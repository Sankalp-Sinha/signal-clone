from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import SessionLocal
from models import User

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

MOCK_OTP = "123456"


class RegisterRequest(BaseModel):
    username: str
    phone: str
    display_name: str


class LoginRequest(BaseModel):
    username: str


class VerifyOtpRequest(BaseModel):
    username: str
    otp: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == payload.username).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    user = User(
        username=payload.username,
        phone=payload.phone,
        display_name=payload.display_name,
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={payload.display_name}",
        is_online=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user": user,
        "mock_otp": MOCK_OTP
    }


@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "message": "OTP sent successfully",
        "mock_otp": MOCK_OTP,
        "username": user.username
    }


@router.post("/verify-otp")
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    if payload.otp != MOCK_OTP:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(User).filter(User.username == payload.username).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_online = True
    db.commit()
    db.refresh(user)

    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "phone": user.phone,
            "avatar_url": user.avatar_url
        }
    }