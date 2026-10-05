import { drivers, scenarioName, pct, driverPhrase } from "@/lib/simulation/model";
import StateChip from "./StateChip";

const SERIES = ["#A8C6E8", "#618CD0", "#3A5292", "#1F273F"];

function RangeChart({ title, results, metric }) {
  let lo = 0, hi = 0;
  results.forEach((r) => { lo = Math.min(lo, r[metric][0]); hi = Math.max(hi, r[metric][2]); });
  lo = Math.floor((lo * 100 - 3) / 10) * 10;
  hi = Math.ceil((hi * 100 + 3) / 10) * 10;
  if (hi - lo < 20) hi = lo + 20;
  const span = hi - lo;
  const at = (x) => ((x * 100 - lo) / span) * 100;
  const step = span > 60 ? 20 : 10;
  const ticks = [];
  for (let t = lo; t <= hi; t += step) ticks.push(t);

  return (
    <figure className="sm-card sm-chart">
      <figcaption>{title}</figcaption>
      <div className="sm-chart-rows">
        {results.map((r, i) => (
          <div key={r.id} className="sm-chart-row">
            <span className="sm-mono">{r.id}</span>
            <div className="sm-chart-track" role="img" aria-label={`Scenario ${r.id}: ${pct(r[metric][0])} to ${pct(r[metric][2])}, middle ${pct(r[metric][1])}`}>
              <span className="sm-chart-zero" style={{ left: `${at(0)}%` }}></span>
              <span className="sm-chart-bar" style={{ left: `${at(r[metric][0])}%`, width: `${at(r[metric][2]) - at(r[metric][0])}%`, background: SERIES[i % 4] }}></span>
              <span className="sm-chart-mid" style={{ left: `calc(${at(r[metric][1])}% - 1.5px)` }}></span>
            </div>
          </div>
        ))}
      </div>
      <div className="sm-chart-axis sm-mono" aria-hidden="true">
        <span></span>
        <div>
          {ticks.map((t) => (
            <span key={t} style={{ left: `${((t - lo) / span) * 100}%` }}>{(t > 0 ? "+" : t < 0 ? "−" : "") + Math.abs(t)}%</span>
          ))}
        </div>
      </div>
    </figure>
  );
}

function within(r) {
  const n = Math.round(r.within * 100);
  return { n, tone: n >= 80 ? "good" : n >= 50 ? "mid" : "low" };
}

