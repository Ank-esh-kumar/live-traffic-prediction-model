# Smart Traffic Real-Time System

A minor project for real-time traffic monitoring and prediction.

## Tech Stack
- **Backend**: FastAPI, Uvicorn, WebSockets, NetworkX
- **Frontend**: React (Vite), Vanilla CSS (Glassmorphism), Leaflet, Recharts
- **Models**: Mock implementations of LSTM & Isolation Forest

## How to Run

### 1. Backend
Open a terminal in the `backend` folder:
```bash
cd d:/MinorProject/smart-traffic-realtime-system/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### 2. Frontend
Open another terminal in the `frontend` folder:
```bash
cd d:/MinorProject/smart-traffic-realtime-system/frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.
