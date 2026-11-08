import { useState } from 'react';
import Modal from '../Modal';
import FormField from '../FormField';
import Button from '../../Button';
import { apiRequest } from '../../../lib/api';

const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;

// File → base64 (without the "data:...;base64," prefix)
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('The screenshot could not be read.'));
    reader.readAsDataURL(file);
  });

export default function ReportProblemModal({ open, onClose, categories }) {
  const emptyForm = { category: categories[0], description: '' };
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | sending | sent

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const [errorText, setErrorText] = useState('');

  const handleFile = (e) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked && picked.size > MAX_SCREENSHOT_BYTES) {
      setErrorText('The screenshot must be 2 MB or smaller.');
      e.target.value = '';
      setFile(null);
      return;
    }
    setErrorText('');
    setFile(picked);
  };

  // Emailed to the BarBuddy team with the screenshot attached, and logged
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return;
    setStatus('sending');
    setErrorText('');
    try {
      const screenshot = file ? { name: file.name, type: file.type, data: await toBase64(file) } : undefined;
      await apiRequest('/support', { method: 'POST', body: { kind: 'problem', category: form.category, message: form.description, screenshot } });
      setStatus('sent');
    } catch (err) {
      setErrorText(err.message);
      setStatus('idle');
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setFile(null);
    setErrorText('');
    setStatus('idle');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Report a Problem">
      {status === 'sent' ? (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#2e7d32' }}>check_circle</span>
          <h3 style={{ fontSize: '16px', margin: '10px 0 6px' }}>Report Sent</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 18px' }}>
            Thanks for flagging this — the BarBuddy team will look into it.
          </p>
          <Button variant="navy" onClick={handleClose}>Close</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormField label="Problem Category" type="select" name="category" value={form.category} onChange={handleChange} options={categories} required />
          <FormField
            label="Description"
            type="textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What happened, and what did you expect to happen instead?"
            rows={4}
            required
          />

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}
            >
              Screenshot (optional)
            </label>
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleFile} style={{ fontSize: '13px' }} />
            {file && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Attached: {file.name}</div>}
          </div>

          {errorText && <p style={{ fontSize: '12px', color: '#c0392b', margin: '-4px 0 12px' }}>{errorText}</p>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="navy" disabled={status === 'sending'}>
              {status === 'sending' ? 'Submitting…' : 'Submit Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
