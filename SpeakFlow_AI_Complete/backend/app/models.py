from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Transcription(Base):
    __tablename__ = "transcriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), default="Untitled transcription")
    text: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(20), default="unknown")
    language_probability: Mapped[float] = mapped_column(Float, default=0.0)
    duration: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
