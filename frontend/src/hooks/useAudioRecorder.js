
import { useState, useRef, useEffect } from "react";
import { connectAudioWebSocket } from "../services/websocket";

function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");

  const [connectionStatus, setConnectionStatus] =
    useState("disconnected");

  const [lastAck, setLastAck] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [languageProbability, setLanguageProbability] =
    useState(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const websocketRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioUrlRef = useRef(null);

  const startRecording = async (language = "auto") => {
    try {
      setError("");
      setTranscript("");
      setDetectedLanguage("");
      setLanguageProbability(null);
      setLastAck(null);
      setIsTranscribing(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone access is not supported.");
      }

      if (!window.MediaRecorder) {
        throw new Error("MediaRecorder is not supported.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const socket = await connectAudioWebSocket(
        (data) => {
          if (data.type === "audio_received") {
            setLastAck(data);
          }

          if (data.type === "transcription_started") {
            setIsTranscribing(true);
            setConnectionStatus("transcribing");
          }

          if (data.type === "transcription_completed") {
            setTranscript(data.transcript || "");
            setDetectedLanguage(data.language || "unknown");
            setLanguageProbability(
              data.language_probability ?? null
            );

            setIsTranscribing(false);
            setConnectionStatus("completed");
          }

          if (data.type === "transcription_error") {
            setError(data.message || "Transcription failed.");
            setIsTranscribing(false);
            setConnectionStatus("error");
          }
        },
        setConnectionStatus,
        language
      );

      websocketRef.current = socket;
      audioChunksRef.current = [];

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
        setAudioUrl(null);
      }

      const supportedMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
      ];

      const mimeType = supportedMimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          if (socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const newAudioUrl = URL.createObjectURL(blob);

        audioUrlRef.current = newAudioUrl;
        setAudioUrl(newAudioUrl);

        setIsRecording(false);

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // The final dataavailable event fires before onstop.
        // Therefore, send the stop message after all chunks.
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "stop",
            })
          );

          setIsTranscribing(true);
        } else {
          setError("WebSocket disconnected before transcription.");
          setConnectionStatus("error");
        }
      };

      recorder.onerror = () => {
        setError("An error occurred while recording.");
        setIsRecording(false);
        setConnectionStatus("error");
      };

      recorder.start(1000);

      setIsRecording(true);

    } catch (err) {
      setError(err.message || "Unable to start recording.");
      setConnectionStatus("error");

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;

      if (
        websocketRef.current &&
        websocketRef.current.readyState === WebSocket.OPEN
      ) {
        websocketRef.current.close();
      }

      websocketRef.current = null;
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      if (
        websocketRef.current &&
        websocketRef.current.readyState === WebSocket.OPEN
      ) {
        websocketRef.current.close();
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    isTranscribing,
    audioUrl,
    error,
    connectionStatus,
    lastAck,
    transcript,
    detectedLanguage,
    languageProbability,
    startRecording,
    stopRecording,
  };
}

export default useAudioRecorder;
