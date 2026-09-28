from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Conversation Model

class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    members = relationship(
        "ConversationMember",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )

    direct_messages = relationship(
        "DirectMessage",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )


# Conversation Member Model

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    __table_args__ = (
        UniqueConstraint(
            "conversation_id",
            "user_id"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    conversation = relationship(
        "Conversation",
        back_populates="members"
    )

    user = relationship(
        "User",
        back_populates="conversation_members"
    )