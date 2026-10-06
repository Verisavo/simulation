# Verisavo Market Simulation

Market Simulation is a Verisavo Decision Application. It lets an organisation explore how a specific market could respond to a decision, under assumptions it can see, question and change.

It is not a forecasting engine. It shows a range of outcomes for each option, the assumptions behind them, which unknowns matter most, and what evidence would narrow the range. The decision stays with the people responsible for it.

## Prototype

The current prototype is a single self-contained web page. Open `dist/index.html` in a browser; it needs no server or install. All signals, sources, location profiles and figures in it are illustrative.

It follows three steps:

1. **Ask.** Describe a decision or change in any African market, optionally choosing a location and time period.
2. **Set up.** Check and adjust the change being tested, the location, sector, measure, period, what you already know, and which signals to include.
3. **Results.** A decision workspace with:
   - a summary and recommended next step
   - outcome, range, path, confidence and unknown indicators
   - a signal map and moving agent populations
   - the Verisavo Intelligence Assistant, which answers questions and runs what-ifs
   - analysis exhibits, option comparison and Market Memory

## Structure

| Path | Contents |
| --- | --- |
| `src/engine.js` | Question interpreter, world builder and Monte Carlo agent simulation (200 runs per scenario). |
| `src/data/africa.json` | Country outlines for the map. |
| `src/ui/core.js` | Journey, setup form, map, agent swarm, intelligence panel, investigation and SavoScout loop, exhibits, report. |
| `src/ui/workspace.js` | Decision-workspace layer: home prompt, results tabs, summary and indicator cards, assistant and what-ifs, map callouts. Loaded after `core.js` and overrides some of its functions. |
| `src/styles/base.css`, `src/styles/workspace.css` | Styles. `workspace.css` is the current design layer. |
| `src/index.html` | Page template with placeholders filled at build time. |
| `scripts/build.py` | Assembles everything into `dist/index.html`. |

## Build

```
python3 scripts/build.py
```

Edit files in `src/`, then rebuild. Commit `dist/index.html` with the source so the prototype can be opened directly.
