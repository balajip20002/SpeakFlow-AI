from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api.transcriptions import router as transcription_router
from app.api.websocket import router as websocket_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SpeakFlow AI",
    description="Incremental multilingual speech transcription with history and CRUD",
    version="2.0.0",
)

origins = [x.strip() for x in __import__("os").getenv(
    "FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if x.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcription_router)
app.include_router(websocket_router)

@app.get("/")
def root():
    return {"message": "Welcome to SpeakFlow AI", "status": "running"}

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "SpeakFlow AI"}
