import { useState } from 'react';
import StatusPill from '../superadmin/StatusPill';
import Pagination from '../common/Pagination';
import PaymentDetailsModal from './PaymentDetailsModal';
import { REVIEWEE_TRANSACTIONS } from '../../data/reviewee-payments';

// Reviewee-facing version of the Superadmin "Transaction Ledger" table —
// same table styling, StatusPill, and Pagination component, scoped to only
// the currently authenticated reviewee's own transactions.
// BACKEND TODO: swap REVIEWEE_TRANSACTIONS for GET /api/reviewee/payment-history.
export default function PaymentHistorySection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTxn, setSelectedTxn] = useState(null);

  const hasAnyHistory = REVIEWEE_TRANSACTIONS.length > 0;

  const visibleTxns = REVIEWEE_TRANSACTIONS.filter(
    (t) => t.package.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase())
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
              placeholder="Search TXN ID or package..."
              style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '190px' }}
            />
          </div>
        )}
      </div>

      {!hasAnyHistory ? (
        <EmptyState />
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '640px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                  {['TXN ID', 'Date', 'Package', 'Amount', 'Method', 'Status', ''].map((h) => (
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
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTxn(t)}
                      style={{ borderTop: '1px solid var(--card-border)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{t.id}</td>
                      <td style={{ padding: '14px 22px' }}>{t.dateLabel}</td>
                      <td style={{ padding: '14px 22px', fontWeight: 700 }}>{t.package}</td>
                      <td style={{ padding: '14px 22px', fontWeight: 700 }}>₱{t.amount.toLocaleString()}</td>
                      <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{t.method}</td>
                      <td style={{ padding: '14px 22px' }}>
                        <StatusPill status={t.status} />
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {visibleTxns.length} of {REVIEWEE_TRANSACTIONS.length} transactions
            </span>
            <Pagination pages={[1]} activePage={1} context="your payment history" />
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
