import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import BrandLogo from '../components/BrandLogo';
import { confirmSignUp, forgotPassword, resendSignUpCode } from '../lib/cognito';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQs', href: '/#faqs' },
];

const CODE_LENGTH = 6;

// The 6-digit code Amazon Cognito emails:
//   ?mode=signup&email=…  confirms a new account, then goes to login
//   ?mode=reset&email=…   continues to /confirm-password to set a new password
//                         (Cognito checks the code together with the new password)
export default function VerifyCodePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'reset';
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const inputsRef = useRef([]);

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (errorMessage) setErrorMessage('');

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    const lastIndex = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputsRef.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = code.join('');

    if (mode === 'reset') {
      navigate('/confirm-password', { state: { email, code: value } });
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await confirmSignUp(email, value);
      setInfoMessage('Your email is confirmed. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');
    try {
      if (mode === 'signup') await resendSignUpCode(email);
      else await forgotPassword(email);
      setCode(Array(CODE_LENGTH).fill(''));
      setInfoMessage(`A new code was sent to ${email}.`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = code.every((digit) => digit !== '');

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar links={NAV_LINKS} />

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
              <h1 className="fs-4 mb-2">{mode === 'signup' ? 'Confirm Your Email' : 'Verify Your Code'}</h1>
              <p className="small text-muted mb-0 lh-lg">
                Enter the 6-digit code we sent to {email ? <strong>{email}</strong> : 'your email address'}{' '}
                {mode === 'signup' ? 'to activate your BarBuddy account.' : 'to continue resetting your password.'}
              </p>
            </div>

            {!email && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: '6px' }}>
                Open this page from {mode === 'signup' ? 'the sign-up form' : 'Forgot Password'} so we know which account the code is for.
              </div>
            )}
            {errorMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px' }}>
                {errorMessage}
              </div>
            )}
            {infoMessage && (
              <div className="alert py-2 px-3 mb-4 small text-center" style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', borderRadius: '6px' }}>
                {infoMessage}
              </div>
            )}

            <div className="d-flex justify-content-between gap-2 mb-4" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  aria-label={`Digit ${index + 1}`}
                  maxLength={1}
                  required
                  className="form-control text-center fs-4 fw-bold p-0"
                  style={{
                    width: '48px',
                    minWidth: 0,
                    flex: '0 1 48px',
                    height: '56px',
                    borderColor: 'var(--card-border)',
                    color: 'var(--navy)',
                  }}
                  value={digit}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={!isComplete || !email || loading}>
              {loading ? 'Checking...' : mode === 'signup' ? 'Confirm Email' : 'Verify Code'}
            </Button>

            <p className="text-center small text-muted mt-4 mb-0">
              Didn't receive a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={!email || loading}
                className="btn btn-link p-0 small fw-bold text-decoration-none align-baseline"
                style={{ color: 'var(--navy)' }}
              >
                Resend
              </button>
            </p>
          </form>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}
