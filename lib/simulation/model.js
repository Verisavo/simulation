// Market Simulation model for the MVP prototype.
//
// A deliberately simple price-response model. It exists so the interface can show
// ranges, drivers and the effect of new evidence. It is not calibrated: every number
// below is example data for a fictional brand and should be replaced by evidence
// from the Intelligence Layer before anyone relies on the output.

export const BASE_PRICE = 700;          // ₦, current shelf price (Fact)
export const CHANNEL_MARGIN = 125;      // ₦ per bottle to retailers and distributors (Fact)
export const UNIT_COST = 400;           // ₦ per bottle before input cost changes (Assumption)
export const KANO_SHARE = 0.55;         // share of volume sold in Kano (Fact)
export const ELASTICITY = [0.6, 1.1];   // price sensitivity range (Inference)
export const RUNS = 2000;

export const COST_RANGES = {
  low: { label: "−5% to 0%", range: [-0.05, 0] },
  mid: { label: "0% to +5%", range: [0, 0.05] },
  high: { label: "+5% to +10%", range: [0.05, 0.1] }
};

// Kano kiosk order response to a ₦100 rise. Unknown until Ground-Level Intelligence arrives.
export function kioskRange(gapClosed) {
  return gapClosed ? [0.04, 0.08] : [0, 0.15];
}

// Small seeded generator so the same inputs always give the same ranges.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One run. Returns changes against today as fractions (−0.1 = 10% lower).
export function model(price, comp, e, k, c, drift) {
  const d = price / BASE_PRICE - 1;
  const follow = comp === "matches" ? 0.5 : 1;   // a competitor who follows halves the relative price change
  const kiosk = d > 0 ? KANO_SHARE * k * (d / (100 / BASE_PRICE)) : 0;
  const vol = -d * e * follow + drift - kiosk;
  const rev = (1 + d) * (1 + vol) - 1;
  const m0 = BASE_PRICE - CHANNEL_MARGIN - UNIT_COST;
  const m1 = price - CHANNEL_MARGIN - UNIT_COST * (1 + c);
  return { vol, rev, gp: (m1 * (1 + vol)) / m0 - 1 };
}

const pick = (arr) => {
  arr.sort((a, b) => a - b);
  const at = (p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
  return [at(0.1), at(0.5), at(0.9)];
};

// Many runs with every uncertain input drawn from its range. Returns the middle 80% and the middle run.
export function simulate(scenario, { gapClosed, cost, volLimit }) {
  const r = rng(1009 + scenario.price * 3 + (scenario.comp === "matches" ? 17 : 0) + (gapClosed ? 101 : 0));
  const [kl, kh] = kioskRange(gapClosed);
  const [cl, ch] = COST_RANGES[cost].range;
  const vol = [], rev = [], gp = [];
  let within = 0;
  for (let i = 0; i < RUNS; i++) {
    const e = ELASTICITY[0] + (ELASTICITY[1] - ELASTICITY[0]) * r();
    const o = model(scenario.price, scenario.comp, e, kl + (kh - kl) * r(), cl + (ch - cl) * r(), 0.03 * r());
    vol.push(o.vol); rev.push(o.rev); gp.push(o.gp);
    if (o.vol >= -volLimit / 100) within++;
  }
  return { id: scenario.id, price: scenario.price, comp: scenario.comp, vol: pick(vol), rev: pick(rev), gp: pick(gp), within: within / RUNS };
}

export function simulateAll(scenarios, opts) {
  return scenarios.map((s) => simulate(s, opts));
}

// How far gross profit moves when each input goes from the low to the high end of its range.
export function drivers(scenario, { gapClosed, cost }) {
  const [kl, kh] = kioskRange(gapClosed);
  const [cl, ch] = COST_RANGES[cost].range;
  const mid = { e: 0.85, k: (kl + kh) / 2, c: (cl + ch) / 2, comp: scenario.comp };
  const f = (o) => {
    const x = { ...mid, ...o };
    return model(scenario.price, x.comp, x.e, x.k, x.c, 0.015).gp;
  };
  return [
    { key: "kiosk", name: "Kano kiosk order response", state: gapClosed ? "Inference" : "Unknown", swing: Math.abs(f({ k: kh }) - f({ k: kl })) },
    { key: "comp", name: "Competitor B response", state: "Hypothesis", swing: Math.abs(f({ comp: "matches" }) - f({ comp: "holds" })) },
    { key: "cost", name: "Input costs", state: "Assumption", swing: Math.abs(f({ c: ch }) - f({ c: cl })) },
    { key: "e", name: "Price sensitivity", state: "Inference", swing: Math.abs(f({ e: ELASTICITY[1] }) - f({ e: ELASTICITY[0] })) }
  ].sort((a, b) => b.swing - a.swing);
}

export function scenarioName(price) {
  if (price === BASE_PRICE) return `Hold at ₦${price}`;
  return price > BASE_PRICE ? `Raise to ₦${price}` : `Cut to ₦${price}`;
}

export function pct(x) {
  const n = Math.round(x * 100);
  return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n) + "%";
}

export const driverPhrase = {
  kiosk: "how Kano kiosks reorder",
  comp: "Competitor B’s response",
  cost: "input costs",
  e: "price sensitivity"
};
