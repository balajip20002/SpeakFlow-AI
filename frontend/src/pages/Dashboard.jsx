
import { useState } from "react";
import LanguageSelector from "../components/LanguageSelector";
import RecordingPanel from "../components/RecordingPanel";
import useAudioRecorder from "../hooks/useAudioRecorder";

function Dashboard() {
  const [language, setLanguage] = useState("en");

  const {
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
  } = useAudioRecorder();

  return (
    <div className="dashboard-page">
      <section className="dashboard-welcome">
        <h2>Welcome to SpeakFlow AI</h2>

        <p>
          Your multilingual speech intelligence workspace.
        </p>
      </section>

      <section className="workspace-section">
        <div className="workspace-header">
          <div>
            <h2>Speech Workspace</h2>

            <p>
              Start a new speech transcription session.
            </p>
          </div>

          <LanguageSelector
            language={language}
            setLanguage={setLanguage}
          />
        </div>

        <RecordingPanel
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          onStart={() => startRecording(language)}
          onStop={stopRecording}
          audioUrl={audioUrl}
          error={error}
          connectionStatus={connectionStatus}
          lastAck={lastAck}
          transcript={transcript}
          detectedLanguage={detectedLanguage}
          languageProbability={languageProbability}
        />
      </section>
    </div>
  );
}

export default Dashboard;
