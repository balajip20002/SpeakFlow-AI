import { useCallback, useEffect, useRef, useState } from "react";
import { WS_BASE } from "../services/api";

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState("unknown");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("disconnected");
  const [savedId, setSavedId] = useState(null);
  const [duration, setDuration] = useState(0);
  const socketRef = useRef(null);
  const contextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const audioContextSampleRateRef = useRef(48000);

  const cleanupAudio = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try { processorRef.current?.disconnect(); } catch {}
    try { sourceRef.current?.disconnect(); } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (contextRef.current && contextRef.current.state !== "closed") {
      await contextRef.current.close();
    }
    contextRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
  }, []);

  const start = useCallback(async (selectedLanguage = "auto") => {
    setError(""); setTranscript(""); setSavedId(null); setDuration(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Microphone is unavailable. Use localhost or HTTPS.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const socket = new WebSocket(WS_BASE);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = () => reject(new Error("Could not connect to the transcription WebSocket."));
      });
      socket.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.type === "transcription_partial") {
          setTranscript(data.transcript || "");
          setLanguage(data.language || "unknown");
          setStatus("recording");
        } else if (data.type === "transcription_completed") {
          setTranscript(data.transcript || "");
          setLanguage(data.language || "unknown");
          setSavedId(data.id);
          setIsTranscribing(false);
          setStatus("completed");
        } else if (data.type === "transcription_error") {
          setError(data.message || "Transcription failed.");
          setIsTranscribing(false); setStatus("error");
        } else if (data.type === "connected") setStatus("connected");
      };
      socket.onclose = () => {
        if (status !== "completed") setStatus("disconnected");
      };
      socket.send(JSON.stringify({ type: "config", language: selectedLanguage, title: "SpeakFlow session" }));

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextClass();
      await context.resume();
      contextRef.current = context;
      audioContextSampleRateRef.current = context.sampleRate;
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      sourceRef.current = source; processorRef.current = processor;
      processor.onaudioprocess = event => {
        if (socket.readyState !== WebSocket.OPEN) return;
        const input = event.inputBuffer.getChannelData(0);
        const targetRate = 16000;
        const ratio = context.sampleRate / targetRate;
        const outputLength = Math.floor(input.length / ratio);
        const pcm = new Int16Array(outputLength);
        for (let i = 0; i < outputLength; i++) {
          const sample = input[Math.min(input.length - 1, Math.floor(i * ratio))];
          const clamped = Math.max(-1, Math.min(1, sample));
          pcm[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
        }
        socket.send(pcm.buffer);
      };
      source.connect(processor);
      processor.connect(context.destination);
      startedAtRef.current = Date.now();
      timerRef.current = setInterval(() => setDuration(Math.floor((Date.now() - startedAtRef.current) / 1000)), 500);
      setIsRecording(true); setStatus("recording");
    } catch (e) {
      setError(e.message || "Unable to start recording.");
      setStatus("error");
      await cleanupAudio();
      if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.close();
    }
  }, [cleanupAudio, status]);

  const stop = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false); setIsTranscribing(true);
    await cleanupAudio();
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop" }));
      setStatus("transcribing");
    } else {
      setError("WebSocket disconnected before the final transcript was saved.");
      setIsTranscribing(false); setStatus("error");
    }
  }, [cleanupAudio, isRecording]);

  useEffect(() => () => { cleanupAudio(); socketRef.current?.close(); }, [cleanupAudio]);
  return { isRecording, isTranscribing, transcript, language, error, status, savedId, duration, start, stop };
}
