import { DRIVERS, type DriverKey, type Drivers } from '@/lib/model';
import { driverRange } from '@/lib/format';
import { NavRow, SectionIntro, StateBadge } from '../ui';

type FixedKey = 'list' | 'shelf' | 'rel' | 'vol' | 'gp' | 'rm' | 'av';
export type NodeKey = DriverKey | FixedKey;

const FIXED: Record<FixedKey, { name: string; kind?: 'lever' | 'out'; desc: string; how: string }> = {
  list: { name: 'Your list price', kind: 'lever', desc: 'The decision lever. Option A raises it; Option B holds it.', how: 'Option A applies the price increase from the brief; Option B leaves it at today’s level.' },
  shelf: { name: 'Shelf price', desc: 'What shoppers pay in the outlet.', how: 'Your list-price change multiplied by retailer pass-through.' },
  rel: { name: 'Price vs competitors', desc: 'Your shelf price relative to competing brands.', how: 'Your shelf-price change, minus the competitor’s change when it also raises.' },
  vol: { name: 'Volume', kind: 'out', desc: 'Outcome metric.', how: 'Elasticity times the relative price change, minus any loss from outlets cutting stock.' },
  gp: { name: 'Gross profit', kind: 'out', desc: 'Outcome metric.', how: 'Volume times the new unit margin, compared with today. Unit cost starts at 50% of today’s price.' },
  rm: { name: 'Retailer margin', desc: 'What the outlet keeps per unit.', how: 'Squeezed by the part of the increase the retailer absorbs instead of passing on.' },
  av: { name: 'Availability', desc: 'Whether your product is on the shelf.', how: 'Falls when squeezed outlets cut stock, which lowers volume.' },
};

const isDriver = (k: NodeKey): k is DriverKey => k in DRIVERS;

function Arrow({ dir }: { dir: 'r' | 'd' | 'u' }) {
  if (dir === 'r')
    return (
      <div className="ar">
        <svg width="34" height="14" viewBox="0 0 34 14" aria-hidden="true">
          <path d="M1 7H30M25 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    );
  return (
    <div className="ar">
      <svg width="14" height="38" viewBox="0 0 14 38" aria-hidden="true">
        <path
          d={dir === 'd' ? 'M7 1V34M2 29l5 5 5-5' : 'M7 37V4M2 9l5-5 5 5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

export default function SystemMapStep({
  drivers,
  selected,
  onSelect,
  onAdjust,
  onBack,
  onNext,
}: {
  drivers: Drivers;
  selected: NodeKey;
  onSelect: (k: NodeKey) => void;
  onAdjust: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const node = (id: NodeKey) => {
    const fixed = isDriver(id) ? null : FIXED[id];
    const cls = `node${fixed?.kind ? ` ${fixed.kind}` : ''}`;
    return (
      <button type="button" className={cls} aria-pressed={selected === id} data-node={id} onClick={() => onSelect(id)}>
        {isDriver(id) ? DRIVERS[id].short : fixed!.name}
        {isDriver(id) ? (
          <StateBadge state={drivers[id].state} />
        ) : (
          <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
            {fixed!.kind === 'out' ? 'Outcome' : fixed!.kind === 'lever' ? 'Decision lever' : 'Derived'}
          </span>
        )}
      </button>
    );
  };
  const at = (c: number, r: number, children: React.ReactNode) => (
    <div key={`${c}-${r}`} style={{ gridColumn: c, gridRow: r }}>
      {children}
    </div>
  );

  const info = isDriver(selected) ? DRIVERS[selected] : FIXED[selected];

  return (
    <>
      <SectionIntro title="How this part of the market connects">
        Proposed from Connected Market Intelligence. Select a node to see how it enters the calculation.
      </SectionIntro>

      <section className="card">
        <div className="mapbox">
          <div className="map">
            {at(3, 1, node('pt'))}
            {at(5, 1, node('cm'))}
            {at(7, 1, node('el'))}
            {at(9, 1, node('ic'))}
            {at(3, 2, <Arrow dir="d" />)}
            {at(5, 2, <Arrow dir="d" />)}
            {at(7, 2, <Arrow dir="d" />)}
            {at(9, 2, <Arrow dir="d" />)}
            {at(1, 3, node('list'))}
            {at(2, 3, <Arrow dir="r" />)}
            {at(3, 3, node('shelf'))}
            {at(4, 3, <Arrow dir="r" />)}
            {at(5, 3, node('rel'))}
            {at(6, 3, <Arrow dir="r" />)}
            {at(7, 3, node('vol'))}
            {at(8, 3, <Arrow dir="r" />)}
            {at(9, 3, node('gp'))}
            {at(3, 4, <Arrow dir="d" />)}
            {at(7, 4, <Arrow dir="u" />)}
            {at(3, 5, node('rm'))}
            {at(4, 5, <Arrow dir="r" />)}
            {at(5, 5, node('sk'))}
            {at(6, 5, <Arrow dir="r" />)}
            {at(7, 5, node('av'))}
          </div>
        </div>
        <div className="legend">
          <span>
            <span className="sw" style={{ background: 'var(--band-soft)', border: '1px solid var(--accent)' }} />
            Outcome
          </span>
          <span>
            <span className="sw" style={{ border: '1px dashed var(--line-2)' }} />
            Decision lever
          </span>
          <span>Arrows show direction of influence</span>
        </div>
      </section>

      <section className="card">
        <div className="lbl">Selected</div>
        <h3 style={{ fontSize: 18, marginTop: 6 }}>{info.name}</h3>
        {isDriver(selected) && (
          <div style={{ marginTop: 8 }}>
            <StateBadge state={drivers[selected].state} />
          </div>
        )}
        <p className="muted" style={{ margin: '12px 0 0' }}>
          {info.desc}
        </p>
        <div style={{ marginTop: 14 }}>
          <div className="kv">
            <span className="muted">In the model</span>
            <span>{info.how}</span>
          </div>
          {isDriver(selected) && (
            <>
              <div className="kv">
                <span className="muted">Range</span>
                <span className="mono">{driverRange(selected, drivers[selected].lo, drivers[selected].hi)}</span>
              </div>
              <div className="kv">
                <span className="muted">Evidence</span>
                <span>{drivers[selected].src}</span>
              </div>
            </>
          )}
        </div>
        {isDriver(selected) && (
          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn2" onClick={onAdjust}>
              Adjust this assumption
            </button>
          </div>
        )}
      </section>

      <NavRow back="Back to evidence" next="Set assumptions" onBack={onBack} onNext={onNext} />
    </>
  );
}
