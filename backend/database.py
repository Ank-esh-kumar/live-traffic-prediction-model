"""
MongoDB connection module for the Smart Traffic System.

Collections:
  - osrm_distances    : Cached OSRM road distances between nodes
  - traffic_snapshots : Historical traffic density snapshots
  - route_feedback    : User route preference feedback
  - anomaly_log       : Logged anomaly events

Setup:
  1. Install MongoDB Community Edition:
     https://www.mongodb.com/docs/manual/installation/
  2. Start the MongoDB service:
     - Windows: net start MongoDB  (or via Services app)
     - Linux/Mac: sudo systemctl start mongod
  3. Default connection: mongodb://localhost:27017/smart_traffic
"""

from pymongo import MongoClient
from datetime import datetime
import os

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "smart_traffic")

_client = None
_db = None
_db_connection_failed = False

def get_db():
    """Returns the MongoDB database instance (lazy singleton)."""
    global _client, _db, _db_connection_failed
    if _db_connection_failed:
        return None
    
    if _db is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        _db = _client[DB_NAME]
        # Test the connection
        try:
            _client.admin.command("ping")
            print(f"✅ Connected to MongoDB: {MONGO_URI}/{DB_NAME}")
        except Exception as e:
            print(f"⚠️  MongoDB connection failed: {e}")
            print("   The app will still work, but data won't be persisted.")
            _db = None
            _db_connection_failed = True
    return _db


# ── OSRM Distance Cache ──

def get_cached_distance(node_a, node_b):
    """Retrieve a cached OSRM distance between two nodes."""
    db = get_db()
    if db is None:
        return None
    key = f"{node_a}||{node_b}"
    doc = db.osrm_distances.find_one({"key": key})
    return doc["distance"] if doc else None

def cache_distance(node_a, node_b, distance):
    """Save an OSRM distance to the cache."""
    db = get_db()
    if db is None:
        return
    key = f"{node_a}||{node_b}"
    db.osrm_distances.update_one(
        {"key": key},
        {"$set": {"key": key, "from": node_a, "to": node_b, "distance": distance, "cached_at": datetime.utcnow()}},
        upsert=True
    )


# ── Traffic Snapshots ──

def save_traffic_snapshot(traffic_data, anomalies=None):
    """Save a traffic snapshot for historical analysis."""
    db = get_db()
    if db is None:
        return
    db.traffic_snapshots.insert_one({
        "timestamp": datetime.utcnow(),
        "nodes": traffic_data,
        "anomalies": anomalies or []
    })


# ── Route Feedback ──

def save_feedback(entry):
    """Save a user route feedback entry."""
    db = get_db()
    if db is None:
        return None
    entry["timestamp"] = datetime.utcnow()
    result = db.route_feedback.insert_one(entry)
    return str(result.inserted_id)

def get_feedback_count():
    """Get total number of feedback entries."""
    db = get_db()
    if db is None:
        return 0
    return db.route_feedback.count_documents({})


# ── Migration: Import existing JSON feedback ──

def migrate_json_feedback(json_path):
    """Import existing route_feedback.json entries into MongoDB (run once)."""
    db = get_db()
    if db is None:
        return
    
    # Skip if already migrated
    if db.route_feedback.count_documents({}) > 0:
        return
    
    import json
    if not os.path.exists(json_path):
        return
    
    try:
        with open(json_path, "r") as f:
            entries = json.load(f)
        if entries:
            db.route_feedback.insert_many(entries)
            print(f"✅ Migrated {len(entries)} feedback entries from JSON to MongoDB")
    except Exception as e:
        print(f"⚠️  Feedback migration failed: {e}")


# ── Anomaly Log ──

def log_anomalies(anomalies):
    """Log anomaly events for historical tracking."""
    db = get_db()
    if db is None or not anomalies:
        return
        
    # Copy dicts to avoid mutating the live state manager with datetime objects
    records = []
    for anomaly in anomalies:
        record = dict(anomaly)
        record["logged_at"] = datetime.utcnow()
        records.append(record)
        
    db.anomaly_log.insert_many(records)
