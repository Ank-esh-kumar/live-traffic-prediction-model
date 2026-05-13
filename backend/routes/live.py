from fastapi import APIRouter
from streaming.state_manager import global_state_manager as state_manager

router = APIRouter()

@router.get("/")
def get_live_traffic():
    """
    Returns current live traffic state.
    """
    state = state_manager.get_current_state()
    return {"timestamp": state.get("timestamp"), "nodes": state.get("nodes", {})}

@router.get("/accuracy")
def get_prediction_accuracy():
    """
    Returns the latest prediction accuracy metric from the feedback loop.
    """
    try:
        from database import get_latest_accuracy
        acc = get_latest_accuracy()
        if acc:
            # Convert ObjectId to string
            acc["_id"] = str(acc["_id"])
            return acc
        return {"accuracy": 100, "avg_error": 0, "message": "Feedback loop initializing..."}
    except Exception as e:
        return {"error": str(e), "accuracy": 100}

from pydantic import BaseModel
from typing import Optional

class IncidentReport(BaseModel):
    node_id: str
    incident_type: str
    description: Optional[str] = ""
    user_id: Optional[str] = None

@router.post("/incident")
def report_incident(report: IncidentReport):
    """
    Receive a user-reported incident, save it to the database, 
    and instantly broadcast it to all connected users via state_manager.
    """
    try:
        from database import save_incident
        incident = save_incident(
            node_id=report.node_id,
            incident_type=report.incident_type,
            description=report.description,
            user_id=report.user_id
        )
        if incident:
            state_manager.add_incident(incident)
            return {"status": "success", "incident": incident}
        return {"status": "error", "message": "Failed to save incident"}
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
