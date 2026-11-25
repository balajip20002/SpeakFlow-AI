
from faster_whisper import WhisperModel

# Load the model only once when the backend needs it.
_model = None


def get_whisper_model():
    global _model

    if _model is None:
        print("Loading Faster-Whisper model...")

        _model = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8",
        )

        print("Faster-Whisper model loaded successfully.")

    return _model


def transcribe_audio(audio_path: str, language: str = "auto"):
    model = get_whisper_model()

    # "auto" allows Whisper to detect the spoken language.
    selected_language = None if language == "auto" else language

    segments, info = model.transcribe(
        audio_path,
        language=selected_language,
        beam_size=5,
        vad_filter=True,
    )

    # The segments object is a generator.
    # Iterating over it executes the transcription.
    transcription_segments = list(segments)

    transcript = " ".join(
        segment.text.strip()
        for segment in transcription_segments
        if segment.text.strip()
    )

    return {
        "text": transcript.strip(),
        "language": info.language,
        "language_probability": round(
            info.language_probability, 4
        ),
        "duration": round(info.duration, 2),
    }
