import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { supabase } from '../lib/supabaseClient';
import { validateEmail, validateLoginPassword } from '../lib/validation';
import BrandLogo from '../components/BrandLogo';


export const ROLE_ROUTES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': '/superadmin', // Super Admin
  '6642db37-fe3f-4c6f-8b82-427b381a9c69': '/lawyer',     // Lawyer
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': '/dashboard',  // Reviewee
};

// Fails a slow request instead of leaving the button on "Logging in..."
const withTimeout = (promise, ms = 20000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms)),
  ]);

const NETWORK_MESSAGE =
  "Can't reach BarBuddy's sign-in service. Check your internet connection (or try another network), then log in again.";
const isNetworkError = (err) =>
  err?.message === 'NETWORK_TIMEOUT' || err?.name === 'AuthRetryableFetchError' || /failed to fetch|network|load failed/i.test(err?.message || '');

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Supabase sends people back here with #error=... when an email link
  // expired or was already used (e.g. a confirmation link opened twice).
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (!hash.get('error')) return;
    const expired = /expired|invalid/i.test(hash.get('error_description') || '') || hash.get('error_code') === 'otp_expired';
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    Promise.resolve().then(() =>
      setInfoMessage(
        expired
          ? 'That email link has expired or was already used. If you already confirmed your email, just log in below.'
          : 'That email link could not be used. Please log in, or request a new link.'
      )
    );
  }, []);

  const validators = {
    email: validateEmail,
    password: validateLoginPassword,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errorMessage) setErrorMessage('');
    // Re-check a field as soon as it is corrected
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: validators[name](value) });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value) setFieldErrors({ ...fieldErrors, [name]: validators[name](value) });
  };


const handleSubmit = async (e) => {
  e.preventDefault();

  const errors = {
    email: validateEmail(form.email),
    password: validateLoginPassword(form.password),
  };

  setFieldErrors(errors);

  if (errors.email || errors.password) {
    return;
  }

  setLoading(true);
  setErrorMessage('');
  setInfoMessage('');
  setUnconfirmedEmail('');

  try {
    // 1. Authenticate using Supabase Auth.
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
    );
    if (isNetworkError(authError)) throw new Error('NETWORK_TIMEOUT');

    if (authError?.code === 'email_not_confirmed') {
      setUnconfirmedEmail(form.email.trim());
      throw new Error(
        'Please confirm your email first. Check your inbox for the BarBuddy confirmation link.'
      );
    }

    if (authError || !authData.session) {
      throw new Error(
        authError?.code === 'invalid_credentials'
          ? 'Invalid email or password.'
          : authError?.message || 'Invalid email or password.'
      );
    }

    // 2. Ask the Hono backend for the BarBuddy profile.
    const response = await withTimeout(
      fetch(
        `${import.meta.env.VITE_API_URL}/api/login`,
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${authData.session.access_token}`,
          },
        }
      )
    );

    const result = await response.json();

    if (!response.ok) {
      await supabase.auth.signOut();

      throw new Error(
        result.error || 'Unable to verify account.'
      );
    }

    // 3. Determine the user's dashboard.
    const destination =
      ROLE_ROUTES[result.user.user_permission_id];

    if (!destination) {
      await supabase.auth.signOut();

      throw new Error(
        'No dashboard is assigned to this account.'
      );
    }

    // 4. Save the session the dashboards check for.
    localStorage.setItem(
      'user',
      JSON.stringify({
        uid: result.user.user_id,
        pid: result.user.user_permission_id,
      })
    );

    // 5. Redirect.
    navigate(destination, { replace: true });

  } catch (error) {
    setErrorMessage(
      isNetworkError(error) ? NETWORK_MESSAGE : error.message || 'Login failed.'
    );
  } finally {
    setLoading(false);
  }
};

const handleResendConfirmation = async () => {
  setLoading(true);

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: unconfirmedEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });

  setLoading(false);

  if (error) {
    setErrorMessage(error.message);
    return;
  }

  setUnconfirmedEmail('');
  setErrorMessage('');
  setInfoMessage(`A new confirmation email was sent to ${unconfirmedEmail}.`);
};

  return (
    <div className="d-flex flex-column min-vh-100 pt-4">

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
        <div className="w-100" style={{ maxWidth: '420px' }}>
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white p-4 rounded-4 shadow-sm"
            style={{ border: '1px solid var(--card-border)' }}
          >
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center gap-2 mb-3">
                <BrandLogo variant="full" height={92} />
              </div>
              <h1 className="fs-4 mb-2">Welcome Back!</h1>
              <p className="small text-muted mb-0">
                Continue your journey to the Philippine Bar.
              </p>
            </div>

            {/* Error / Lockout Banner */}
            {errorMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px' }}>
                {errorMessage}
                {unconfirmedEmail && (
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn btn-link p-0 small fw-semibold"
                      style={{ color: '#991b1b' }}
                      onClick={handleResendConfirmation}
                      disabled={loading}
                    >
                      Resend confirmation email
                    </button>
                  </div>
                )}
              </div>
            )}

            {infoMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '6px' }}>
                {infoMessage}
              </div>
            )}

            <FormInput
              label="Email Address"
              icon="mail"
              type="email"
              name="email"
              placeholder="name@example.com"
              required
              autoComplete="email"
              maxLength={254}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={fieldErrors.email}
            />

            <FormInput
              label="Password"
              icon="lock"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={fieldErrors.password}
              showToggle
              onToggleVisibility={() => setShowPassword((v) => !v)}
              trailing={
                <a
                  href="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                  className="fw-semibold text-decoration-none"
                  style={{ fontSize: '12px', color: 'var(--navy)' }}
                >
                  Forgot password?
                </a>
              }
            />

            <label className="d-flex align-items-center gap-2 small text-muted mb-3">
              <input type="checkbox" className="form-check-input mt-0" />
              Remember me
            </label>

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={loading}>
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </Button>

            {/* <div className="d-flex align-items-center gap-2 text-muted text-uppercase my-4" style={{ fontSize: '11px' }}>
              <div className="flex-grow-1" style={{ height: '1px', background: 'var(--card-border)' }} />
              Or continue with
              <div className="flex-grow-1" style={{ height: '1px', background: 'var(--card-border)' }} />
            </div>

            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => navigate('/dashboard')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_circle</span>
              Google
            </Button> */}

            <p className="text-center small text-muted mt-4 mb-0">
              Don't have an account?{' '}
              <a
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/signup');
                }}
                className="fw-bold text-decoration-none"
                style={{ color: 'var(--navy)' }}
              >
                Get Started
              </a>
            </p>
          </form>

          <p className="text-center fst-italic text-muted mt-3" style={{ fontSize: '12px' }}>
            “Success in the Bar Examinations is not handed out. It is forged. It is #SuccessAchievedthroughMerit … No shortcuts. No substitutes. No free passes. Only merit.”
            <br />
            — Samuel H. Gaerlan, Chairperson, 2026 Bar Examinations
          </p>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}