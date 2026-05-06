from fastapi import APIRouter
from streaming.state_manager import global_state_manager as state_manager

router = APIRouter()

@router.get("/")
def get_anomalies():
    """
    Returns active traffic anomalies.
    """
    state = state_manager.get_current_state()
    return {"anomalies": state.get("anomalies", [])}
