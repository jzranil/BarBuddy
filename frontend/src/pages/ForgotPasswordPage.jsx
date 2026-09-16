import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQs', href: '/#faqs' },
];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // No backend wired up yet — simulate the reset email being sent and
    // move straight to the "enter new password" step for this demo flow.
    // BACKEND TODO: POST /api/auth/forgot-password with { email }, then
    // land the user on this same confirmation step from the emailed link.
    navigate('/confirm-password');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar links={NAV_LINKS} />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '1.5px solid var(--navy)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 700,
                    color: 'var(--navy)',
                  }}
                >B</span>
                <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '19px' }}>
                  BarBuddy
                </span>
                  </div>
                  <h1 style={{ fontSize: '22px', marginBottom: '8px' }}>Forgot Password</h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                    Enter your email address, and we'll send you an email with instructions for how to reset your
                    password.
                  </p>
                </div>

                <FormInput
                  label="Email Address"
                  icon="mail"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Button type="submit" variant="navy" fullWidth icon="arrow_forward">
                  Send Instructions
                </Button>

                <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: 0 }}>
                  Remembered your password?{' '}
                  <a
                    href="/login"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/login');
                    }}
                    style={{ color: 'var(--navy)', fontWeight: 700 }}
                  >
                    Back to Login
                  </a>
                </p>
              </form>
            </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
