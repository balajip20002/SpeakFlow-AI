
const WS_URL = "ws://127.0.0.1:8000/ws/transcribe";

export function connectAudioWebSocket(
  onMessage,
  onStatus,
  language = "auto"
) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(WS_URL);
    let terminalStatus = null;

    socket.onopen = () => {
      onStatus("connected");

      socket.send(
        JSON.stringify({
          type: "config",
          language: language || "auto",
        })
      );

      resolve(socket);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "transcription_completed") {
          terminalStatus = "completed";
        }

        if (data.type === "transcription_error") {
          terminalStatus = "error";
        }

        onMessage(data);
      } catch {
        console.error("Invalid WebSocket response:", event.data);
      }
    };

    socket.onerror = () => {
      onStatus("error");
      reject(
        new Error("Unable to connect to the transcription server.")
      );
    };

    socket.onclose = () => {
      onStatus(terminalStatus || "disconnected");
    };
  });
}
