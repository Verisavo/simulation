import type { Summary } from '@/lib/model';
import { niceTicks, signedPct } from '@/lib/format';

interface Row {
  tag: string;
  name: string;
  summary: Summary;
}

/** Outcome ranges for each option on one shared scale: middle 90%, middle 50% and median. */
export default function RangeChart({ title, unit, rows }: { title: string; unit: string; rows: Row[] }) {
  const lows = rows.map((r) => r.summary.p5);
  const highs = rows.map((r) => r.summary.p95);
  const min = Math.min(...lows, 0);
  const max = Math.max(...highs, 0);
  const pad = (max - min) * 0.06 || 0.02;
  const dom = niceTicks(min - pad, max + pad, 5);
  const pos = (v: number) => ((v - dom.lo) / (dom.hi - dom.lo)) * 100;
  const grid = dom.ticks.map((t) => <div key={t} className="gl" style={{ left: `${pos(t)}%` }} />);

  return (
    <section className="card">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
        <h3>{title}</h3>
        <span className="muted" style={{ fontSize: 12.5 }}>
          {unit}
        </span>
      </div>
      <div style={{ marginTop: 12 }}>
        {rows.map((r) => (
          <div className="rr" key={r.tag}>
            <div>
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--accent)' }}>
                {r.tag}
              </div>
              <div style={{ fontWeight: 500 }}>{r.name}</div>
            </div>
            <div className="plot">
              {grid}
              <div className="o" style={{ left: `${pos(r.summary.p5)}%`, width: `${Math.max(pos(r.summary.p95) - pos(r.summary.p5), 0.6)}%` }} />
              <div className="i" style={{ left: `${pos(r.summary.p25)}%`, width: `${Math.max(pos(r.summary.p75) - pos(r.summary.p25), 0.6)}%` }} />
              <div className="zero" style={{ left: `${pos(0)}%` }} />
              <div className="md" style={{ left: `${pos(r.summary.p50)}%` }} />
            </div>
            <div className="mono" style={{ fontSize: 13 }}>
              {signedPct(r.summary.p5)} to {signedPct(r.summary.p95)}
            </div>
          </div>
        ))}
        <div className="rr" style={{ minHeight: 0 }}>
          <div className="axisgap" />
          <div className="ticks">
            {dom.ticks.map((t) => (
              <span key={t} style={{ left: `${pos(t)}%` }}>
                {signedPct(t)}
              </span>
            ))}
          </div>
          <div className="axisgap" />
        </div>
      </div>
    </section>
  );
}
