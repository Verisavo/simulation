/**
 * Market Simulation model.
 *
 * Pure functions with no UI or browser dependencies, so the same logic can run
 * in the browser today and on a server or in the Intelligence Layer later.
 *
 * All evidence values below are illustrative. They are not market findings.
 */

export type DriverKey = 'pt' | 'el' | 'cm' | 'sk' | 'ic';
export type IntelState = 'Fact' | 'Inference' | 'Hypothesis' | 'Assumption' | 'Unknown';
export type ScenarioKey = 'base' | 'match' | 'hold' | 'cost';

export interface Investigation {
  lo: number;
  hi: number;
  state: IntelState;
  src: string;
  method: string;
  who: string;
  question: (city: string) => string;
}

export interface DriverDef {
  name: string;
  short: string;
  unit: '%' | '% chance' | '';
  lo: number;
  hi: number;
  min: number;
  max: number;
  step: number;
  state: IntelState;
  src: string;
  recency: string;
  desc: string;
  how: string;
  investigation: Investigation | null;
}

export interface DriverState {
  lo: number;
  hi: number;
  state: IntelState;
  src: string;
  recency: string;
  edited: boolean;
  /** The range the evidence supports, kept so user edits can be reset. */
  evidenceLo: number;
  evidenceHi: number;
}

export type Drivers = Record<DriverKey, DriverState>;

export const DRIVER_ORDER: DriverKey[] = ['pt', 'el', 'cm', 'sk', 'ic'];

export const STATES: IntelState[] = ['Fact', 'Inference', 'Hypothesis', 'Assumption', 'Unknown'];

/** Rough evidence coverage per intelligence state, for the coverage bars. */
export const COVERAGE: Record<IntelState, number> = {
  Fact: 100,
  Inference: 65,
  Hypothesis: 35,
  Assumption: 20,
  Unknown: 0,
};

export const STATE_HELP: Record<IntelState, string> = {
  Fact: 'Supported within a defined scope',
  Inference: 'Derived from evidence, not observed',
  Hypothesis: 'Proposed, needs testing',
  Assumption: 'Treated as true for now',
  Unknown: 'Evidence cannot answer yet',
};

