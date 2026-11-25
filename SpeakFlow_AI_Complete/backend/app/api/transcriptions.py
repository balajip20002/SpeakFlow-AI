from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database import get_db
from app.models import Transcription
from app.schemas import TranscriptionCreate, TranscriptionUpdate, TranscriptionOut

router = APIRouter(prefix="/api/transcriptions", tags=["Transcriptions"])

@router.post("", response_model=TranscriptionOut, status_code=201)
def create_transcription(payload: TranscriptionCreate, db: Session = Depends(get_db)):
    item = Transcription(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("", response_model=list[TranscriptionOut])
def list_transcriptions(
    q: str | None = Query(default=None, max_length=200),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Transcription)
    if q:
        pattern = f"%{q}%"
        query = query.filter(or_(Transcription.title.ilike(pattern), Transcription.text.ilike(pattern)))
    return query.order_by(desc(Transcription.created_at)).offset(skip).limit(limit).all()

@router.get("/{item_id}", response_model=TranscriptionOut)
def get_transcription(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Transcription, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Transcription not found")
    return item

@router.put("/{item_id}", response_model=TranscriptionOut)
def update_transcription(item_id: int, payload: TranscriptionUpdate, db: Session = Depends(get_db)):
    item = db.get(Transcription, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Transcription not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_transcription(item_id: int, db: Session = Depends(get_db)):
    item = db.get(Transcription, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Transcription not found")
    db.delete(item)
    db.commit()
    return {"message": "Transcription deleted", "id": item_id}
