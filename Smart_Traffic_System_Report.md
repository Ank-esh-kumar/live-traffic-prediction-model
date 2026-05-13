# Smart Traffic Real-Time System — Project Report

**Author:** Ankesh Kumar  
**Date:** May 2026  
**Repository:** https://github.com/Ank-esh-kumar/live-traffic-prediction-model

---

## 1. Project Overview

The **Smart Traffic Real-Time System** is a full-stack web application that monitors, predicts, and optimizes urban traffic flow across a multi-city corridor (Delhi → Meerut → Muzaffarnagar → Roorkee → Dehradun → Haridwar → Rishikesh). It combines real-time traffic simulation, AI-based congestion prediction using LSTM neural networks, anomaly detection, and intelligent shortest-path routing — all visualized on an interactive map dashboard.

### Key Capabilities
- **Live Traffic Monitoring:** Real-time density values (0–100%) for 50+ intersections streamed via WebSocket.
- **AI Traffic Prediction:** LSTM model trained on real-world UCI Metro Interstate data forecasts future congestion.
- **Anomaly Detection:** Isolation Forest algorithm flags unusual congestion spikes (accidents, gridlocks).
- **Smart Routing:** Dijkstra's algorithm with traffic-weighted edges finds the fastest real-time route.
- **Multi-Stop Routing:** Users can add intermediate waypoints and compare direct vs. via-stop routes.
- **Explore Mode:** Drill into any city/region and see color-coded road segments by congestion level.
- **PWA Support:** Installable on mobile devices as a native-like app with offline tile caching.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                        │
│  React 18 + Vite 5 + Leaflet Maps + Recharts + Lucide Icons │
│  PWA (vite-plugin-pwa + Workbox)                             │
│                                                              │
│  Components:                                                 │
│  ┌────────────┐ ┌───────────┐ ┌────────────┐ ┌───────────┐  │
│  │  MapView   │ │RoutePanel │ │TrafficChart│ │AnomalyAlert│ │
│  │  (Leaflet) │ │(Waypoints)│ │ (Recharts) │ │  (Alerts) │  │
│  └─────┬──────┘ └─────┬─────┘ └─────┬──────┘ └─────┬─────┘  │
│        └───────────────┴─────────────┴───────────────┘       │
│                         │ WebSocket + REST                   │
└─────────────────────────┼────────────────────────────────────┘
                          │  HTTPS / WSS
┌─────────────────────────┼────────────────────────────────────┐
│                     BACKEND (Render)                         │
│  Python 3.10 + FastAPI + Uvicorn                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ app.py — FastAPI Server + WebSocket /ws/traffic       │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ routes/                                               │    │
│  │  ├─ route.py     (Shortest path & multi-stop routing)│    │
│  │  ├─ predict.py   (Traffic prediction endpoint)       │    │
│  │  ├─ live.py      (Current traffic state)             │    │
│  │  ├─ anomaly.py   (Active anomalies)                  │    │
│  │  ├─ recommend.py (Route recommendations)             │    │
│  │  └─ feedback.py  (User route feedback)               │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ models/                                               │    │
│  │  ├─ lstm_model.py    (LSTM predictor — TensorFlow)   │    │
│  │  └─ anomaly_model.py (Isolation Forest — sklearn)    │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ optimization/                                         │    │
│  │  ├─ graph_builder.py (NetworkX graph + OSRM distances)│   │
│  │  └─ dijkstra.py      (Traffic-weighted pathfinding)  │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ streaming/                                            │    │
│  │  ├─ simulator.py     (Synthetic traffic generator)   │    │
│  │  └─ state_manager.py (Thread-safe global state)      │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ pipeline/                                             │    │
│  │  └─ train_models.py  (Model training script)         │    │
│  ├──────────────────────────────────────────────────────┤    │
│  │ database.py (MongoDB — caching, snapshots, feedback) │    │
│  └──────────────────────────────────────────────────────┘    │
│                          │                                   │
│              ┌───────────┴───────────┐                       │
│              │   MongoDB Atlas       │                       │
│              │   (Optional Cloud DB) │                       │
│              └───────────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3 | UI component library with hooks-based state management |
| **Vite** | 5.4 | Build tool and dev server — ultra-fast HMR |
| **Leaflet** | 1.9.4 | Interactive map rendering with tile layers |
| **React-Leaflet** | 4.2.1 | React bindings for Leaflet |
| **Recharts** | 2.13.3 | Data visualization (traffic density charts, accuracy history) |
| **Lucide React** | 0.462 | Icon library (Activity, Navigation, AlertTriangle, etc.) |
| **vite-plugin-pwa** | 1.3.0 | Progressive Web App — service worker, manifest, offline caching |
| **Workbox** | (bundled) | Runtime caching strategies for map tiles and API responses |

