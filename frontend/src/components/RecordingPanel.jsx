
function RecordingPanel({
  isRecording,
  isTranscribing,
  onStart,
  onStop,
  audioUrl,
  error,
  connectionStatus,
  lastAck,
  transcript,
  detectedLanguage,
  languageProbability,
}) {
  return (
    <section className="recording-panel">
      <div className="panel-heading">
        <h2>Live Transcription</h2>
        <p>
          Record your speech and convert it into text using AI.
        </p>
      </div>

      <div className="recording-status">
        <span
          className={
            isRecording
              ? "status-dot recording"
              : "status-dot"
          }
        />

        {isRecording
          ? "Recording in progress..."
          : isTranscribing
            ? "Transcribing your audio..."
            : "Ready to record"}
      </div>

      <p>
        Server connection: <strong>{connectionStatus}</strong>
      </p>

      <div className="recording-controls">
        <button
          className="start-btn"
          onClick={onStart}
          disabled={isRecording || isTranscribing}
        >
          🎙 Start Recording
        </button>

        <button
          className="stop-btn"
          onClick={onStop}
          disabled={!isRecording}
        >
          ⏹ Stop Recording
        </button>
      </div>

      {error && (
        <p className="recording-error">{error}</p>
      )}

      {lastAck && (
        <div className="server-acknowledgement">
          <h3>Audio Transmission</h3>

          <p>
            Last chunk size: {lastAck.chunk_size} bytes
          </p>

          <p>
            Total audio received: {lastAck.total_bytes} bytes
          </p>
        </div>
      )}

      {isTranscribing && (
        <div className="transcription-loading">
          <p>
            AI is processing your recording. Please wait...
          </p>
        </div>
      )}

      <div className="transcription-output">
        <h3>Transcription Output</h3>

        {transcript ? (
          <>
            <div className="transcription-result">
              <p>{transcript}</p>
            </div>

            <div className="transcription-metadata">
              <p>
                Detected language:{" "}
                <strong>{detectedLanguage}</strong>
              </p>

              {languageProbability !== null && (
                <p>
                  Language confidence:{" "}
                  <strong>
                    {(languageProbability * 100).toFixed(1)}%
                  </strong>
                </p>
              )}
            </div>
          </>
        ) : (
          <p>
            {isRecording
              ? "Your audio is being sent to the backend."
              : isTranscribing
                ? "Waiting for the AI transcription result..."
                : "Your recognized speech will appear here."}
          </p>
        )}

        {audioUrl && (
          <div className="audio-playback">
            <h3>Recorded Audio</h3>
            <audio controls src={audioUrl} />
          </div>
        )}
      </div>
    </section>
  );
}

export default RecordingPanel;
