import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { confirmForgotPassword, signOut } from '../lib/cognito';
import { validateNewPassword } from '../lib/validation';
import BrandLogo from '../components/BrandLogo';

// Last step of Forgot Password: Amazon Cognito checks the emailed code (from
// /verify-code) together with the new password
export default function ConfirmPasswordPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email || '';
  const code = state?.code || '';
  const hasSession = Boolean(email && code);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const passwordError = password ? validateNewPassword(password) : '';
  const valid = hasSession && password && !passwordError && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    setLoading(true);
    setErrorMessage('');

    try {
      await confirmForgotPassword(email, code, password);
    } catch (err) {
      setLoading(false);
      setErrorMessage(
        err.code === 'CodeMismatchException' || err.code === 'ExpiredCodeException'
          ? `${err.message} Go back to the code page to request a new one.`
          : err.message || 'Unable to reset your password.'
      );
      return;
    }

    await signOut();
    localStorage.removeItem('user');
    setLoading(false);
    setSuccessMessage('Your password has been reset. Redirecting to login...');
    setTimeout(() => navigate('/login'), 1500);
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
                <BrandLogo variant="full" height={92} />
              </div>
              <h1 className="fs-4 mb-2">Enter your new password</h1>
              <p className="small text-muted mb-0">
                Choose a strong, unique password for your account.
              </p>
            </div>

            {!hasSession && !successMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '6px' }}>
                Start from Forgot Password and enter the 6-digit code from your email first. To get a new code,{' '}
                <a
                  href="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                  className="fw-semibold"
                  style={{ color: '#92400e' }}
                >
                  start again
                </a>
                .
              </div>
            )}
            {errorMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '6px' }}>
                {successMessage}
              </div>
            )}

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

            {passwordError && (
              <p className="small mb-3" style={{ color: '#c0392b', marginTop: '-10px' }}>
                {passwordError}
              </p>
            )}
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="small mb-3" style={{ color: '#c0392b', marginTop: '-10px' }}>
                Passwords do not match.
              </p>
            )}

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={!valid || loading}>
              {loading ? 'Saving...' : 'Reset Password'}
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