### 3.2 Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.10.12 | Runtime (pinned via `runtime.txt` for TensorFlow compatibility) |
| **FastAPI** | latest | Async REST API framework with automatic OpenAPI docs |
| **Uvicorn** | latest | ASGI server for serving FastAPI |
| **TensorFlow/Keras** | ≥2.15 | LSTM neural network for traffic prediction |
| **scikit-learn** | latest | Isolation Forest for anomaly detection |
| **NetworkX** | latest | Graph data structure for road network modeling |
| **Pandas / NumPy** | latest | Data processing and numerical computation |
| **PyMongo** | latest | MongoDB driver for persistent storage |

### 3.3 External Services

| Service | Purpose |
|---|---|
| **OSRM** (Open Source Routing Machine) | Real driving distances between intersections |
| **OpenStreetMap / CartoDB** | Map tile layers for the interactive map |
| **Nominatim** | City boundary polygons for the Explore feature |
| **MongoDB Atlas** | Cloud database for caching OSRM distances, traffic snapshots, and user feedback |

### 3.4 Deployment

| Platform | Component | URL Pattern |
|---|---|---|
| **Render** | Backend (FastAPI + WebSocket) | `https://<name>.onrender.com` |
| **Vercel** | Frontend (React SPA) | `https://<name>.vercel.app` |
| **GitHub** | Source control & CI/CD trigger | Push → auto-deploy |

---

## 4. Core Concepts Explained

### 4.1 LSTM (Long Short-Term Memory) Neural Network

**What it is:** A type of Recurrent Neural Network (RNN) specifically designed to learn patterns in sequential/time-series data by maintaining a "memory cell" that can remember long-term dependencies.

**How it's used here:** The LSTM model takes the last 10 traffic density readings for each intersection and predicts the next density value. This allows the system to forecast congestion 3–30 seconds into the future.

**Architecture:**
```
Input (10 timesteps × 1 feature) → LSTM(32 units, ReLU) → Dense(16, ReLU) → Dense(1) → Output
```

**Training data:** UCI Metro Interstate Traffic Volume dataset (~48,000 hourly records of real traffic volumes from a Minnesota highway). The raw traffic volumes are scaled to a 0–100 range using MinMaxScaler to match the system's density scale.

**File:** `backend/models/lstm_model.py`

### 4.2 Isolation Forest (Anomaly Detection)

**What it is:** An unsupervised machine learning algorithm that detects outliers by randomly partitioning data. Anomalies are "few and different," so they get isolated in fewer partitions (shorter path length in the tree).

**How it's used here:** Any intersection with traffic density > 85% is flagged as an anomaly. Densities > 95% are marked as CRITICAL (likely accident or total gridlock), while 85–95% are marked as HIGH.

**File:** `backend/models/anomaly_model.py`

### 4.3 Dijkstra's Algorithm (Traffic-Weighted Routing)

**What it is:** A classic graph algorithm that finds the shortest path between two nodes in a weighted graph.

**How it's used here:** The system runs Dijkstra's algorithm twice for every route request:

1. **Shortest Physical Path** — Uses raw road distances as edge weights. This gives the geographically shortest route (ignoring traffic).
2. **AI Optimal Path** — Creates a dynamic directed graph where each edge weight is: `distance × (1 + traffic_density / 10)`. A road with 0% traffic keeps its original weight; a road at 100% traffic has 11× the weight. This naturally diverts routes away from congested roads.

**ETA Calculation:** Base speed is 50 km/h (1.2 min/km). A traffic multiplier of `1 + (density / 33.3)` is applied, meaning at 100% traffic, speed drops to ~25% of normal.

**File:** `backend/optimization/dijkstra.py`

### 4.4 Graph-Based Road Network (NetworkX)

**What it is:** The entire road network is modeled as an undirected weighted graph using NetworkX. Each node is an intersection/landmark, and each edge is a road segment.

**Coverage:**
- **Delhi:** 14 nodes (India Gate, Connaught Place, Kashmiri Gate, etc.)
- **Meerut:** 3 nodes
- **Muzaffarnagar:** 4 nodes
- **Roorkee:** 2 nodes
- **Dehradun:** 20 nodes
- **Haridwar:** 4 nodes
- **Rishikesh:** 4 nodes
- **Inter-city highways:** 14 dedicated connections

