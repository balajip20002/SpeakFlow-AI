import asyncio
import io
import json
import wave
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Transcription
from app.transcription import transcribe_audio

router = APIRouter()
SAMPLE_RATE = 16000
WINDOW_SECONDS = 8
UPDATE_EVERY_SECONDS = 4
MAX_AUDIO_SECONDS = 60 * 30

def pcm_to_wav(pcm: bytes) -> str:
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        path = f.name
    with wave.open(path, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(pcm)
    return path

def merge_text(previous: str, current: str) -> str:
    """Replace the prior rolling-window hypothesis without duplicating overlap."""
    a = previous.split()
    b = current.split()
    max_overlap = min(len(a), len(b), 30)
    overlap = 0
    for n in range(1, max_overlap + 1):
        if [x.lower() for x in a[-n:]] == [x.lower() for x in b[:n]]:
            overlap = n
    if overlap:
        return " ".join(a + b[overlap:]).strip()
    # The rolling window may revise words; prefer the latest hypothesis.
    return current.strip() if current else previous

@router.websocket("/ws/transcribe")
async def transcribe_websocket(ws: WebSocket):
    await ws.accept()
    pcm_buffer = bytearray()
    selected_language = "auto"
    transcript = ""
    last_processed_samples = 0
    title = "Live transcription"
    try:
        await ws.send_json({"type": "connected", "message": "PCM streaming connection ready"})
        while True:
            message = await ws.receive()
            if message.get("bytes") is not None:
                chunk = message["bytes"]
                pcm_buffer.extend(chunk)
                total_samples = len(pcm_buffer) // 2
                if total_samples > SAMPLE_RATE * MAX_AUDIO_SECONDS:
                    await ws.send_json({"type": "transcription_error", "message": "Recording exceeded 30 minutes."})
                    await ws.close()
                    return
                await ws.send_json({"type": "audio_received", "total_bytes": len(pcm_buffer)})
                elapsed = total_samples / SAMPLE_RATE
                if elapsed >= WINDOW_SECONDS and elapsed - (last_processed_samples / SAMPLE_RATE) >= UPDATE_EVERY_SECONDS:
                    start_sample = max(0, total_samples - SAMPLE_RATE * WINDOW_SECONDS)
                    start_byte = start_sample * 2
                    wav_path = pcm_to_wav(bytes(pcm_buffer[start_byte:]))
                    try:
                        result = await asyncio.to_thread(transcribe_audio, wav_path, selected_language)
                    finally:
                        import os
                        if os.path.exists(wav_path):
                            os.remove(wav_path)
                    if result["text"]:
                        transcript = merge_text(transcript, result["text"])
                        await ws.send_json({
                            "type": "transcription_partial",
                            "transcript": transcript,
                            "window_text": result["text"],
                            "language": result["language"],
                            "language_probability": result["language_probability"],
                            "duration": elapsed,
                        })
                    last_processed_samples = total_samples

            elif message.get("text") is not None:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    await ws.send_json({"type": "transcription_error", "message": "Invalid control message"})
                    continue
                if data.get("type") == "config":
                    selected_language = data.get("language", "auto")
                    title = data.get("title") or title
                elif data.get("type") == "stop":
                    if not pcm_buffer:
                        await ws.send_json({"type": "transcription_error", "message": "No audio received"})
                        await ws.close()
                        return
                    wav_path = pcm_to_wav(bytes(pcm_buffer))
                    try:
                        result = await asyncio.to_thread(transcribe_audio, wav_path, selected_language)
                    finally:
                        import os
                        if os.path.exists(wav_path):
                            os.remove(wav_path)
                    final_text = result["text"] or transcript
                    db: Session = SessionLocal()
                    try:
                        item = Transcription(
                            title=title,
                            text=final_text,
                            language=result["language"],
                            language_probability=result["language_probability"],
                            duration=result["duration"],
                        )
                        db.add(item)
                        db.commit()
                        db.refresh(item)
                        record_id = item.id
                    finally:
                        db.close()
                    await ws.send_json({
                        "type": "transcription_completed",
                        "id": record_id,
                        "transcript": final_text,
                        "language": result["language"],
                        "language_probability": result["language_probability"],
                        "duration": result["duration"],
                    })
                    await ws.close()
                    return
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as exc:
        print("WebSocket transcription error:", repr(exc))
        try:
            await ws.send_json({"type": "transcription_error", "message": "Transcription failed. Check backend logs and audio/model dependencies."})
            await ws.close()
        except Exception:
            pass
