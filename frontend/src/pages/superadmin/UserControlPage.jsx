import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import Pagination from '../../components/common/Pagination';
import AddUserModal from '../../components/superadmin/AddUserModal';

const API_BASE = '/api'; // Adjust base URL if using an absolute origin like 'http://localhost:3001/api'

const STATUS_DOT = {
  Active: '#2e7d32',
  Pending: '#b8860b',
  Inactive: 'var(--text-muted)',
  Suspended: '#c0392b',
};

export default function UserControlPage() {
  const navigate = useNavigate();

  // Data states
  const [summary, setSummary] = useState({
    totalUsers: 0,
    adminsCount: 0,
    lockedAccounts: 0,
    avgSessionLabel: '0m',
  });
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // UI/Control states
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

  const limit = 10;

  // 1. Fetch Summary Metrics
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/summary`);
      if (!res.ok) throw new Error('Failed to fetch KPI summary');
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Summary fetch error:', err);
    }
  }, []);

  // 2. Fetch Paginated & Filtered Users List
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        search: searchTerm,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`${API_BASE}/admin/users?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users list');

      const data = await res.json();
      setUsers(data.users || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('User list fetch error:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, limit]);

  // Initial Load & Debouncing Search
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce for search input

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleUserAdded = () => {
    setAddUserModalOpen(false);
    fetchSummary();
    fetchUsers();
  };

  const goComingSoon = (title, description) =>
    navigate('/coming-soon', { state: { title, description } });

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>User Role Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '560px' }}>
            Super Admin management console for cross-platform access control, role provisioning, and administrative audit trails.
          </p>
        </div>
      </div>

      {/* KPI Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiTile icon="group" label="TOTAL USERS" value={summary.totalUsers.toLocaleString()} trendLabel="Active this month" />
        <KpiTile icon="shield" label="ADMINS" value={summary.adminsCount} trendLabel="Elevated privileges" />
        <KpiTile icon="lock" label="LOCKED ACCOUNTS" value={summary.lockedAccounts} trendLabel="Pending review" />
        <KpiTile icon="calendar_month" label="AVG. SESSION" value={summary.avgSessionLabel} trendLabel="System engagement" />
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to page 1 on search
              }}
              placeholder="Search users..."
              style={{ padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '220px' }}
            />
          </div>
          <button onClick={() => goComingSoon('Filters', 'Advanced filtering functionality coming soon.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
            Filters
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => goComingSoon('Export CSV', 'CSV export functionality coming soon.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_vert</span>
            Export CSV
          </button>
          <button onClick={() => setAddUserModalOpen(true)} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add New User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Full Name', 'Role', 'Email Address', 'Joined Date', 'Last Activity', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#c0392b' }}>
                    {error}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users match "{searchTerm}".
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderTop: '1px solid var(--card-border)' }}>
                    <td style={{ padding: '14px 22px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy)' }}>person</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{user.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 22px' }}>{user.role}</td>
                    <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{user.email}</td>
                    <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>{user.joinedDate}</td>
                    <td style={{ padding: '14px 22px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_month</span>
                        {user.lastActivity}
                      </span>
                    </td>
                    <td style={{ padding: '14px 22px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_DOT[user.status] || STATUS_DOT.Inactive }} />
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 22px' }}>
                      <button
                        onClick={() => goComingSoon(`Edit ${user.name}`, 'User edit dialog coming soon.')}
                        aria-label={`Edit ${user.name}`}
                        style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--navy)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {users.length} of {totalCount.toLocaleString()} users
          </span>
          <Pagination
            totalPages={Math.ceil(totalCount / limit) || 1}
            activePage={page}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>

      <AddUserModal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        onSuccess={handleUserAdded}
      />
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