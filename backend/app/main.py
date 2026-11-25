
from fastapi import FastAPI
from app.api.websocket import router as websocket_router

app = FastAPI(
    title="SpeakFlow AI",
    description="Real-time multilingual speech transcription application",
    version="1.0.0"
)

# Register WebSocket router
app.include_router(websocket_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to SpeakFlow AI",
        "status": "running"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SpeakFlow AI backend"
    }
