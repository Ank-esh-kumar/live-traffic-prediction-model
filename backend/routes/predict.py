from fastapi import APIRouter
from streaming.state_manager import global_state_manager as state_manager

router = APIRouter()

@router.get("/")
def get_predictions():
    """
    Returns future traffic predictions.
    """
    state = state_manager.get_current_state()
    return {"predictions": state.get("predictions", {})}
