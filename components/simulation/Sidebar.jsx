export default function Sidebar({ current, gapCount, onSimulations, onEvidence, onGaps }) {
  const item = (key, label, onClick, extra) => (
    <li>
      <button type="button" className="sm-nav-item" aria-current={current === key ? "page" : undefined} onClick={onClick}>
        <span>{label}</span>
        {extra}
      </button>
    </li>
  );
  return (
    <nav className="sm-side" aria-label="Primary">
      <a className="sm-logo" href="/" aria-label="Verisavo home">
        <svg viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <path d="M6 20L14 7L22 18M6 20H22" stroke="#80AADC" strokeWidth="1.6" />
          <circle cx="6" cy="20" r="3" fill="#FFFFFF" />
          <circle cx="14" cy="7" r="3" fill="#FFFFFF" />
          <circle cx="22" cy="18" r="3" fill="#80AADC" />
        </svg>
        <span>Verisavo</span>
      </a>
      <div className="sm-workspace">
        <span className="sm-workspace-label">Workspace</span>
        <strong>Brand A Beverages</strong>
        <span>Nigeria · Private</span>
      </div>
      <ul className="sm-nav">
        {item("evidence", "Evidence", onEvidence)}
        {item("simulations", "Simulations", onSimulations)}
        {item("gaps", "Intelligence Gaps", onGaps, <span className="sm-count" aria-label={`${gapCount} open`}>{gapCount}</span>)}
      </ul>
      <p className="sm-private">Your company data remains private, protected and under your control.</p>
    </nav>
  );
}
