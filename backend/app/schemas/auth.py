from pydantic import BaseModel, EmailStr, Field


# Registration Schema

class RegisterRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


# Login Schema

class LoginRequest(BaseModel):
    email: EmailStr

    password: str


# Authentication Response

class TokenResponse(BaseModel):
    access_token: str
    token_type: str