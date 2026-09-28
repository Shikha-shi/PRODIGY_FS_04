from datetime import datetime

from pydantic import BaseModel


# Create Conversation

class ConversationCreate(BaseModel):
    user_id: int


# Conversation User

class ConversationUser(BaseModel):
    id: int
    username: str
    online: bool = False


# Conversation Response

class ConversationResponse(BaseModel):
    id: int
    other_user: ConversationUser
    last_message: str | None = None
    last_message_at: datetime | None = None