import { useEffect, useState } from "react";
import { Search, Trash2, Pencil, X, Check, RefreshCw } from "lucide-react";
import { api } from "../services/api";

export default function History({ refreshKey }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try { setItems(await api(`/api/transcriptions?q=${encodeURIComponent(query)}`)); setError(""); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, [query, refreshKey]);

  async function remove(id) {
    if (!window.confirm("Delete this transcription permanently?")) return;
    try { await api(`/api/transcriptions/${id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(e.message); }
  }
  async function save(id) {
    try { await api(`/api/transcriptions/${id}`, { method: "PUT", body: JSON.stringify({ text: draft }) }); setEditing(null); await load(); }
    catch (e) { setError(e.message); }
  }
  return <section className="history panel">
    <div className="section-heading"><div><p className="eyebrow">YOUR LIBRARY</p><h2>Transcription history</h2></div><button className="icon-button" onClick={load} title="Refresh"><RefreshCw size={17}/></button></div>
    <label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search transcripts or titles"/></label>
    {error && <p className="error">{error}</p>}
    {!items.length && !error ? <div className="empty">No saved transcriptions yet. Complete a recording to see it here.</div> :
      <div className="history-list">{items.map(item=><article className="history-item" key={item.id}>
        <div className="history-top"><div><h3>{item.title}</h3><small>{new Date(item.created_at).toLocaleString()} · {item.language} · {Math.round(item.duration)} sec</small></div>
          <div className="actions">{editing===item.id ? <><button onClick={()=>save(item.id)} title="Save"><Check size={16}/></button><button onClick={()=>setEditing(null)} title="Cancel"><X size={16}/></button></> : <><button onClick={()=>{setEditing(item.id);setDraft(item.text)}} title="Edit"><Pencil size={16}/></button><button onClick={()=>remove(item.id)} title="Delete"><Trash2 size={16}/></button></>}</div>
        </div>
        {editing===item.id ? <textarea className="edit-area" value={draft} onChange={e=>setDraft(e.target.value)}/> : <p className="history-text">{item.text}</p>}
      </article>)}</div>}
  </section>;
}
