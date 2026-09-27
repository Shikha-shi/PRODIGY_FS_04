from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import jwt
from app.database import Base, SessionLocal, engine
from app.models import Message, User
from app.models.room import ChatRoom
from app.routers.auth import router as auth_router
from app.routers.rooms import router as rooms_router
from app.settings import settings
from app.websocket.manager import manager


# Database Initialization

Base.metadata.create_all(bind=engine)


# FastAPI Application

app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time chat application built with FastAPI, WebSockets and PostgreSQL",
    version="1.0.0"
)


# CORS Configuration

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication Routes

app.include_router(auth_router)


# Chat Room Routes

app.include_router(rooms_router)


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


# Real-Time Chat WebSocket

@app.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int
):
    db: Session = SessionLocal()

    try:
        token = websocket.query_params.get("token")

        if not token:
            await websocket.close(code=1008)
            return

        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            user_id = payload.get("sub")

            if user_id is None:
                await websocket.close(code=1008)
                return

            user = db.get(User, int(user_id))

            if not user:
                await websocket.close(code=1008)
                return

        except jwt.PyJWTError:
            await websocket.close(code=1008)
            return

        room = db.get(ChatRoom, room_id)

        if not room:
            await websocket.close(code=1008)
            return

        await manager.connect(room_id, websocket)

        while True:
            data = await websocket.receive_json()

            content = data.get("content", "").strip()

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

            await manager.broadcast(
                room_id,
                {
                    "id": message.id,
                    "content": message.content,
                    "sender_id": message.sender_id,
                    "username": user.username,
                    "room_id": message.room_id,
                    "created_at": message.created_at.isoformat()
                }
            )

    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)

    finally:
        db.close()