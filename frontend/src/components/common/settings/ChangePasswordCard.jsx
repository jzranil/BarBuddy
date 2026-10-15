import { useState } from 'react';
import FormInput from '../../FormInput';
import Button from '../../Button';
import { supabase } from '../../../lib/supabaseClient';
import { confirmAction } from '../../../lib/swal';

const EMPTY = { current: '', next: '', confirm: '' };

export default function ChangePasswordCard() {
  const [form, setForm] = useState(EMPTY);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const checks = {
    length: form.next.length >= 8,
    mixed: /[A-Z]/.test(form.next) && /[a-z]/.test(form.next) && /[0-9]/.test(form.next),
    match: form.next.length > 0 && form.next === form.confirm,
  };
  const valid = checks.length && checks.mixed && checks.match && form.current.length > 0;

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setUpdated(false);
  };

  const toggleVisible = (field) => () => setVisible((v) => ({ ...v, [field]: !v[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    if (!(await confirmAction({ title: 'Change your password?', text: 'Use your new password the next time you sign in.', confirmText: 'Yes, change it' }))) return;
    setError('');
    setSaving(true);

    try {
      // Confirm the current password, then save the new one with Supabase Auth.
      // Passwords are never stored or logged by BarBuddy.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Your session has expired. Please log in again.');

      const { error: wrongPassword } = await supabase.auth.signInWithPassword({ email: user.email, password: form.current });
      if (wrongPassword) throw new Error('Your current password is incorrect.');

      if (form.current === form.next) throw new Error('Choose a password different from your current one.');

      const { error: updateError } = await supabase.auth.updateUser({ password: form.next });
      if (updateError) throw updateError;

      setForm(EMPTY);
      setUpdated(true);
    } catch (err) {
      setError(err.message || 'Unable to change your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={cardStyle}>
      <h3 style={cardTitleStyle}>Change Password</h3>

      <form onSubmit={handleSubmit}>
        {error && <p role="alert" style={{ color: '#c0392b', fontSize: '13px', marginTop: 0 }}>{error}</p>}
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
          <Requirement met={checks.mixed} label="Contains uppercase, lowercase and a number" />
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
