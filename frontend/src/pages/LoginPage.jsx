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

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // No backend wired up yet — just redirect for now.
    navigate('/dashboard');
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
                >
                  B
                </span>
                <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '19px' }}>
                  BarBuddy
                </span>
              </div>
              <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Welcome Back</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Continue your journey to the Philippine Bar.
              </p>
            </div>

            <FormInput
              label="Email Address"
              icon="mail"
              type="email"
              name="email"
              placeholder="name@example.com"
              required
              value={form.email}
              onChange={handleChange}
            />

            <FormInput
              label="Password"
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={handleChange}
              showToggle
              onToggleVisibility={() => setShowPassword((v) => !v)}
              trailing={
                <a
                  href="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                  style={{ fontSize: '12px', color: 'var(--navy)', fontWeight: 600 }}
                >
                  Forgot password?
                </a>
              }
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <input type="checkbox" />
              Remember me for 30 days
            </label>

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward">
              Login to Dashboard
            </Button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '22px 0', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
              Or continue with
              <div style={{ flex: 1, height: '1px', background: 'var(--card-border)' }} />
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => navigate('/dashboard')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
              Google
            </Button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '22px', marginBottom: 0 }}>
              Don't have an account?{' '}
              <a
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
                style={{ color: 'var(--navy)', fontWeight: 700 }}
              >
                Get Started
              </a>
            </p>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '20px' }}>
            “Success in the Bar Examinations is not handed out. It is forged. It is #SuccessAchievedthroughMerit … No shortcuts. No substitutes. No free passes. Only merit.”

            — Samuel H. Gaerlan, Chairperson, 2026 Bar Examinations          </p>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
