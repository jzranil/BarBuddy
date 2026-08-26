// Reusable labeled input used on Login and Signup pages.
// icon: Google Material Symbol name shown inside the field (e.g. "mail", "lock")
// trailing: optional node rendered top-right of the label (e.g. "Forgot password?")
export default function FormInput({
  label,
  icon,
  trailing,
  type = 'text',
  name,
  placeholder,
  required = false,
  value,
  onChange,
  onToggleVisibility,
  showToggle = false,
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '6px',
        }}
      >
        <label
          htmlFor={name}
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--navy)',
          }}
        >
          {label} {required && <span style={{ color: 'var(--gold)' }}>*</span>}
        </label>
        {trailing}
      </div>

      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            className="material-symbols-outlined"
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '18px',
            }}
          >
            {icon}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          style={{
            width: '100%',
            padding: icon ? '11px 40px' : '11px 14px',
            borderRadius: '8px',
            border: '1px solid var(--card-border)',
            background: '#fff',
            fontSize: '14px',
            color: 'var(--navy)',
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label="Toggle password visibility"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 0,
              lineHeight: 1,
            }}
          >
            <span className="material-symbols-outlined">visibility</span>
          </button>
        )}
      </div>
    </div>
  );
}
