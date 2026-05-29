from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import bcrypt

from models.user import UserCreate, UserLogin, Token, TokenData, UserInDB
from database import get_user_by_email, create_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Security Config
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-for-smart-traffic-system")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_email(token_data.email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    db_user = get_user_by_email(user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "email": user.email,
        "username": user.username,
        "hashed_password": hashed_password,
        "preferences": {
            "theme": "dark",
            "notifications_enabled": False,
            "location_enabled": False,
            "preferred_mode": "fastest"
        },
        "history": [],
        "emergency_auth": {
            "authorized": False,
            "role": "user",
            "expires_at": None,
            "usage_history": []
        }
    }
    new_user = create_user(user_dict)
    if not new_user:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed. Please check if MongoDB is running."
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form_data.username) # OAuth2 uses 'username' field for the identifier
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    # Remove sensitive data
    user_data = dict(current_user)
    user_data.pop("hashed_password", None)
    if "_id" in user_data:
        user_data["id"] = str(user_data["_id"])
        user_data.pop("_id")
    return user_data

class EmergencyAuthRequest(BaseModel):
    reason: str
    id_badge: Optional[str] = None

@router.post("/emergency-access")
async def request_emergency_access(request: EmergencyAuthRequest, current_user: dict = Depends(get_current_user)):
    from database import update_emergency_auth
    
    auth_data = current_user.get("emergency_auth", {})
    usage_history = auth_data.get("usage_history", [])
    now = datetime.utcnow()
    
    if request.reason == "medical":
        # Keep only history from the last 24 hours
        usage_history = [t for t in usage_history if now - datetime.fromisoformat(t) < timedelta(hours=24)]
        
        # Limit 1: Max 3 times a day
        if len(usage_history) >= 3:
            raise HTTPException(status_code=429, detail="Daily limit reached. You can only use emergency access 3 times a day.")
            
        # Limit 2: Cooldown of 2 hours
        if usage_history:
            last_used = datetime.fromisoformat(usage_history[-1])
            if now - last_used < timedelta(hours=2):
                remaining = timedelta(hours=2) - (now - last_used)
                mins = int(remaining.total_seconds() // 60)
                raise HTTPException(status_code=429, detail=f"Cooldown active. Please wait {mins} minutes before requesting again.")
        
        # Grant 2 hours of access
        expire = now + timedelta(hours=2)
        auth_data["authorized"] = True
        auth_data["role"] = request.reason
        auth_data["expires_at"] = expire.isoformat()
        
        # Log this usage
        usage_history.append(now.isoformat())
        auth_data["usage_history"] = usage_history
    else:
        # Permanent access for police/ambulance/fire
        auth_data["authorized"] = True
        auth_data["role"] = request.reason
        auth_data["expires_at"] = None
        
    success = update_emergency_auth(current_user["email"], auth_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update authorization")
        
    return {"status": "success", "message": "Emergency access granted"}

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
async def change_password(request: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    """Allows an authenticated user to change their password after verifying the current one."""
    from database import get_db  # lazy import to avoid circular deps
    db = get_db()

    if not verify_password(request.current_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    new_hash = get_password_hash(request.new_password)

    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"hashed_password": new_hash}}
    )
    return {"status": "success", "message": "Password updated successfully"}

class VerifyPasswordRequest(BaseModel):
    password: str

@router.post("/verify-password")
async def verify_current_password(request: VerifyPasswordRequest, current_user: dict = Depends(get_current_user)):
    """Read-only endpoint: verifies the user's current password is correct.
    Used as a pre-check before showing the new-password form.
    Returns 200 on match, 401 on mismatch — never modifies anything."""
    if not verify_password(request.password, current_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Password is incorrect")
    return {"status": "verified", "message": "Identity confirmed"}

class PasswordResetRequest(BaseModel):
    email: str

@router.post("/request-password-reset")
async def request_password_reset(request: PasswordResetRequest):
    import random
    from database import set_reset_otp
    
    user = get_user_by_email(request.email)
    if not user:
        # Return success anyway to prevent email enumeration
        return {"status": "success", "message": "If that email exists, an OTP has been sent."}
        
    otp = str(random.randint(100000, 999999))
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
    
    success = set_reset_otp(request.email, otp, expires_at)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to generate OTP")
        
    # Simulate sending email by logging to console
    print(f"\n{'='*50}\n[SIMULATED EMAIL] OTP for {request.email}: {otp}\n{'='*50}\n")
    
    return {"status": "success", "message": "If that email exists, an OTP has been sent."}

class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/reset-password-with-otp")
async def reset_password_with_otp(request: PasswordResetConfirm):
    from database import get_db, clear_reset_otp
    db = get_db()
    
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid OTP or email")
        
    if not user.get("reset_otp") or user.get("reset_otp") != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if user.get("reset_otp_expiry"):
        expiry = datetime.fromisoformat(user.get("reset_otp_expiry"))
        if datetime.utcnow() > expiry:
            raise HTTPException(status_code=400, detail="OTP has expired")
            
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
    new_hash = get_password_hash(request.new_password)
    
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    db["users"].update_one(
        {"email": request.email},
        {"$set": {"hashed_password": new_hash}}
    )
    
    clear_reset_otp(request.email)
    
    return {"status": "success", "message": "Password has been reset successfully"}
