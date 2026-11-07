import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import StatusPill from '../../components/superadmin/StatusPill';
import Pagination from '../../components/common/Pagination';
import DetailRow from '../../components/common/DetailRow';
import PaymentStatusBanner from '../../components/common/PaymentStatusBanner';
import { apiRequest } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { downloadCsv, formatDateTime } from '../../lib/format';
import { toastSuccess } from '../../lib/swal';
import { Skeleton, SkeletonTableRows } from '../../components/common/Skeleton';

const LIMIT = 10;
const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];
const STATUS_LABEL = { paid: 'Paid', pending: 'Pending', expired: 'Expired', cancelled: 'Cancelled', failed: 'Failed' };
const EMPTY_SUMMARY = { revenueThisMonth: 0, revenueLastMonth: 0, revenueTotal: 0, paidCount: 0, pendingCount: 0, pendingValue: 0, unsuccessfulThisMonth: 0, activeSubscriptions: 0 };

const peso = (amount) => `₱${Number(amount || 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

const BANNERS = {
  paid: (p) => ({ failed: false, label: 'Payment successful', detail: `Paid ${formatDateTime(p.paidAt)}${p.method ? ` via ${p.method}` : ''}. The package was activated.` }),
  pending: (p) => ({ failed: false, label: 'Waiting for payment', detail: `The PayMongo checkout link is open until ${formatDateTime(p.expiresAt)}.` }),
  expired: () => ({ failed: true, label: 'Link expired', detail: 'The reviewee did not pay within the payment window. No money was taken.' }),
  cancelled: () => ({ failed: true, label: 'Cancelled', detail: 'The reviewee withdrew this payment link. No money was taken.' }),
  failed: () => ({ failed: true, label: 'Payment failed', detail: 'PayMongo did not complete this payment. No money was taken.' }),
};

// Payment Management (UAT, Super Admin: monitor subscription transactions and
// manage subscription records). Every PayMongo checkout BarBuddy created.
export default function PaymentManagementPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (query) params.set('search', query);
  if (status) params.set('status', status);
  const { data, error, reload } = useApi(`/admin/payments?${params}`);

  const loading = !data && !error;
  const summary = data?.summary ?? EMPTY_SUMMARY;
  const payments = data?.payments ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT));
  const selected = payments.find((p) => p.paymentId === selectedId) ?? payments[0];

  const revenueTrend = summary.revenueLastMonth
    ? `${summary.revenueThisMonth >= summary.revenueLastMonth ? '+' : ''}${Math.round(((summary.revenueThisMonth - summary.revenueLastMonth) / summary.revenueLastMonth) * 100)}% vs last month (${peso(summary.revenueLastMonth)})`
    : `${peso(summary.revenueTotal)} all time • ${summary.paidCount} paid`;

  const copy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(value);
      toastSuccess(`${label} copied.`);
    } catch {
      setExportError(`Could not copy the ${label.toLowerCase()}.`);
    }
  };

  // CSV of every payment matching the current filters, all pages
  const exportCsv = async () => {
    setExporting(true);
    setExportError('');
    try {
      const rows = [];
      for (let p = 1; p <= 50; p += 1) {
        const all = new URLSearchParams(params);
        all.set('page', String(p));
        all.set('limit', '50');
        const result = await apiRequest(`/admin/payments?${all}`);
        rows.push(...result.payments);
        if (rows.length >= result.total || result.payments.length === 0) break;
      }
      downloadCsv(`barbuddy-payments-${new Date().toISOString().slice(0, 10)}.csv`, [
        ['Reference', 'Created', 'Paid', 'Status', 'Reviewee', 'Reviewee Email', 'Package', 'Amount (PHP)', 'Method', 'PayMongo Payment ID', 'Payer Name', 'Payer Email'],
        ...rows.map((p) => [p.reference, formatDateTime(p.createdAt), p.paidAt ? formatDateTime(p.paidAt) : '', STATUS_LABEL[p.status] ?? p.status, p.reviewee, p.revieweeEmail ?? '', p.package?.name ?? '', p.amount, p.method ?? '', p.receipt ?? '', p.payerName ?? '', p.payerEmail ?? '']),
      ]);
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const banner = selected ? (BANNERS[selected.status] ?? BANNERS.failed)(selected) : null;

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Payment Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '540px' }}>
            Subscription payments made through PayMongo: revenue, open checkout links and every transaction record.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/superadmin/system-logs?service=payment')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
            Audit Logs
          </button>
          <button onClick={exportCsv} disabled={exporting || loading} style={{ ...navyButtonStyle, opacity: exporting || loading ? 0.7 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiTile icon="attach_money" label="REVENUE THIS MONTH" value={peso(summary.revenueThisMonth)} trendLabel={revenueTrend} loading={loading} />
        <KpiTile icon="schedule" label="OPEN PAYMENT LINKS" value={summary.pendingCount} trendLabel={`${peso(summary.pendingValue)} waiting to be paid`} loading={loading} />
        <KpiTile icon="error" label="UNSUCCESSFUL THIS MONTH" value={summary.unsuccessfulThisMonth} trendLabel="Expired, cancelled or failed" trendPositive={!summary.unsuccessfulThisMonth} loading={loading} />
        <KpiTile icon="credit_card" label="ACTIVE SUBSCRIPTIONS" value={summary.activeSubscriptions.toLocaleString()} trendLabel="Reviewees with a package today" loading={loading} />
      </div>

      {(error || exportError) && <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '14px' }}>{error || exportError}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Transaction ledger */}
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Transaction Ledger</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Newest first. Click a row for its full record.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Reference, name or email..."
                  aria-label="Search payments"
                  style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '210px' }}
                />
              </div>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by status"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button onClick={reload} aria-label="Refresh" style={iconButtonStyle}>
                <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--navy)' }}>refresh</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                  {['Reference', 'Reviewee & Package', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && <SkeletonTableRows rows={5} cols={5} />}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {query || status ? 'No payments match these filters.' : 'No payments yet.'}
                    </td>
                  </tr>
                )}
                {payments.map((p) => (
                  <tr
                    key={p.paymentId}
                    onClick={() => setSelectedId(p.paymentId)}
                    style={{ borderTop: '1px solid var(--card-border)', cursor: 'pointer', background: p.paymentId === selected?.paymentId ? 'var(--bg)' : 'transparent' }}
                  >
                    <td style={{ padding: '14px 22px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>{p.reference}</td>
                    <td style={{ padding: '14px 22px' }}>
                      <div style={{ fontWeight: 700 }}>{p.reviewee}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.package ? `${p.package.name} • ${p.package.tagline}` : 'Package removed'}</div>
                    </td>
                    <td style={{ padding: '14px 22px', fontWeight: 700 }}>{peso(p.amount)}</td>
                    <td style={{ padding: '14px 22px' }}>
                      <StatusPill status={STATUS_LABEL[p.status] ?? 'Info'} />
                    </td>
                    <td style={{ padding: '14px 22px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(p.paidAt || p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
            {loading ? (
              <Skeleton width={180} height={12} />
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Showing {payments.length} of {(data?.total ?? 0).toLocaleString()} payments
              </span>
            )}
            <Pagination totalPages={totalPages} activePage={page} onPageChange={setPage} context="the transaction ledger" />
          </div>
        </div>

        {/* Transaction record detail */}
        <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ background: 'var(--navy)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
              <span style={{ color: '#cfd3dc', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>TRANSACTION RECORD</span>
              {loading ? (
                <Skeleton width={70} height={18} radius={999} style={{ opacity: 0.35 }} />
              ) : selected ? (
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '999px', padding: '3px 10px' }}>{selected.reference}</span>
              ) : null}
            </div>
            {loading ? (
              <div style={{ display: 'grid', gap: '8px', paddingTop: '4px' }}>
                <Skeleton width="45%" height={28} style={{ opacity: 0.35 }} />
                <Skeleton width="35%" height={12} style={{ opacity: 0.35 }} />
              </div>
            ) : (
              <>
                <div style={{ color: '#fff', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>{peso(selected?.amount ?? 0)}</div>
                <div style={{ color: '#cfd3dc', fontSize: '12px' }}>{selected ? `Created ${formatDateTime(selected.createdAt)}` : 'No payment selected'}</div>
              </>
            )}
          </div>

          <div style={{ background: '#fff', padding: '20px' }}>
            {loading ? (
              <div role="status" aria-label="Loading" style={{ display: 'grid', gap: '14px' }}>
                <Skeleton height={52} radius={10} />
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <Skeleton width="30%" height={12} />
                    <Skeleton width="40%" height={12} />
                  </div>
                ))}
              </div>
            ) : selected ? (
              <>
                <PaymentStatusBanner failed={banner.failed} label={banner.label} detail={banner.detail} />

                <DetailRow label="Reviewee" value={selected.reviewee} />
                {selected.revieweeEmail && <DetailRow label="Account Email" value={selected.revieweeEmail} />}
                <DetailRow label="Package" value={selected.package ? `${selected.package.name} (${selected.package.durationDays} days)` : '—'} />
                <DetailRow label="Method" value={selected.method || '—'} />
                {selected.payerName && <DetailRow label="Paid By" value={selected.payerName} />}
                {selected.payerEmail && <DetailRow label="Payer Email" value={selected.payerEmail} />}
                <DetailRow label="Reference" value={selected.reference} mono />
                <DetailRow label="PayMongo Payment ID" value={selected.receipt || '—'} mono />
                {selected.paidAt && <DetailRow label="Paid At" value={formatDateTime(selected.paidAt)} />}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                  <button onClick={() => copy('Reference', selected.reference)} style={{ ...outlineButtonStyle, flex: 1, justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                    Copy Reference
                  </button>
                  {selected.receipt && (
                    <button onClick={() => copy('PayMongo payment ID', selected.receipt)} style={{ ...outlineButtonStyle, flex: 1, justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>receipt_long</span>
                      Copy Payment ID
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '12px 0 0', lineHeight: 1.6 }}>
                  Refunds and payouts are handled in the PayMongo dashboard; search it with the PayMongo payment ID.
                </p>
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Select a payment to see its record.</p>
            )}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
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
