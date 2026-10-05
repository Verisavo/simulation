import {
  DRIVER_ORDER, DRIVERS, RUNS,
  type DriverKey, type Drivers, type Grounding, type SimulationResult,
} from '@/lib/model';
import { driverValue } from '@/lib/format';
import { GroundingChip, NavRow, SectionIntro, StateBadge } from '../ui';

function RangeBand({ k, drivers }: { k: DriverKey; drivers: Drivers }) {
  const def = DRIVERS[k];
  const d = drivers[k];
  const span = def.max - def.min;
  const pos = (v: number) => ((v - def.min) / span) * 100;
  return (
    <div className="band" aria-hidden="true">
      <div className="base" />
      <div className="ev" style={{ left: `${pos(d.evidenceLo)}%`, width: `${Math.max(pos(d.evidenceHi) - pos(d.evidenceLo), 1)}%` }} />
      <div className="rng" style={{ left: `${pos(d.lo)}%`, width: `${Math.max(pos(d.hi) - pos(d.lo), 1)}%` }} />
      <div className="mid" style={{ left: `${pos((d.lo + d.hi) / 2)}%` }} />
    </div>
  );
}

export default function AssumptionsStep({
  drivers,
  result,
  ground,
  onChange,
  onReset,
  onBack,
  onNext,
}: {
  drivers: Drivers;
  result: SimulationResult;
  ground: Grounding;
  onChange: (k: DriverKey, end: 'lo' | 'hi', v: number) => void;
  onReset: (k: DriverKey) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <SectionIntro title="What are we taking as given?">
        Each driver starts from its evidence range. Move the sliders if you disagree; your changes are marked and logged.
      </SectionIntro>

      <div className="banner info" aria-live="polite">
        <span>
          Live check: Option A ahead on gross profit in{' '}
          <strong className="mono">{Math.round(result.shareAAhead * 100)}%</strong> of {RUNS.toLocaleString('en-GB')} runs.
        </span>
        <GroundingChip level={ground.level} label={ground.label} />
      </div>

      <section className="card" style={{ padding: '4px 22px' }}>
        {DRIVER_ORDER.map((k) => {
          const def = DRIVERS[k];
          const d = drivers[k];
          return (
            <div className="drv" key={k}>
              <div>
                <div style={{ fontWeight: 600 }}>{def.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 6 }}>
                  <StateBadge state={d.state} />
                  {d.edited && <span className="edited">Edited by you</span>}
                </div>
                <p className="muted" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
                  {def.desc}
                </p>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                  Evidence: {d.src}
                </div>
              </div>
              <div>
                <RangeBand k={k} drivers={drivers} />
                {(['lo', 'hi'] as const).map((end) => (
                  <div className="sl" key={end}>
                    <label htmlFor={`${end}-${k}`} className="muted">
                      {end === 'lo' ? 'Low' : 'High'}
                    </label>
                    <input
                      type="range"
                      id={`${end}-${k}`}
                      min={def.min}
                      max={def.max}
                      step={def.step}
                      value={d[end]}
                      onChange={(e) => onChange(k, end, parseFloat(e.target.value))}
                    />
                    <span className="mono">{driverValue(k, d[end])}</span>
                  </div>
                ))}
                {d.edited && (
                  <button
                    type="button"
                    className="btn2"
                    style={{ minHeight: 36, marginTop: 6, fontSize: 13 }}
                    onClick={() => onReset(k)}
                  >
                    Reset to evidence
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <NavRow back="Back to system map" next="Run simulation" onBack={onBack} onNext={onNext} />
    </>
  );
}
