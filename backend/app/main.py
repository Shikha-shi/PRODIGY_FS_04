from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import security
from app.database import Base, engine
from app.models import User
from app.routers.auth import router as auth_router
from app.settings import settings


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