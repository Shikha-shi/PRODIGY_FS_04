from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from app.auth.dependencies import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/upload",
    tags=["Files"]
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# Allowed Upload Types

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
}


# Upload File

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type"
        )

    extension = Path(
        file.filename or "file"
    ).suffix[:10]

    filename = (
        f"{uuid4().hex}{extension}"
    )

    path = UPLOAD_DIR / filename

    path.write_bytes(
        await file.read()
    )

    return {
        "url": f"/uploads/{filename}",
        "filename": file.filename or filename,
        "content_type": file.content_type,
    }