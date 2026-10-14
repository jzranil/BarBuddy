import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { supabase } from '../lib/supabaseClient';


export const ROLE_ROUTES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': '/superadmin', // Super Admin
  '6642db37-fe3f-4c6f-8b82-427b381a9c69': '/lawyer',     // Lawyer
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': '/dashboard',  // Reviewee
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  
const handleSubmit = async (e) => {
  e.preventDefault();

  setLoading(true);
  setErrorMessage('');

  try {
    // 1. Authenticate using Supabase Auth.
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

    if (authError || !authData.session) {
      throw new Error(
        authError?.message || 'Invalid email or password.'
      );
    }

    // 2. Ask the Hono backend for the BarBuddy profile.
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/login`,
      {
        method: 'POST',
        headers: {
          Authorization:
            `Bearer ${authData.session.access_token}`,
        },
      }
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

    // 4. Redirect.
    navigate(destination, { replace: true });

  } catch (error) {
    setErrorMessage(
      error.message || 'Login failed.'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="d-flex flex-column min-vh-100 pt-4">

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
              <h1 className="fs-4 mb-2">Welcome Back!</h1>
              <p className="small text-muted mb-0">
                Continue your journey to the Philippine Bar.
              </p>
            </div>

            {/* Error / Lockout Banner */}
            {errorMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px' }}>
                {errorMessage}
              </div>
            )}

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