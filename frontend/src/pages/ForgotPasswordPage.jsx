import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { forgotPassword } from '../lib/cognito';
import BrandLogo from '../components/BrandLogo';



export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Amazon Cognito emails a 6-digit code; the code page comes next.
    // Accounts from before Cognito are moved over by the user migration trigger.
    try {
      await forgotPassword(email);
      navigate(`/verify-code?mode=reset&email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      // Unknown emails are not revealed (same message as a real account)
      if (err.code === 'UserNotFoundException') {
        setSuccessMessage(`If an account exists for ${email.trim()}, we've sent a code to reset your password.`);
      } else {
        setErrorMessage(err.message || 'Unable to send reset instructions.');
      }
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
                <BrandLogo variant="full" height={92} />
              </div>
              <h1 className="fs-4 mb-2">Forgot Password</h1>
              <p className="small text-muted mb-0 lh-lg">
                Enter your email address, and we'll email you a 6-digit code to reset your password.
              </p>
            </div>

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
              label="Email Address"
              icon="mail"
              type="email"
              name="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={loading}>
              {loading ? 'Sending...' : 'Send Instructions'}
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