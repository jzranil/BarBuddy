// Extracted from the Superadmin Payment Management page's "Transaction
// Record" panel so both the admin ledger and the reviewee Payment History
// modal render detail rows identically.
export default function DetailRow({ label, value, link, mono }) {
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
