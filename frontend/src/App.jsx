import { useState } from "react";
import { AudioLines, Mic, Square, Radio, Languages, Clock3, Github, Sparkles } from "lucide-react";
import useAudioRecorder from "./hooks/useAudioRecorder";
import History from "./components/History";

export default function App() {
  const [language, setLanguage] = useState("auto");
  const [refreshKey, setRefreshKey] = useState(0);
  const { isRecording, isTranscribing, transcript, language: detected, error, status, savedId, duration, start, stop } = useAudioRecorder();
  const handleStart = () => start(language);
  const handleStop = async () => { await stop(); };
  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-icon"><AudioLines/></span><span>SpeakFlow<span className="brand-ai"> AI</span></span></a>
      <div className="top-right"><span className="live-pill"><i/> LOCAL AI ENGINE</span><a className="github-link" href="https://github.com/balajip20002/SpeakFlow-AI" target="_blank" rel="noreferrer"><Github size={17}/> GitHub</a></div>
    </header>
    <section className="hero"><div><p className="eyebrow"><Sparkles size={14}/> MULTILINGUAL SPEECH INTELLIGENCE</p><h1>Your voice.<br/><span>Every language.</span></h1><p className="hero-copy">Capture natural speech and turn it into searchable text with locally running AI.</p></div>
      <div className="hero-art"><div className="orb orb-one"/><div className="orb orb-two"/><div className="wave">{Array.from({length:29},(_,i)=><i key={i} style={{height:`${14+Math.abs(Math.sin(i*.72))*64}px`}}/>)}</div><span className="hero-tag">EN · HI · MULTILINGUAL</span></div>
    </section>
    <div className="workspace-grid">
      <section className="panel recorder">
        <div className="section-heading"><div><p className="eyebrow">LIVE WORKSPACE</p><h2>Speech capture</h2></div><span className={`status ${isRecording?"recording":isTranscribing?"processing":""}`}><i/>{isRecording?"Recording":isTranscribing?"Processing":status}</span></div>
        <div className="capture-center"><div className={`mic-orbit ${isRecording?"active":""}`}><div className="mic-core"><Mic size={34}/></div></div><p className="capture-title">{isRecording?"Listening to your voice":isTranscribing?"Finalizing your transcript":"Ready when you are"}</p><p className="capture-sub">{isRecording?"Speak naturally. Your transcript updates as audio is processed.":"Choose a language and start speaking."}</p>
          <div className="controls"><button className="primary-button" onClick={handleStart} disabled={isRecording||isTranscribing}><Mic size={17}/> Start recording</button><button className="stop-button" onClick={handleStop} disabled={!isRecording}><Square size={15} fill="currentColor"/> Stop</button></div>
        </div>
        <div className="settings-row"><label><Languages size={16}/> Recognition language<select value={language} onChange={e=>setLanguage(e.target.value)} disabled={isRecording}><option value="auto">Auto detect (recommended)</option><option value="hi">Hindi</option><option value="en">English</option><option value="ta">Tamil</option><option value="te">Telugu</option><option value="bn">Bengali</option><option value="mr">Marathi</option></select></label><div className="duration"><Clock3 size={16}/><span>{Math.floor(duration/60).toString().padStart(2,"0")}:{(duration%60).toString().padStart(2,"0")}</span></div></div>
        {error&&<p className="error">{error}</p>}
      </section>
      <section className="panel output">
        <div className="section-heading"><div><p className="eyebrow">LIVE RESULT</p><h2>Transcription</h2></div><span className="language-tag"><Radio size={14}/>{detected||"Awaiting audio"}</span></div>
        <div className="transcript-body">{transcript?<p>{transcript}</p>:<div className="placeholder"><AudioLines size={28}/><span>Your recognized speech will appear here.</span><small>Incremental updates arrive as each audio window is processed.</small></div>}</div>
        {savedId&&<div className="saved-note">✓ Saved to history · Record #{savedId}<button onClick={()=>setRefreshKey(v=>v+1)}>Refresh history</button></div>}
        {isTranscribing&&<div className="processing-note"><span className="spinner"/> Running final transcription…</div>}
      </section>
    </div>
    <History refreshKey={`${refreshKey}-${savedId || "none"}`}/>
    <footer><span>SpeakFlow AI · Open-source speech recognition</span><span>Built with React · FastAPI · Faster-Whisper · SQLAlchemy</span></footer>
  </main>;
}
