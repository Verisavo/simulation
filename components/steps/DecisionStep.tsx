'use client';

import { useState } from 'react';
import {
  DRIVER_ORDER, DRIVERS,
  type Drivers, type Grounding, type SimulationResult,
} from '@/lib/model';
import { clockTime, driverRange, signedPct } from '@/lib/format';
import { StateBadge } from '../ui';

export interface DecisionRecord {
  option: string;
  why: string;
  owner: string;
  signals: string[];
  ground: string;
  shareAAhead: number;
  time: string;
}

const SIGNALS = [
  { id: 'Competitor shelf price', label: 'Competitor shelf price, any change' },
  { id: 'Outlet stockouts', label: 'Outlet stockouts rising' },
  { id: 'Reorder frequency', label: 'Reorder frequency falling below today’s level' },
];

export default function DecisionStep({
  price,
  drivers,
  result,
  ground,
  decisions,
  onSave,
  onBack,
}: {
  price: number;
  drivers: Drivers;
  result: SimulationResult;
  ground: Grounding;
  decisions: DecisionRecord[];
  onSave: (r: DecisionRecord) => void;
  onBack: () => void;
}) {
  const optionA = `Raise list price ${price}%`;
  const [option, setOption] = useState<'A' | 'B'>('A');
  const [why, setWhy] = useState('');
  const [owner, setOwner] = useState('');
  const [signals, setSignals] = useState<string[]>(SIGNALS.map((s) => s.id));

  const accepted = DRIVER_ORDER.filter((k) => drivers[k].state !== 'Fact');

  return (
    <>
      <section className="card" style={{ background: 'var(--brand)', color: 'var(--brand-ink)', borderColor: 'var(--brand)' }}>
        <div className="lbl" style={{ color: 'var(--brand-muted)' }}>
          Where the simulation stands
        </div>
        <div className="grid2" style={{ marginTop: 12 }}>
          {[
            { label: `Option A · Raise ${price}%`, s: result.A.profit },
            { label: 'Option B · Hold price', s: result.B.profit },
          ].map((o) => (
            <div key={o.label}>
              <div style={{ fontSize: 13, color: 'var(--brand-muted)' }}>{o.label}</div>
              <div className="mono" style={{ fontSize: 20, marginTop: 2 }}>
                {signedPct(o.s.p5)} to {signedPct(o.s.p95)}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--brand-muted)' }}>gross profit, middle 90% of runs</div>
            </div>
          ))}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--brand-muted)' }}>
          {ground.label}. Option A ahead in {Math.round(result.shareAAhead * 100)}% of runs.
        </p>
      </section>

      <form
        className="card"
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            option: option === 'A' ? optionA : 'Hold price',
            why: why.trim(),
            owner: owner.trim(),
            signals,
            ground: ground.label,
            shareAAhead: result.shareAAhead,
            time: clockTime(),
          });
          setWhy('');
        }}
      >
        <div>
          <h2>Record the decision</h2>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            The choice is your team’s. Recording it lets Market Memory compare what happens with what was expected.
          </p>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="lbl" style={{ marginBottom: 8 }}>
            Option chosen
          </legend>
          <div className="grid2">
            {(['A', 'B'] as const).map((o) => (
              <label className="opt" key={o}>
                <input type="radio" name="opt" checked={option === o} onChange={() => setOption(o)} />
                <span>
                  <strong style={{ display: 'block' }}>{o === 'A' ? optionA : 'Hold price'}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    Option {o}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="fl">
          <label className="lbl" htmlFor="why">
            Reasoning
          </label>
          <textarea
            id="why"
            className="field"
            rows={3}
            placeholder="Why your team chose this option"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
          />
        </div>

        <div>
          <div className="lbl">Assumptions accepted</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {accepted.map((k) => (
              <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 14 }}>
                <StateBadge state={drivers[k].state} />
                {DRIVERS[k].name}: <span className="mono">{driverRange(k, drivers[k].lo, drivers[k].hi)}</span>
                {drivers[k].edited && <span className="edited">edited by you</span>}
              </div>
            ))}
          </div>
        </div>

        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="lbl">Signals to watch</legend>
          {SIGNALS.map((s) => (
            <label className="check" key={s.id}>
              <input
                type="checkbox"
                checked={signals.includes(s.id)}
                onChange={(e) =>
                  setSignals((cur) => (e.target.checked ? [...cur, s.id] : cur.filter((x) => x !== s.id)))
                }
              />
              {s.label}
            </label>
          ))}
        </fieldset>

        <div className="fl">
          <label className="lbl" htmlFor="owner">
            Decision owner
          </label>
          <input id="owner" className="field" placeholder="Name" value={owner} onChange={(e) => setOwner(e.target.value)} />
        </div>

        <div className="navrow">
          <button type="button" className="btn2" onClick={onBack}>
            Back to sensitivity
          </button>
          <button type="submit" className="btn">
            Save to Market Memory
          </button>
        </div>
      </form>

      {decisions.length > 0 && (
        <section className="card">
          <h3>Saved decisions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            {decisions.map((d, i) => (
              <div className="tile" key={`${d.time}-${decisions.length - i}`}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
                  <strong>{d.option}</strong>
                  <span className="mono muted" style={{ fontSize: 12 }}>
                    {d.time}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {d.ground} · Option A ahead in {Math.round(d.shareAAhead * 100)}% of runs · owner {d.owner || 'unassigned'}
                </div>
                {d.why && <p style={{ margin: '8px 0 0', fontSize: 14 }}>{d.why}</p>}
                <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  Watching: {d.signals.join(', ') || 'no Signals'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