**Edge Weights:** Real driving distances fetched from the OSRM API at startup and cached in MongoDB for subsequent boots.

**File:** `backend/optimization/graph_builder.py`

### 4.5 WebSocket Real-Time Streaming

**What it is:** A persistent, full-duplex communication channel between the browser and server. Unlike HTTP (request-response), WebSockets allow the server to push data to the client continuously.

**How it's used here:**
- The backend simulator generates new traffic data every 3 seconds.
- The `StateManager` (thread-safe singleton) stores the latest state.
- The `/ws/traffic` WebSocket endpoint polls the StateManager every 2 seconds and sends the full state (nodes, anomalies, predictions) to all connected clients.
- The frontend `useLiveTraffic` hook connects to this WebSocket and updates the React state with exponential backoff retry logic.

**Files:** `backend/app.py` (WebSocket endpoint), `backend/streaming/simulator.py`, `frontend/src/hooks/useLiveTraffic.js`

### 4.6 OSRM (Open Source Routing Machine)

**What it is:** A free, open-source routing engine that calculates real driving distances between GPS coordinates using OpenStreetMap road data.

**How it's used here:** At startup, the graph builder fetches actual driving distances for every edge pair:
```
https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false
```
If OSRM is unreachable, it falls back to Haversine (straight-line) distance. All fetched distances are cached in MongoDB to avoid re-fetching on every restart.

### 4.7 Progressive Web App (PWA)

**What it is:** A web application enhanced with native-like capabilities — installable on home screens, works offline (for cached content), and receives push notifications.

**Implementation:**
- `vite-plugin-pwa` generates the `manifest.json` and service worker automatically.
- **CacheFirst** strategy for map tiles (CartoDB, OpenStreetMap) — tiles load instantly after first view.
- **NetworkFirst** strategy for API calls — always tries fresh data, falls back to cache.
- `beforeinstallprompt` event is captured to provide a custom "Install App" button.

### 4.8 MongoDB Collections

| Collection | Purpose |
|---|---|
| `osrm_distances` | Cached OSRM road distances (avoids re-fetching on restart) |
| `traffic_snapshots` | Historical traffic density snapshots (every 30 seconds) |
| `route_feedback` | User route preference feedback for future model improvement |
| `anomaly_log` | Historical anomaly events for pattern analysis |

---

## 5. Frontend Components

### 5.1 Dashboard (`pages/Dashboard.jsx`)
The main page orchestrating all components. Manages route finding, feedback submission, theme toggling (dark/light), and the PWA install prompt.

### 5.2 MapView (`components/MapView.jsx`)
The largest component (634 lines). Renders the Leaflet map with:
- Color-coded circle markers for each intersection (green → yellow → red based on density).
- Polyline overlays for shortest path (blue dashed) and AI optimal path (green solid).
- OSRM road geometry for the Explore mode.
- City boundary polygons fetched from the backend.
- Click-to-select for route start/end points.

### 5.3 RoutePanel (`components/RoutePanel.jsx`)
Sidebar panel for multi-stop route configuration. Users select start, end, and optional intermediate stops from dropdown menus. Displays distance, ETA, and leg-by-leg breakdown.

### 5.4 TrafficChart (`components/TrafficChart.jsx`)
Recharts-based visualization showing:
- Live traffic density bar chart for all nodes.
- AI prediction accuracy over time (line chart).
- Comparison between actual vs. predicted values.

### 5.5 AnomalyAlert (`components/AnomalyAlert.jsx`)
Displays real-time anomaly cards with severity badges (CRITICAL/HIGH), affected node name, and density value.

### 5.6 LiveTicker (`components/LiveTicker.jsx`)
A scrolling ticker bar showing the latest traffic updates and anomaly notifications.

---

## 6. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/nodes` | All graph nodes with coordinates |
| GET | `/api/live/current` | Current traffic state |
| GET | `/api/predict/current` | Current predictions |
| GET | `/api/anomaly/current` | Active anomalies |
| POST | `/api/route/` | Find route (start → end) |
| POST | `/api/route/via` | Route through a waypoint |
| POST | `/api/route/multi` | Multi-stop routing with comparison |
| GET | `/api/route/area/{name}` | Road edges for a city/area |
| GET | `/api/route/area/{name}/boundary` | City boundary polygon |
| POST | `/api/feedback` | Submit route feedback |
| GET | `/api/recommend/` | Route recommendations |
| WS | `/ws/traffic` | Live traffic WebSocket stream |

---

## 7. Deployment Guide

