// Evidence bearing on the example decision. Example data for a fictional brand.
// In the product this comes from the Intelligence Layer: Client Intelligence, Platform
// Intelligence and Ground-Level Intelligence, each with its source, scope and date.

import { COST_RANGES } from "./model";

export const STATES = [
  { name: "Fact", def: "Sufficiently supported within a defined scope" },
  { name: "Inference", def: "Derived from evidence, not directly observed" },
  { name: "Hypothesis", def: "A proposed explanation that needs testing" },
  { name: "Assumption", def: "Treated as true for this analysis only" },
  { name: "Unknown", def: "Evidence cannot responsibly answer this yet" }
];

export const SOURCES = {
  client: "Client Intelligence",
  platform: "Platform Intelligence",
  ground: "Ground-Level Intelligence",
  team: "Set by your team",
  none: "No sufficient evidence"
};

export const SOURCE_FILTERS = [
  ["all", "All sources"],
  ["client", "Client Intelligence"],
  ["platform", "Platform Intelligence"],
  ["ground", "Ground-Level Intelligence"]
];

const row = (id, state, src, text, detail, scope, date, extra = {}) => ({ id, state, src, text, detail, scope, date, ...extra });

export function buildEvidence({ gapClosed, cost }) {
  return [
    row("price", "Fact", "ground", "Brand A median shelf price in Kano traditional trade is ₦700", "SavoScouts, 212 outlets", "Kano Municipal, Fagge, Nassarawa", "Sep 2026"),
    row("ship", "Fact", "client", "Brand A shipped 41,800 cases to Kano and Kaduna distributors in Q3", "Your sales records", "Both states", "Sep 2026"),
    row("share", "Fact", "client", "Kano accounts for 55% of Brand A volume across the two states", "Your sales records", "Both states", "Sep 2026"),
    row("compb", "Fact", "ground", "Competitor B raised its 33cl price from ₦650 to ₦700", "38 retailer observations, cross-checked", "Kaduna North, Kaduna South", "Aug 2026"),
    row("margin", "Fact", "client", "Retailer and distributor margins total ₦125 per bottle", "Distributor agreements, trade terms", "Both states", "Jul 2026"),
    row("switch", "Inference", "platform", "Shoppers in Kano switch malt brands more readily than in Kaduna", "Switching observations, retailer interviews, stock rotation", "Kano, Kaduna", "Sep 2026"),
    row("elastic", "Inference", "platform", "Price sensitivity for 33cl malt in traditional trade sits between −0.6 and −1.1", "Past price moves in comparable northern markets", "Northern Nigeria", "2024–26"),
    row("match", "Hypothesis", "team", "Competitor B will match a price increase within six weeks", "Based on Competitor B’s August move", "Both states", "Untested"),
    row("pass", "Hypothesis", "team", "Retailers will pass on the new price rather than absorb it", "Your sales team", "Both states", "Untested"),
    row("cost", "Assumption", "team", `Sugar and packaging costs change by ${COST_RANGES[cost].label} until March 2027`, "Editable in scenarios", "Both states", "User-set"),
    row("unit", "Assumption", "team", "Brand A unit cost is ₦400 before input cost changes", "Finance estimate", "Both states", "User-set"),
    row("outlets", "Assumption", "team", "Active distribution stays at about 1,900 outlets", "Editable later", "Both states", "User-set"),
    gapClosed
      ? row("kiosk", "Inference", "ground", "Peri-urban kiosk owners in Kano cut order size by 4% to 8% after a ₦100 rise", "SavoScouts, 118 outlets, 24 revisited", "Ungogo, Kumbotso, Dala, Gwale", "Oct 2026", { updated: true })
      : row("kiosk", "Unknown", "none", "How peri-urban kiosk owners in Kano change order size after a ₦100 rise", "Modelled as 0% to 15% until evidence arrives", "Kano peri-urban LGAs", "—", { gap: "Intelligence Gap · could change the outcome" }),
    row("stock", "Unknown", "none", "Stock currently held by the two Kaduna distributors", "Not shared", "Kaduna", "—", { gap: "Intelligence Gap · low impact" })
  ];
}

export const CONTRADICTION =
  "A Kaduna retailer panel reports steady Brand A volumes after Competitor B raised its price in August. This weakens the inference that Kaduna shoppers move quickly between brands on price.";
