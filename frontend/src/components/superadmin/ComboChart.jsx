// data: [{ month, revenue, aiCost }] — both in the same unit (e.g. ₱k)
export default function ComboChart({ data, height = 260, yMax, formatY = (v) => v }) {
  const max = yMax ?? Math.max(1, ...data.map((d) => Math.max(d.revenue, d.aiCost))) * 1.1;
  const gridLines = [1, 0.75, 0.5, 0.25, 0];

  // Line points as percentages within the plot area, for the SVG overlay.
  const linePoints = data
    .map((d, i) => {
      const x = ((i + 0.5) / data.length) * 100;
      const y = 100 - (d.aiCost / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {/* y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height, fontSize: '10px', color: 'var(--text-muted)', paddingBottom: '22px', textAlign: 'right', minWidth: '36px' }}>
          {gridLines.map((g) => (
            <span key={g}>{formatY(Math.round(max * g))}</span>
          ))}
        </div>

        {/* plot area */}
        <div style={{ position: 'relative', flex: 1 }}>
          {/* gridlines */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: '22px', left: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {gridLines.map((g) => (
              <div key={g} style={{ borderTop: '1px dashed var(--card-border)' }} />
            ))}
          </div>

          {/* line overlay (AI cost) */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ position: 'absolute', top: 0, right: 0, bottom: '22px', left: 0, width: '100%', height: `calc(100% - 22px)` }}
          >
            <polyline points={linePoints} fill="none" stroke="var(--gold)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {data.map((d, i) => {
              const x = ((i + 0.5) / data.length) * 100;
              const y = 100 - (d.aiCost / max) * 100;
              return <circle key={i} cx={x} cy={y} r="1.6" fill="var(--gold)" />;
            })}
          </svg>

          {/* bars (revenue) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', height, gap: '4px' }}>
            {data.map((d) => (
              <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1, width: '100%', justifyContent: 'center' }}>
                  <div
                    title={`Revenue: ${formatY(d.revenue)}`}
                    style={{ width: '55%', maxWidth: '38px', height: `${(d.revenue / max) * 100}%`, background: 'var(--navy)', borderRadius: '3px 3px 0 0' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', height: '16px' }}>{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '18px', justifyContent: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--navy)', display: 'inline-block' }} />
          Revenue
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
          AI Costs
        </span>
      </div>
    </div>
  );
}
