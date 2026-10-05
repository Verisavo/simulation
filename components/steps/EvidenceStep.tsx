import { COVERAGE, DRIVER_ORDER, DRIVERS, STATES, type Drivers, type IntelState } from '@/lib/model';
import { driverRange } from '@/lib/format';
import { NavRow, SectionIntro, StateBadge } from '../ui';

export default function EvidenceStep({
  drivers,
  onBack,
  onNext,
}: {
  drivers: Drivers;
  onBack: () => void;
  onNext: () => void;
}) {
  const counts = Object.fromEntries(STATES.map((s) => [s, 0])) as Record<IntelState, number>;
  DRIVER_ORDER.forEach((k) => counts[drivers[k].state]++);
  const unknown = DRIVER_ORDER.filter((k) => drivers[k].state === 'Unknown');

  return (
    <>
      <SectionIntro title="How much do we actually know?">
        Evidence assembled from the Intelligence Layer and your company data for each driver this decision depends on.
      </SectionIntro>

      <div className="tiles">
        <div className="tile">
          <div className="v">{DRIVER_ORDER.length}</div>
          <div className="muted" style={{ fontSize: 13 }}>
            Drivers
          </div>
        </div>
        {STATES.map((s) => (
          <div className="tile" key={s}>
            <div className="v">{counts[s]}</div>
            <div style={{ marginTop: 2 }}>
              <StateBadge state={s} />
            </div>
          </div>
        ))}
      </div>

      <section className="card" style={{ padding: '8px 12px' }}>
        <div className="tblbox">
          <table>
            <thead>
              <tr>
                <th scope="col">Driver</th>
                <th scope="col">State</th>
                <th scope="col">Range</th>
                <th scope="col">Evidence</th>
                <th scope="col">Most recent</th>
              </tr>
            </thead>
            <tbody>
              {DRIVER_ORDER.map((k) => {
                const d = drivers[k];
                return (
                  <tr key={k} className={d.state === 'Unknown' ? 'unk' : undefined}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{DRIVERS[k].name}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {DRIVERS[k].desc}
                      </div>
                    </td>
                    <td>
                      <StateBadge state={d.state} />
                    </td>
                    <td className="mono">{driverRange(k, d.lo, d.hi)}</td>
                    <td>{d.src}</td>
                    <td className="muted">
                      {d.recency}
                      <div className="cov" aria-label={`Coverage ${COVERAGE[d.state]}%`}>
                        <i style={{ width: `${COVERAGE[d.state]}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {unknown.length ? (
        <div className="banner warn">
          <span>
            <strong>
              {unknown.length} driver{unknown.length > 1 ? 's have' : ' has'} no evidence.
            </strong>{' '}
            The simulation can still run, but it will say so in its results.
          </span>
        </div>
      ) : (
        <div className="banner info">
          <span>Every driver now has some evidence behind it.</span>
        </div>
      )}

      <NavRow back="Back to brief" next="Map the system" onBack={onBack} onNext={onNext} />
    </>
  );
}
