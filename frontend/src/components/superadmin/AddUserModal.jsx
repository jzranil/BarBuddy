import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import { AVAILABLE_ROLES } from '../../data/superadmin';

const EMPTY_FORM = { fullName: '', email: '', role: AVAILABLE_ROLES[0], sendInvite: true };

export default function AddUserModal({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // BACKEND TODO: POST /api/admin/users — if sendInvite is true, this
    // should also trigger an AWS SES invite email with a Cognito sign-up link.
    setForm(EMPTY_FORM);
    onClose();
    navigate('/coming-soon', { state: { title: 'Add New User', description: 'Creating the user and sending an invite connects here once Cognito + SES are wired up.' } });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add New User">
      <form onSubmit={handleSubmit}>
        <FormField label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Juan Dela Cruz" required />
        <FormField label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="name@example.com" required />
        <FormField label="Role Assignment" type="select" name="role" value={form.role} onChange={handleChange} options={AVAILABLE_ROLES} required />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--navy)', marginBottom: '8px' }}>
          <input type="checkbox" name="sendInvite" checked={form.sendInvite} onChange={handleChange} />
          Send an email invite immediately
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="button" onClick={onClose} style={outlineButtonStyle}>Cancel</button>
          <button type="submit" style={navyButtonStyle}>Add User</button>
        </div>
      </form>
    </Modal>
  );
}

const navyButtonStyle = {
  background: 'var(--navy)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const outlineButtonStyle = {
  background: '#fff',
  color: 'var(--navy)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};
