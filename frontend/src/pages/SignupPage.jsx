import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';


const APPLICATION_TYPES = ['New Applicant', 'Retaker', 'Refresher'];

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    lawSchool: '',
    applicationType: 'New Applicant',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    subscribeUpdates: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (form.password !== form.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          contactNumber: form.contactNumber,
          lawSchool: form.lawSchool,
          applicationType: form.applicationType,
          password: form.password,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned non-JSON response (${response.status} ${response.statusText}). Check if backend server is running.`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      setSuccessMessage('Account created successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 pt-4">

      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
        <div className="w-100" style={{ maxWidth: '720px' }}>
          <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded-4 shadow-sm"
            style={{ border: '1px solid var(--card-border)' }}
          >
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
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
              <h1 className="fs-4 mb-1">Create Your Account</h1>
              <p className="small text-muted mb-0">
                Start your journey to the Philippine Bar.
              </p>
            </div>

            {/* Status Feedback */}
            {errorMessage && (
              <div className="alert py-2 px-3 mb-3 small" style={{ background: '#fee2e2', color: '#991b1b', borderRadius: '6px', border: 'none' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="alert py-2 px-3 mb-3 small" style={{ background: '#dcfce7', color: '#166534', borderRadius: '6px', border: 'none' }}>
                {successMessage}
              </div>
            )}

            <div className="row g-0 gx-4">
              {/* Left Column */}
              <div className="col-md-6">
                <div className="row g-2">
                  <div className="col-6">
                    <FormInput
                      label="First Name"
                      icon="person"
                      name="firstName"
                      placeholder="First Name"
                      required
                      value={form.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-6">
                    <FormInput
                      label="Last Name"
                      icon="person"
                      name="lastName"
                      placeholder="Last Name"
                      required
                      value={form.lastName}
                      onChange={handleChange}
                    />
                  </div>
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
                  label="Contact Number"
                  icon="call"
                  name="contactNumber"
                  placeholder="+639"
                  required
                  value={form.contactNumber}
                  onChange={handleChange}
                />

                <FormInput
                  label="Law School"
                  icon="school"
                  name="lawSchool"
                  placeholder="San Beda"
                  required
                  value={form.lawSchool}
                  onChange={handleChange}
                />
              </div>

              {/* Right Column */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label
                    className="d-block fw-bold text-uppercase mb-2"
                    style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                  >
                    Bar Application <span style={{ color: 'var(--gold)' }}>*</span>
                  </label>
                  {APPLICATION_TYPES.map((type, idx) => (
                    <div className="form-check mb-1" key={type}>
                      <input
                        type="radio"
                        className="form-check-input"
                        id={`applicationType-${idx}`}
                        name="applicationType"
                        value={type}
                        checked={form.applicationType === type}
                        onChange={handleChange}
                        style={{ accentColor: 'var(--navy)' }}
                      />
                      <label
                        className="form-check-label small"
                        htmlFor={`applicationType-${idx}`}
                        style={{ color: 'var(--navy)' }}
                      >
                        {type}
                      </label>
                    </div>
                  ))}
                </div>

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
                />

                <FormInput
                  label="Confirm Password"
                  icon="lock"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  showToggle
                  onToggleVisibility={() => setShowConfirm((v) => !v)}
                />
              </div>
            </div>

            <div className="form-check align-items-start mb-2">
              <input
                type="checkbox"
                className="form-check-input mt-1"
                id="agreeTerms"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
                required
                style={{ accentColor: 'var(--navy)' }}
              />
              <label className="form-check-label small text-muted" htmlFor="agreeTerms">
                I agree to the{' '}
                <a href="#" className="fw-semibold text-decoration-none" style={{ color: 'var(--navy)' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="fw-semibold text-decoration-none" style={{ color: 'var(--navy)' }}>
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            <div className="form-check align-items-start mb-3">
              <input
                type="checkbox"
                className="form-check-input mt-1"
                id="subscribeUpdates"
                name="subscribeUpdates"
                checked={form.subscribeUpdates}
                onChange={handleChange}
                style={{ accentColor: 'var(--navy)' }}
              />
              <label className="form-check-label small text-muted" htmlFor="subscribeUpdates">
                Send me exam updates, legal news, and platform announcements.
              </label>
            </div>

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p className="text-center small text-muted mt-3 mb-0">
              Already have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="fw-bold text-decoration-none"
                style={{ color: 'var(--navy)' }}
              >
                Sign In
              </a>
            </p>
          </form>
        </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}