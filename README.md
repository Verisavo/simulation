# Verisavo Market Simulation

Market Simulation is a Verisavo Decision Application. It lets an organisation explore how a specific market could respond to a decision, under assumptions it can see, question and change.

It is not a forecasting engine. It shows a range of outcomes for each option, the assumptions behind them, which unknowns matter most, and what evidence would narrow the range. The decision stays with the people responsible for it.

## The MVP prototype

A working front end that takes one example pricing decision through five steps:

1. **Decision.** State the question, the decision type and the largest volume loss you could accept.
2. **Evidence.** Review what is known, labelled Fact, Inference, Hypothesis, Assumption or Unknown, and filter by state or by source (Client, Platform or Ground-Level Intelligence).
3. **Scenarios.** Set up to four options, each with a shelf price and an expected competitor response. Shared inputs show the evidence they rest on.
4. **Outcomes.** Compare ranges for bottles sold, revenue and gross profit, see how often each option stays within your limit, and see which inputs move the result most.
5. **Gaps.** Brief SavoScouts on the Unknown that matters most. When the evidence comes back, the simulation re-runs and Market Memory records what changed.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

Node.js 20 or newer is required.

## How the code is organised

```
app/
  layout.jsx  page.jsx    fonts, metadata and the single page
  simulation.css          Verisavo tokens: Royal Indigo, white and the blue scale
components/simulation/
  SimulationApp.jsx       holds the state and moves between steps
  DecisionStep, EvidenceStep, ScenariosStep, OutcomesStep, GapsStep
  Sidebar, StepNav, Loading, StateChip
lib/simulation/
  model.js                runs, ranges (middle 80%), drivers and helpers
  evidence.js             evidence items, intelligence states and sources
```

## What it is not yet

- Everything runs in the browser on example data for a fictional brand ("Brand A") in Kano and Kaduna.
- The model in `lib/simulation/model.js` is a simple price-response calculation chosen so the ranges move sensibly. It is not calibrated to real evidence.
- The evidence list in `lib/simulation/evidence.js` is illustrative. In the product it would come from the Intelligence Layer.
- "Add returned evidence" on the Gaps step stands in for a real SavoScouts investigation.
- Only pricing decisions are simulated. Other decision types show a note.
