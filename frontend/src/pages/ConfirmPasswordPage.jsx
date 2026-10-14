import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { supabase } from '../lib/supabaseClient';



export default function ConfirmPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // The emailed reset link signs the user in with a temporary recovery
  // session (picked up from the URL by the Supabase client).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        setHasSession(true);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const valid = hasSession && password.length >= 8 && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    setLoading(true);
    setErrorMessage('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setErrorMessage(error.message || 'Unable to reset your password.');
      return;
    }

    await supabase.auth.signOut();
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

            {!hasSession && !successMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '6px' }}>
                Open this page from the password reset link in your email. If the link has expired,{' '}
                <a
                  href="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                  className="fw-semibold"
                  style={{ color: '#92400e' }}
                >
                  request a new one
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