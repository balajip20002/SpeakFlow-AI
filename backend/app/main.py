
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.api.transcriptions import router as transcription_router
from app.api.websocket import router as websocket_router


# Initialize database tables
Base.metadata.create_all(bind=engine)


# Initialize FastAPI application
app = FastAPI(
    title="SpeakFlow AI",
    description="Incremental multilingual speech transcription with history and CRUD",
    version="2.0.0",
)


# CORS configuration
# Supports deployed Netlify frontend and local development.
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

frontend_origins = os.getenv("FRONTEND_ORIGINS", "")

origins = list(
    dict.fromkeys(
        origin.strip().rstrip("/")
        for origin in default_origins + frontend_origins.split(",")
        if origin.strip()
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(transcription_router)
app.include_router(websocket_router)


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to SpeakFlow AI",
        "status": "running",
    }


# Health check endpoint
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "SpeakFlow AI",
    }
