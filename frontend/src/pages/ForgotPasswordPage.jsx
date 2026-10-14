import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';



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
              <h1 className="fs-4 mb-2">Forgot Password</h1>
              <p className="small text-muted mb-0 lh-lg">
                Enter your email address, and we'll send you an email with instructions for how to
                reset your password.
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