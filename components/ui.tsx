import type { GroundingLevel, IntelState } from '@/lib/model';

export function StateBadge({ state }: { state: IntelState }) {
  return <span className={`st st-${state}`}>{state}</span>;
}

const GROUND_CLASS: Record<GroundingLevel, string> = {
  exploratory: 'g-exploratory',
  partial: 'g-partial',
  grounded: 'g-grounded',
};

export function GroundingChip({ level, label, title }: { level: GroundingLevel; label: string; title?: string }) {
  return (
    <span className={`chip ground ${GROUND_CLASS[level]}`} title={title}>
      {label}
    </span>
  );
}

export function NavRow({
  back,
  next,
  onBack,
  onNext,
}: {
  back?: string;
  next?: string;
  onBack?: () => void;
  onNext?: () => void;
}) {
  return (
    <div className="navrow">
      {back ? (
        <button type="button" className="btn2" onClick={onBack}>
          {back}
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button type="button" className="btn" onClick={onNext}>
          {next}
        </button>
      )}
    </div>
  );
}

export function SectionIntro({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section>
      <h2 style={{ fontSize: 20 }}>{title}</h2>
      {children && <p className="intro muted">{children}</p>}
    </section>
  );
}
