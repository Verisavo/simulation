'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_BRIEF, type Brief } from '@/lib/brief';
import {
  applyInvestigation, DRIVERS, grounding, initialDrivers, sensitivity, simulate,
  type DriverKey, type Drivers, type ScenarioKey,
} from '@/lib/model';
import { clockTime, driverRange } from '@/lib/format';
import { GroundingChip } from './ui';
import Rail from './Rail';
import BriefStep from './steps/BriefStep';
import EvidenceStep from './steps/EvidenceStep';
import SystemMapStep, { type NodeKey } from './steps/SystemMapStep';
import AssumptionsStep from './steps/AssumptionsStep';
import OutcomesStep from './steps/OutcomesStep';
import SensitivityStep from './steps/SensitivityStep';
import DecisionStep, { type DecisionRecord } from './steps/DecisionStep';

export const STEPS = ['Brief', 'Evidence', 'System map', 'Assumptions', 'Outcomes', 'Sensitivity and gaps', 'Decision'];

export interface MemoryEntry {
  time: string;
  text: string;
}

export interface GapRun {
  status: 'running' | 'done';
  /** 0 Scoped, 1 Collecting, 2 Verifying, 3 Evidence received */
  stage: number;
  before: { lo: number; hi: number };
  shareBefore: number;
  shareAfter?: number;
}

export type Gaps = Partial<Record<DriverKey, GapRun>>;

const STAGE_MS = 1100;

