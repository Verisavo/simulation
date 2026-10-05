import { useState } from "react";
import { STATES, SOURCES, SOURCE_FILTERS, CONTRADICTION, buildEvidence } from "@/lib/simulation/evidence";
import StateChip from "./StateChip";

export default function EvidenceStep({ gapClosed, cost, gapCount, onNext, onBack }) {
  const [source, setSource] = useState("all");
  const [state, setState] = useState(null);
  const all = buildEvidence({ gapClosed, cost });
  const rows = all.filter((r) => (source === "all" || r.src === source) && (!state || r.state === state));

  return (
    <>
      <header className="sm-head">
        <h1 tabIndex={-1}>What we know about this decision</h1>
        <p>{all.length} pieces of evidence bear on this decision. Each is labelled by how well it is supported, so you can see where the simulation stands on solid ground and where it relies on assumptions.</p>
      </header>

      <div className="sm-states" role="group" aria-label="Filter by intelligence state">
        {STATES.map((s) => (
          <button
            key={s.name}
            type="button"
            className="sm-state-card"
            aria-pressed={state === s.name}
            onClick={() => setState(state === s.name ? null : s.name)}
          >
            <span className="sm-state-top">
              <StateChip state={s.name} />
              <span className="sm-mono sm-state-count">{all.filter((r) => r.state === s.name).length}</span>
            </span>
            <span className="sm-state-def">{s.def}</span>
          </button>
        ))}
      </div>

      <div className="sm-filterbar">
        <div className="sm-pills" role="group" aria-label="Filter by source">
          {SOURCE_FILTERS.map(([k, label]) => (
            <button key={k} type="button" className="sm-pill" aria-pressed={source === k} onClick={() => setSource(k)}>{label}</button>
          ))}
        </div>
        <p className="sm-hint" aria-live="polite">Showing {rows.length} of {all.length}</p>
      </div>

      <div className="sm-card sm-table-wrap">
        <table className="sm-table">
          <thead>
            <tr><th scope="col" className="sm-col-wide">Statement</th><th scope="col">State</th><th scope="col">Source</th><th scope="col">Scope</th><th scope="col">As of</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.updated ? "sm-row-new" : undefined}>
                <td>
                  <strong>{r.text}</strong>
                  {r.gap && <span className="sm-row-gap">{r.gap}</span>}
                  {r.updated && <span className="sm-row-updated">Updated from Ground-Level Intelligence</span>}
                </td>
                <td><StateChip state={r.state} /></td>
                <td><span className="sm-src">{SOURCES[r.src]}</span><span className="sm-muted">{r.detail}</span></td>
                <td className="sm-muted">{r.scope}</td>
                <td className="sm-mono sm-muted sm-nowrap">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="sm-empty">No evidence matches these filters. Choose another source or state.</p>}
      </div>

      <div className="sm-pair">
        <section className="sm-card sm-note">
          <p className="sm-eyebrow">1 contradiction found</p>
          <p>{CONTRADICTION}</p>
        </section>
        <section className="sm-note sm-note-blue">
          <p className="sm-eyebrow">{gapCount} Intelligence {gapCount === 1 ? "Gap" : "Gaps"}</p>
          <p>
            {gapClosed
              ? "The Kano kiosk gap has been narrowed with Ground-Level Intelligence. One low-impact Unknown remains."
              : "One Unknown could materially change the outcome: how Kano kiosk owners adjust order sizes after a price rise. You can still run the simulation. The gap will show in the results."}
          </p>
        </section>
      </div>

      <div className="sm-actions">
        <button type="button" className="btn btn-dark" onClick={onNext}>Set up scenarios</button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back to decision</button>
      </div>
    </>
  );
}
