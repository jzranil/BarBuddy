import { useState } from 'react';
import Modal from '../Modal';
import FormField from '../FormField';
import Button from '../../Button';

export default function ContactSupportModal({ open, onClose, categories }) {
  const emptyForm = { subject: '', category: categories[0], message: '' };
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setStatus('sending');
    // BACKEND TODO: POST /api/support/tickets with `form`.
    // No backend yet — simulate submission so the flow can be reviewed.
    setTimeout(() => setStatus('sent'), 500);
  };

  const handleClose = () => {
    setForm(emptyForm);
    setStatus('idle');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Contact Support">
      {status === 'sent' ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#2e7d32' }}>check_circle</span>
          <h3 style={{ fontSize: '16px', margin: '10px 0 6px' }}>Request Submitted</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 18px' }}>
            The BarBuddy team will get back to you by email.
          </p>
          <Button variant="navy" onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormField label="Category" type="select" name="category" value={form.category} onChange={handleChange} options={categories} required />
          <FormField label="Subject" name="subject" value={form.subject} onChange={handleChange} placeholder="Briefly describe your request" required />
          <FormField label="Message" type="textarea" name="message" value={form.message} onChange={handleChange} placeholder="Tell us more about what you need help with" rows={4} required />

          {status === 'error' && (
            <p style={{ fontSize: '12px', color: '#c0392b', marginTop: '-8px', marginBottom: '12px' }}>
              Something went wrong sending your request. Please try again.
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="navy" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Submit Request'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
