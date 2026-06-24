from pydantic import BaseModel


class ConversationResponse(BaseModel):
    id: int
    name: str
    last_message: str
    unread_count: int

    class Config:
        from_attributes = True