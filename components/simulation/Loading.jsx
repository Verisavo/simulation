export default function Loading({ title, items }) {
  return (
    <section className="sm-card sm-loading" aria-live="polite">
      <div className="sm-spin" aria-hidden="true"></div>
      <h2 role="status">{title}</h2>
      <ul>
        {items.map((t, i) => (
          <li key={t} style={{ animationDelay: `${i * 0.22}s` }}>{t}</li>
        ))}
      </ul>
    </section>
  );
}
