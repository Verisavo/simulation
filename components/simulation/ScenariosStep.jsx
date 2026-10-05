import { scenarioName, kioskRange, COST_RANGES } from "@/lib/simulation/model";
import StateChip from "./StateChip";

const IDS = ["A", "B", "C", "D"];

export default function ScenariosStep({ scenarios, onScenarios, cost, onCost, gapClosed, onRun, onBack }) {
  const update = (id, patch) => onScenarios(scenarios.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const add = () => {
    const id = IDS.find((i) => !scenarios.some((s) => s.id === i));
    const price = [850, 775, 725, 900, 825].find((p) => !scenarios.some((s) => s.price === p)) ?? 850;
    if (id) onScenarios([...scenarios, { id, price, comp: "holds" }]);
  };
  const remove = (id) => onScenarios(scenarios.filter((s) => s.id !== id));
  const [kl, kh] = kioskRange(gapClosed);

  const shared = [
    { name: "Price sensitivity", state: "Inference", value: "−0.6 to −1.1", note: "Past price moves in comparable northern markets" },
    gapClosed
      ? { name: "Kano kiosk order response", state: "Inference", value: `−${kl * 100}% to −${kh * 100}%`, note: "Narrowed by Ground-Level Intelligence from 118 outlets" }
      : { name: "Kano kiosk order response", state: "Unknown", value: `0% to −${kh * 100}%`, note: "Kept wide because no evidence narrows it yet. This widens every result." },
    { name: "Kano share of volume", state: "Fact", value: "55%", note: "Your sales records, Q3 2026" },
    { name: "Margins to retailers and distributors", state: "Fact", value: "₦125 per bottle", note: "Your trade terms" }
  ];

  return (
    <>
      <header className="sm-head sm-head-row">
        <div>
          <h1 tabIndex={-1}>Set up the scenarios to compare</h1>
          <p>Change what you control and what you expect Competitor B to do. The shared inputs below come from the evidence, and each one shows how well it is supported.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={add} disabled={scenarios.length >= 4}>Add scenario</button>
      </header>

      <div className="sm-scenarios">
        {scenarios.map((s) => (
          <section key={s.id} className="sm-card sm-scenario" aria-labelledby={`sm-sc-${s.id}`}>
            <div className="sm-scenario-top">
              <div>
                <p className="sm-eyebrow">Scenario {s.id}</p>
                <h2 id={`sm-sc-${s.id}`}>{scenarioName(s.price)}</h2>
              </div>
              {scenarios.length > 2 && (
                <button type="button" className="sm-link-btn" onClick={() => remove(s.id)} aria-label={`Remove scenario ${s.id}`}>Remove</button>
              )}
            </div>
            <div className="sm-field">
              <label htmlFor={`sm-price-${s.id}`}>Shelf price, 33cl</label>
              <div className="sm-slider">
                <input id={`sm-price-${s.id}`} type="range" min={650} max={900} step={25} value={s.price} onChange={(e) => update(s.id, { price: Number(e.target.value) })} />
                <output htmlFor={`sm-price-${s.id}`} className="sm-mono sm-slider-val">₦{s.price}</output>
              </div>
            </div>
            <div className="sm-field">
              <label htmlFor={`sm-comp-${s.id}`}>Competitor B response <StateChip state="Hypothesis" /></label>
              <select id={`sm-comp-${s.id}`} value={s.comp} onChange={(e) => update(s.id, { comp: e.target.value })}>
                <option value="matches">Matches within 6 weeks</option>
                <option value="holds">Holds its price</option>
              </select>
            </div>
          </section>
        ))}
      </div>

      <section className="sm-card sm-shared" aria-labelledby="sm-shared-h">
        <h2 id="sm-shared-h" className="sm-shared-h">Shared across all scenarios</h2>
        <dl>
          {shared.map((x) => (
            <div key={x.name} className="sm-shared-row">
              <dt>{x.name}</dt>
              <dd><StateChip state={x.state} /></dd>
              <dd className="sm-mono">{x.value}</dd>
              <dd className="sm-muted">{x.note}</dd>
            </div>
          ))}
          <div className="sm-shared-row">
            <dt><label htmlFor="sm-cost">Input costs to March 2027</label></dt>
            <dd><StateChip state="Assumption" /></dd>
            <dd>
              <select id="sm-cost" value={cost} onChange={(e) => onCost(e.target.value)}>
                {Object.entries(COST_RANGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </dd>
            <dd className="sm-muted">Set by your team. Sugar and packaging.</dd>
          </div>
        </dl>
      </section>

      <div className="sm-actions">
        <button type="button" className="btn btn-dark" onClick={onRun}>Run simulation</button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>Back to evidence</button>
      </div>
    </>
  );
}
