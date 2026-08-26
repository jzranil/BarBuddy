// value: 0-100. Defaults to 0 everywhere until real scores come from the backend.
export default function ProgressBar({ value = 0, height = 6 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        borderRadius: '999px',
        background: 'var(--card-border)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: 'var(--navy)',
          borderRadius: '999px',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}
