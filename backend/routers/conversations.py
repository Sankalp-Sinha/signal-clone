from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal
from models import Conversation, ConversationMember, Message, User

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
    

class DirectConversationCreate(BaseModel):
    current_user_id: int
    target_username: str


@router.get("/")
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    conversations = (
        db.query(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .filter(ConversationMember.user_id == user_id)
        .all()
    )

    result = []

    for conv in conversations:
        last_message = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )

        current_member = (
            db.query(ConversationMember)
            .filter(
                ConversationMember.conversation_id == conv.id,
                ConversationMember.user_id == user_id,
            )
            .first()
        )

        if conv.type == "group":
            name = conv.name
        else:
            other_member = (
                db.query(ConversationMember)
                .filter(
                    ConversationMember.conversation_id == conv.id,
                    ConversationMember.user_id != user_id,
                )
                .first()
            )

            other_user = (
                db.query(User)
                .filter(User.id == other_member.user_id)
                .first()
                if other_member
                else None
            )

            name = other_user.display_name if other_user else "Unknown"

        result.append({
            "id": conv.id,
            "name": name,
            "type": conv.type,
            "last_message": last_message.content if last_message else "",
            "unread_count": current_member.unread_count if current_member else 0,
        })

    return result


@router.post("/direct")
def create_direct_conversation(
    payload: DirectConversationCreate,
    db: Session = Depends(get_db)
):
    target_user = (
        db.query(User)
        .filter(User.username == payload.target_username)
        .first()
    )

    if not target_user:
        return {"error": "User not found"}

    if target_user.id == payload.current_user_id:
        return {"error": "You cannot chat with yourself"}

    existing_conversations = (
        db.query(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .filter(Conversation.type == "direct")
        .all()
    )

    for conv in existing_conversations:
        members = (
            db.query(ConversationMember)
            .filter(ConversationMember.conversation_id == conv.id)
            .all()
        )

        member_ids = sorted([member.user_id for member in members])

        if member_ids == sorted([payload.current_user_id, target_user.id]):
            return {
                "id": conv.id,
                "name": target_user.display_name,
                "type": conv.type,
                "last_message": "",
                "unread_count": 0,
            }

    conversation = Conversation(type="direct")

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    member1 = ConversationMember(
        conversation_id=conversation.id,
        user_id=payload.current_user_id,
        role="member",
        unread_count=0
    )

    member2 = ConversationMember(
        conversation_id=conversation.id,
        user_id=target_user.id,
        role="member",
        unread_count=0
    )

    db.add_all([member1, member2])
    db.commit()

    return {
        "id": conversation.id,
        "name": target_user.display_name,
        "type": conversation.type,
        "last_message": "",
        "unread_count": 0,
    }



@router.post("/{conversation_id}/read")
def mark_conversation_read(
    conversation_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if member:
        member.unread_count = 0
        db.commit()

    return {"success": True}