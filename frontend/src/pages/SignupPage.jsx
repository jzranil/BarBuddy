import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Features', href: '#' },
  { label: 'Pricing', href: '#' },
  { label: 'FAQs', href: '#' },
];

const APPLICATION_TYPES = ['New Applicant', 'Retaker', 'Refresher'];

export default function SignupPage({ onNavigateToLogin }) {
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
      if (onNavigateToLogin) {
        setTimeout(() => onNavigateToLogin(), 1500);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar links={NAV_LINKS} />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: '720px' }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    border: '1.5px solid var(--navy)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: 700,
                    color: 'var(--navy)',
                  }}
                >
                  B
                </span>
                <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '19px' }}>
                  BarBuddy
                </span>
              </div>
              <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Create Your Account</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Start your journey to the Philippine Bar.
              </p>
            </div>

            {/* Status Feedback */}
            {errorMessage && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', fontSize: '13px' }}>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div style={{ padding: '10px 14px', marginBottom: '16px', borderRadius: '6px', background: '#dcfce7', color: '#166534', fontSize: '13px' }}>
                {successMessage}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              {/* Left Column */}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormInput
                    label="First Name"
                    icon="person"
                    name="firstName"
                    placeholder="First Name"
                    required
                    value={form.firstName}
                    onChange={handleChange}
                  />
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
              <div>
                <div style={{ marginBottom: '18px' }}>
                  <label
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Bar Application <span style={{ color: 'var(--gold)' }}>*</span>
                  </label>
                  {APPLICATION_TYPES.map((type) => (
                    <label
                      key={type}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '6px', color: 'var(--navy)' }}
                    >
                      <input
                        type="radio"
                        name="applicationType"
                        value={type}
                        checked={form.applicationType === type}
                        onChange={handleChange}
                      />
                      {type}
                    </label>
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

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
              <input type="checkbox" name="agreeTerms" checked={form.agreeTerms} onChange={handleChange} required style={{ marginTop: '2px' }} />
              <span>
                I agree to the <a href="#" style={{ color: 'var(--navy)', fontWeight: 600 }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--navy)', fontWeight: 600 }}>Privacy Policy</a>.
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              <input type="checkbox" name="subscribeUpdates" checked={form.subscribeUpdates} onChange={handleChange} style={{ marginTop: '2px' }} />
              Send me exam updates, legal news, and platform announcements.
            </label>

            <Button type="submit" variant="navy" fullWidth icon="arrow_forward" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px', marginBottom: 0 }}>
              Already have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigateToLogin) onNavigateToLogin();
                }}
                style={{ color: 'var(--navy)', fontWeight: 700 }}
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