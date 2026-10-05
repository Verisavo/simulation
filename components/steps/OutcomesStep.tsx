import {
  DRIVERS, pathways, RUNS, SCENARIOS,
  type Drivers, type Grounding, type ScenarioKey, type SensitivityResult, type SimulationResult,
} from '@/lib/model';
import { driverRange, driverValue, signedPct, signedPts } from '@/lib/format';
import RangeChart from '../RangeChart';
import { NavRow } from '../ui';

function Explanation({ drivers, sens }: { drivers: Drivers; sens: SensitivityResult }) {
  const [top, second] = sens.rows;
  const d1 = drivers[top.key];
  return (
    <div className="explain">
      <p>
        The spread comes mostly from <strong>{DRIVERS[top.key].name.toLowerCase()}</strong>, currently{' '}
        {driverRange(top.key, d1.lo, d1.hi)} and marked {d1.state}. On its own it moves Option A’s advantage between{' '}
        {signedPts(top.lo)} and {signedPts(top.hi)} points.
      </p>
      <p>
        Next is <strong>{DRIVERS[second.key].name.toLowerCase()}</strong> ({drivers[second.key].state}).{' '}
        {top.flips
          ? 'Because the first driver could flip which option comes out ahead, it is worth investigating before committing.'
          : 'Neither flips the preferred option at its current range.'}
      </p>
    </div>
  );
}

export default function OutcomesStep({
  price,
  drivers,
  result,
  scenario,
  onScenario,
  ground,
  sens,
  explain,
  onExplain,
  onSensitivity,
  onBack,
  onNext,
}: {
  price: number;
  drivers: Drivers;
  result: SimulationResult;
  scenario: ScenarioKey;
  onScenario: (s: ScenarioKey) => void;
  ground: Grounding;
  sens: SensitivityResult;
  explain: boolean;
  onExplain: () => void;
  onSensitivity: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const share = Math.round(result.shareAAhead * 100);
  const paths = pathways(result.draws);
  const pathCard = (label: string, s: typeof paths.weak) => (
    <div className="tile">
      <div className="lbl">{label}</div>
      <div className="mono" style={{ fontSize: 20, marginTop: 4 }}>
        {signedPct(s.profit)} gross profit
      </div>
      <p className="muted" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
        Pass-through averages <strong>{Math.round(s.passThrough * 100)}%</strong>, elasticity{' '}
        <strong>{driverValue('el', s.elasticity)}</strong>, and the competitor raised its price in{' '}
        <strong>{Math.round(s.competitorShare * 100)}%</strong> of these runs.
      </p>
    </div>
  );

  return (
    <>
      {ground.level === 'exploratory' ? (
        <div className="banner warn">
          <span>
            <strong>Exploratory.</strong> {ground.why} Use these ranges to structure the discussion, not to commit
            resources.
          </span>
          <button type="button" className="btn2" onClick={onSensitivity}>
            See what drives the range
          </button>
        </div>
      ) : (
        <div className="banner info">
          <span>
            <strong>{ground.label}.</strong> {ground.why}
          </span>
        </div>
      )}

      <section style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <h2 style={{ fontSize: 20 }}>What could happen under each option?</h2>
        <div className="scen" role="group" aria-label="Scenario">
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
            <button key={k} type="button" className="pill" aria-pressed={scenario === k} onClick={() => onScenario(k)}>
              {SCENARIOS[k]}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="verdict">
          <div>
            <div className="lbl">Option A ahead on gross profit</div>
            <div className="big" style={{ marginTop: 6 }}>
              {share}%
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
              of {RUNS.toLocaleString('en-GB')} runs · {SCENARIOS[scenario]}
            </div>
          </div>
          <div className="meter" aria-hidden="true">
            <i style={{ width: `${share}%` }} />
          </div>
        </div>
      </section>

      <RangeChart
        title="Volume change vs today"
        unit="% at end of horizon"
        rows={[
          { tag: 'OPTION A', name: `Raise ${price}%`, summary: result.A.volume },
          { tag: 'OPTION B', name: 'Hold price', summary: result.B.volume },
        ]}
      />
      <RangeChart
        title="Gross profit change vs today"
        unit="% at end of horizon"
        rows={[
          { tag: 'OPTION A', name: `Raise ${price}%`, summary: result.A.profit },
          { tag: 'OPTION B', name: 'Hold price', summary: result.B.profit },
        ]}
      />
      <div className="legend" style={{ border: 0, margin: 0, padding: 0 }}>
        <span>
          <span className="sw" style={{ background: 'var(--band-strong)' }} />
          Middle half of runs
        </span>
        <span>
          <span className="sw" style={{ background: 'var(--band)' }} />
          Middle 90% of runs
        </span>
        <span>
          <span style={{ height: 14, borderLeft: '1.5px dashed var(--muted)' }} />
          No change
        </span>
      </div>

      <section className="card">
        <h3>What produces each end of Option A’s range</h3>
        <p className="muted" style={{ margin: '4px 0 0', fontSize: 13.5 }}>
          Average conditions in the weakest and strongest 10% of runs.
        </p>
        <div className="grid2" style={{ marginTop: 14 }}>
          {pathCard('Weaker end', paths.weak)}
          {pathCard('Stronger end', paths.strong)}
        </div>
      </section>

      <section className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Why is the range this wide?</h3>
          <button type="button" className="btn2" onClick={onExplain} aria-expanded={explain}>
            {explain ? 'Hide explanation' : 'Explain this range'}
          </button>
        </div>
        {explain && <Explanation drivers={drivers} sens={sens} />}
      </section>

      <NavRow back="Adjust assumptions" next="Test sensitivity" onBack={onBack} onNext={onNext} />
    </>
  );
}
