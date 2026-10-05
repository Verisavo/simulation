const TYPES = ["Pricing", "Market entry", "Distribution", "Product expansion", "Location"];

export default function DecisionStep({ decision, onChange, onSubmit }) {
  const set = (patch) => onChange({ ...decision, ...patch });
  return (
    <>
      <header className="sm-head">
        <h1 tabIndex={-1}>Start with the decision ahead</h1>
        <p>Describe the choice you need to make. Verisavo gathers the evidence that bears on it, shows what is known and unknown, and lets you explore how different assumptions change the outcome.</p>
      </header>

      <div className="sm-split">
        <form
          className="sm-card sm-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="sm-field">
            <label htmlFor="sm-q">Decision question</label>
            <textarea id="sm-q" rows={3} className="sm-question" value={decision.question} onChange={(e) => set({ question: e.target.value })} />
          </div>

          <fieldset className="sm-field">
            <legend>Decision type</legend>
            <div className="sm-pills">
              {TYPES.map((t) => (
                <button key={t} type="button" className="sm-pill" aria-pressed={decision.type === t} onClick={() => set({ type: t })}>{t}</button>
              ))}
            </div>
            {decision.type !== "Pricing" && (
              <p className="sm-note-warn">The MVP simulates pricing decisions first. {decision.type} will follow the same steps.</p>
            )}
          </fieldset>

          <div className="sm-grid-2">
            <div className="sm-field"><label htmlFor="sm-country">Country</label><select id="sm-country" defaultValue="Nigeria"><option>Nigeria</option></select></div>
            <div className="sm-field"><label htmlFor="sm-geo">States</label><input id="sm-geo" defaultValue="Kano, Kaduna" /></div>
            <div className="sm-field"><label htmlFor="sm-channel">Channel</label><input id="sm-channel" defaultValue="Traditional trade: kiosks, provision stores, open markets" /></div>
            <div className="sm-field"><label htmlFor="sm-period">Period</label><input id="sm-period" defaultValue="January to March 2027" /></div>
          </div>

          <div className="sm-field">
            <label htmlFor="sm-limit">Largest volume loss you could accept</label>
            <div className="sm-slider">
              <input id="sm-limit" type="range" min={0} max={25} step={1} value={decision.volLimit} onChange={(e) => set({ volLimit: Number(e.target.value) })} />
              <output htmlFor="sm-limit" className="sm-mono sm-slider-val">{decision.volLimit}%</output>
            </div>
            <p className="sm-hint">Each scenario will be checked against this limit.</p>
          </div>

          <div className="sm-actions">
            <button type="submit" className="btn btn-dark">Gather evidence</button>
          </div>
        </form>

        <aside className="sm-explainer">
          <h2>What a simulation does</h2>
          <p>It explores what could happen under different assumptions. It does not predict a single outcome.</p>
          <ul>
            <li>Every result shows the evidence and assumptions behind it.</li>
            <li>Results are ranges, so you can see how much is uncertain.</li>
            <li>Unknowns that could change the answer are flagged as Intelligence Gaps.</li>
            <li>The decision stays with you.</li>
          </ul>
        </aside>
      </div>
    </>
  );
}
