const STEPS = ["Decision", "Evidence", "Scenarios", "Outcomes", "Gaps"];

export default function StepNav({ step, maxStep, disabled, onGo }) {
  return (
    <nav aria-label="Simulation steps">
      <ol className="sm-steps">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const locked = n > maxStep || disabled;
          const state = n === step ? "on" : n < Math.max(step, maxStep) ? "done" : "";
          return (
            <li key={label}>
              <button
                type="button"
                className={`sm-step-btn ${state}`}
                aria-current={n === step ? "step" : undefined}
                disabled={locked}
                onClick={() => onGo(n)}
              >
                <span className="sm-step-n">{n}</span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
