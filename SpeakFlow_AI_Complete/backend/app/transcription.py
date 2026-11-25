import os
from functools import lru_cache
from faster_whisper import WhisperModel

@lru_cache(maxsize=1)
def get_whisper_model():
    model_name = os.getenv("WHISPER_MODEL", "base")
    device = os.getenv("WHISPER_DEVICE", "cpu")
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
    print(f"Loading Faster-Whisper: {model_name} on {device}/{compute_type}")
    return WhisperModel(model_name, device=device, compute_type=compute_type)

def transcribe_audio(audio_path: str, language: str = "auto"):
    model = get_whisper_model()
    selected_language = None if not language or language == "auto" else language
    segments, info = model.transcribe(
        audio_path,
        language=selected_language,
        beam_size=1,
        vad_filter=True,
        condition_on_previous_text=False,
    )
    text = " ".join(s.text.strip() for s in segments if s.text.strip()).strip()
    return {
        "text": text,
        "language": info.language or "unknown",
        "language_probability": round(float(info.language_probability or 0), 4),
        "duration": round(float(info.duration or 0), 2),
    }
