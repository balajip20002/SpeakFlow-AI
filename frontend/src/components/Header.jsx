
function Header() {
  return (
    <header className="dashboard-header">
      <div className="header-title">
        <h1>Dashboard</h1>
        <p>Manage your speech transcriptions</p>
      </div>

      <div className="header-actions">
        <input
          type="text"
          placeholder="Search transcriptions..."
          className="search-input"
        />

        <button className="notification-btn" aria-label="Notifications">
          🔔
        </button>

        <div className="user-profile">
          <div className="user-avatar">B</div>
          <span>Admin</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
