from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json

from routes import predict, live, route, anomaly, recommend, feedback
from streaming.simulator import TrafficSimulator
from streaming.state_manager import global_state_manager as state_manager

app = FastAPI(title="Smart Traffic Real-Time System")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global state manager and simulator
simulator = TrafficSimulator(state_manager)

# Include routers
app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(live.router, prefix="/api/live", tags=["Live Traffic"])
app.include_router(route.router, prefix="/api/route", tags=["Routing"])
app.include_router(anomaly.router, prefix="/api/anomaly", tags=["Anomalies"])
app.include_router(recommend.router, prefix="/api/recommend", tags=["Recommendations"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["Feedback"])

@app.on_event("startup")
async def startup_event():
    # Start the simulation loop in the background
    asyncio.create_task(simulator.run())

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Traffic Real-Time System API"}

# WebSocket Endpoint for Live Dashboard
connected_clients = set()

@app.websocket("/ws/traffic")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        # Send initial state
        initial_data = state_manager.get_current_state()
        await websocket.send_json(initial_data)
        
        # Subscribe to state changes (simplified polling for demo)
        while True:
            await asyncio.sleep(2)
            # In a real app, use an event pub/sub. Here we just poll the state manager.
            current_data = state_manager.get_current_state()
            await websocket.send_json(current_data)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        connected_clients.remove(websocket)