export const DRIVERS: Record<DriverKey, DriverDef> = {
  pt: {
    name: 'Retailer pass-through',
    short: 'Pass-through',
    unit: '%',
    lo: 60, hi: 100, min: 0, max: 100, step: 5,
    state: 'Unknown',
    src: 'No recent evidence for this channel',
    recency: 'None',
    desc: 'Share of a list-price rise that dukas and kiosks pass on to the shelf price.',
    how: 'Sets how much of your list-price change reaches the shopper. Anything not passed on squeezes retailer margin.',
    investigation: {
      lo: 55, hi: 70, state: 'Inference',
      src: 'SavoScouts shelf-price observations, 2 rounds',
      method: 'Shelf-price and stocking observations in sampled outlets, plus a short question on pricing practice',
      who: 'SavoScouts via mobile app and WhatsApp',
      question: (city) => `How much of a supplier price increase do ${city} dukas and kiosks pass on to shelf price in this category?`,
    },
  },
  el: {
    name: 'Price elasticity vs competing brands',
    short: 'Elasticity',
    unit: '',
    lo: -2.4, hi: -1.8, min: -3.5, max: 0, step: 0.1,
    state: 'Inference',
    src: 'Your sales after the last 2 price moves',
    recency: '2025',
    desc: 'How volume responds when your shelf price moves relative to competing brands.',
    how: 'Multiplies the change in your shelf price relative to competitors to give the change in volume.',
    investigation: {
      lo: -2.2, hi: -1.95, state: 'Inference',
      src: 'Expanded analysis of company sales and a category panel',
      method: 'Re-estimate using more price events and outlet-level sales',
      who: 'Verisavo analysts',
      question: () => 'How sensitive is volume to our price relative to competing brands in this channel?',
    },
  },
  cm: {
    name: 'Competitor raises price too',
    short: 'Competitor response',
    unit: '% chance',
    lo: 20, hi: 60, min: 0, max: 100, step: 5,
    state: 'Hypothesis',
    src: 'Behaviour seen in a neighbouring market',
    recency: '2024',
    desc: 'Chance that the main competitor raises its own price by about 10% within two months.',
    how: 'In each run, a competitor raise either happens or not with this probability. If it happens, your relative price falls by its raise.',
    investigation: {
      lo: 45, hi: 65, state: 'Inference',
      src: 'Distributor interviews and competitor shelf tracking',
      method: 'Distributor conversations plus monthly competitor shelf-price tracking',
      who: 'SavoScouts and Verisavo analysts',
      question: () => 'Is the main competitor likely to raise its price within two months?',
    },
  },
  sk: {
    name: 'Stocking cut when margins are squeezed',
    short: 'Stocking response',
    unit: '%',
    lo: 0, hi: 40, min: 0, max: 100, step: 5,
    state: 'Assumption',
    src: 'Team judgement',
    recency: 'n/a',
    desc: 'How strongly outlets cut stock of your product when they absorb part of the increase themselves.',
    how: 'Reduces availability, and so volume, in proportion to the part of the increase retailers absorb.',
    investigation: {
      lo: 10, hi: 25, state: 'Inference',
      src: 'SavoScouts retailer questions on stocking decisions',
      method: 'Short structured questions to outlet owners on how they respond to margin pressure',
      who: 'SavoScouts via WhatsApp and voice',
      question: () => 'Do outlets cut stock of a brand when they absorb part of a price increase?',
    },
  },
  ic: {
    name: 'Input cost increase',
    short: 'Input cost',
    unit: '%',
    lo: 6, hi: 8, min: 0, max: 20, step: 0.5,
    state: 'Fact',
    src: 'Supplier contracts',
    recency: 'This quarter',
    desc: 'Increase in your unit cost this period.',
    how: 'Raises unit cost from 50% of today’s price. Applies to both options.',
    investigation: null,
  },
};

export const SCENARIOS: Record<ScenarioKey, string> = {
  base: 'Baseline',
  match: 'Competitor raises',
  hold: 'Competitor holds',
  cost: 'Input costs rise further',
};

export const RUNS = 3000;
/** Unit cost as a share of today's price, so today's gross margin is 50%. */
export const COST_SHARE = 0.5;
/** Size of the competitor's price rise when it raises. */
export const COMPETITOR_RAISE = 0.1;
/** How strongly retailer margin squeeze converts into lost availability. */
const STOCK_LOSS_FACTOR = 3;

export function initialDrivers(): Drivers {
  const out = {} as Drivers;
  for (const k of DRIVER_ORDER) {
    const d = DRIVERS[k];
    out[k] = {
      lo: d.lo, hi: d.hi, state: d.state, src: d.src, recency: d.recency,
      edited: false, evidenceLo: d.lo, evidenceHi: d.hi,
    };
  }
  return out;
}

export interface Outcome {
  volume: number;
  profit: number;
}

/**
 * One run of the model for one option.
 * @param price list-price change as a fraction (0.1 = +10%; 0 = hold)
 * @param passThrough share of the change passed to shelf price (0 to 1)
 * @param elasticity volume response to relative shelf price (negative)
 * @param competitorRaised whether the main competitor also raised its price
 * @param stockCut how strongly squeezed outlets cut stock (0 to 1)
 * @param inputCost unit-cost increase as a fraction
 */
export function outcome(
  price: number,
  passThrough: number,
  elasticity: number,
  competitorRaised: boolean,
  stockCut: number,
  inputCost: number,
): Outcome {
  const relativePrice = passThrough * price - (competitorRaised ? passThrough * COMPETITOR_RAISE : 0);
  const volume = elasticity * relativePrice - stockCut * (1 - passThrough) * price * STOCK_LOSS_FACTOR;
  const marginToday = 1 - COST_SHARE;
  const marginNew = 1 + price - COST_SHARE * (1 + inputCost);
  return { volume, profit: ((1 + volume) * marginNew) / marginToday - 1 };
}

type Ranges = Record<DriverKey, { lo: number; hi: number }>;

