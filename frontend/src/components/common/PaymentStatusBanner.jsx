// Extracted from the Superadmin Payment Management page's "Transaction
// Record" panel so both the admin ledger and the reviewee Payment History
// modal render the same colored status banner.
export default function PaymentStatusBanner({ failed, label, detail }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: failed ? '#fdecea' : '#e8f5e9',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '18px',
      }}
    >
      <span className="material-symbols-outlined" style={{ color: failed ? '#c0392b' : '#2e7d32' }}>
        {failed ? 'error' : 'check_circle'}
      </span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '13px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{detail}</div>
      </div>
    </div>
  );
}
