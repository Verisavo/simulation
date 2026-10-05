import { drivers } from "@/lib/simulation/model";
import StateChip from "./StateChip";

const BRIEF = [
  ["Where", "120 kiosks and provision stores in Ungogo, Kumbotso, Dala and Gwale"],
  ["Who", "Verified SavoScouts based in Kano"],
  ["How", "Short structured interview and shelf photo, geo-tagged and time-stamped. WhatsApp or voice, in Hausa or English."],
  ["Verification", "Cross-checked against shelf photos, with repeat visits to one in five outlets"],
  ["Time", "About 10 days"],
  ["Cost", "[COST ESTIMATE]"]
];

export default function GapsStep({ scenarios, cost, view, gapClosed, requested, memory, onRequest, onEvidence, onOutcomes }) {
  const sc = scenarios.find((s) => s.id === view) || scenarios[scenarios.length - 1];
  const dr = drivers(sc, { gapClosed: false, cost });
  const kiosk = dr.find((d) => d.key === "kiosk");
  const rank = dr.indexOf(kiosk);

  const status = gapClosed ? ["Answered", "done"] : requested ? ["Requested · SavoScouts briefed", "sent"] : ["High impact", "high"];
  const why = gapClosed
    ? "Answered by Ground-Level Intelligence from 118 outlets. It is now an Inference: kiosk owners cut order size by 4% to 8% after a ₦100 rise."
    : sc.price > 700
      ? `Until this is answered, the simulation assumes anything from no change to a 15% cut in order size. For Scenario ${sc.id} that moves gross profit by up to ${Math.round(kiosk.swing * 100)} points${rank === 0 ? ", more than any other input." : "."}`
      : "Until this is answered, the simulation assumes anything from no change to a 15% cut in order size. It matters for any scenario that raises the price.";

  return (
    <>
      <header className="sm-head">
        <h1 tabIndex={-1}>Investigate an Intelligence Gap</h1>
        <p>When something unknown could change the decision, Verisavo can gather targeted Ground-Level Intelligence to answer it. New evidence updates the simulation and is kept in Market Memory.</p>
      </header>

      <div className="sm-split">
        <div className="sm-stack">
          <section className="sm-card sm-gap" aria-labelledby="sm-gap1">
            <div className="sm-gap-top">
              <StateChip state={gapClosed ? "Inference" : "Unknown"} />
              <span className={`sm-gap-status ${status[1]}`}>{status[0]}</span>
            </div>
            <h2 id="sm-gap1">How do peri-urban kiosk owners in Kano change order size after a ₦100 price rise?</h2>
            <p className="sm-muted">{why}</p>
            <dl className="sm-brief">
              {BRIEF.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
            <div className="sm-actions">
              {!requested && !gapClosed && <button type="button" className="btn btn-dark" onClick={onRequest}>Request this investigation</button>}
              {requested && !gapClosed && (
                <>
                  <button type="button" className="btn btn-dark" onClick={onEvidence}>Add returned evidence</button>
                  <p className="sm-hint">Prototype only: stands in for the 10-day field investigation.</p>
                </>
              )}
              {gapClosed && <button type="button" className="btn btn-dark" onClick={onOutcomes}>See updated outcomes</button>}
            </div>
            <p className="sm-hint">Findings are Client Intelligence: private to Brand A Beverages.</p>
          </section>

          <section className="sm-card sm-gap" aria-labelledby="sm-gap2">
            <div className="sm-gap-top">
              <StateChip state="Unknown" />
              <span className="sm-gap-status">Low impact</span>
            </div>
            <h2 id="sm-gap2" className="sm-gap-h-sm">Stock currently held by the two Kaduna distributors</h2>
            <p className="sm-muted">This affects timing in January, not which scenario performs best. Asking your distributors directly is faster than a field investigation.</p>
          </section>
        </div>

        <aside className="sm-card sm-memory" aria-labelledby="sm-mem-h">
          <h2 id="sm-mem-h">Market Memory for this simulation</h2>
          <ol>
            {memory.map((m, i) => (
              <li key={m.when + m.text + i} className={`sm-mem-${m.tone}`}>
                <span className="sm-mono sm-mem-when">{m.when}</span>
                <span>{m.text}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </>
  );
}
