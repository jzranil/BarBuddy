import Modal from '../common/Modal';
import Button from '../Button';
import DetailRow from '../common/DetailRow';
import PaymentStatusBanner from '../common/PaymentStatusBanner';
import { REVIEWEE_TRANSACTION_DETAILS } from '../../data/reviewee-payments';

// Reviewee-facing version of the Superadmin "Transaction Record" panel —
// same visual language (navy amount header, status banner, detail rows) but
// shown as a modal, and limited to what a customer should see about their
// own payment (no internal processing notes or admin-only fields).
export default function PaymentDetailsModal({ open, onClose, transaction }) {
  if (!transaction) return null;
  const detail = REVIEWEE_TRANSACTION_DETAILS[transaction.id];

  return (
    <Modal open={open} onClose={onClose} title="Payment Details" width="440px">
      <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-md)', padding: '16px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <span style={{ color: '#cfd3dc', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>TRANSACTION</span>
          <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '999px', padding: '3px 10px' }}>
            {transaction.id}
          </span>
        </div>
        <div style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>
          ₱{transaction.amount.toLocaleString()}
        </div>
        <div style={{ color: '#cfd3dc', fontSize: '12px' }}>{transaction.dateLabel}</div>
      </div>

      {detail && (
        <PaymentStatusBanner failed={transaction.status === 'Failed'} label={detail.statusLabel} detail={detail.statusDetail} />
      )}

      <DetailRow label="Subscription" value={transaction.package} />
      <DetailRow label="Payment Method" value={transaction.method} />
      {detail && <DetailRow label="Payment Reference" value={detail.paymentReference} mono />}

      <div style={{ marginTop: '18px' }}>
        <Button variant="outline" onClick={onClose} fullWidth>
          Close
        </Button>
      </div>
    </Modal>
  );
}
