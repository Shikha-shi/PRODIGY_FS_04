from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Public Room Message

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    room_id: Mapped[int] = mapped_column(
        ForeignKey("chat_rooms.id"),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    sender = relationship(
        "User",
        back_populates="messages"
    )

    room = relationship(
        "ChatRoom",
        back_populates="messages"
    )


# Private Direct Message

class DirectMessage(Base):
    __tablename__ = "direct_messages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    content: Mapped[str] = mapped_column(
        Text,
        default="",
        nullable=False
    )

    sender_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    message_type: Mapped[str] = mapped_column(
        String(20),
        default="text",
        nullable=False
    )

    attachment_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    sender = relationship("User")

    conversation = relationship(
        "Conversation",
        back_populates="direct_messages"
    )