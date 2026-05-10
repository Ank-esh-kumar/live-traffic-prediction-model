from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

# Try MongoDB, fall back to JSON file
try:
    from database import save_feedback, get_feedback_count
    MONGO_AVAILABLE = True
except ImportError:
    MONGO_AVAILABLE = False

import json
import os
FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "route_feedback.json")

class RouteFeedback(BaseModel):
    start_node: str
    end_node: str
    ai_path: List[str]
    shortest_path: List[str]
    user_chosen_path: List[str]
    choice: str  # "ai", "shortest", or "custom"

@router.post("/")
def submit_feedback(feedback: RouteFeedback):
    """
    Stores the user's route preference for future model training.
    Uses MongoDB if available, falls back to JSON file.
    """
    entry = {
        "timestamp": datetime.now().isoformat(),
        "start": feedback.start_node,
        "end": feedback.end_node,
        "ai_path": feedback.ai_path,
        "shortest_path": feedback.shortest_path,
        "user_chosen": feedback.user_chosen_path,
        "choice": feedback.choice
    }
    
    if MONGO_AVAILABLE:
        try:
            save_feedback(entry)
            total = get_feedback_count()
            return {"message": "Feedback recorded to database", "total_feedback": total}
        except Exception as e:
            print(f"MongoDB feedback save failed, falling back to JSON: {e}")
    
    # Fallback: JSON file
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    existing = []
    if os.path.exists(FEEDBACK_FILE):
        try:
            with open(FEEDBACK_FILE, "r") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, IOError):
            existing = []
    
    existing.append(entry)
    
    with open(FEEDBACK_FILE, "w") as f:
        json.dump(existing, f, indent=2)
    
    return {"message": "Feedback recorded successfully", "total_feedback": len(existing)}
