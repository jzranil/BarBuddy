import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQs', href: '/#faqs' },
];

const CODE_LENGTH = 6;

export default function VerifyCodePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const inputsRef = useRef([]);

  const handleChange = (index, e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = value;
    setCode(next);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // No backend wired up yet — simulate the code being verified and
    // move straight to the "enter new password" step for this demo flow.
    // BACKEND TODO: POST /api/auth/verify-code with { code: code.join('') },
    // then land the user on this same confirmation step on success.
    navigate('/confirm-password');
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
              <h1 className="fs-4 mb-2">Verify Your Code</h1>
              <p className="small text-muted mb-0 lh-lg">
                Enter the 6-digit code we sent to your email address to continue resetting your
                password.
              </p>
            </div>

            <div className="d-flex justify-content-between gap-2 mb-4" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  required
                  className="form-control text-center fs-4 fw-bold p-0"
                  style={{
                    width: '48px',
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

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={!isComplete}>
              Verify Code
            </Button>

            <p className="text-center small text-muted mt-4 mb-0">
              Didn't receive a code?{' '}
              <a
                href="/forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/forgot-password');
                }}
                className="fw-bold text-decoration-none"
                style={{ color: 'var(--navy)' }}
              >
                Resend
              </a>
            </p>
          </form>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}