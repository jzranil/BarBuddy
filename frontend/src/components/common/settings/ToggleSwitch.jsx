// Same switch visual used for Night Mode in ProfileMenu.jsx, pulled out so
// every settings toggle looks identical.
export default function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '999px',
        border: 'none',
        background: checked ? 'var(--navy)' : 'var(--card-border)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '19px' : '3px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  );
}
