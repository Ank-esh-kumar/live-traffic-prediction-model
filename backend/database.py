"""
MongoDB connection module for the Smart Traffic System.

Collections:
  - osrm_distances    : Cached OSRM road distances between nodes
  - traffic_snapshots : Historical traffic density snapshots
  - route_feedback    : User route preference feedback
  - anomaly_log       : Logged anomaly events
  - users             : Registered user profiles, preferences, and history

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


# ── User Management ──

def get_user_by_email(email):
    """Retrieve a user by email."""
    db = get_db()
    if db is None:
        return None
    return db.users.find_one({"email": email})

def create_user(user_data):
    """Create a new user record."""
    db = get_db()
    if db is None:
        return None
    result = db.users.insert_one(user_data)
    user_data["_id"] = result.inserted_id
    return user_data

def set_reset_otp(email, otp, expires_at):
    """Set a password reset OTP for a user."""
    db = get_db()
    if db is None:
        return False
    result = db.users.update_one(
        {"email": email},
        {"$set": {"reset_otp": otp, "reset_otp_expiry": expires_at}}
    )
    return result.modified_count > 0

def clear_reset_otp(email):
    """Clear the password reset OTP for a user."""
    db = get_db()
    if db is None:
        return False
    db.users.update_one(
        {"email": email},
        {"$unset": {"reset_otp": "", "reset_otp_expiry": ""}}
    )
    return True

def update_user_preferences(email, preferences):
    """Update user preferences."""
    db = get_db()
    if db is None:
        return False
    db.users.update_one(
        {"email": email},
        {"$set": {"preferences": preferences}}
    )
    return True

def update_emergency_auth(email, auth_data):
    """Update user's emergency authorization status."""
    db = get_db()
    if db is None:
        return False
    db.users.update_one(
        {"email": email},
        {"$set": {"emergency_auth": auth_data}}
    )
    return True

def add_route_history(email, history_item):
    """Add a route to user's history."""
    db = get_db()
    if db is None:
        return False
    db.users.update_one(
        {"email": email},
        {"$push": {"history": {
            "$each": [history_item],
            "$position": 0,
            "$slice": 50 # Keep last 50 routes
        }}}
    )
    return True

def get_user_history(email):
    """Get route history for a user."""
    db = get_db()
    if db is None:
        return []
    user = db.users.find_one({"email": email}, {"history": 1})
    return user.get("history", []) if user else []

# ── Prediction Accuracy ──

def log_prediction_accuracy(accuracy_data):
    """Log prediction accuracy results for the feedback loop."""
    db = get_db()
    if db is None:
        return
    accuracy_data["timestamp"] = datetime.utcnow()
    db.prediction_accuracy.insert_one(accuracy_data)

def get_latest_accuracy():
    """Retrieve the most recent accuracy log."""
    db = get_db()
    if db is None:
        return None
    return db.prediction_accuracy.find_one(sort=[("timestamp", -1)])

# ── Incidents ──

def save_incident(node_id, incident_type, description, user_id=None):
    """Save a user-reported incident."""
    db = get_db()
    if db is None:
        return None
        
    incident = {
        "node_id": node_id,
        "type": incident_type,
        "description": description,
        "user_id": user_id,
        "timestamp": datetime.utcnow(),
        "active": True
    }
    result = db.incidents.insert_one(incident)
    incident["_id"] = str(result.inserted_id)
    incident["timestamp"] = incident["timestamp"].isoformat()
    return incident

def get_active_incidents(hours=2):
    """Get active incidents from the last N hours."""
    db = get_db()
    if db is None:
        return []
        
    from datetime import timedelta
    cutoff_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Return incidents that are marked active and within the time window
    cursor = db.incidents.find({
        "active": True,
        "timestamp": {"$gte": cutoff_time}
    }).sort("timestamp", -1)
    
    incidents = []
    for inc in cursor:
        inc["_id"] = str(inc["_id"])
        inc["timestamp"] = inc["timestamp"].isoformat()
        incidents.append(inc)
        
    return incidents
