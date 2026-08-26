import { useNavigate } from 'react-router-dom';

const STATUS_TAG_STYLES = {
  Published: { bg: 'var(--navy)', color: '#fff' },
  Draft: { bg: '#fdf7e9', color: 'var(--navy)', border: '1px solid var(--gold)' },
  Archived: { bg: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' },
};

// viewMode: 'grid' (card) | 'list' (compact row)
export default function SyllabusCard({ card, viewMode = 'grid' }) {
  const navigate = useNavigate();
  const tagStyle = STATUS_TAG_STYLES[card.status] ?? STATUS_TAG_STYLES.Archived;

  const editButton = (
    <button
      onClick={() => navigate('/coming-soon', { state: { title: `Edit ${card.title}`, description: 'The syllabus/question editor will open here once the backend exists.' } })}
      style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>edit</span>
      Edit
    </button>
  );

  const archiveButton = (
    <button
      onClick={() => navigate('/coming-soon', { state: { title: `Archive ${card.title}`, description: 'Archiving connects once the syllabus API exists.' } })}
      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>archive</span>
      Archive
    </button>
  );

  const moreButton = (
    <button
      onClick={() => navigate('/coming-soon', { state: { title: card.title, description: 'More options (duplicate, delete, export) connect here once the backend exists.' } })}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
      aria-label="More options"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
    </button>
  );

  if (viewMode === 'list') {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', padding: '3px 10px', borderRadius: '999px', ...tagStyle, flexShrink: 0 }}>
          {card.status.toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <h4 style={{ fontSize: '14px', margin: 0 }}>{card.title}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{card.subject}</p>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>list</span>
          {card.questionCount} Questions &nbsp;•&nbsp; Last edited: {card.lastEdited}
        </p>
        <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
          {editButton}
          {archiveButton}
        </div>
        {moreButton}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', padding: '3px 10px', borderRadius: '999px', ...tagStyle }}>
          {card.status.toUpperCase()}
        </span>
        {moreButton}
      </div>
      <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{card.title}</h4>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{card.subject}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>list</span>
        {card.questionCount} Questions &nbsp;•&nbsp; Last edited: {card.lastEdited}
      </p>
      <div style={{ display: 'flex', gap: '14px' }}>
        {editButton}
        {archiveButton}
      </div>
    </div>
  );
}
