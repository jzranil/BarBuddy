// Reusable button used across landing, login, and signup pages.
// variant: "navy" (solid navy, white text) | "gold" (solid gold, navy text) | "outline" (navy border)
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'navy',
  fullWidth = false,
  icon,
  disabled = false,
}) {
  const base = {
    fontWeight: 600,
    fontSize: '15px',
    padding: '12px 22px',
    borderRadius: '8px',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: fullWidth ? '100%' : 'auto',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
    opacity: disabled ? 0.6 : 1,
  };

  const variants = {
    navy: {
      background: 'var(--navy)',
      color: '#fff',
      borderColor: 'var(--navy)',
    },
    gold: {
      background: 'var(--gold)',
      color: 'var(--navy)',
      borderColor: 'var(--gold)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--navy)',
      borderColor: 'var(--navy)',
    },
    'outline-light': {
      background: 'transparent',
      color: '#fff',
      borderColor: 'rgba(255,255,255,0.6)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--navy)',
      borderColor: 'transparent',
      padding: '8px 4px',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {icon && <span className="material-symbols-outlined">{icon}</span>}
      {children}
    </button>
  );
}
