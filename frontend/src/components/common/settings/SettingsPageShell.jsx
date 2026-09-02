import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Shared shell for every portal's Settings page: title/subtitle, the
// horizontally-scrollable jump-nav chip row, and hash-based deep-linking
// (e.g. navigate('/settings#notifications') from the profile menu scrolls
// straight to that section). Each portal's SettingsPage supplies its own
// `links` (which sections exist for that role) and renders its own section
// components as `children`.
export default function SettingsPageShell({ title = 'Settings', subtitle, links, children }) {
  const { hash } = useLocation();

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const timer = setTimeout(() => scrollTo(id), 50);
    return () => clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>{title}</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>{subtitle}</p>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '22px',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => scrollTo(link.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--navy)',
              background: '#fff',
              border: '1px solid var(--card-border)',
              borderRadius: '999px',
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--gold)' }}>{link.icon}</span>
            {link.label}
          </button>
        ))}
      </div>

      {children}
    </>
  );
}
