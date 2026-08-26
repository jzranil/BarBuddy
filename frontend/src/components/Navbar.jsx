import { useNavigate } from 'react-router-dom';
import Button from './Button';

// links: [{ label, href }]  -- href can be an in-page anchor ("#pricing") or a route ("/")
export default function Navbar({ links }) {
  const navigate = useNavigate();

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
        }}
      >
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span
            style={{
              width: '30px',
              height: '30px',
              border: '1.5px solid var(--gold)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            B
          </span>
          <span
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '19px',
              color: '#fff',
            }}
          >
            BarBuddy
          </span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            style={{ color: '#fff', fontSize: '14px', fontWeight: 500 }}
          >
            Login
          </a>
          <Button variant="gold" onClick={() => navigate('/signup')}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
