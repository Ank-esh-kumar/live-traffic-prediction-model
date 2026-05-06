from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import json
import os
from datetime import datetime

router = APIRouter()

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
    """
    os.makedirs(os.path.dirname(FEEDBACK_FILE), exist_ok=True)
    
    entry = {
        "timestamp": datetime.now().isoformat(),
        "start": feedback.start_node,
        "end": feedback.end_node,
        "ai_path": feedback.ai_path,
        "shortest_path": feedback.shortest_path,
        "user_chosen": feedback.user_chosen_path,
        "choice": feedback.choice
    }
    
    # Append to existing feedback file
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
