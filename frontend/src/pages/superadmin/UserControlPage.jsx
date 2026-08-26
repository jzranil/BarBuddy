import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import Pagination from '../../components/common/Pagination';
import AddUserModal from '../../components/superadmin/AddUserModal';
import { getZeroedUserControlSummary, DUMMY_USERS, TOTAL_USERS } from '../../data/superadmin';

// BACKEND TODO: fetch from the API instead of these zeroed/dummy helpers.
const summary = getZeroedUserControlSummary();

// Only 4 statuses exist: Active, Pending, Inactive, Suspended.
const STATUS_DOT = {
  Active: '#2e7d32',
  Pending: '#b8860b',
  Inactive: 'var(--text-muted)',
  Suspended: '#c0392b',
};

export default function UserControlPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once GET /api/admin/users supports search
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

  const visibleUsers = DUMMY_USERS.filter(
    (u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goComingSoon = (title, description) => navigate('/coming-soon', { state: { title, description } });

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>User Role Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '560px' }}>
            Super Admin management console for cross-platform access control, role provisioning,
            and administrative audit trails.
          </p>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiTile icon="group" label="TOTAL USERS" value={summary.totalUsers.toLocaleString()} trendLabel="Active this month" />
        <KpiTile icon="shield" label="ADMINS" value={summary.adminsCount} trendLabel="Elevated privileges" />
        <KpiTile icon="lock" label="LOCKED ACCOUNTS" value={summary.lockedAccounts} trendLabel="Pending review" />
        <KpiTile icon="calendar_month" label="AVG. SESSION" value={summary.avgSessionLabel} trendLabel="System engagement" />
      </div>

      {/* Search / filter / actions row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              style={{ padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '220px' }}
            />
          </div>
          <button onClick={() => goComingSoon('Filters', 'Advanced user filtering connects once the backend exists.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>
            Filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => goComingSoon('Export CSV', 'Exporting the user list connects here once the backend exists.')} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_vert</span>
            Export CSV
          </button>
          <button onClick={() => setAddUserModalOpen(true)} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add New User
          </button>
        </div>
      </div>

      {/* Users table */}
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
              {visibleUsers.map((user) => (
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
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_DOT[user.status] }} />
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 22px' }}>
                    <button
                      onClick={() => goComingSoon(`Edit ${user.name}`, 'Editing this user\u2019s role, status, and details connects here once the backend exists.')}
                      aria-label={`Edit ${user.name}`}
                      style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--navy)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No users match "{searchTerm}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing {visibleUsers.length} of {TOTAL_USERS.toLocaleString()} users</span>
          <Pagination pages={[1, 2, 3, '...', 124]} activePage={1} context="the user list" />
        </div>
      </div>

      <AddUserModal open={addUserModalOpen} onClose={() => setAddUserModalOpen(false)} />
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
