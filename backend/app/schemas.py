from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class TranscriptionCreate(BaseModel):
    title: str = Field(default="Untitled transcription", max_length=200)
    text: str
    language: str = "unknown"
    language_probability: float = 0.0
    duration: float = 0.0

class TranscriptionUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    text: str | None = None

class TranscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    text: str
    language: str
    language_probability: float
    duration: float
    created_at: datetime
    updated_at: datetime