### 7.1 Backend (Render)
1. Push code to GitHub.
2. Create a **Web Service** on Render, link the GitHub repo.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn app:app --host 0.0.0.0 --port $PORT`.
6. Add environment variable: `PYTHON_VERSION = 3.10.12`.
7. (Optional) Add `MONGO_URI` for MongoDB Atlas.

### 7.2 Frontend (Vercel)
1. Import the same GitHub repo on Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite** (auto-detected).
4. Ensure `frontend/.env.production` contains:
   ```
   VITE_API_URL=https://<your-render-url>.onrender.com
   VITE_WS_URL=wss://<your-render-url>.onrender.com
   ```
5. Click Deploy.

---

## 8. Guide to Training the LSTM Model Further

### 8.1 Running the Training Script

```bash
cd backend
python pipeline/train_models.py
```

This will:
1. Download the UCI Metro Interstate Traffic Volume dataset.
2. Scale volumes to 0–100 using MinMaxScaler.
3. Create sliding window sequences (length 10).
4. Train the LSTM for 5 epochs.
5. Save `lstm.keras` and `scaler.pkl` to `backend/saved_models/`.

### 8.2 Suitable Datasets

| Dataset | Source | Size | Best For |
|---|---|---|---|
| **UCI Metro Interstate Traffic Volume** | [UCI ML Repository](https://archive.ics.uci.edu/ml/datasets/Metro+Interstate+Traffic+Volume) | 48,204 records | Hourly highway traffic with weather features |
| **Caltrans PeMS** | [pems.dot.ca.gov](https://pems.dot.ca.gov) | Millions of records | 5-minute interval detector data across California highways |
| **UK Traffic Counts** | [data.gov.uk](https://data.gov.uk) | 100,000+ records | Annual average daily traffic flows for UK roads |
| **NYC Taxi & Limousine** | [nyc.gov/tlc](https://www.nyc.gov/site/tlc/about/tlc-trip-record-data.page) | Billions of records | Trip-level data that can be aggregated to road-level density |
| **Your own MongoDB snapshots** | `traffic_snapshots` collection | Growing | Best for fine-tuning on your specific corridor |

### 8.3 How to Feed Custom Data

Your training data must be a **single-column time-series** of traffic density/volume values. The pipeline expects:

```python
# In pipeline/train_models.py, replace the download section:

# Option A: From CSV
df = pd.read_csv("path/to/your_data.csv")
volumes = df['traffic_volume'].values.reshape(-1, 1)

# Option B: From MongoDB snapshots
from pymongo import MongoClient
client = MongoClient("mongodb+srv://...")
db = client["smart_traffic"]
snapshots = list(db.traffic_snapshots.find().sort("timestamp", 1))
volumes = np.array([
    np.mean(list(s["nodes"].values()))  # Average density per snapshot
    for s in snapshots
]).reshape(-1, 1)
```

### 8.4 How Much Data is Enough

| Data Size | Epochs | Risk | Recommendation |
|---|---|---|---|
| < 1,000 records | Any | **Severe overfitting** — model memorizes noise | Not recommended for production |
| 1,000 – 5,000 | 5–10 | Moderate overfitting risk | Use dropout (0.2) and early stopping |
| 5,000 – 50,000 | 10–20 | **Sweet spot** — enough patterns to generalize | Current setup works well here |
| 50,000 – 500,000 | 15–30 | Low overfitting risk | Can increase model complexity (64+ LSTM units) |
| 500,000+ | 20–50 | Minimal overfitting | Add more LSTM layers, increase sequence length to 24+ |

### 8.5 Preventing Overfitting — Practical Steps

**1. Use Validation Split (already implemented):**
```python
model.fit(X, y, epochs=10, batch_size=64, validation_split=0.2)
```
20% of data is held out for validation. If validation loss starts increasing while training loss keeps decreasing, the model is overfitting.

**2. Add Early Stopping:**
```python
from tensorflow.keras.callbacks import EarlyStopping

early_stop = EarlyStopping(
    monitor='val_loss',
    patience=3,          # Stop if no improvement for 3 epochs
    restore_best_weights=True
)

model.fit(X, y, epochs=50, batch_size=64, validation_split=0.2,
          callbacks=[early_stop])
```

**3. Add Dropout Regularization:**
```python
from tensorflow.keras.layers import LSTM, Dense, Dropout

