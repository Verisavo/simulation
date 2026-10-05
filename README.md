# Verisavo Market Simulation

Market Simulation is a Verisavo Decision Application. It lets an organisation explore how a specific market could respond to a decision, under assumptions it can see, question and change.

It is not a forecasting engine. It shows a range of outcomes for each option, the assumptions behind them, which unknowns matter most, and what evidence would narrow the range. The decision stays with the people responsible for it.

## Working prototype

This repository is a Next.js app (App Router, TypeScript) that runs the full workflow in the browser. The example decision is whether to raise a 500ml product's price by 10% in Nairobi's traditional trade (dukas and kiosks) or hold price.

**All evidence values are illustrative.** They are not market findings.

### Run it

Requires Node.js 20 or later.

```sh
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```sh
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # TypeScript check
npm test           # model tests
```

To deploy on Vercel, import the repository. It is detected as a Next.js project and needs no settings.

### Project structure

```
app/
  layout.tsx            Page shell, metadata and fonts
  page.tsx              Renders the simulation
  globals.css           Verisavo palette and component styles, light and dark
components/
  SimulationApp.tsx     State for the whole workflow and the investigation loop
  Rail.tsx              "How this step works", current reading and Market Memory
  RangeChart.tsx        Outcome ranges on a shared scale
  ui.tsx                Intelligence-state badges, grounding label, navigation
  steps/                One component per step
lib/
  model.ts              The simulation model: drivers, runs, sensitivity, grounding
  model.test.ts         Tests for the model
  brief.ts              Reads a plain-language question into a brief
  format.ts             Number and range formatting
```

`lib/model.ts` has no UI or browser dependencies. It can move to a server route or connect to the Intelligence Layer without changing the screens.

### The seven steps

| Step | What the user does | What happens underneath |
| --- | --- | --- |
| 1. Brief | States the decision in plain language | `parseBrief` reads the price change, city, channel and horizon. In the product, the Intelligence Assistant drafts the brief. |
| 2. Evidence | Reviews how much is known about each driver | Each driver shows its intelligence state (Fact, Inference, Hypothesis, Assumption, Unknown), source and recency. |
| 3. System map | Sees how the price lever reaches volume and profit | Each node explains how it enters the calculation. |
| 4. Assumptions | Drags sliders to change any driver's range | Edits are marked, logged to Market Memory and reflected in a live check. |
| 5. Outcomes | Compares options across scenarios | 3,000 runs per option produce outcome ranges and the conditions behind each end. |
| 6. Sensitivity and gaps | Sees which drivers could change the decision | A weakly evidenced driver that could flip the preferred option becomes an Intelligence Gap. A simulated investigation narrows its range and everything reruns. |
| 7. Decision | Records the choice, reasoning and Signals to watch | The record is kept in this session's Market Memory. |

### The model

Each run picks a value for every driver within its range and decides whether the main competitor also raises its price.

- Shelf price change = list price change × retailer pass-through
- Volume change = elasticity × (your shelf price change − competitor's matching change) − stock loss when squeezed outlets cut availability
- Gross profit change = (1 + volume change) × new unit margin ÷ today's unit margin − 1, with unit cost starting at 50% of today's price

Runs use a seeded random generator, so the same inputs always give the same ranges.

Sensitivity swings one driver at a time from the low to the high end of its range, with the others at their midpoints, and checks whether it could change which option comes out ahead.

Each simulation carries a grounding label based on its most influential drivers:

- **Exploratory:** the most influential driver is Unknown.
- **Partially grounded:** an influential driver rests on a Hypothesis or Assumption.
- **Evidence-grounded:** the most influential drivers rest on Facts or Inferences.

### What is simulated in the prototype

- The evidence values and sources (`DRIVERS` in `lib/model.ts`)
- The SavoScouts investigation and its results (`investigation` on each driver)
- The "Explain this range" text, which is generated from the model's own sensitivity figures rather than by the Intelligence Assistant
- Market Memory, which lasts only until the page is closed

These are the points where the prototype would connect to the Verisavo Intelligence Layer.