function applyScenario(drivers: Drivers, scenario: ScenarioKey): Ranges {
  const r = {} as Ranges;
  for (const k of DRIVER_ORDER) r[k] = { lo: drivers[k].lo, hi: drivers[k].hi };
  if (scenario === 'match') r.cm = { lo: 100, hi: 100 };
  if (scenario === 'hold') r.cm = { lo: 0, hi: 0 };
  if (scenario === 'cost') r.ic = { lo: 10, hi: 12 };
  return r;
}

/** Small seeded generator so the same inputs always give the same ranges. */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Summary {
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
}

export function summarise(xs: number[]): Summary {
  const s = [...xs].sort((a, b) => a - b);
  const q = (f: number) => s[Math.min(s.length - 1, Math.floor(f * (s.length - 1)))];
  return { p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95) };
}

export interface Draw {
  passThrough: number;
  elasticity: number;
  competitorRaised: boolean;
  profitA: number;
}

export interface SimulationResult {
  A: { volume: Summary; profit: Summary };
  B: { volume: Summary; profit: Summary };
  /** Share of runs in which Option A (raise) gives more gross profit than Option B (hold). */
  shareAAhead: number;
  draws: Draw[];
}

export function simulate(
  drivers: Drivers,
  pricePct: number,
  scenario: ScenarioKey = 'base',
  runs: number = RUNS,
  seed = 20261002,
): SimulationResult {
  const r = applyScenario(drivers, scenario);
  const rand = mulberry32(seed);
  const between = (lo: number, hi: number) => lo + (hi - lo) * rand();
  const price = pricePct / 100;
  const aVol: number[] = [], aProfit: number[] = [], bVol: number[] = [], bProfit: number[] = [];
  const draws: Draw[] = [];
  let ahead = 0;
  for (let i = 0; i < runs; i++) {
    const t = between(r.pt.lo, r.pt.hi) / 100;
    const e = between(r.el.lo, r.el.hi);
    const q = between(r.cm.lo, r.cm.hi) / 100;
    const m = rand() < q;
    const k = between(r.sk.lo, r.sk.hi) / 100;
    const c = between(r.ic.lo, r.ic.hi) / 100;
    const a = outcome(price, t, e, m, k, c);
    const b = outcome(0, t, e, m, k, c);
    aVol.push(a.volume); aProfit.push(a.profit); bVol.push(b.volume); bProfit.push(b.profit);
    draws.push({ passThrough: t, elasticity: e, competitorRaised: m, profitA: a.profit });
    if (a.profit > b.profit) ahead++;
  }
  return {
    A: { volume: summarise(aVol), profit: summarise(aProfit) },
    B: { volume: summarise(bVol), profit: summarise(bProfit) },
    shareAAhead: ahead / runs,
    draws,
  };
}

/** Expected gross-profit advantage of Option A over Option B at fixed driver values. */
export function advantage(values: Record<DriverKey, number>, pricePct: number): number {
  const p = pricePct / 100;
  const q = values.cm / 100;
  const diff = (raised: boolean) =>
    outcome(p, values.pt / 100, values.el, raised, values.sk / 100, values.ic / 100).profit -
    outcome(0, values.pt / 100, values.el, raised, values.sk / 100, values.ic / 100).profit;
  return q * diff(true) + (1 - q) * diff(false);
}

export interface SensitivityRow {
  key: DriverKey;
  lo: number;
  hi: number;
  width: number;
  /** True when this driver alone could change which option comes out ahead. */
  flips: boolean;
}

export interface SensitivityResult {
  base: number;
  rows: SensitivityRow[];
}

/** One-at-a-time swing of each driver across its range, others at their midpoints. */
export function sensitivity(drivers: Drivers, pricePct: number): SensitivityResult {
  const mid = {} as Record<DriverKey, number>;
  for (const k of DRIVER_ORDER) mid[k] = (drivers[k].lo + drivers[k].hi) / 2;
  const base = advantage(mid, pricePct);
  const rows = DRIVER_ORDER.map((key) => {
    const a = advantage({ ...mid, [key]: drivers[key].lo }, pricePct);
    const b = advantage({ ...mid, [key]: drivers[key].hi }, pricePct);
    const lo = Math.min(a, b), hi = Math.max(a, b);
    return { key, lo, hi, width: hi - lo, flips: lo < 0 && hi > 0 };
  }).sort((x, y) => y.width - x.width);
  return { base, rows };
}

