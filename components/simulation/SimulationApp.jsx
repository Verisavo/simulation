"use client";
import { useEffect, useRef, useState } from "react";
import { simulateAll, scenarioName, pct } from "@/lib/simulation/model";
import Sidebar from "./Sidebar";
import StepNav from "./StepNav";
import Loading from "./Loading";
import DecisionStep from "./DecisionStep";
import EvidenceStep from "./EvidenceStep";
import ScenariosStep from "./ScenariosStep";
import OutcomesStep from "./OutcomesStep";
import GapsStep from "./GapsStep";

const DEFAULT_QUESTION =
  "Should we raise the shelf price of Brand A malt drink (33cl) from ₦700 to ₦800 in Kano and Kaduna from January 2027?";

const DEFAULT_SCENARIOS = [
  { id: "A", price: 700, comp: "holds" },
  { id: "B", price: 750, comp: "matches" },
  { id: "C", price: 800, comp: "matches" }
];

const LOAD_STEPS = {
  evidence: {
    title: "Connecting the evidence for this decision",
    items: ["Your sales records and trade terms", "Ground-Level observations from 340 outlets", "Past price moves in comparable markets", "Public records on excise and import rules"]
  },
  run: {
    title: "Running the simulation",
    items: ["Running 2,000 combinations per scenario", "Drawing inputs from their evidence ranges", "Checking results against your volume limit", "Measuring which inputs move the result most"]
  },
  rerun: {
    title: "Re-running with the new evidence",
    items: ["Adding Ground-Level Intelligence from 118 outlets", "Narrowing the Kano kiosk range", "Running 2,000 combinations per scenario", "Recording the change in Market Memory"]
  }
};

function stamp() {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function SimulationApp() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [loading, setLoading] = useState(null);
  const [decision, setDecision] = useState({ question: DEFAULT_QUESTION, type: "Pricing", volLimit: 10 });
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [cost, setCost] = useState("mid");
  const [results, setResults] = useState(null);
  const [prevResults, setPrevResults] = useState(null);
  const [view, setView] = useState("C");
  const [requested, setRequested] = useState(false);
  const [gapClosed, setGapClosed] = useState(false);
  const [memory, setMemory] = useState([{ when: "5 Oct 2026", text: "Simulation created for Kano and Kaduna, 33cl pricing", tone: "start" }]);
  const timer = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const log = (text, tone = "event") => setMemory((m) => [{ when: stamp(), text, tone }, ...m]);

  const go = (n) => {
    setStep(n);
    // move focus to the new step's heading so keyboard and screen reader users land in the right place
    requestAnimationFrame(() => mainRef.current?.querySelector("h1")?.focus());
  };

  const withLoading = (kind, done) => {
    clearTimeout(timer.current);
    setLoading(kind);
    window.scrollTo({ top: 0, behavior: "smooth" });
    timer.current = setTimeout(() => {
      setLoading(null);
      done();
    }, 1300);
  };

  const opts = (closed = gapClosed) => ({ gapClosed: closed, cost, volLimit: decision.volLimit });

  const gatherEvidence = () =>
    withLoading("evidence", () => {
      log("Evidence gathered: 14 items, 2 Unknowns");
      setMaxStep((m) => Math.max(m, 3));
      go(2);
    });

  const run = () =>
    withLoading("run", () => {
      setResults(simulateAll(scenarios, opts()));
      log("Simulation run: " + scenarios.map((s) => `${s.id} ${scenarioName(s.price)}`).join(", "));
      if (!scenarios.some((s) => s.id === view)) setView(scenarios[scenarios.length - 1].id);
      setMaxStep(5);
      go(4);
    });

  const request = () => {
    setRequested(true);
    log("Ground-Level request sent: 120 kiosks in Kano, about 10 days");
  };

  const evidenceArrives = () => {
    const before = results;
    withLoading("rerun", () => {
      const after = simulateAll(scenarios, opts(true));
      setGapClosed(true);
      setPrevResults(before);
      setResults(after);
      const p = before?.find((r) => r.id === view), n = after.find((r) => r.id === view);
      log("New evidence from 118 outlets: kiosk order response is now an Inference (−4% to −8%)", "evidence");
      if (n) log(`Simulation re-run. Scenario ${view} gross profit ${p ? `${pct(p.gp[0])} to ${pct(p.gp[2])} → ` : ""}${pct(n.gp[0])} to ${pct(n.gp[2])}`, "evidence");
      go(4);
    });
  };

  const hasResults = !!results;
  const gapCount = gapClosed ? 1 : 2;

  return (
    <div className="sm-app">
      <Sidebar
        current={step === 2 ? "evidence" : step === 5 ? "gaps" : "simulations"}
        gapCount={gapCount}
        onSimulations={() => go(hasResults ? 4 : 1)}
        onEvidence={() => maxStep >= 2 && go(2)}
        onGaps={() => maxStep >= 5 && go(5)}
      />
      <main className="sm-main" id="main" ref={mainRef}>
        <div className="sm-topbar">
          <p className="sm-crumb">
            Simulations / <strong>{step === 1 && !hasResults ? "New simulation" : "Brand A 33cl price · Kano and Kaduna"}</strong>
          </p>
          <div className="sm-topbar-end">
            <span className="sm-example">Example data</span>
            <span className="sm-avatar" aria-label="Signed in as Amina Yusuf">AY</span>
          </div>
        </div>

        <StepNav step={step} maxStep={maxStep} disabled={!!loading} onGo={go} />

        {loading ? (
          <Loading {...LOAD_STEPS[loading]} />
        ) : (
          <div className="sm-step" key={step}>
            {step === 1 && <DecisionStep decision={decision} onChange={setDecision} onSubmit={gatherEvidence} />}
            {step === 2 && (
              <EvidenceStep gapClosed={gapClosed} cost={cost} gapCount={gapCount} onNext={() => go(3)} onBack={() => go(1)} />
            )}
            {step === 3 && (
              <ScenariosStep
                scenarios={scenarios}
                onScenarios={setScenarios}
                cost={cost}
                onCost={setCost}
                gapClosed={gapClosed}
                onRun={run}
                onBack={() => go(2)}
              />
            )}
            {step === 4 && hasResults && (
              <OutcomesStep
                results={results}
                prevResults={prevResults}
                scenarios={scenarios}
                volLimit={decision.volLimit}
                cost={cost}
                gapClosed={gapClosed}
                view={view}
                onView={setView}
                onAdjust={() => go(3)}
                onGaps={() => go(5)}
              />
            )}
            {step === 5 && (
              <GapsStep
                scenarios={scenarios}
                cost={cost}
                view={view}
                gapClosed={gapClosed}
                requested={requested}
                memory={memory}
                onRequest={request}
                onEvidence={evidenceArrives}
                onOutcomes={() => go(4)}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
