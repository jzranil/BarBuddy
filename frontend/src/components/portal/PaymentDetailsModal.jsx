import Modal from '../common/Modal';
import Button from '../Button';
import DetailRow from '../common/DetailRow';
import PaymentStatusBanner from '../common/PaymentStatusBanner';
import { formatDate, packageLabel, peso } from '../../lib/payments';

const STATUS_TEXT = {
  paid: ['Payment Successful', (t) => (t.method ? `Paid via ${t.method}` : 'Paid through PayMongo')],
  pending: ['Waiting for Payment', () => 'The payment link is still open.'],
  expired: ['Payment Link Expired', () => 'The link was not paid within 10 minutes.'],
  cancelled: ['Payment Link Cancelled', () => 'You cancelled this payment link.'],
  failed: ['Payment Failed', () => 'The payment could not be started.'],
};

// Reviewee-facing version of the Superadmin "Transaction Record" panel —
// same visual language (navy amount header, status banner, detail rows) but
// shown as a modal, and limited to what a customer should see about their
// own payment (no internal processing notes or admin-only fields).
export default function PaymentDetailsModal({ open, onClose, transaction }) {
  if (!transaction) return null;
  const [label, detail] = STATUS_TEXT[transaction.status] || [transaction.status, () => ''];
  const payer = [transaction.payerName, transaction.payerEmail].filter(Boolean).join(' · ');

  return (
    <Modal open={open} onClose={onClose} title="Payment Details" width="440px">
      <div style={{ background: 'var(--navy-fill)', borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <span style={{ color: '#cfd3dc', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>TRANSACTION</span>
          <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '999px', padding: '3px 10px' }}>
            {transaction.reference}
          </span>
        </div>
        <div style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>
          {peso(transaction.amount)}
        </div>
        <div style={{ color: '#cfd3dc', fontSize: '12px' }}>{formatDate(transaction.paidAt || transaction.createdAt)}</div>
      </div>

      <PaymentStatusBanner failed={transaction.status !== 'paid' && transaction.status !== 'pending'} label={label} detail={detail(transaction)} />

      <DetailRow label="Subscription" value={packageLabel(transaction.package)} />
      <DetailRow label="Payment Method" value={transaction.method || '—'} />
      {payer && <DetailRow label="Paid By" value={payer} />}
      {transaction.receipt && <DetailRow label="Payment Reference" value={transaction.receipt} mono />}

      <div style={{ marginTop: '18px', display: 'grid', gap: '10px' }}>
        {transaction.status === 'pending' && transaction.payUrl && (
          <Button variant="navy" fullWidth icon="open_in_new" onClick={() => window.location.assign(transaction.payUrl)}>
            Open Payment Link
          </Button>
        )}
        <Button variant="outline" onClick={onClose} fullWidth>
          Close
        </Button>
      </div>
    </Modal>
  );
}
