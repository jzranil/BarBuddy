// Generic labeled field for modal forms — one component instead of
// rewriting label+input markup four times.
// type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea'
// options: required when type === 'select', array of strings or {value,label}
export default function FormField({ label, type = 'text', name, value, onChange, options, placeholder, required, rows = 3 }) {
  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--card-border)',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif',
    color: 'var(--navy)',
    background: '#fff',
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        htmlFor={name}
        style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}
      >
        {label} {required && <span style={{ color: 'var(--gold)' }}>*</span>}
      </label>

      {type === 'select' && (
        <select id={name} name={name} value={value} onChange={onChange} required={required} style={inputStyle}>
          {options.map((opt) => {
            const optValue = typeof opt === 'string' ? opt : opt.value;
            const optLabel = typeof opt === 'string' ? opt : opt.label;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      )}

      {type === 'textarea' && (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      )}

      {type !== 'select' && type !== 'textarea' && (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={inputStyle}
        />
      )}
    </div>
  );
}
