# Smart Traffic Real-Time System

A minor project for real-time traffic monitoring and prediction.

## Tech Stack
- **Backend**: FastAPI, Uvicorn, WebSockets, NetworkX, MongoDB
- **Frontend**: React (Vite), Vanilla CSS (Glassmorphism), Leaflet, Recharts
- **Models**: Mock implementations of LSTM & Isolation Forest
- **Database**: MongoDB (traffic snapshots, OSRM cache, route feedback)

## How to Run

### 0. MongoDB Setup
Install MongoDB Community Edition:
- **Windows**: Download from https://www.mongodb.com/try/download/community
  - Run the installer, select "Complete" setup
  - Check "Install MongoDB as a Service" (starts automatically)
  - MongoDB Compass (GUI) is included — use it to inspect the `smart_traffic` database
- **Mac**: `brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community`
- **Linux**: Follow https://www.mongodb.com/docs/manual/administration/install-on-linux/

Verify it's running:
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

### 1. Backend
Open a terminal in the `backend` folder:
```bash
cd d:/MinorProject/smart-traffic-realtime-system/backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

> **First startup** fetches OSRM distances (~15s) and caches them in MongoDB.  
> **Subsequent startups** are near-instant (reads from cache).

### 2. Frontend
Open another terminal in the `frontend` folder:
```bash
cd d:/MinorProject/smart-traffic-realtime-system/frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

## MongoDB Collections
| Collection | Purpose |
|---|---|
| `osrm_distances` | Cached OSRM road distances (speeds up startup) |
| `traffic_snapshots` | Historical traffic data for LSTM training |
| `route_feedback` | User route preferences |
| `anomaly_log` | Logged congestion/anomaly events |
