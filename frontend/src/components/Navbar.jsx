import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import BrandLogo from './BrandLogo';

// links: [{ label, href }]  -- href can be an in-page anchor ("#pricing") or a route ("/")
// Below 768px the links and Login collapse into a ☰ dropdown (see index.css).
export default function Navbar({ links }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const goToLogin = (e) => {
    e.preventDefault();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header
      style={{
        background: 'var(--navy)',
        borderBottom: '3px solid var(--gold)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '12px',
        }}
      >
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(false);
            navigate('/');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}
        >
          <BrandLogo height={34} onDark />
        </a>

        <nav
          style={{
            display: 'flex',
            gap: '28px',
            fontSize: '14px',
            fontWeight: 500,
          }}
          className="nav-links"
        >
          {links.map((link) => (
            <a key={link.label} href={link.href} style={{ color: '#e8e6e0' }}>
              {link.label}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <a
            href="/login"
            onClick={goToLogin}
            className="nav-login"
            style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}
          >
            Login
          </a>
          <span className="nav-cta">
            <Button variant="gold" onClick={() => navigate('/signup')}>
              Get Started
            </Button>
          </span>
          <button
            type="button"
            className="nav-toggle"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            style={{ background: 'none', border: 'none', color: '#fff', padding: '4px', cursor: 'pointer', alignItems: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>{menuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="nav-mobile" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '8px 16px 14px' }}>
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '10px 4px', color: '#e8e6e0', fontSize: '15px', fontWeight: 500 }}
            >
              {link.label}
            </a>
          ))}
          <a href="/login" onClick={goToLogin} style={{ display: 'block', padding: '10px 4px', color: '#fff', fontSize: '15px', fontWeight: 600 }}>
            Login
          </a>
          <a
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen(false);
              navigate('/signup');
            }}
            className="nav-mobile-cta"
            style={{ display: 'block', padding: '10px 4px', color: 'var(--gold)', fontSize: '15px', fontWeight: 700 }}
          >
            Get Started
          </a>
        </nav>
      )}
    </header>
  );
}
