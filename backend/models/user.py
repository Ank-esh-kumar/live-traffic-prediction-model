from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserPreference(BaseModel):
    theme: str = "dark"
    notifications_enabled: bool = False
    location_enabled: bool = False
    preferred_mode: str = "fastest" # fastest, shortest, eco

class RouteHistoryItem(BaseModel):
    start_node: str
    end_node: str
    path: List[str]
    distance: float
    time_taken: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class UserInDB(UserBase):
    id: str
    hashed_password: str
    preferences: UserPreference = Field(default_factory=UserPreference)
    history: List[RouteHistoryItem] = Field(default_factory=list)
    emergency_auth: dict = Field(default_factory=lambda: {"authorized": False, "role": "user", "expires_at": None})

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
