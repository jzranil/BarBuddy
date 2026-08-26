import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import ProgressBar from './ProgressBar';

// subject: { slug, name, icon }  (static metadata from src/data/subjects.js)
// stats: { score, status, trendDirection, trendLabel } (zeroed until backend exists)
export default function SubjectCard({ subject, stats, compact = false }) {
  const navigate = useNavigate();

  const trendIcon =
    stats.trendDirection === 'up' ? 'trending_up' : stats.trendDirection === 'down' ? 'trending_down' : 'remove';
  const trendColor =
    stats.trendDirection === 'up' ? '#2e7d32' : stats.trendDirection === 'down' ? '#c0392b' : 'var(--text-muted)';

  return (
    <button
      onClick={() => navigate(`/subjects/${subject.slug}`)}
      style={{
        textAlign: 'left',
        width: '100%',
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: compact ? '16px' : '20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>
            {subject.icon}
          </span>
        </div>
        <Badge status={stats.status} />
      </div>

      <div>
        <h4 style={{ fontSize: '15px', margin: '0 0 6px' }}>{subject.name}</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 700 }}>
            {stats.score}%
          </span>
          <span style={{ fontSize: '11px', color: trendColor, display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>{trendIcon}</span>
            {stats.trendLabel}
          </span>
        </div>
      </div>

      <ProgressBar value={stats.score} />
    </button>
  );
}
