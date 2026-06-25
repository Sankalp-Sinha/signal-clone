from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal
from datetime import datetime
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


class GroupConversationCreate(BaseModel):
    current_user_id: int
    name: str
    member_usernames: list[str]


class GroupMemberAdd(BaseModel):
    username: str


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
            "last_activity": (
                last_message.created_at.timestamp()
                if last_message
                else 0
            ),
        })

    result.sort(
        key=lambda conversation: conversation["last_activity"],
        reverse=True
    )

    for conversation in result:
        conversation.pop("last_activity", None)

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
                    ConversationMember.user_id == payload.current_user_id
                )
                .first()
            )

            return {
                "id": conv.id,
                "name": target_user.display_name,
                "type": conv.type,
                "last_message": last_message.content if last_message else "",
                "unread_count": current_member.unread_count if current_member else 0,
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


@router.post("/group")
def create_group_conversation(
    payload: GroupConversationCreate,
    db: Session = Depends(get_db)
):
    conversation = Conversation(
        type="group",
        name=payload.name,
        avatar_url=f"https://api.dicebear.com/7.x/initials/svg?seed={payload.name}"
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    admin_member = ConversationMember(
        conversation_id=conversation.id,
        user_id=payload.current_user_id,
        role="admin",
        unread_count=0
    )

    db.add(admin_member)

    added_user_ids = {payload.current_user_id}

    for username in payload.member_usernames:
        user = db.query(User).filter(User.username == username).first()

        if user and user.id not in added_user_ids:
            member = ConversationMember(
                conversation_id=conversation.id,
                user_id=user.id,
                role="member",
                unread_count=0
            )
            db.add(member)
            added_user_ids.add(user.id)

    db.commit()

    return {
        "id": conversation.id,
        "name": conversation.name,
        "type": conversation.type,
        "last_message": "",
        "unread_count": 0,
    }


@router.post("/{conversation_id}/members")
def add_group_member(
    conversation_id: int,
    payload: GroupMemberAdd,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

    if not conversation or conversation.type != "group":
        return {"error": "Group not found"}

    user = db.query(User).filter(User.username == payload.username).first()

    if not user:
        return {"error": "User not found"}

    existing_member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user.id
        )
        .first()
    )

    if existing_member:
        return {"error": "User already in group"}

    member = ConversationMember(
        conversation_id=conversation_id,
        user_id=user.id,
        role="member",
        unread_count=0
    )

    db.add(member)
    db.commit()

    return {"success": True}


@router.get("/{conversation_id}/members")
def get_conversation_members(
    conversation_id: int,
    db: Session = Depends(get_db)
):
    members = (
        db.query(ConversationMember, User)
        .join(User, ConversationMember.user_id == User.id)
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )

    return [
        {
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name,
            "avatar_url": user.avatar_url,
            "role": member.role,
        }
        for member, user in members
    ]


@router.delete("/{conversation_id}/members/{user_id}")
def remove_group_member(
    conversation_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()

    if not conversation or conversation.type != "group":
        return {"error": "Group not found"}

    member = (
        db.query(ConversationMember)
        .filter(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id
        )
        .first()
    )

    if not member:
        return {"error": "Member not found"}

    if member.role == "admin":
        return {"error": "Admin cannot be removed"}

    db.delete(member)
    db.commit()

    return {"success": True}