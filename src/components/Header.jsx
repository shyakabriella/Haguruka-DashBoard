export default function Header({ onToggleSidebar, title = "Admin Dashboard" }) {
  return (
    <header className="hd">
      <button className="hd-burger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        ☰
      </button>

      <div className="hd-title">{title}</div>

      <div className="hd-right">
        <button className="hd-icon" title="Notifications">
          🔔
          <span className="hd-dot" />
        </button>
        <div className="hd-admin">The Admin</div>
      </div>

      <style>{css}</style>
    </header>
  );
}

const css = `
  .hd{
    height:60px;
    background:#fff;
    border-bottom:1px solid #e6eef5;
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:0 16px;
    position:sticky;
    top:0;
    z-index:10;
  }
  .hd-burger{
    border:1px solid #e6eef5;
    background:#fff;
    border-radius:10px;
    padding:8px 10px;
    cursor:pointer;
    font-size:16px;
  }
  .hd-title{
    font-weight:900;
    color:#0f172a;
  }
  .hd-right{
    display:flex;
    align-items:center;
    gap:12px;
  }
  .hd-icon{
    border:1px solid #e6eef5;
    background:#fff;
    border-radius:10px;
    padding:8px 10px;
    cursor:pointer;
    position:relative;
  }
  .hd-dot{
    width:8px;height:8px;
    border-radius:999px;
    background:#ef4444;
    position:absolute;
    right:6px;
    top:6px;
  }
  .hd-admin{
    font-weight:700;
    color:#334155;
    font-size:13px;
  }
`;
