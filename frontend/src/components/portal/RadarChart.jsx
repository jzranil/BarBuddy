// Renders an N-axis radar chart from scratch (just trig + SVG polygons),
// so no extra charting dependency is needed for one component.
// axes: [{ label: string, value: number (0-100) }]
export default function RadarChart({ axes, size = 260 }) {
  const center = size / 2;
  const maxRadius = size / 2 - 36; // leave room for axis labels
  const angleStep = (2 * Math.PI) / axes.length;

  const pointFor = (value, index) => {
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxRadius;
    const angle = index * angleStep - Math.PI / 2; // start at top
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const labelPointFor = (index) => {
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + (maxRadius + 20) * Math.cos(angle),
      y: center + (maxRadius + 20) * Math.sin(angle),
    };
  };

  const dataPoints = axes.map((a, i) => pointFor(a.value, i));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // concentric grid rings at 25/50/75/100%
  const rings = [25, 50, 75, 100].map((pct) => {
    const ringPoints = axes.map((_, i) => pointFor(pct, i));
    return ringPoints.map((p) => `${p.x},${p.y}`).join(' ');
  });

  return (
    <svg width={size} height={size}>
      {rings.map((ring, i) => (
        <polygon key={i} points={ring} fill="none" stroke="var(--card-border)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const outer = pointFor(100, i);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--card-border)"
            strokeWidth="1"
          />
        );
      })}

      {/* actual data shape — flat dot at center when everything is 0 */}
      <polygon points={dataPath} fill="rgba(15,31,61,0.35)" stroke="var(--navy)" strokeWidth="2" />

      {axes.map((a, i) => {
        const p = labelPointFor(i);
        return (
          <text
            key={a.label}
            x={p.x}
            y={p.y}
            fontSize="11"
            fill="var(--text-muted)"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}
