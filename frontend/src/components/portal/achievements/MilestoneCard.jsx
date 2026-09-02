import ProgressBar from '../ProgressBar';

// variant: 'achievement' (square icon tile + rarity pill, used in the
// Achievements Sanctum) | 'badge' (circular icon frame, used in Badges).
// Reused by both the preview sections on the main Achievements page and the
// two dedicated pages, so earned/locked treatment only lives in one place.
export default function MilestoneCard({
  icon,
  name,
  description,
  requirementLabel,
  current,
  target,
  earned,
  earnedAtLabel,
  rarity,
  variant = 'achievement',
  onClick,
}) {
  const remaining = target - current;
  const showProgress = !earned && typeof target === 'number' && target > 1;

  const Wrapper = onClick ? 'button' : 'div';
  const wrapperProps = onClick
    ? { onClick, type: 'button', 'aria-label': `${name} — ${earned ? 'Earned' : 'Locked'}` }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px',
        textAlign: 'left',
        width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        opacity: earned ? 1 : 0.85,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        font: 'inherit',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: variant === 'badge' ? '50%' : '8px',
            background: earned ? 'var(--gold)' : 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: earned ? 'none' : 'grayscale(1)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: earned ? 'var(--navy)' : 'var(--text-muted)' }}>
            {earned ? icon : 'lock'}
          </span>
        </div>
        {rarity && (
          <span style={{ fontSize: '10px', fontWeight: 700, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '2px 8px', color: 'var(--text-muted)' }}>
            {rarity}
          </span>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>{name}</h4>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{description}</p>
      </div>

      {showProgress && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Progress</span>
            <span>{current} / {target}</span>
          </div>
          <ProgressBar value={(current / target) * 100} height={5} />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {remaining} more to unlock
          </div>
        </div>
      )}

      {!earned && !showProgress && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{requirementLabel}</p>
      )}

      <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
        {earned ? (
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
            Earned{earnedAtLabel ? ` ${earnedAtLabel}` : ''}
          </span>
        ) : (
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lock</span>
            Locked
          </span>
        )}
      </div>
    </Wrapper>
  );
}
