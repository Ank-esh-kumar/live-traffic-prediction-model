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
