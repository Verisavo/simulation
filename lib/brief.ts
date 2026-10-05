export interface Brief {
  question: string;
  city: string;
  channel: string;
  horizon: number;
  /** List-price increase for Option A, in percent. */
  price: number;
}

export const INITIAL_BRIEF: Brief = {
  question:
    "If we raise our 500ml price by 10% in Nairobi's dukas and kiosks, what could happen to volume and profit over the next six months, compared with holding price?",
  city: 'Nairobi',
  channel: 'Traditional trade (dukas, kiosks)',
  horizon: 6,
  price: 10,
};

export const EXAMPLE_QUESTIONS = [
  "If we raise our 330ml can price by 8% in Accra's supermarkets, what happens to volume and profit over 9 months versus holding?",
  'Should we raise price 12% in Kampala kiosks over the next 6 months or hold?',
  INITIAL_BRIEF.question,
];

const CITIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Lagos', 'Abuja', 'Accra', 'Kumasi', 'Kampala', 'Dar es Salaam',
  'Kigali', 'Abidjan', 'Dakar', 'Lusaka', 'Addis Ababa', 'Johannesburg', 'Cairo', 'Casablanca',
];

const WORD_NUMBERS: Record<string, number> = {
  three: 3, six: 6, nine: 9, twelve: 12, eighteen: 18, 'twenty-four': 24,
};

/**
 * Stand-in for the Intelligence Assistant: reads the price change, city,
 * channel and horizon from a plain-language question. Anything it cannot
 * find keeps its current value.
 */
export function parseBrief(question: string, current: Brief): Brief {
  const next: Brief = { ...current, question };
  const pct = question.match(/(\d+(?:\.\d+)?)\s*%/);
  if (pct) next.price = clamp(Math.round(parseFloat(pct[1])), 1, 30);
  const lower = question.toLowerCase();
  const city = CITIES.find((c) => lower.includes(c.toLowerCase()));
  if (city) next.city = city;
  const months = question.match(/(\d+)\s*months?/i);
  if (months) next.horizon = clamp(parseInt(months[1], 10), 1, 24);
  else {
    const word = Object.keys(WORD_NUMBERS).find((w) => new RegExp(`\\b${w}\\s+months?`, 'i').test(question));
    if (word) next.horizon = WORD_NUMBERS[word];
  }
  if (/supermarket|modern trade|retail chain/i.test(question)) next.channel = 'Modern trade (supermarkets)';
  else if (/duka|kiosk|traditional/i.test(question)) next.channel = 'Traditional trade (dukas, kiosks)';
  return next;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
