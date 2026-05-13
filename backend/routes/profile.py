from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.user import UserPreference, RouteHistoryItem
from routes.auth import get_current_user
from database import update_user_preferences, add_route_history, get_user_history

router = APIRouter()

@router.put("/preferences")
async def update_prefs(prefs: UserPreference, current_user: dict = Depends(get_current_user)):
    success = update_user_preferences(current_user["email"], prefs.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update preferences")
    return {"message": "Preferences updated successfully"}

@router.post("/history")
async def save_history(item: RouteHistoryItem, current_user: dict = Depends(get_current_user)):
    success = add_route_history(current_user["email"], item.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save history")
    return {"message": "History item saved"}

@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    history = get_user_history(current_user["email"])
    return history
