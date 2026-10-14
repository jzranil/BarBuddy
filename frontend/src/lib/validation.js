// Field validation for the Login and Signup forms.
// Each validator returns an error message, or '' when the value is valid.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Letters (including ñ and accents), spaces, apostrophes, hyphens and periods
const NAME_PATTERN = /^[\p{L}][\p{L} .'-]*$/u;
// Philippine mobile number: 09XXXXXXXXX or +639XXXXXXXXX
const PH_MOBILE_PATTERN = /^(09|\+639)\d{9}$/;

export const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, label: 'At least 8 characters' },
  { test: (v) => /[A-Z]/.test(v), label: 'An uppercase letter' },
  { test: (v) => /[a-z]/.test(v), label: 'A lowercase letter' },
  { test: (v) => /\d/.test(v), label: 'A number' },
];

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return 'Email address is required.';
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return 'Enter a valid email address (e.g. name@example.com).';
  return '';
}

export function validateName(value, label) {
  const name = value.trim();
  if (!name) return `${label} is required.`;
  if (name.length < 2) return `${label} must be at least 2 characters.`;
  if (name.length > 50) return `${label} must be 50 characters or fewer.`;
  if (!NAME_PATTERN.test(name)) return `${label} can only contain letters, spaces, apostrophes, hyphens and periods.`;
  return '';
}

export function normalizeContactNumber(value) {
  return value.replace(/[\s()-]/g, '');
}

export function validateContactNumber(value) {
  const number = normalizeContactNumber(value);
  if (!number) return 'Contact number is required.';
  if (!PH_MOBILE_PATTERN.test(number)) return 'Enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).';
  return '';
}

export function validateLawSchool(value) {
  const school = value.trim();
  if (!school) return 'Law school is required.';
  if (school.length < 2) return 'Law school must be at least 2 characters.';
  if (school.length > 100) return 'Law school must be 100 characters or fewer.';
  if (!/\p{L}/u.test(school)) return 'Enter the name of your law school.';
  return '';
}

export function validateNewPassword(value) {
  if (!value) return 'Password is required.';
  if (value.length > 72) return 'Password must be 72 characters or fewer.';
  const missing = PASSWORD_RULES.filter((rule) => !rule.test(value));
  if (missing.length > 0) return `Password needs: ${missing.map((r) => r.label.toLowerCase()).join(', ')}.`;
  return '';
}

export function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export function validateLoginPassword(value) {
  if (!value) return 'Password is required.';
  return '';
}
