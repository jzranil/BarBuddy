// Reusable labeled input used on Login and Signup pages.
// icon: Google Material Symbol name shown inside the field (e.g. "mail", "lock")
// trailing: optional node rendered top-right of the label (e.g. "Forgot password?")
// error: validation message shown under the field (red border when set)
// hint: helper text shown under the field when there is no error
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
  onBlur,
  onToggleVisibility,
  showToggle = false,
  error,
  hint,
  autoComplete,
  inputMode,
  maxLength,
}) {
  const messageId = `${name}-message`;
  const hasError = Boolean(error);

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
              color: hasError ? '#c0392b' : 'var(--text-muted)',
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
          onBlur={onBlur}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={hasError}
          aria-describedby={error || hint ? messageId : undefined}
          style={{
            width: '100%',
            padding: icon ? '11px 40px' : '11px 14px',
            borderRadius: '8px',
            border: `1px solid ${hasError ? '#c0392b' : 'var(--card-border)'}`,
            background: '#fff',
            fontSize: '14px',
            color: 'var(--navy)',
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggleVisibility}
            aria-label={type === 'password' ? 'Show password' : 'Hide password'}
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
            <span className="material-symbols-outlined">{type === 'password' ? 'visibility' : 'visibility_off'}</span>
          </button>
        )}
      </div>

      {(error || hint) && (
        <div
          id={messageId}
          role={error ? 'alert' : undefined}
          style={{ fontSize: '12px', marginTop: '5px', color: error ? '#c0392b' : 'var(--text-muted)' }}
        >
          {error || hint}
        </div>
      )}
    </div>
  );
}
