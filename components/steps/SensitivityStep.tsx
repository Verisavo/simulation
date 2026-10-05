import {
  decisiveGaps, DRIVERS, otherGaps,
  type DriverKey, type Drivers, type SensitivityResult,
} from '@/lib/model';
import { driverRange, niceTicks, signedPts } from '@/lib/format';
import type { Gaps } from '../SimulationApp';
import { NavRow, SectionIntro, StateBadge } from '../ui';

const STAGES = ['Scoped', 'Collecting', 'Verifying', 'Evidence received'];

function GapCard({
  k,
  city,
  drivers,
  gaps,
  decisive,
  onInvestigate,
}: {
  k: DriverKey;
  city: string;
  drivers: Drivers;
  gaps: Gaps;
  decisive: boolean;
  onInvestigate: (k: DriverKey) => void;
}) {
  const inv = DRIVERS[k].investigation!;
  const d = drivers[k];
  const run = gaps[k];
  const busy = Object.values(gaps).some((g) => g?.status === 'running');

  return (
    <div className={`gap${decisive ? '' : ' quiet'}`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div className="lbl" style={{ color: 'var(--ink)' }}>
          {decisive ? 'Intelligence Gap · could change the decision' : 'Possible gap'}
        </div>
        <StateBadge state={d.state} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginTop: 8, lineHeight: 1.4 }}>{inv.question(city)}</div>

      {!run && (
        <>
          <div style={{ marginTop: 12 }}>
            <div className="kv"><span className="muted">Method</span><span>{inv.method}</span></div>
            <div className="kv"><span className="muted">Collected by</span><span>{inv.who}</span></div>
            <div className="kv"><span className="muted">Where</span><span>{city}, sampled outlets</span></div>
          </div>
          <button
            type="button"
            className={decisive ? 'btn' : 'btn2'}
            style={{ marginTop: 14, width: '100%' }}
            disabled={busy}
            onClick={() => onInvestigate(k)}
          >
            Request investigation
          </button>
        </>
      )}

      {run && (
        <div className="pipe" aria-live="polite">
          {STAGES.map((s, i) => {
            const now = run.status === 'running' && i === run.stage;
            const done = run.status === 'done' || i < run.stage;
            return (
              <div key={s}>
                <span className={`dot${now ? ' now' : done ? ' done' : ''}`} />
                <span style={now ? { fontWeight: 600 } : undefined}>{s}</span>
              </div>
            );
          })}
        </div>
      )}

      {run?.status === 'done' && (
        <div className="explain" style={{ marginTop: 14 }}>
          <div className="lbl">New evidence</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <span className="mono muted" style={{ textDecoration: 'line-through' }}>
              {driverRange(k, run.before.lo, run.before.hi)}
            </span>
            <span aria-hidden="true">→</span>
            <span className="mono" style={{ fontSize: 17, fontWeight: 500 }}>
              {driverRange(k, d.lo, d.hi)}
            </span>
            <StateBadge state={d.state} />
          </div>
          <p style={{ marginTop: 8 }}>
            Option A ahead in <strong className="mono">{Math.round(run.shareBefore * 100)}%</strong> of runs before,{' '}
            <strong className="mono">{Math.round((run.shareAfter ?? 0) * 100)}%</strong> after.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SensitivityStep({
  city,
  drivers,
  sens,
  gaps,
  onInvestigate,
  onBack,
  onNext,
}: {
  city: string;
  drivers: Drivers;
  sens: SensitivityResult;
  gaps: Gaps;
  onInvestigate: (k: DriverKey) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const values = [sens.base, 0, ...sens.rows.flatMap((r) => [r.lo, r.hi])];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.05 || 0.02;
  const dom = niceTicks(min - pad, max + pad, 5);
  const pos = (v: number) => ((v - dom.lo) / (dom.hi - dom.lo)) * 100;

  const decisive = decisiveGaps(drivers, sens);
  const others = otherGaps(drivers, sens);
  // Keep investigated gaps visible even once they no longer qualify as decisive.
  const investigated = (Object.keys(gaps) as DriverKey[]).filter((k) => !decisive.includes(k) && !others.includes(k));
  const shown = [...decisive, ...investigated];

  return (
    <>
      <SectionIntro title="Which unknowns could change the decision?">
        Each bar shows how far Option A’s gross-profit advantage over Option B moves when one driver swings across its
        range. The solid line is the midpoint case; the dashed line is where both options are equal.
      </SectionIntro>

      <section className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
          <h3>Advantage of Option A over B, by driver</h3>
          <span className="muted" style={{ fontSize: 12.5 }}>
            percentage points of gross profit · midpoint {signedPts(sens.base)}
          </span>
        </div>
        <div style={{ marginTop: 12 }}>
          {sens.rows.map((r) => (
            <div className="tr" key={r.key}>
              <div>
                <div style={{ fontWeight: r.flips ? 600 : 500 }}>{DRIVERS[r.key].name}</div>
                <div style={{ marginTop: 4 }}>
                  <StateBadge state={drivers[r.key].state} />
                </div>
              </div>
              <div className="tplot">
                {dom.ticks.map((t) => (
                  <div key={t} className="gl" style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'var(--line)', left: `${pos(t)}%` }} />
                ))}
                <div style={{ position: 'absolute', top: 0, bottom: 0, borderLeft: '1.5px dashed var(--muted)', left: `${pos(0)}%` }} />
                <div
                  className={`bar${r.flips ? ' flip' : ''}`}
                  style={{ left: `${pos(r.lo)}%`, width: `${Math.max(pos(r.hi) - pos(r.lo), 0.6)}%` }}
                />
                <div className="basel" style={{ left: `${pos(sens.base)}%` }} />
              </div>
              <div className="mono" style={{ fontSize: 13 }}>
                {signedPts(r.lo)} to {signedPts(r.hi)}
              </div>
            </div>
          ))}
          <div className="tr" style={{ minHeight: 0 }}>
            <div />
            <div className="ticks">
              {dom.ticks.map((t) => (
                <span key={t} style={{ left: `${pos(t)}%` }}>
                  {signedPts(t, 0)}
                </span>
              ))}
            </div>
            <div />
          </div>
        </div>
        <div className="legend">
          <span>
            <span className="sw" style={{ background: 'var(--band-strong)' }} />
            Could flip the preferred option
          </span>
          <span>
            <span className="sw" style={{ background: 'var(--band)' }} />
            Moves the margin, no flip
          </span>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {shown.length ? (
          shown.map((k) => (
            <GapCard key={k} k={k} city={city} drivers={drivers} gaps={gaps} decisive onInvestigate={onInvestigate} />
          ))
        ) : (
          <div className="banner info">
            <span>
              No weakly evidenced driver can flip the preferred option at its current range. The decision rests on
              evidence you can see.
            </span>
          </div>
        )}
      </section>

      {others.length > 0 && (
        <details className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Other drivers you could investigate ({others.length})</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            {others.map((k) => (
              <GapCard key={k} k={k} city={city} drivers={drivers} gaps={gaps} decisive={false} onInvestigate={onInvestigate} />
            ))}
          </div>
        </details>
      )}

      <NavRow back="Back to outcomes" next="Record the decision" onBack={onBack} onNext={onNext} />
    </>
  );
}
