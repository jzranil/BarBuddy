// Renders the block-based content used by data/helpCenter.js articles.
// Kept separate from HelpArticle so the block vocabulary (p / h5 / ul / ol /
// table / formula) stays in one place and is easy to extend.
export default function ContentBlocks({ blocks }) {
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'p':
            return (
              <p key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>
                {block.text}
              </p>
            );

          case 'h5':
            return (
              <h5 key={i} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', margin: '4px 0 0' }}>
                {block.text}
              </h5>
            );

          case 'formula':
            return (
              <div
                key={i}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--navy)',
                  background: 'var(--bg)',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                }}
              >
                {block.text}
              </div>
            );

          case 'ul':
            return (
              <ul key={i} style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '4px' }}>
                {block.items.map((item) => (
                  <li key={item} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {item}
                  </li>
                ))}
              </ul>
            );

          case 'ol':
            return (
              <ol key={i} style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '4px' }}>
                {block.items.map((item) => (
                  <li key={item} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {item}
                  </li>
                ))}
              </ol>
            );

          case 'table':
            return (
              <div key={i} style={{ overflowX: 'auto', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '360px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                      {block.headers.map((h) => (
                        <th key={h} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} style={{ borderTop: '1px solid var(--card-border)' }}>
                        {row.map((cell, c) => (
                          <td key={c} style={{ padding: '10px 12px', color: c === 0 ? 'var(--navy)' : 'var(--text-muted)', fontWeight: c === 0 ? 600 : 400 }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