const WEAK: IntelState[] = ['Hypothesis', 'Assumption', 'Unknown'];
export const isWeak = (s: IntelState) => WEAK.includes(s);

export type GroundingLevel = 'exploratory' | 'partial' | 'grounded';

export interface Grounding {
  level: GroundingLevel;
  label: string;
  why: string;
}

export function grounding(drivers: Drivers, sens: SensitivityResult): Grounding {
  const [first, second] = sens.rows;
  const s0 = drivers[first.key].state;
  const s1 = drivers[second.key].state;
  if (s0 === 'Unknown') {
    return {
      level: 'exploratory',
      label: 'Exploratory',
      why: `The driver with the most influence, ${DRIVERS[first.key].name.toLowerCase()}, is Unknown.`,
    };
  }
  const weakFlip = sens.rows.find((r) => r.flips && isWeak(drivers[r.key].state));
  if (weakFlip) {
    const st = drivers[weakFlip.key].state;
    return {
      level: 'partial',
      label: 'Partially grounded',
      why: `${DRIVERS[weakFlip.key].name} could change the preferred option and rests on ${st === 'Assumption' ? 'an' : 'a'} ${st}.`,
    };
  }
  if (isWeak(s0) || isWeak(s1)) {
    return {
      level: 'partial',
      label: 'Partially grounded',
      why: 'At least one of the two most influential drivers rests on a Hypothesis or Assumption.',
    };
  }
  return { level: 'grounded', label: 'Evidence-grounded', why: 'The most influential drivers rest on Facts or Inferences.' };
}

/** Drivers that could flip the preferred option and are not well evidenced. */
export function decisiveGaps(drivers: Drivers, sens: SensitivityResult): DriverKey[] {
  return sens.rows
    .filter((r) => r.flips && isWeak(drivers[r.key].state) && DRIVERS[r.key].investigation)
    .map((r) => r.key);
}

/** Weakly evidenced drivers that can be investigated but would not flip the decision. */
export function otherGaps(drivers: Drivers, sens: SensitivityResult): DriverKey[] {
  const decisive = decisiveGaps(drivers, sens);
  return sens.rows
    .filter((r) => !decisive.includes(r.key) && isWeak(drivers[r.key].state) && DRIVERS[r.key].investigation)
    .map((r) => r.key);
}

/** Apply the result of an investigation to a driver. */
export function applyInvestigation(drivers: Drivers, key: DriverKey): Drivers {
  const inv = DRIVERS[key].investigation;
  if (!inv) return drivers;
  return {
    ...drivers,
    [key]: {
      ...drivers[key],
      lo: inv.lo,
      hi: inv.hi,
      state: inv.state,
      src: `${inv.src} (simulated)`,
      recency: 'Just now',
      edited: false,
      evidenceLo: inv.lo,
      evidenceHi: inv.hi,
    },
  };
}

/** Average conditions in the weakest and strongest 10% of Option A runs. */
export function pathways(draws: Draw[]) {
  const sorted = [...draws].sort((x, y) => x.profitA - y.profitA);
  const n = Math.max(1, Math.floor(sorted.length * 0.1));
  const avg = (arr: Draw[]) => {
    const L = arr.length;
    return {
      passThrough: arr.reduce((s, d) => s + d.passThrough, 0) / L,
      elasticity: arr.reduce((s, d) => s + d.elasticity, 0) / L,
      competitorShare: arr.reduce((s, d) => s + (d.competitorRaised ? 1 : 0), 0) / L,
      profit: arr.reduce((s, d) => s + d.profitA, 0) / L,
    };
  };
  return { weak: avg(sorted.slice(0, n)), strong: avg(sorted.slice(-n)) };
}
