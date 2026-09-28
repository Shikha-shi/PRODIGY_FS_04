from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.conversation import (
    Conversation,
    ConversationMember,
)
from app.models.message import DirectMessage
from app.models.user import User
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationUser,
)
from app.schemas.message import MessageResponse
from app.websocket.manager import manager


router = APIRouter(
    prefix="/conversations",
    tags=["Private Conversations"]
)


# Conversation Membership

def is_member(
    db: Session,
    conversation_id: int,
    user_id: int
) -> bool:
    return db.scalar(
        select(ConversationMember.id).where(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == user_id,
        )
    ) is not None


# Find Other User

def other_member(
    db: Session,
    conversation_id: int,
    user_id: int
) -> User | None:
    return db.scalar(
        select(User)
        .join(
            ConversationMember,
            ConversationMember.user_id == User.id
        )
        .where(
            ConversationMember.conversation_id == conversation_id,
            User.id != user_id
        )
    )


# Conversation Response

def response_for(
    db: Session,
    conversation: Conversation,
    current_user_id: int
) -> ConversationResponse | None:

    other = other_member(
        db,
        conversation.id,
        current_user_id
    )

    if not other:
        return None

    last = db.scalar(
        select(DirectMessage)
        .where(
            DirectMessage.conversation_id
            == conversation.id
        )
        .order_by(
            DirectMessage.created_at.desc()
        )
    )

    return ConversationResponse(
        id=conversation.id,
        other_user=ConversationUser(
            id=other.id,
            username=other.username,
            online=manager.is_online(other.id)
        ),
        last_message=(
            last.content
            if last
            else None
        ),
        last_message_at=(
            last.created_at
            if last
            else None
        ),
    )


# Create Or Get Conversation

@router.post(
    "",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_or_get_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if data.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot start a conversation with yourself"
        )

    other = db.get(User, data.user_id)

    if not other:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    conversations = db.scalars(
        select(Conversation)
        .join(ConversationMember)
        .where(
            ConversationMember.user_id
            == current_user.id
        )
    ).all()

    for conversation in conversations:
        member_ids = {
            member.user_id
            for member in conversation.members
        }

        if member_ids == {
            current_user.id,
            other.id
        }:
            result = response_for(
                db,
                conversation,
                current_user.id
            )

            if result:
                return result

    conversation = Conversation()

    db.add(conversation)
    db.flush()

    db.add_all([
        ConversationMember(
            conversation_id=conversation.id,
            user_id=current_user.id
        ),
        ConversationMember(
            conversation_id=conversation.id,
            user_id=other.id
        ),
    ])

    db.commit()
    db.refresh(conversation)

    return response_for(
        db,
        conversation,
        current_user.id
    )


# List Conversations

@router.get(
    "",
    response_model=list[ConversationResponse]
)
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.scalars(
        select(Conversation)
        .join(ConversationMember)
        .where(
            ConversationMember.user_id
            == current_user.id
        )
    ).all()

    return [
        result
        for conversation in conversations
        if (
            result := response_for(
                db,
                conversation,
                current_user.id
            )
        )
    ]


# Private Message History

@router.get(
    "/{conversation_id}/messages",
    response_model=list[MessageResponse]
)
def conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_member(
        db,
        conversation_id,
        current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You are not a member of this conversation"
        )

    messages = db.scalars(
        select(DirectMessage)
        .where(
            DirectMessage.conversation_id
            == conversation_id
        )
        .order_by(
            DirectMessage.created_at.asc()
        )
    ).all()

    return [
        MessageResponse(
            id=message.id,
            content=message.content,
            sender_id=message.sender_id,
            username=message.sender.username,
            conversation_id=message.conversation_id,
            room_id=None,
            message_type=message.message_type,
            attachment_url=message.attachment_url,
            created_at=message.created_at
        )
        for message in messages
    ]