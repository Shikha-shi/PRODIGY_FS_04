from datetime import datetime

from pydantic import BaseModel, Field


# Create Room Schema

class RoomCreate(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=100
    )

    description: str | None = Field(
        default=None,
        max_length=255
    )


# Room Response

class RoomResponse(BaseModel):
    id: int
    name: str
    description: str | None
    creator_id: int
    created_at: datetime

    model_config = {
        "from_attributes": True
    }