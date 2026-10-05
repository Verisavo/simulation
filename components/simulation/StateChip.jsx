// The five intelligence states, always shown the same way so users learn to read them at a glance.
export default function StateChip({ state }) {
  return <span className={`sm-chip sm-chip-${state.toLowerCase()}`}>{state}</span>;
}
