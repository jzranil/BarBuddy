import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../common/Modal';
import FormField from '../common/FormField';

// Plan options match the plan names already used in the dummy transaction
// ledger, so a manually created invoice looks consistent with real ones.
const PLAN_OPTIONS = ['Package 1 – Day 1: Political Law, Commercial Law, and Tax Law ',
   'Package 2 – Day 2: Civil Law and Labor Law', 
   'Package 3 – Day 3: Criminal Law, Remedial Law, and Ethics', 
   'Package 4  - All Subjects'];

const VALID_OPTIONS = ['65 days',
   '45 days', 
   '14 days', 
   '7 days'];

const EMPTY_FORM = { customerEmail: '', plan: PLAN_OPTIONS[0], validation: VALID_OPTIONS[0], amount: '', dueDate: '', notes: '' };

export default function CreateInvoiceModal({ open, onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // BACKEND TODO: POST /api/admin/invoices with this form data, then
    // refresh the transaction ledger once the server confirms.
    setForm(EMPTY_FORM);
    onClose();
    navigate('/coming-soon', { state: { title: 'Create Manual Invoice', description: 'Generating and sending a manual invoice connects here once PayMongo billing is wired up.' } });
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Manual Invoice">
      <form onSubmit={handleSubmit}>
        <FormField label="Customer Email" type="email" name="customerEmail" value={form.customerEmail} onChange={handleChange} placeholder="name@example.com" required />
        <FormField label="Plan / Package" type="select" name="plan" value={form.plan} onChange={handleChange} options={PLAN_OPTIONS} required />
        <FormField label="Validation" type="select" name="validation" value={form.validation} onChange={handleChange} options={VALID_OPTIONS} required />
        <FormField label="Amount (₱)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0.00" required />
        <FormField label="Due Date" type="date" name="dueDate" value={form.dueDate} onChange={handleChange} required />
        <FormField label="Notes (optional)" type="textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Internal notes about this invoice..." />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={outlineButtonStyle}>Cancel</button>
          <button type="submit" style={navyButtonStyle}>Create Invoice</button>
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
