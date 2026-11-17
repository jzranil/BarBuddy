import { useState } from 'react';
import StatusPill from '../superadmin/StatusPill';
import PaymentDetailsModal from './PaymentDetailsModal';
import { SkeletonTableRows } from '../common/Skeleton';
import { formatDate, packageLabel, peso, STATUS_LABELS } from '../../lib/payments';

// Reviewee-facing version of the Superadmin "Transaction Ledger" table —
// same table styling and StatusPill, scoped to the authenticated reviewee's
// own payments (GET /api/payments/history).
export default function PaymentHistorySection({ payments, loading, error }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);

  const rows = payments || [];
  const hasAnyHistory = rows.length > 0;
  const term = searchTerm.trim().toLowerCase();
  const visibleTxns = rows.filter(
    (t) => !term || packageLabel(t.package).toLowerCase().includes(term) || String(t.reference).toLowerCase().includes(term)
  );

  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Payment History</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            View your previous subscription payments and transaction details.
          </p>
        </div>

        {hasAnyHistory && (
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>
              search
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reference or package..."
              aria-label="Search payments"
              style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '210px' }}
            />
          </div>
        )}
      </div>

      {error && <p role="alert" style={{ color: '#c0392b', fontSize: '13px', padding: '0 22px' }}>{error}</p>}

      {loading ? (
        <div style={{ padding: '0 22px 22px' }}>
          <SkeletonTableRows rows={3} cols={6} />
        </div>
      ) : !hasAnyHistory ? (
        <EmptyState />
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                  {['Reference', 'Date', 'Package', 'Amount', 'Method', 'Status', ''].map((h) => (
                    <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTxns.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px 22px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                      No transactions match your search.
                    </td>
                  </tr>
                ) : (
                  visibleTxns.map((t) => (
                    <tr key={t.paymentId} onClick={() => setSelectedTxn(t)} style={{ borderTop: '1px solid var(--card-border)', cursor: 'pointer' }}>
                      <td style={{ padding: '14px 22px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{t.reference}</td>
                      <td style={{ padding: '14px 22px', whiteSpace: 'nowrap' }}>{formatDate(t.paidAt || t.createdAt)}</td>
                      <td style={{ padding: '14px 22px', fontWeight: 700 }}>{packageLabel(t.package)}</td>
                      <td style={{ padding: '14px 22px', fontWeight: 700 }}>{peso(t.amount)}</td>
                      <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{t.method || '—'}</td>
                      <td style={{ padding: '14px 22px' }}>
                        <StatusPill status={STATUS_LABELS[t.status] || t.status} />
                      </td>
                      <td style={{ padding: '14px 22px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(t);
                          }}
                          aria-label="View payment details"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={{ padding: '16px 22px', borderTop: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {visibleTxns.length} of {rows.length} transactions
            </span>
          </div>
        </>
      )}

      <PaymentDetailsModal open={!!selectedTxn} onClose={() => setSelectedTxn(null)} transaction={selectedTxn} />
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 22px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--text-muted)' }}>receipt_long</span>
      <h4 style={{ fontSize: '15px', margin: '10px 0 4px' }}>No Payment History</h4>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
        You don't have any recorded payment transactions yet.
      </p>
    </div>
  );
}
