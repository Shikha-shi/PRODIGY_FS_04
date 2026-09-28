from pathlib import Path

import jwt
from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import (
    Base,
    SessionLocal,
    engine,
)
from app.models import (
    ChatRoom,
    ConversationMember,
    DirectMessage,
    Message,
    User,
)
from app.routers.auth import router as auth_router
from app.routers.conversations import (
    router as conversations_router,
)
from app.routers.rooms import (
    router as rooms_router,
)
from app.routers.upload import (
    router as upload_router,
)
from app.routers.users import (
    router as users_router,
)
from app.settings import settings
from app.websocket.manager import manager


# Upload Directory

Path("uploads").mkdir(
    exist_ok=True
)


# Database Initialization

Base.metadata.create_all(
    bind=engine
)


# FastAPI Application

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Real-time chat application "
        "built with FastAPI, WebSockets, "
        "SQLAlchemy and PostgreSQL"
    ),
    version="2.0.0"
)


# CORS Configuration

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Static Uploads

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


# API Routes

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rooms_router)
app.include_router(conversations_router)
app.include_router(upload_router)


# Root Endpoint

@app.get("/")
def root():
    return {
        "message": "Welcome to Chirp API",
        "status": "running"
    }


# Health Check

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# WebSocket Authentication

def authenticate_ws(
    websocket: WebSocket,
    db: Session
):
    token = websocket.query_params.get(
        "token"
    )

    if not token:
        return None

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[
                settings.JWT_ALGORITHM
            ]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return db.get(
            User,
            int(user_id)
        )

    except (
        jwt.PyJWTError,
        ValueError,
        TypeError
    ):
        return None


# Public Room WebSocket

@app.websocket(
    "/ws/rooms/{room_id}"
)
async def room_websocket(
    websocket: WebSocket,
    room_id: int
):
    db = SessionLocal()

    user = authenticate_ws(
        websocket,
        db
    )

    room = db.get(
        ChatRoom,
        room_id
    )

    if not user or not room:
        await websocket.close(
            code=1008
        )
        db.close()
        return

    await manager.connect_room(
        room_id,
        user.id,
        websocket
    )

    try:
        await manager.broadcast_room(
            room_id,
            {
                "type": "presence",
                "user_id": user.id,
                "online": True,
            }
        )

        while True:
            data = await websocket.receive_json()

            content = str(
                data.get(
                    "content",
                    ""
                )
            ).strip()

            if not content:
                continue

            message = Message(
                content=content,
                sender_id=user.id,
                room_id=room_id
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            await manager.broadcast_room(
                room_id,
                {
                    "type": "message",
                    "id": message.id,
                    "content": message.content,
                    "sender_id": message.sender_id,
                    "username": user.username,
                    "room_id": message.room_id,
                    "message_type": "text",
                    "attachment_url": None,
                    "created_at": (
                        message.created_at
                        .isoformat()
                    ),
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(
            websocket,
            user.id,
            room_id=room_id
        )

        await manager.broadcast_room(
            room_id,
            {
                "type": "presence",
                "user_id": user.id,
                "online": False,
            }
        )

    finally:
        db.close()


# Private Conversation WebSocket

@app.websocket(
    "/ws/conversations/{conversation_id}"
)
async def conversation_websocket(
    websocket: WebSocket,
    conversation_id: int
):
    db = SessionLocal()

    user = authenticate_ws(
        websocket,
        db
    )

    if not user:
        await websocket.close(
            code=1008
        )
        db.close()
        return

    member = db.scalar(
        select(
            ConversationMember.id
        ).where(
            ConversationMember.conversation_id
            == conversation_id,
            ConversationMember.user_id
            == user.id
        )
    )

    if not member:
        await websocket.close(
            code=1008
        )
        db.close()
        return

    await manager.connect_conversation(
        conversation_id,
        user.id,
        websocket
    )

    try:
        while True:
            data = await websocket.receive_json()

            content = str(
                data.get(
                    "content",
                    ""
                )
            ).strip()

            message_type = data.get(
                "message_type",
                "text"
            )

            attachment_url = data.get(
                "attachment_url"
            )

            if not content and not attachment_url:
                continue

            message = DirectMessage(
                content=content,
                sender_id=user.id,
                conversation_id=conversation_id,
                message_type=message_type,
                attachment_url=attachment_url,
            )

            db.add(message)
            db.commit()
            db.refresh(message)

            payload = {
                "type": "message",
                "id": message.id,
                "content": message.content,
                "sender_id": user.id,
                "username": user.username,
                "conversation_id": conversation_id,
                "message_type": message.message_type,
                "attachment_url": message.attachment_url,
                "created_at": (
                    message.created_at
                    .isoformat()
                ),
            }

            await manager.broadcast_conversation(
                conversation_id,
                payload
            )

            members = db.scalars(
                select(
                    ConversationMember
                ).where(
                    ConversationMember.conversation_id
                    == conversation_id,
                    ConversationMember.user_id
                    != user.id
                )
            ).all()

            for member_item in members:
                await manager.send_to_user(
                    member_item.user_id,
                    {
                        "type": "notification",
                        "conversation_id": conversation_id,
                        "sender_id": user.id,
                        "username": user.username,
                        "content": (
                            content
                            or "Sent an attachment"
                        ),
                    }
                )

    except WebSocketDisconnect:
        manager.disconnect(
            websocket,
            user.id,
            conversation_id=conversation_id
        )

    finally:
        db.close()


# Notification WebSocket

@app.websocket(
    "/ws/notifications"
)
async def notification_websocket(
    websocket: WebSocket
):
    db = SessionLocal()

    user = authenticate_ws(
        websocket,
        db
    )

    if not user:
        await websocket.close(
            code=1008
        )
        db.close()
        return

    await websocket.accept()

    manager.user_connections[
        user.id
    ].append(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(
            websocket,
            user.id
        )

    finally:
        db.close()