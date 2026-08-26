// Circular gauge used for "Bar Readiness Score" (dashboard) and
// "Current Readiness" (subject page). Pure SVG, no charting library required.
// value: 0-100. size/stroke are in px.
export default function GaugeCircle({ value = 0, size = 140, stroke = 12, label = 'READY' }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (clamped / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--navy)"
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Playfair Display, serif', fontSize: size * 0.2, fontWeight: 700, color: 'var(--navy)' }}>
          {clamped}%
        </span>
        <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</span>
      </div>
    </div>
  );
}
