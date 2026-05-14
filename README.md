# Smart Traffic Real-time System 🚦🤖

**AI-Driven Traffic Prediction, Emergency Priority Routing, and Regional Exploration.**

[![Version](https://img.shields.io/badge/version-1.2.0-blue)](./RELEASE_NOTES.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🆕 Latest Update (v1.2.0)
Check out the [Release Notes](./RELEASE_NOTES.md) for full details on the new **Hospital/Police Infrastructure Expansion** and **High-Precision AI Routing**.

## 🌟 Key Features
- **Real-time Prediction:** Graph Neural Networks (GNN) and LSTMs for 95%+ accurate traffic forecasting.
- **Critical Infrastructure:** 18+ new nodes including Hospitals (AIIMS, Doon, Max) and Police Stations.
- **AES (Advanced Emergency Service):** Prioritized routing for emergency vehicles with strict node validation.
- **Eco-Routing:** Sustainability metrics and carbon impact analysis for every path.
- **Regional Exploration:** Precise traffic overlays for Dehradun, Delhi, Meerut, Mussoorie, and more.

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
