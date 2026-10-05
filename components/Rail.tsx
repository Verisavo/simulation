import type { Grounding, SimulationResult } from '@/lib/model';
import { RUNS } from '@/lib/model';
import type { MemoryEntry } from './SimulationApp';

const HOW: { body: React.ReactNode }[] = [
  {
    body: (
      <>
        <p>You state the decision in plain language. The brief turns it into options, scope and the outcomes that matter.</p>
        <p>
          Try it: change the percentage, city or horizon in your question and press <strong>Draft brief</strong>. The
          fields update and every later step recalculates.
        </p>
        <p>
          In the full product the Intelligence Assistant drafts the brief. Here a simple parser reads the percentage, city,
          channel and months from your text.
        </p>
      </>
    ),
  },
  {
    body: (
      <>
        <p>Before anything runs, the system shows how much is actually known about each driver, where it came from and how certain it is.</p>
        <ul>
          <li><strong>Fact</strong>: supported within a defined scope</li>
          <li><strong>Inference</strong>: derived from evidence, not observed</li>
          <li><strong>Hypothesis</strong>: proposed, needs testing</li>
          <li><strong>Assumption</strong>: treated as true for now</li>
          <li><strong>Unknown</strong>: evidence cannot answer yet</li>
        </ul>
        <p>A thin area is visible from the start rather than hidden inside a forecast.</p>
      </>
    ),
  },
  {
    body: (
      <>
        <p>The map shows how the decision lever travels through the market to the outcomes. Each arrow is a relationship the model uses.</p>
        <p>Select any node to see what it does in the calculation and what evidence sits behind it.</p>
      </>
    ),
  },
  {
    body: (
      <>
        <p>Every driver has a plausible range. The simulation samples across these ranges thousands of times, so a wide range means more uncertainty in the result.</p>
        <p>Drag the sliders to disagree with the evidence. The dashed outline shows the evidence range, and your change is marked and logged so reviewers can see it.</p>
        <p>The live check updates as you move a slider.</p>
      </>
    ),
  },
  {
    body: (
      <>
        <p>
          The engine runs {RUNS.toLocaleString('en-GB')} scenarios for each option. Each run picks a value for every driver
          within its range, and decides whether the competitor raises its price.
        </p>
        <p>The dark band holds the middle half of runs and the light band the middle 90%. The tick marks the median.</p>
        <p>Switch scenarios to force a condition, such as the competitor holding its price.</p>
      </>
    ),
  },
  {
    body: (
      <>
        <p>Each driver is swung from the low to the high end of its range while the others stay at their midpoint. The longer the bar, the more the decision depends on that driver.</p>
        <p>
          A dark bar crosses zero, which means it could change which option comes out ahead. If that driver is not well
          evidenced, it becomes an <strong>Intelligence Gap</strong>.
        </p>
        <p>Request an investigation to see the loop: evidence is collected, verified and fed back, and everything reruns.</p>
      </>
    ),
  },
  {
    body: (
      <>
        <p>The decision is yours. Recording it captures the option, the reasoning, the assumptions accepted and the Signals to watch.</p>
        <p>Market Memory keeps the record so that later outcomes can be compared with the scenarios. In this prototype it lasts until you close the page.</p>
      </>
    ),
  },
];

export default function Rail({
  step,
  result,
  ground,
  memory,
}: {
  step: number;
  result: SimulationResult;
  ground: Grounding;
  memory: MemoryEntry[];
}) {
  return (
    <aside className="rail">
      <div className="how">
        <div className="lbl">How this step works</div>
        <h3>What happens here</h3>
        {HOW[step].body}
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="lbl">Current reading</div>
        <div style={{ marginTop: 10, fontSize: 14 }}>
          Option A ahead on gross profit in <strong className="mono">{Math.round(result.shareAAhead * 100)}%</strong> of runs.
        </div>
        <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
          {ground.why}
        </div>
      </div>
      <div className="card" style={{ padding: 18 }}>
        <div className="lbl">Market Memory · this simulation</div>
        <div className="mem" style={{ marginTop: 6 }}>
          {memory.slice(0, 6).map((m, i) => (
            <div key={`${m.time}-${memory.length - i}`}>
              <time>{m.time}</time>
              {m.text}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
