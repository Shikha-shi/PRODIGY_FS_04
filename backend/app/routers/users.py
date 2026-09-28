from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.conversation import ConversationUser
from app.websocket.manager import manager


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# List Users

@router.get(
    "",
    response_model=list[ConversationUser]
)
def list_users(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(User)
        .where(User.id != current_user.id)
        .order_by(User.username.asc())
    )

    if search:
        query = query.where(
            User.username.ilike(
                f"%{search}%"
            )
        )

    users = db.scalars(query).all()

    return [
        ConversationUser(
            id=user.id,
            username=user.username,
            online=manager.is_online(user.id)
        )
        for user in users
    ]