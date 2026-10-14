const STATUS_TAG_STYLES = {
  Published: { bg: 'var(--navy)', color: '#fff' },
  Draft: { bg: '#fdf7e9', color: 'var(--navy)', border: '1px solid var(--gold)' },
  Archived: { bg: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--card-border)' },
};

// Card for a question bank subject or a syllabus document.
// viewMode: 'grid' (card) | 'list' (compact row)
// card: { title, subject, status, questionCount?, lastEdited, meta? }
// actions: [{ icon, label, onClick, muted?, disabled? }]
// onOpen: called when the card's ⋮ button is clicked (optional)
export default function SyllabusCard({ card, viewMode = 'grid', actions = [], onOpen }) {
  const tagStyle = STATUS_TAG_STYLES[card.status] ?? STATUS_TAG_STYLES.Archived;

  const metaLine =
    card.meta ??
    `${card.questionCount != null ? `${card.questionCount.toLocaleString()} Questions  •  ` : ''}Last updated: ${card.lastEdited}`;

  const actionButtons = actions.map((action) => (
    <button
      key={action.label}
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      style={{
        background: 'none',
        border: 'none',
        color: action.muted ? 'var(--text-muted)' : 'var(--navy)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: action.disabled ? 'default' : 'pointer',
        opacity: action.disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: 0,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{action.icon}</span>
      {action.label}
    </button>
  ));

  const moreButton = onOpen && (
    <button
      type="button"
      onClick={onOpen}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
      aria-label={`Open ${card.title}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
    </button>
  );

  const metaIcon = card.questionCount != null ? 'list' : 'picture_as_pdf';

  if (viewMode === 'list') {
    return (
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', padding: '3px 10px', borderRadius: '999px', background: tagStyle.bg, color: tagStyle.color, border: tagStyle.border, flexShrink: 0 }}>
          {card.status.toUpperCase()}
        </span>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <h4 style={{ fontSize: '14px', margin: 0 }}>{card.title}</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{card.subject}</p>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, flexShrink: 0, whiteSpace: 'pre' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{metaIcon}</span>
          {metaLine}
        </p>
        <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>{actionButtons}</div>
        {moreButton}
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', padding: '3px 10px', borderRadius: '999px', background: tagStyle.bg, color: tagStyle.color, border: tagStyle.border }}>
          {card.status.toUpperCase()}
        </span>
        {moreButton}
      </div>
      <h4 style={{ fontSize: '15px', marginBottom: '4px', overflowWrap: 'anywhere' }}>{card.title}</h4>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{card.subject}</p>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', whiteSpace: 'pre' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{metaIcon}</span>
        {metaLine}
      </p>
      <div style={{ display: 'flex', gap: '14px', marginTop: 'auto' }}>{actionButtons}</div>
    </div>
  );
}
