import { useEffect, useState } from 'react';
import SettingsSectionCard from '../../common/settings/SettingsSectionCard';
import { SkeletonList } from '../../common/Skeleton';
import { apiRequest } from '../../../lib/api';
import { downloadCsv } from '../../../lib/format';

// Super Admin "Manage database records" (paper use case): download any
// BarBuddy table as a CSV file. Secret columns are left out by the backend,
// and each export is written to the System Logs.
export default function DatabaseRecordsSection() {
  const [tables, setTables] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiRequest('/admin/export')
      .then((r) => setTables(r.tables))
      .catch((err) => setError(err.message));
  }, []);

  const download = async (table) => {
    setBusy(table.key);
    setNotice('');
    setError('');
    try {
      const result = await apiRequest(`/admin/export/${table.key}`);
      downloadCsv(result.filename, [result.columns, ...result.rows]);
      setNotice(
        result.truncated
          ? `${result.label}: downloaded the first ${result.rows.length.toLocaleString()} rows (export limit reached).`
          : `${result.label}: downloaded ${result.rows.length.toLocaleString()} row${result.rows.length === 1 ? '' : 's'}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <SettingsSectionCard
      id="database-records"
      icon="database"
      title="Database Records"
      description="Download BarBuddy's records as CSV files for reports, audits or backups. Passwords, tokens and other secrets are never included."
    >
      {error && <div className="alert alert-danger py-2 small">{error}</div>}
      {notice && <div className="alert alert-success py-2 small">{notice}</div>}
      {!tables && !error && <SkeletonList rows={5} />}
      {tables && (
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: '14px' }}>
            <thead>
              <tr>
                <th>Records</th>
                <th className="text-end" style={{ width: '110px' }}>Rows</th>
                <th className="text-end" style={{ width: '150px' }}>Export</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.key}>
                  <td>
                    <div className="fw-semibold" style={{ color: 'var(--navy)' }}>{table.label}</div>
                    <div className="small text-muted">{table.description}</div>
                  </td>
                  <td className="text-end text-muted">{table.rows === null ? '—' : table.rows.toLocaleString()}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => download(table)}
                      disabled={Boolean(busy) || table.rows === 0 || table.rows === null}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <span className="material-symbols-outlined align-middle me-1" style={{ fontSize: '18px' }}>download</span>
                      {busy === table.key ? 'Preparing…' : 'CSV'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SettingsSectionCard>
  );
}
