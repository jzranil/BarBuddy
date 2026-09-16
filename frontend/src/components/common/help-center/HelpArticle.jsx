import { useState } from 'react';
import ContentBlocks from './ContentBlocks';

// Same accordion look as components/FaqItem.jsx (Playfair question, chevron,
// muted answer), but takes structured `content` blocks instead of a single
// plain-text string, since Help Center articles need lists/tables.
export default function HelpArticle({ id, question, content }) {
  const [open, setOpen] = useState(false);

  return (
    <div id={id} style={{ borderBottom: '1px solid var(--card-border)', padding: '16px 0', scrollMarginTop: '90px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          fontFamily: 'Playfair Display, serif',
          fontSize: '15px',
          color: 'var(--navy)',
          padding: 0,
          textAlign: 'left',
        }}
        aria-expanded={open}
      >
        {question}
        <span className="material-symbols-outlined" style={{ flexShrink: 0 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div style={{ marginTop: '12px' }}>
          <ContentBlocks blocks={content} />
        </div>
      )}
    </div>
  );
}
