import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { supabase } from '../lib/supabaseClient';
import BrandLogo from '../components/BrandLogo';
import LegalDocModal from '../components/common/legal/LegalDocModal';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../data/legal';
import {
  PASSWORD_RULES,
  normalizeContactNumber,
  validateConfirmPassword,
  validateContactNumber,
  validateEmail,
  validateLawSchool,
  validateName,
  validateNewPassword,
} from '../lib/validation';


const APPLICATION_TYPES = ['New Applicant', 'Retaker', 'Refresher'];

export default function SignupPage() {
  const navigate = useNavigate();
  // Invitation links: /signup?invite=1&email=...&first=...&last=...
  const [searchParams] = useSearchParams();
  const invited = searchParams.get('invite') === '1';
  const [form, setForm] = useState({
    firstName: searchParams.get('first') || '',
    lastName: searchParams.get('last') || '',
    email: searchParams.get('email') || '',
    contactNumber: '',
    lawSchool: '',
    applicationType: 'New Applicant',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    subscribeUpdates: true,
  });

  const [legalDoc, setLegalDoc] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // One validator per field; each gets the whole form (confirmPassword needs password)
  const validators = {
    firstName: (f) => validateName(f.firstName, 'First name'),
    lastName: (f) => validateName(f.lastName, 'Last name'),
    email: (f) => validateEmail(f.email),
    contactNumber: (f) => validateContactNumber(f.contactNumber),
    lawSchool: (f) => validateLawSchool(f.lawSchool),
    password: (f) => validateNewPassword(f.password),
    confirmPassword: (f) => validateConfirmPassword(f.password, f.confirmPassword),
    agreeTerms: (f) => (f.agreeTerms ? '' : 'You must accept the Terms of Service and Privacy Policy.'),
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const next = { ...form, [name]: type === 'checkbox' ? checked : value };
    setForm(next);
    if (errorMessage) setErrorMessage('');

    // Re-check fields that already show an error as the user fixes them
    const updates = {};
    if (fieldErrors[name] && validators[name]) updates[name] = validators[name](next);
    if (name === 'password' && fieldErrors.confirmPassword) updates.confirmPassword = validators.confirmPassword(next);
    if (Object.keys(updates).length) setFieldErrors({ ...fieldErrors, ...updates });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value && validators[name]) setFieldErrors({ ...fieldErrors, [name]: validators[name](form) });
  };

  const passwordChecks = PASSWORD_RULES.map((rule) => ({ label: rule.label, ok: rule.test(form.password) }));


const handleSubmit = async (e) => {
  e.preventDefault();

  setErrorMessage('');
  setSuccessMessage('');

  const errors = Object.fromEntries(
    Object.entries(validators).map(([field, validate]) => [field, validate(form)])
  );

  setFieldErrors(errors);

  const firstInvalid = Object.keys(errors).find((field) => errors[field]);

  if (firstInvalid) {
    setErrorMessage('Please fix the highlighted fields.');
    document.getElementById(firstInvalid)?.focus();
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo:
          `${window.location.origin}/login`,
        data: {
          first_name: form.firstName.trim().replace(/\s+/g, ' '),
          last_name: form.lastName.trim().replace(/\s+/g, ' '),
          contact_number: normalizeContactNumber(form.contactNumber),
          law_school: form.lawSchool.trim(),
          application_type: form.applicationType,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Registration could not be completed.');
    }

    // Supabase hides "email already registered" by returning a user with
    // no identities, so detect it here instead of showing a false success.
    if (data.user.identities?.length === 0) {
      throw new Error(
        'An account with this email already exists. Please log in or reset your password.'
      );
    }

    // Email confirmation turned off in Supabase: the account is usable right away.
    if (data.session) {
      await supabase.auth.signOut();
      setSuccessMessage('Account created successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    setSuccessMessage(
      `Almost done! We sent a confirmation link to ${form.email.trim()}. Open it to activate your BarBuddy account, then log in.`
    );

  } catch (err) {
    const friendly = {
      user_already_exists: 'An account with this email already exists. Please log in or reset your password.',
      weak_password: 'That password is too weak. Choose a longer password with letters and numbers.',
      over_email_send_rate_limit: 'Too many sign-up emails were sent. Please wait a few minutes and try again.',
      email_address_invalid: 'That email address cannot be used. Please use a different one.',
    };

    setErrorMessage(
      friendly[err.code] || err.message || 'Registration failed.'
    );
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
            noValidate
            className="bg-white p-4 rounded-4 shadow-sm"
            style={{ border: '1px solid var(--card-border)' }}
          >
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                <BrandLogo variant="full" height={84} />
              </div>
              <h1 className="fs-4 mb-1">{invited ? 'Accept Your Invitation' : 'Create Your Account'}</h1>
              <p className="small text-muted mb-0">
                {invited
                  ? 'You were invited to BarBuddy. Register with the invited email address so your role is applied.'
                  : 'Start your journey to the Philippine Bar.'}
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
                      autoComplete="given-name"
                      maxLength={50}
                      value={form.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.firstName}
                    />
                  </div>
                  <div className="col-6">
                    <FormInput
                      label="Last Name"
                      icon="person"
                      name="lastName"
                      placeholder="Last Name"
                      required
                      autoComplete="family-name"
                      maxLength={50}
                      value={form.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={fieldErrors.lastName}
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
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.email}
                />

                <FormInput
                  label="Contact Number"
                  icon="call"
                  name="contactNumber"
                  type="tel"
                  placeholder="09171234567"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={17}
                  value={form.contactNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.contactNumber}
                  hint="PH mobile: 09XXXXXXXXX or +639XXXXXXXXX"
                />

                <FormInput
                  label="Law School"
                  icon="school"
                  name="lawSchool"
                  placeholder="San Beda"
                  required
                  maxLength={100}
                  value={form.lawSchool}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.lawSchool}
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
                  autoComplete="new-password"
                  maxLength={72}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.password}
                  showToggle
                  onToggleVisibility={() => setShowPassword((v) => !v)}
                />

                {form.password && (
                  <ul aria-label="Password requirements" style={{ listStyle: 'none', padding: 0, margin: '-8px 0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 10px' }}>
                    {passwordChecks.map((check) => (
                      <li key={check.label} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: check.ok ? '#2e7d32' : 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{check.ok ? 'check_circle' : 'radio_button_unchecked'}</span>
                        {check.label}
                      </li>
                    ))}
                  </ul>
                )}

                <FormInput
                  label="Confirm Password"
                  icon="lock"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  maxLength={72}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={fieldErrors.confirmPassword}
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
                <button type="button" onClick={() => setLegalDoc(TERMS_OF_SERVICE)} className="fw-semibold p-0 border-0 bg-transparent" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" onClick={() => setLegalDoc(PRIVACY_POLICY)} className="fw-semibold p-0 border-0 bg-transparent" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>
                  Privacy Policy
                </button>
                .
              </label>
              {fieldErrors.agreeTerms && (
                <div role="alert" style={{ fontSize: '12px', color: '#c0392b', marginTop: '2px' }}>{fieldErrors.agreeTerms}</div>
              )}
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

      <LegalDocModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
      <Footer variant="minimal" />
    </div>
  );
}