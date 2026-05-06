from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_recommendations():
    """
    Returns general recommendations based on traffic.
    """
    return {"message": "Leave 15 minutes early to avoid arterial congestion."}
