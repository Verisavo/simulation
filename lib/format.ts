import { DRIVERS, type DriverKey } from './model';

const MINUS = '−';

/** A fraction as a signed percentage: 0.034 -> "+3%". */
export function signedPct(x: number, dp = 0): string {
  const v = Number((x * 100).toFixed(dp));
  if (v === 0) return '0%';
  return `${v > 0 ? '+' : MINUS}${Math.abs(v).toFixed(dp)}%`;
}

/** A fraction as signed percentage points: 0.034 -> "+3.4". */
export function signedPts(x: number, dp = 1): string {
  const v = Number((x * 100).toFixed(dp));
  if (v === 0) return '0';
  return `${v > 0 ? '+' : MINUS}${Math.abs(v).toFixed(dp)}`;
}

/** A driver value in its own unit. */
export function driverValue(key: DriverKey, v: number): string {
  if (key === 'el') return `${v < 0 ? MINUS : ''}${Math.abs(v).toFixed(1)}`;
  const unit = DRIVERS[key].unit;
  const n = Math.round(v * 10) / 10;
  return unit === '%' || unit === '% chance' ? `${n}%` : String(n);
}

export function driverRange(key: DriverKey, lo: number, hi: number): string {
  return lo === hi ? driverValue(key, lo) : `${driverValue(key, lo)} to ${driverValue(key, hi)}`;
}

/** Round axis bounds and evenly spaced ticks covering [min, max]. */
export function niceTicks(min: number, max: number, count = 5) {
  const span = max - min || 1;
  let step = Math.pow(10, Math.floor(Math.log10(span / count)));
  const err = span / count / step;
  if (err >= 7.5) step *= 10;
  else if (err >= 3.5) step *= 5;
  else if (err >= 1.5) step *= 2;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let x = lo; x <= hi + step / 2; x += step) ticks.push(Math.round(x / step) * step);
  return { lo, hi, ticks };
}

export function clockTime(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
