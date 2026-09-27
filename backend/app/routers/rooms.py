from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.room import ChatRoom
from app.models.user import User
from app.schemas.room import RoomCreate, RoomResponse
from app.models.message import Message
from app.schemas.message import MessageResponse


# Chat Room Router

router = APIRouter(
    prefix="/rooms",
    tags=["Chat Rooms"]
)


# Create Chat Room

@router.post(
    "",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED
)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing_room = db.scalar(
        select(ChatRoom).where(
            ChatRoom.name == data.name
        )
    )

    if existing_room:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A room with this name already exists"
        )

    room = ChatRoom(
        name=data.name,
        description=data.description,
        creator_id=current_user.id
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


# List Chat Rooms

@router.get(
    "",
    response_model=list[RoomResponse]
)
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.scalars(
        select(ChatRoom).order_by(
            ChatRoom.created_at.desc()
        )
    ).all()


# Get Single Chat Room

@router.get(
    "/{room_id}",
    response_model=RoomResponse
)
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.get(ChatRoom, room_id)

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )

    return room

# Room Message History

@router.get(
    "/{room_id}/messages",
    response_model=list[MessageResponse]
)
def get_room_messages(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    room = db.get(ChatRoom, room_id)

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat room not found"
        )

    messages = db.scalars(
        select(Message)
        .where(Message.room_id == room_id)
        .order_by(Message.created_at.asc())
    ).all()

    return [
        MessageResponse(
            id=message.id,
            content=message.content,
            sender_id=message.sender_id,
            username=message.sender.username,
            room_id=message.room_id,
            created_at=message.created_at
        )
        for message in messages
    ]