model = Sequential([
    LSTM(64, activation='relu', input_shape=(seq_length, 1), return_sequences=True),
    Dropout(0.2),
    LSTM(32, activation='relu'),
    Dropout(0.2),
    Dense(16, activation='relu'),
    Dense(1)
])
```

**4. Increase Sequence Length for More Context:**
```python
seq_length = 24  # Use last 24 readings instead of 10
```
Longer sequences give the model more temporal context but require more memory.

**5. Use More Features (Multivariate LSTM):**
Instead of just traffic volume, include weather, time-of-day, day-of-week:
```python
features = df[['traffic_volume', 'temp', 'rain_1h', 'clouds_all']].values
# input_shape becomes (seq_length, 4) instead of (seq_length, 1)
```

### 8.6 Recommended Training Configuration for Production

```python
model = Sequential([
    LSTM(64, activation='relu', input_shape=(24, 1), return_sequences=True),
    Dropout(0.2),
    LSTM(32, activation='relu'),
    Dropout(0.2),
    Dense(16, activation='relu'),
    Dense(1)
])

model.compile(optimizer='adam', loss='mse', metrics=['mae'])

model.fit(X, y,
    epochs=50,
    batch_size=128,
    validation_split=0.2,
    callbacks=[
        EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2)
    ]
)
```

**Expected performance:** With 48,000+ records and this configuration, expect a validation MAE (Mean Absolute Error) of 3–7 density points on the 0–100 scale, which translates to roughly 85–93% prediction accuracy.

---

## 9. File Structure Summary

```
smart-traffic-realtime-system/
├── backend/
│   ├── app.py                  # FastAPI server + WebSocket
│   ├── database.py             # MongoDB connection & collections
│   ├── requirements.txt        # Python dependencies
│   ├── runtime.txt             # Python version for Render (3.10.12)
│   ├── models/
│   │   ├── lstm_model.py       # LSTM traffic predictor
│   │   └── anomaly_model.py    # Isolation Forest anomaly detector
│   ├── optimization/
│   │   ├── graph_builder.py    # Road network graph (NetworkX + OSRM)
│   │   └── dijkstra.py         # Traffic-weighted shortest path
│   ├── streaming/
│   │   ├── simulator.py        # Synthetic traffic data generator
│   │   └── state_manager.py    # Thread-safe global state
│   ├── pipeline/
│   │   └── train_models.py     # Model training script
│   ├── routes/
│   │   ├── route.py            # Routing endpoints
│   │   ├── predict.py          # Prediction endpoint
│   │   ├── live.py             # Live traffic endpoint
│   │   ├── anomaly.py          # Anomaly endpoint
│   │   ├── recommend.py        # Recommendation endpoint
│   │   └── feedback.py         # User feedback endpoint
│   ├── saved_models/           # Trained model files (.keras, .pkl)
│   └── data/                   # Static data files
├── frontend/
│   ├── index.html              # Entry HTML with PWA meta tags
│   ├── vite.config.js          # Vite + PWA configuration
│   ├── package.json            # Node dependencies
│   ├── .env.production         # Production API URLs
│   ├── public/
│   │   ├── icon.svg            # App icon (SVG)
│   │   └── icon-512x512.png    # PWA icon (PNG for iOS)
│   └── src/
│       ├── App.jsx             # Root component
│       ├── main.jsx            # Entry point + PWA registration
│       ├── index.css           # Global styles + dark/light themes
│       ├── pages/
│       │   └── Dashboard.jsx   # Main dashboard page
│       ├── components/
│       │   ├── MapView.jsx     # Interactive Leaflet map
│       │   ├── RoutePanel.jsx  # Multi-stop route selector
│       │   ├── TrafficChart.jsx# Traffic density charts
│       │   ├── AnomalyAlert.jsx# Anomaly notification cards
│       │   └── LiveTicker.jsx  # Scrolling status ticker
│       └── hooks/
│           └── useLiveTraffic.js # WebSocket connection hook
├── .gitignore
└── README.md
```

---

## 10. Future Enhancements

1. **Real Sensor Integration** — Replace the simulator with live data from traffic cameras or IoT sensors.
2. **Multi-Feature LSTM** — Include weather, time-of-day, and day-of-week as input features.
3. **User Authentication** — Login system for personalized route history and preferences.
4. **Push Notifications** — Alert users about anomalies on their saved routes.
5. **Historical Analytics Dashboard** — Visualize traffic patterns over days/weeks/months from MongoDB snapshots.
6. **Graph Neural Networks (GNNs)** — Replace per-node LSTM with a spatial-temporal GNN that models relationships between adjacent intersections.
7. **Live Navigation with audio Description** 

---

*© 2026 Ankesh Kumar. All rights reserved.*
