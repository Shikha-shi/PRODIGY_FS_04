from datetime import datetime

from pydantic import BaseModel


# Message Response

class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    username: str
    room_id: int | None = None
    conversation_id: int | None = None
    message_type: str = "text"
    attachment_url: str | None = None
    created_at: datetime