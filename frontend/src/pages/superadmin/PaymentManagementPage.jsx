import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import StatusPill from '../../components/superadmin/StatusPill';
import CreateInvoiceModal from '../../components/superadmin/CreateInvoiceModal';
import Pagination from '../../components/common/Pagination';
import { getZeroedPaymentSummary, DUMMY_TRANSACTIONS, TRANSACTION_DETAILS, TOTAL_TRANSACTIONS } from '../../data/superadmin';

// BACKEND TODO: fetch from the API instead of these zeroed/dummy helpers.
const summary = getZeroedPaymentSummary();

export default function PaymentManagementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once GET /api/admin/transactions supports search
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const requestedId = searchParams.get('txn');
  const selectedTxn = DUMMY_TRANSACTIONS.find((t) => t.id === requestedId) ?? DUMMY_TRANSACTIONS[0];
  const detail = TRANSACTION_DETAILS[selectedTxn.id]; // undefined for every transaction except the demo one

  const goComingSoon = (title, description) => navigate('/coming-soon', { state: { title, description } });

  const visibleTxns = DUMMY_TRANSACTIONS.filter(
    (t) => t.customer.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Payment Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '540px' }}>
            Administrative oversight of platform revenue, subscription lifecycle, and financial
            auditing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => goComingSoon('Audit Logs', 'Payment-specific audit logs connect here once the backend exists.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
            Audit Logs
          </button>
          <button onClick={() => setInvoiceModalOpen(true)} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Create Manual Invoice
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiTile icon="attach_money" label="TOTAL REVENUE (MTD)" value={`₱${summary.totalRevenueMtd}`} trendLabel={summary.revenueTrendLabel} />
        <KpiTile icon="schedule" label="PENDING INVOICES" value={summary.pendingInvoicesCount} trendLabel={summary.pendingInvoicesValueLabel} />
        <KpiTile icon="error" label="FAILED TRANSACTIONS" value={summary.failedTransactions} trendLabel={summary.failedTransactionsTrendLabel} />
        <KpiTile icon="credit_card" label="ACTIVE SUBSCRIPTIONS" value={summary.activeSubscriptions.toLocaleString()} trendLabel={summary.activeSubscriptionsTrendLabel} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Transaction ledger */}
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Transaction Ledger</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Live stream of all financial activity across the platform.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search TXN ID or User..."
                  style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '190px' }}
                />
              </div>
              <button onClick={() => goComingSoon('Filters', 'Filtering the ledger by status or plan connects once the backend exists.')} style={iconButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--navy)' }}>filter_list</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                  {['TXN ID', 'Customer & Plan', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTxns.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/superadmin/payment?txn=${t.id}`)}
                    style={{ borderTop: '1px solid var(--card-border)', cursor: 'pointer', background: t.id === selectedTxn.id ? 'var(--bg)' : 'transparent' }}
                  >
                    <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{t.id}</td>
                    <td style={{ padding: '14px 22px' }}>
                      <div style={{ fontWeight: 700 }}>{t.customer}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.plan}</div>
                    </td>
                    <td style={{ padding: '14px 22px', fontWeight: 700 }}>₱{t.amount.toLocaleString()}</td>
                    <td style={{ padding: '14px 22px' }}>
                      <StatusPill status={t.status} />
                    </td>
                    <td style={{ padding: '14px 22px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goComingSoon(t.id, 'Refund, dispute, and export actions connect here once the backend exists.');
                        }}
                        aria-label="More actions"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {visibleTxns.length} of {TOTAL_TRANSACTIONS.toLocaleString()} transactions
            </span>
            <Pagination pages={[1, 2, 3]} activePage={1} context="the transaction ledger" />
          </div>
        </div>

        {/* Transaction record detail */}
        <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ background: 'var(--navy)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ color: '#cfd3dc', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>TRANSACTION RECORD</span>
              <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '999px', padding: '3px 10px' }}>{selectedTxn.id}</span>
            </div>
            <div style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>₱{selectedTxn.amount.toLocaleString()}</div>
            <div style={{ color: '#cfd3dc', fontSize: '12px' }}>{detail?.dateLabel ?? 'Date pending'}</div>
          </div>

          <div style={{ background: '#fff', padding: '20px' }}>
            {detail ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: selectedTxn.status === 'Failed' ? '#fdecea' : '#e8f5e9', borderRadius: '8px', padding: '12px', marginBottom: '18px' }}>
                  <span className="material-symbols-outlined" style={{ color: selectedTxn.status === 'Failed' ? '#c0392b' : '#2e7d32' }}>
                    {selectedTxn.status === 'Failed' ? 'error' : 'check_circle'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{detail.statusLabel}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{detail.statusDetail}</div>
                  </div>
                </div>

                <DetailRow label="Customer" value={detail.customer} />
                <DetailRow label="Plan Type" value={detail.planType} />
                <DetailRow label="Invoice No." value={detail.invoiceNo} link />
                <DetailRow label="Payment ID" value={detail.paymentId} mono />

                <div style={{ display: 'flex', gap: '10px', margin: '20px 0 12px' }}>
                  <button onClick={() => goComingSoon('Receipt', 'Downloading a receipt PDF connects here once the backend exists.')} style={{ ...outlineButtonStyle, flex: 1, justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
                    Receipt
                  </button>
                  <button onClick={() => goComingSoon('Copy Payment ID', 'Copies the payment processor ID to your clipboard.')} style={{ ...outlineButtonStyle, flex: 1, justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                    Copy ID
                  </button>
                </div>
                <button onClick={() => goComingSoon('Subscription Profile', 'Opening the linked subscription profile connects here once the backend exists.')} style={{ ...navyButtonStyle, width: '100%', justifyContent: 'center', marginBottom: '16px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                  Open Subscription Profile
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => goComingSoon('Mark as Reviewed', 'Marking this transaction as reviewed connects here once the backend exists.')} style={{ ...outlineButtonStyle, flex: 1, justifyContent: 'center' }}>
                    Mark as Reviewed
                  </button>
                  <button onClick={() => goComingSoon('Resolve Issue', 'Opening a resolution workflow connects here once the backend exists.')} style={{ ...outlineButtonStyle, flex: 1, justifyContent: 'center' }}>
                    Resolve Issue
                  </button>
                </div>
              </>
            ) : (
              // BACKEND TODO: every transaction besides the demo one shows
              // its real detail here once GET /api/admin/transactions/{id} exists.
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Full transaction detail for {selectedTxn.customer} will load here once connected to
                the backend.
              </p>
            )}
          </div>
        </div>
      </div>

      <CreateInvoiceModal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} />
    </SuperAdminLayout>
  );
}

function DetailRow({ label, value, link, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--card-border)' }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: mono ? 'monospace' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {value}
        {link && <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>open_in_new</span>}
      </span>
    </div>
  );
}

const navyButtonStyle = {
  background: 'var(--navy)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const outlineButtonStyle = {
  background: '#fff',
  color: 'var(--navy)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const iconButtonStyle = {
  background: '#fff',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  width: '34px',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};
