
import asyncio
import json
import os
import tempfile

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.transcription import transcribe_audio

router = APIRouter()

MAX_AUDIO_SIZE = 100 * 1024 * 1024  # 100 MB


@router.websocket("/ws/transcribe")
async def transcribe_websocket(websocket: WebSocket):
    await websocket.accept()

    print("WebSocket client connected")

    audio_buffer = bytearray()
    selected_language = "auto"

    try:
        await websocket.send_json({
            "type": "connected",
            "message": "WebSocket connection established"
        })

        while True:
            message = await websocket.receive()

            # Handle binary audio chunks.
            if message.get("bytes") is not None:
                audio_chunk = message["bytes"]

                audio_buffer.extend(audio_chunk)

                if len(audio_buffer) > MAX_AUDIO_SIZE:
                    await websocket.send_json({
                        "type": "transcription_error",
                        "message": "Audio size exceeded the 100 MB limit."
                    })
                    await websocket.close()
                    return

                print(
                    f"Received audio chunk: "
                    f"{len(audio_chunk)} bytes | "
                    f"Total: {len(audio_buffer)} bytes"
                )

                await websocket.send_json({
                    "type": "audio_received",
                    "chunk_size": len(audio_chunk),
                    "total_bytes": len(audio_buffer)
                })

            # Handle JSON control messages.
            elif message.get("text") is not None:
                try:
                    data = json.loads(message["text"])
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "transcription_error",
                        "message": "Invalid control message."
                    })
                    continue

                if data.get("type") == "config":
                    selected_language = data.get(
                        "language", "auto"
                    )

                    print(
                        f"Selected language: {selected_language}"
                    )

                elif data.get("type") == "stop":
                    if not audio_buffer:
                        await websocket.send_json({
                            "type": "transcription_error",
                            "message": "No audio was received."
                        })
                        await websocket.close()
                        return

                    print("Audio recording completed.")
                    print("Starting speech transcription...")

                    await websocket.send_json({
                        "type": "transcription_started",
                        "message": "Transcription is processing."
                    })

                    temp_path = None

                    try:
                        # Save the complete WebM recording.
                        with tempfile.NamedTemporaryFile(
                            suffix=".webm",
                            delete=False
                        ) as temp_file:
                            temp_file.write(audio_buffer)
                            temp_path = temp_file.name

                        # Run CPU-heavy transcription outside
                        # the FastAPI event loop.
                        result = await asyncio.to_thread(
                            transcribe_audio,
                            temp_path,
                            selected_language
                        )

                        await websocket.send_json({
                            "type": "transcription_completed",
                            "transcript": result["text"],
                            "language": result["language"],
                            "language_probability": (
                                result["language_probability"]
                            ),
                            "duration": result["duration"]
                        })

                        print("Transcription completed.")
                        print("Result:", result["text"])

                    except Exception as exc:
                        print("Transcription error:", str(exc))

                        await websocket.send_json({
                            "type": "transcription_error",
                            "message": str(exc)
                        })

                    finally:
                        if temp_path and os.path.exists(temp_path):
                            os.remove(temp_path)

                    await websocket.close()
                    return

    except WebSocketDisconnect:
        print("WebSocket client disconnected")

    except Exception as exc:
        print("WebSocket error:", str(exc))

        try:
            await websocket.send_json({
                "type": "transcription_error",
                "message": "An unexpected backend error occurred."
            })
            await websocket.close()
        except Exception:
            pass
