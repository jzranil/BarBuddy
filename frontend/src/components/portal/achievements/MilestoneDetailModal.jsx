import Modal from '../../common/Modal';
import ProgressBar from '../ProgressBar';
import Button from '../../Button';

// Shared by both the Achievements Sanctum and Badges pages. `entry` is a
// catalog item already merged with computed status via withStatus().
export default function MilestoneDetailModal({ open, onClose, entry, variant = 'achievement' }) {
  if (!entry) return null;
  const { icon, name, description, requirementLabel, current, target, earned, earnedAtLabel, rarity } = entry;
  const remaining = target - current;
  const showProgress = !earned && typeof target === 'number' && target > 1;

  return (
    <Modal open={open} onClose={onClose} title={name} width="420px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: variant === 'badge' ? '50%' : '10px',
            background: earned ? 'var(--gold)' : 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            filter: earned ? 'none' : 'grayscale(1)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '26px', color: earned ? 'var(--navy)' : 'var(--text-muted)' }}>
            {earned ? icon : 'lock'}
          </span>
        </div>
        <div>
          {rarity && (
            <span style={{ fontSize: '10px', fontWeight: 700, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '2px 8px', color: 'var(--text-muted)' }}>
              {rarity}
            </span>
          )}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 700,
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: earned ? '#2e7d32' : 'var(--text-muted)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{earned ? 'check_circle' : 'lock'}</span>
            {earned ? 'Earned' : 'Locked'}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.6, marginBottom: '18px' }}>{description}</p>

      <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Requirement
        </div>
        <p style={{ fontSize: '13px', color: 'var(--navy)', margin: '0 0 14px' }}>{requirementLabel}</p>

        {showProgress && (
          <div style={{ marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>Progress</span>
              <span>{current} / {target}</span>
            </div>
            <ProgressBar value={(current / target) * 100} height={6} />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              {remaining} more to unlock.
            </div>
          </div>
        )}

        {earned && (
          <div style={{ fontSize: '13px', color: 'var(--navy)' }}>
            Requirement completed.
            {earnedAtLabel && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Earned {earnedAtLabel}</div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <Button variant="outline" onClick={onClose} fullWidth>
          Close
        </Button>
      </div>
    </Modal>
  );
}
