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

export default function ConfirmPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const valid = password.length >= 8 && password === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    // No backend wired up yet — just redirect for now.
    // BACKEND TODO: POST /api/auth/reset-password with the reset token
    // (from the emailed link) and the new password, then redirect to login.
    navigate('/login');
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
                  <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Enter your new password</h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Choose a strong, unique password for your account.
                  </p>
                </div>

                <FormInput
                  label="Password"
                  icon="lock"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showToggle
                  onToggleVisibility={() => setShowPassword((v) => !v)}
                />

                <FormInput
                  label="Confirm Password"
                  icon="lock"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showToggle
                  onToggleVisibility={() => setShowConfirm((v) => !v)}
                />

                {password.length > 0 && password.length < 8 && (
                  <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '-10px', marginBottom: '16px' }}>
                    Password must be at least 8 characters.
                  </p>
                )}
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '-10px', marginBottom: '16px' }}>
                    Passwords do not match.
                  </p>
                )}

                <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={!valid}>
                  Reset Password
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
