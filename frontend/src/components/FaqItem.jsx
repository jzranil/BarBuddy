import { useState } from 'react';

export default function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid var(--card-border)', padding: '16px 0' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontFamily: 'Playfair Display, serif',
          fontSize: '15px',
          color: 'var(--navy)',
          padding: 0,
        }}
        aria-expanded={open}
      >
        {question}
        <span className="material-symbols-outlined">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
          {answer}
        </p>
      )}
    </div>
  );
}
