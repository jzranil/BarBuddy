import { useState } from 'react';
import FormInput from '../../FormInput';
import Button from '../../Button';

const EMPTY = { current: '', next: '', confirm: '' };

export default function ChangePasswordCard() {
  const [form, setForm] = useState(EMPTY);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [updated, setUpdated] = useState(false);

  const checks = {
    length: form.next.length >= 8,
    mixed: /[A-Z]/.test(form.next) && /[0-9]/.test(form.next),
    match: form.next.length > 0 && form.next === form.confirm,
  };
  const valid = checks.length && checks.mixed && checks.match && form.current.length > 0;

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setUpdated(false);
  };

  const toggleVisible = (field) => () => setVisible((v) => ({ ...v, [field]: !v[field] }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    // BACKEND TODO: POST /api/reviewee/change-password with { current, next }.
    // Never log or persist the raw password client-side beyond this form state.
    setForm(EMPTY);
    setUpdated(true);
  };

  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Change Password</h3>

      <form onSubmit={handleSubmit}>
        <FormInput
          label="Current Password"
          name="current-password"
          type={visible.current ? 'text' : 'password'}
          value={form.current}
          onChange={handleChange('current')}
          showToggle
          onToggleVisibility={toggleVisible('current')}
          required
        />
        <FormInput
          label="New Password"
          name="new-password"
          type={visible.next ? 'text' : 'password'}
          value={form.next}
          onChange={handleChange('next')}
          showToggle
          onToggleVisibility={toggleVisible('next')}
          required
        />
        <FormInput
          label="Confirm New Password"
          name="confirm-password"
          type={visible.confirm ? 'text' : 'password'}
          value={form.confirm}
          onChange={handleChange('confirm')}
          showToggle
          onToggleVisibility={toggleVisible('confirm')}
          required
        />

        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Password requirements
          </div>
          <Requirement met={checks.length} label="At least 8 characters" />
          <Requirement met={checks.mixed} label="Contains an uppercase letter and a number" />
          <Requirement met={checks.match} label="New passwords match" />
        </div>

        {updated && (
          <div style={{ fontSize: '12px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
            Password updated
          </div>
        )}

        <Button type="submit" variant="navy" disabled={!valid}>Update Password</Button>
      </form>
    </div>
  );
}

function Requirement({ met, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: met ? '#2e7d32' : 'var(--text-muted)', marginBottom: '4px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{met ? 'check_circle' : 'radio_button_unchecked'}</span>
      {label}
    </div>
  );
}

const cardStyle = {
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
};

const cardTitleStyle = { fontSize: '15px', marginBottom: '16px' };
