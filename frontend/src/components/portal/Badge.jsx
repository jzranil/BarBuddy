import { STATUS_STYLES } from '../../data/subjects';

export default function Badge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES['Not Started'];
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 600,
        padding: '3px 12px',
        borderRadius: '999px',
        border: `1px solid ${style.border}`,
        color: style.color,
        background: style.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}
