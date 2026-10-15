// Shimmering placeholders shown while data loads (styles: ".skeleton" in index.css)

export function Skeleton({ width = '100%', height = 14, radius = 8, style }) {
  return <span className="skeleton" aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />;
}

// A grid of card placeholders
export function SkeletonCards({ count = 3, height = 120, min = 220 }) {
  return (
    <div role="status" aria-label="Loading" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: '14px' }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'grid', gap: '10px', minHeight: height }}>
          <Skeleton width="45%" height={12} />
          <Skeleton width="80%" height={18} />
          <Skeleton width="65%" height={12} />
        </div>
      ))}
    </div>
  );
}

// Stacked list-row placeholders
export function SkeletonList({ rows = 4 }) {
  return (
    <div role="status" aria-label="Loading" style={{ display: 'grid', gap: '12px' }}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Skeleton width={38} height={38} radius={8} />
          <div style={{ flex: 1, display: 'grid', gap: '8px' }}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="65%" height={11} />
          </div>
          <Skeleton width={70} height={30} />
        </div>
      ))}
    </div>
  );
}

// Table-body placeholders: render inside <tbody>
export function SkeletonTableRows({ rows = 5, cols = 5 }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} style={{ borderTop: '1px solid var(--card-border)' }} aria-hidden="true">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} style={{ padding: '16px 22px' }}>
          <Skeleton width={c === 0 ? '80%' : '60%'} height={12} />
        </td>
      ))}
    </tr>
  ));
}

// Full page placeholder (header + cards + list)
export function SkeletonPage() {
  return (
    <div role="status" aria-label="Loading" style={{ display: 'grid', gap: '20px' }}>
      <div style={{ display: 'grid', gap: '10px' }}>
        <Skeleton width="30%" height={26} />
        <Skeleton width="50%" height={13} />
      </div>
      <SkeletonCards count={3} />
      <SkeletonList rows={3} />
    </div>
  );
}
