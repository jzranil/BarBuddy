// variant: "full" (landing page, multi-column) | "minimal" (login/signup pages)
export default function Footer({ variant = 'minimal' }) {
  if (variant === 'minimal') {
    return (
      <footer
        style={{
          borderTop: '1px solid var(--card-border)',
          padding: '18px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>© 2026 BarBuddy. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer style={{ background: 'var(--navy)', color: '#cfd3dc', padding: '48px 0 24px' }}>
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '32px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '19px',
              color: '#fff',
              marginBottom: '10px',
            }}
          >
            BarBuddy
          </div>
          <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
            Serious bar prep starts here.  <br />
            Daily bar questions. Real practice. Instant feedback.   <br />
            Built for future lawyers.
          </p>
        </div>

        <div>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '10px', fontSize: '13px' }}>
            Platform
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '8px', fontSize: '13px' }}>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </div>

        <div>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '10px', fontSize: '13px' }}>
            Support
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '8px', fontSize: '13px' }}>
            <li><a href="#faqs">FAQs</a></li>
            <li><a href="#bar-guide">Bar Exam Guide</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: '10px', fontSize: '13px' }}>
            Contact
          </div>
          <p style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
            barbuddysystem@gmail.com
          </p>
          <p style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span>
            Makati, Makati, Philippines, 1000
          </p>
        </div>
      </div>

      <div
        className="container"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '36px',
          paddingTop: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>© 2026 BarBuddy. Your Trusted Bar Exam Companion.</span>
        <div style={{ display: 'flex', gap: '18px' }}>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Use</a>
          <a href="/cookies">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
