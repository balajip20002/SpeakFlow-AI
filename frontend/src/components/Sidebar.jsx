
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>SpeakFlow AI</h2>
        <p>Speech Intelligence</p>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-heading">WORKSPACE</p>

        <a href="#" className="nav-item active">
          Dashboard
        </a>

        <a href="#" className="nav-item">
          Live Transcription
        </a>

        <a href="#" className="nav-item">
          History
        </a>

        <p className="nav-heading">PREFERENCES</p>

        <a href="#" className="nav-item">
          Settings
        </a>
      </nav>

      <div className="sidebar-footer">
        <p>SpeakFlow AI v1.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;
