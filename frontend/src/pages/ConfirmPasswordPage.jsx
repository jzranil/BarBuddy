import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';



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
    <div className="d-flex flex-column min-vh-100">

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
        <div className="w-100" style={{ maxWidth: '420px' }}>
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded-4 shadow-sm"
            style={{ border: '1px solid var(--card-border)' }}
          >
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center gap-2 mb-3">
                <span
                  className="d-flex align-items-center justify-content-center rounded-2 fw-bold"
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '1.5px solid var(--navy)',
                    fontFamily: 'Playfair Display, serif',
                    color: 'var(--navy)',
                  }}
                >
                  B
                </span>
                <span className="fw-bold fs-5" style={{ fontFamily: 'Playfair Display, serif' }}>
                  BarBuddy
                </span>
              </div>
              <h1 className="fs-4 mb-2">Enter your new password</h1>
              <p className="small text-muted mb-0">
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
              <p className="small mb-3" style={{ color: '#c0392b', marginTop: '-10px' }}>
                Password must be at least 8 characters.
              </p>
            )}
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="small mb-3" style={{ color: '#c0392b', marginTop: '-10px' }}>
                Passwords do not match.
              </p>
            )}

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={!valid}>
              Reset Password
            </Button>

            <p className="text-center small text-muted mt-4 mb-0">
              Remembered your password?{' '}
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="fw-bold text-decoration-none"
                style={{ color: 'var(--navy)' }}
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