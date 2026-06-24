from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import SessionLocal
from models import Message, ConversationMember

router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)


class MessageCreate(BaseModel):
    conversation_id: int
    sender_id: int
    content: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{conversation_id}")
def get_messages(conversation_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return messages


@router.post("/")
def create_message(payload: MessageCreate, db: Session = Depends(get_db)):
    message = Message(
        conversation_id=payload.conversation_id,
        sender_id=payload.sender_id,
        content=payload.content,
        status="sent",
        is_read=False,
    )

    db.add(message)
    db.commit()
    db.refresh(message)
    members = (
        db.query(ConversationMember)
        .filter(ConversationMember.conversation_id == payload.conversation_id)
        .all()
    )

    for member in members:
        if member.user_id != payload.sender_id:
            member.unread_count += 1

    db.commit()
    db.refresh(message)

    return message