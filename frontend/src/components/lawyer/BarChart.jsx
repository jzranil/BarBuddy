// data: [{ label, current, target }], values 0-100
export default function BarChart({ data, height = 220 }) {
  const gridLines = [100, 75, 50, 25, 0];

  return (
    <div>
      {/* legend */}
      <div style={{ display: 'flex', gap: '18px', justifyContent: 'flex-end', marginBottom: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--navy)', display: 'inline-block' }} />
          Current Avg
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--gold-soft)', display: 'inline-block' }} />
          Bar Pass Target
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {/* y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height, fontSize: '10px', color: 'var(--text-muted)', paddingBottom: '22px' }}>
          {gridLines.map((g) => (
            <span key={g}>{g}</span>
          ))}
        </div>

        {/* plot area */}
        <div style={{ position: 'relative', flex: 1 }}>
          {/* gridlines */}
          <div style={{ position: 'absolute', inset: `0 0 22px 0`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {gridLines.map((g) => (
              <div key={g} style={{ borderTop: '1px dashed var(--card-border)' }} />
            ))}
          </div>

          {/* bars */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', height, gap: '4px' }}>
            {data.map((d) => (
              <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', flex: 1, width: '100%', justifyContent: 'center' }}>
                  <div
                    title={`Current: ${d.current}%`}
                    style={{ width: '30%', maxWidth: '22px', height: `${d.current}%`, background: 'var(--navy)', borderRadius: '3px 3px 0 0' }}
                  />
                  <div
                    title={`Target: ${d.target}%`}
                    style={{ width: '30%', maxWidth: '22px', height: `${d.target}%`, background: 'var(--gold-soft)', borderRadius: '3px 3px 0 0' }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px', height: '16px' }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
