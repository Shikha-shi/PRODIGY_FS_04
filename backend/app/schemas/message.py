from datetime import datetime

from pydantic import BaseModel


# Message Response

class MessageResponse(BaseModel):
    id: int
    content: str
    sender_id: int
    username: str
    room_id: int
    created_at: datetime