export default function OutcomesStep({ results, prevResults, scenarios, volLimit, cost, gapClosed, view, onView, onAdjust, onGaps }) {
  const opts = { gapClosed, cost };
  const viewSc = scenarios.find((s) => s.id === view) || scenarios[scenarios.length - 1];
  const dr = drivers(viewSc, opts);
  const maxSwing = Math.max(0.0001, ...dr.map((d) => d.swing));
  const kiosk = dr.find((d) => d.key === "kiosk");
  const kioskRank = dr.indexOf(kiosk);
  const gapMaterial = !gapClosed && viewSc.price > 700 && kioskRank < 2;

  const best = [...results].sort((a, b) => b.gp[1] - a.gp[1])[0];
  const safest = [...results].sort((a, b) => b.within - a.within)[0];
  const bestSc = scenarios.find((s) => s.id === best.id) || best;
  const top = drivers(bestSc, opts)[0];
  let reading = `Scenario ${best.id} (${scenarioName(best.price)}) has the highest middle estimate for gross profit at ${pct(best.gp[1])}. `;
  reading += safest.id !== best.id
    ? `Scenario ${safest.id} is most likely to keep volume loss within your ${volLimit}% limit (${within(safest).n}% of runs, against ${within(best).n}% for ${best.id}). `
    : `It also keeps volume loss within your ${volLimit}% limit in ${within(best).n}% of runs. `;
  reading += `For ${best.id}, the result depends most on ${driverPhrase[top.key]}, which is ${top.state === "Unknown" ? "still Unknown." : top.state === "Hypothesis" ? "an untested Hypothesis." : `an ${top.state}.`}`;

  const prev = prevResults?.find((r) => r.id === viewSc.id);
  const now = results.find((r) => r.id === viewSc.id);

  return (
    <>
      <header className="sm-head">
        <h1 tabIndex={-1}>Compare possible outcomes</h1>
        <p>{results.length} scenarios, 2,000 runs each. Every run draws its inputs from the evidence ranges, so the spread of results shows how much is still uncertain.</p>
      </header>

      <section className="sm-reading" aria-labelledby="sm-reading-h">
        <p className="sm-eyebrow" id="sm-reading-h">How to read this</p>
        <p>{reading}</p>
      </section>

      <div className="sm-card sm-table-wrap">
        <table className="sm-table sm-results">
          <thead>
            <tr><th scope="col">Scenario</th><th scope="col">Bottles sold</th><th scope="col">Revenue</th><th scope="col">Gross profit</th><th scope="col">Within your {volLimit}% limit</th></tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const w = within(r);
              return (
                <tr key={r.id}>
                  <th scope="row">
                    <strong>{r.id} · {scenarioName(r.price)}</strong>
                    <span className="sm-muted">{r.price === 700 ? "No price change" : `Competitor B ${r.comp === "matches" ? "matches within 6 weeks" : "holds its price"}`}</span>
                  </th>
                  {["vol", "rev", "gp"].map((m) => (
                    <td key={m} className="sm-mono">{pct(r[m][0])} to {pct(r[m][2])} <span className="sm-muted">({pct(r[m][1])})</span></td>
                  ))}
                  <td><span className={`sm-within sm-within-${w.tone}`}>{w.n}% of runs</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="sm-table-foot">Ranges show the middle 80% of runs. The figure in brackets is the middle run.</p>
      </div>

      <div className="sm-charts">
        <RangeChart title="Bottles sold" results={results} metric="vol" />
        <RangeChart title="Revenue" results={results} metric="rev" />
        <RangeChart title="Gross profit" results={results} metric="gp" />
      </div>

      <div className="sm-pair">
        <section className="sm-card sm-drivers" aria-labelledby="sm-drivers-h">
          <div className="sm-drivers-top">
            <h2 id="sm-drivers-h">What moves gross profit most</h2>
            <div className="sm-pills" role="group" aria-label="Choose scenario">
              {scenarios.map((s) => (
                <button key={s.id} type="button" className="sm-pill sm-pill-sm" aria-pressed={s.id === viewSc.id} onClick={() => onView(s.id)}>{s.id}</button>
              ))}
            </div>
          </div>
          <ul>
            {dr.map((d) => (
              <li key={d.key} className="sm-driver">
                <span className="sm-driver-name">{d.name}</span>
                <StateChip state={d.state} />
                <span className="sm-driver-track"><span className={d.key === "kiosk" && !gapClosed ? "sm-driver-bar warn" : "sm-driver-bar"} style={{ width: `${Math.max(2, (d.swing / maxSwing) * 100)}%` }}></span></span>
                <span className="sm-mono sm-driver-val">{Math.round(d.swing * 100)} pts</span>
              </li>
            ))}
          </ul>
          <p className="sm-hint">Points of gross profit the result moves when each input goes from the low to the high end of its range.</p>
        </section>

        {gapMaterial && (
          <section className="sm-card sm-gapcall">
            <StateChip state="Unknown" />
            <h2>Close this before deciding</h2>
            <p>How Kano kiosk owners reorder after a price rise is Unknown. For Scenario {viewSc.id} it moves gross profit by up to {Math.round(kiosk.swing * 100)} points{kioskRank === 0 ? ", more than any other input" : ""}.</p>
            <div><button type="button" className="btn btn-dark" onClick={onGaps}>Investigate the gap</button></div>
          </section>
        )}
        {gapClosed && (
          <section className="sm-note sm-note-blue sm-gapcall">
            <StateChip state="Inference" />
            <h2>Updated with Ground-Level Intelligence</h2>
            <p>
              Kano kiosk order response is now an Inference.
              {prev && now && ` Scenario ${now.id} gross profit moved from ${pct(prev.gp[0])} to ${pct(prev.gp[2])}, to ${pct(now.gp[0])} to ${pct(now.gp[2])}.`}
            </p>
          </section>
        )}
      </div>

      <div className="sm-actions">
        <button type="button" className="btn btn-ghost" onClick={onAdjust}>Adjust scenarios</button>
        <button type="button" className="btn btn-ghost" onClick={onGaps}>View Intelligence Gaps</button>
        <p className="sm-hint">These are possible outcomes, not a forecast. The decision is yours.</p>
      </div>
    </>
  );
}
