import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyInvestigation, decisiveGaps, grounding, initialDrivers, outcome, sensitivity, simulate,
} from './model.ts';

test('holding price with no cost change leaves volume and profit unchanged', () => {
  const r = outcome(0, 0.8, -2, false, 0.2, 0);
  assert.ok(Math.abs(r.volume) < 1e-12);
  assert.ok(Math.abs(r.profit) < 1e-12);
});

test('raising price reduces volume when elasticity is negative', () => {
  assert.ok(outcome(0.1, 1, -2, false, 0, 0).volume < 0);
});

test('simulation is deterministic for the same inputs', () => {
  const d = initialDrivers();
  assert.deepEqual(simulate(d, 10).A.profit, simulate(d, 10).A.profit);
});

test('percentiles are ordered', () => {
  const s = simulate(initialDrivers(), 10).A.profit;
  assert.ok(s.p5 <= s.p25 && s.p25 <= s.p50 && s.p50 <= s.p75 && s.p75 <= s.p95);
});

test('starting evidence is Exploratory because pass-through is Unknown', () => {
  const d = initialDrivers();
  assert.equal(grounding(d, sensitivity(d, 10)).level, 'exploratory');
  assert.ok(decisiveGaps(d, sensitivity(d, 10)).includes('pt'));
});

test('investigating pass-through moves the simulation out of Exploratory', () => {
  const before = initialDrivers();
  const after = applyInvestigation(before, 'pt');
  assert.equal(after.pt.state, 'Inference');
  assert.notEqual(grounding(after, sensitivity(after, 10)).level, 'exploratory');
  assert.ok(simulate(after, 10).shareAAhead > simulate(before, 10).shareAAhead);
});
