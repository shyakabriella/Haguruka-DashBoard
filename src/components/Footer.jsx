export default function Footer() {
  return (
    <footer className="ft">
      <span>© {new Date().getFullYear()} Haguruka App</span>
      <span className="ft-right">Version 1.0.0</span>

      <style>{css}</style>
    </footer>
  );
}

const css = `
  .ft{
    height:46px;
    background:#fff;
    border-top:1px solid #e6eef5;
    display:flex;
    align-items:center;
    justify-content:space-between;
    padding:0 16px;
    color:#64748b;
    font-size:12px;
  }
  .ft-right{ font-weight:700; }
`;
