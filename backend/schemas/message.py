from pydantic import BaseModel
from datetime import datetime


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    status: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True