export default function SimulationApp() {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<Brief>(INITIAL_BRIEF);
  const [drivers, setDrivers] = useState<Drivers>(initialDrivers);
  const [scenario, setScenario] = useState<ScenarioKey>('base');
  const [selectedNode, setSelectedNode] = useState<NodeKey>('pt');
  const [gaps, setGaps] = useState<Gaps>({});
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [explain, setExplain] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const log = useCallback((text: string) => {
    setMemory((m) => [{ time: clockTime(), text }, ...m]);
  }, []);

  const notify = useCallback((msg: string) => setToast(msg), []);

  // Times depend on the viewer's clock, so the first entry is added after mount.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    log('Simulation created from the brief. Evidence assembled for 5 drivers.');
  }, [log]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const baseline = useMemo(() => simulate(drivers, brief.price, 'base'), [drivers, brief.price]);
  const current = useMemo(
    () => (scenario === 'base' ? baseline : simulate(drivers, brief.price, scenario)),
    [baseline, drivers, brief.price, scenario],
  );
  const sens = useMemo(() => sensitivity(drivers, brief.price), [drivers, brief.price]);
  const ground = useMemo(() => grounding(drivers, sens), [drivers, sens]);

  // Slider edits are logged once the user pauses, not on every pixel of movement.
  const editTimers = useRef<Partial<Record<DriverKey, ReturnType<typeof setTimeout>>>>({});
  const changeDriver = useCallback(
    (key: DriverKey, end: 'lo' | 'hi', value: number) => {
      const d = drivers[key];
      const lo = end === 'lo' ? Math.min(value, d.hi) : d.lo;
      const hi = end === 'hi' ? Math.max(value, d.lo) : d.hi;
      const edited = lo !== d.evidenceLo || hi !== d.evidenceHi;
      setDrivers((prev) => ({ ...prev, [key]: { ...prev[key], lo, hi, edited } }));
      clearTimeout(editTimers.current[key]);
      editTimers.current[key] = setTimeout(() => {
        if (edited) log(`You set ${DRIVERS[key].name.toLowerCase()} to ${driverRange(key, lo, hi)}.`);
      }, 700);
    },
    [drivers, log],
  );

  const resetDriver = useCallback(
    (key: DriverKey) => {
      const d = drivers[key];
      setDrivers((prev) => ({
        ...prev,
        [key]: { ...prev[key], lo: d.evidenceLo, hi: d.evidenceHi, edited: false },
      }));
      log(`${DRIVERS[key].name} reset to evidence (${driverRange(key, d.evidenceLo, d.evidenceHi)}).`);
    },
    [drivers, log],
  );

  const investigate = useCallback(
    (key: DriverKey) => {
      setGaps((g) => ({
        ...g,
        [key]: {
          status: 'running',
          stage: 0,
          before: { lo: drivers[key].lo, hi: drivers[key].hi },
          shareBefore: baseline.shareAAhead,
        },
      }));
      log(`Intelligence Gap raised on ${DRIVERS[key].name.toLowerCase()}. Investigation requested.`);
    },
    [drivers, baseline.shareAAhead, log],
  );

  // Advances any running investigation one stage at a time.
  useEffect(() => {
    const running = (Object.keys(gaps) as DriverKey[]).find((k) => gaps[k]?.status === 'running');
    if (!running) return;
    const run = gaps[running]!;
    const t = setTimeout(() => {
      if (run.stage < 2) {
        setGaps((g) => ({ ...g, [running]: { ...run, stage: run.stage + 1 } }));
        return;
      }
      const next = applyInvestigation(drivers, running);
      const inv = DRIVERS[running].investigation!;
      setDrivers(next);
      setGaps((g) => ({
        ...g,
        [running]: { ...run, stage: 3, status: 'done', shareAfter: simulate(next, brief.price).shareAAhead },
      }));
      log(
        `${DRIVERS[running].name}: ${driverRange(running, run.before.lo, run.before.hi)} (${drivers[running].state}) → ` +
          `${driverRange(running, inv.lo, inv.hi)} (${inv.state}). Simulation rerun.`,
      );
      notify('New evidence received. Simulation rerun.');
    }, STAGE_MS);
    return () => clearTimeout(t);
  }, [gaps, drivers, brief.price, log, notify]);

  const go = (i: number) => setStep(Math.max(0, Math.min(STEPS.length - 1, i)));

  const views = [
    <BriefStep key="brief" brief={brief} setBrief={setBrief} log={log} notify={notify} onNext={() => go(1)} />,
    <EvidenceStep key="evidence" drivers={drivers} onBack={() => go(0)} onNext={() => go(2)} />,
    <SystemMapStep
      key="map"
      drivers={drivers}
      selected={selectedNode}
      onSelect={setSelectedNode}
      onAdjust={() => go(3)}
      onBack={() => go(1)}
      onNext={() => go(3)}
    />,
    <AssumptionsStep
      key="assumptions"
      drivers={drivers}
      result={baseline}
      ground={ground}
      onChange={changeDriver}
      onReset={resetDriver}
      onBack={() => go(2)}
      onNext={() => go(4)}
    />,
    <OutcomesStep
      key="outcomes"
      price={brief.price}
      drivers={drivers}
      result={current}
      scenario={scenario}
      onScenario={setScenario}
      ground={ground}
      sens={sens}
      explain={explain}
      onExplain={() => setExplain((x) => !x)}
      onSensitivity={() => go(5)}
      onBack={() => go(3)}
      onNext={() => go(5)}
    />,
    <SensitivityStep
      key="sensitivity"
      city={brief.city}
      drivers={drivers}
      sens={sens}
      gaps={gaps}
      onInvestigate={investigate}
      onBack={() => go(4)}
      onNext={() => go(6)}
    />,
    <DecisionStep
      key="decision"
      price={brief.price}
      drivers={drivers}
      result={baseline}
      ground={ground}
      decisions={decisions}
      onSave={(rec) => {
        setDecisions((d) => [rec, ...d]);
        log(`Decision recorded: ${rec.option}. Watching ${rec.signals.length} Signals.`);
        notify('Saved to Market Memory');
      }}
      onBack={() => go(5)}
    />,
  ];

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <div className="brandname">
            Verisavo<span>Market Simulation</span>
          </div>
          <div className="proto">Working prototype · illustrative data · runs in your browser</div>
        </div>
      </header>

      <div className="wrap">
        <div className="head">
          <h1>
            Raise {brief.price}% or hold · {brief.city}
          </h1>
          <div className="chips">
            <span className="chip">{brief.city}</span>
            <span className="chip">{brief.channel}</span>
            <span className="chip">{brief.horizon}-month horizon</span>
            <GroundingChip level={ground.level} label={ground.label} title={ground.why} />
          </div>
        </div>

        <div className="stepsbox">
          <nav className="steps" aria-label="Simulation steps">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                data-step={i}
                aria-current={i === step ? 'step' : undefined}
                onClick={() => go(i)}
              >
                <span className="n">0{i + 1}</span>
                {s}
              </button>
            ))}
          </nav>
        </div>

        <div className="layout">
          <main className="col">{views[step]}</main>
          <Rail step={step} result={baseline} ground={ground} memory={memory} />
        </div>
      </div>

      <div className="toast" role="status" hidden={!toast}>
        {toast}
      </div>
    </>
  );
}
