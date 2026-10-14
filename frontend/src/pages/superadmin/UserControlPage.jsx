import { useEffect, useState } from 'react';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { downloadCsv, formatDate, timeAgo } from '../../lib/format';
import { validateEmail, validateName } from '../../lib/validation';

const STATUS_DOT = {
  ACTIVE: '#2e7d32',
  INACTIVE: 'var(--text-muted)',
  SUSPENDED: '#c0392b',
};
const STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const LIMIT = 10;
const titleCase = (s = '') => s.charAt(0) + s.slice(1).toLowerCase();

// User and role management (paper: Super Admin manages user roles with
// role-based access control).
export default function UserControlPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const params = new URLSearchParams({ search: query, page: String(page), limit: String(LIMIT) });
  if (role) params.set('role', role);
  const users = useApi(`/admin/users?${params}`);
  const summary = useApi('/admin/summary');
  const rows = users.data?.users ?? [];
  const roles = users.data?.roles ?? [];
  const total = users.data?.total ?? 0;
  const s = summary.data ?? { totalUsers: 0, adminsCount: 0, lockedAccounts: 0, newThisMonth: 0 };

  const refresh = (text) => {
    setNotice({ tone: 'success', text });
    users.reload();
    summary.reload();
  };

  const exportCsv = async () => {
    const all = [];
    for (let p = 1; ; p++) {
      const q = new URLSearchParams({ search: query, page: String(p), limit: '50' });
      if (role) q.set('role', role);
      const r = await apiRequest(`/admin/users?${q}`);
      all.push(...r.users);
      if (all.length >= r.total || r.users.length === 0) break;
    }
    downloadCsv(`barbuddy-users-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Activity'],
      ...all.map((u) => [u.name, u.email, u.role, u.status, formatDate(u.joinedDate), u.lastActivity ? formatDate(u.lastActivity) : '']),
    ]);
  };

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>User Role Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '560px' }}>
            Manage access for reviewees, Review Administrators and Super Admins. Every change is recorded in the system logs.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KpiTile icon="group" label="TOTAL USERS" value={s.totalUsers.toLocaleString()} trendLabel="All roles" />
        <KpiTile icon="shield" label="ADMINS & LAWYERS" value={s.adminsCount} trendLabel="Elevated privileges" />
        <KpiTile icon="lock" label="INACTIVE / SUSPENDED" value={s.lockedAccounts} trendLabel="Cannot sign in" />
        <KpiTile icon="person_add" label="NEW THIS MONTH" value={s.newThisMonth} trendLabel="Last 30 days" />
      </div>

      {notice && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', background: notice.tone === 'error' ? '#fdf0f0' : '#e8f5e9', color: notice.tone === 'error' ? '#9b1c1c' : '#2e7d32', border: `1px solid ${notice.tone === 'error' ? '#e5b8b8' : '#b7dfba'}` }}>
          {notice.text}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          <div style={{ position: 'relative', minWidth: 0, maxWidth: '100%' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              aria-label="Search users"
              style={{ padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '220px', maxWidth: '100%', background: '#fff', color: 'var(--navy)' }}
            />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by role"
            style={selectStyle}
          >
            <option value="">All roles</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => exportCsv().catch((err) => setNotice({ tone: 'error', text: err.message }))} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Export CSV
          </button>
          <button onClick={() => setInviteOpen(true)} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Invite User
          </button>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', textAlign: 'left' }}>
                {['Full Name', 'Role', 'Email Address', 'Joined Date', 'Last Activity', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 22px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!users.data && !users.error && <MessageRow text="Loading users..." />}
              {users.error && <MessageRow text={users.error} error />}
              {users.data && rows.length === 0 && <MessageRow text={query ? `No users match "${query}".` : 'No users found.'} />}
              {rows.map((user) => (
                <tr key={user.id} style={{ borderTop: '1px solid var(--card-border)', opacity: user.isArchived ? 0.55 : 1 }}>
                  <td style={cell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy)' }}>person</span>
                      </div>
                      <div style={{ fontWeight: 700 }}>{user.name}{user.isArchived ? ' (archived)' : ''}</div>
                    </div>
                  </td>
                  <td style={cell}>{user.role}</td>
                  <td style={{ ...cell, color: 'var(--text-muted)' }}>{user.email}</td>
                  <td style={{ ...cell, color: 'var(--text-muted)' }}>{formatDate(user.joinedDate)}</td>
                  <td style={{ ...cell, color: 'var(--text-muted)' }}>{user.lastActivity ? timeAgo(user.lastActivity) : 'Never'}</td>
                  <td style={cell}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_DOT[user.status] || STATUS_DOT.INACTIVE }} />
                      {titleCase(user.status)}
                    </span>
                  </td>
                  <td style={cell}>
                    <button
                      onClick={() => setEditing(user)}
                      aria-label={`Edit ${user.name}`}
                      style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--navy)' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing {rows.length} of {total.toLocaleString()} users</span>
          <Pagination totalPages={Math.ceil(total / LIMIT) || 1} activePage={page} onPageChange={setPage} />
        </div>
      </div>

      {inviteOpen && <InviteModal roles={roles} onClose={() => setInviteOpen(false)} onSaved={(t) => { setInviteOpen(false); refresh(t); }} />}
      {editing && <EditModal user={editing} roles={roles} onClose={() => setEditing(null)} onSaved={(t) => { setEditing(null); refresh(t); }} />}
    </SuperAdminLayout>
  );
}

function InviteModal({ roles, onClose, onSaved }) {
  const reviewee = roles.find((r) => /reviewee/i.test(r.name));
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', permissionId: reviewee?.id ?? '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateName(form.firstName, 'First name') || validateName(form.lastName, 'Last name') || validateEmail(form.email) || (!form.permissionId && 'Choose a role.');
    if (problem) return setError(problem);
    setSaving(true);
    setError('');
    try {
      const result = await apiRequest('/admin/users', { method: 'POST', body: form });
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Invite a New User">
      <form onSubmit={submit} noValidate>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 0 }}>
          BarBuddy emails an invitation link. The user sets their own password when they accept.
        </p>
        {error && <p style={{ color: '#9b1c1c', fontSize: '13px' }}>{error}</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <Field label="First name"><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} maxLength={50} style={inputStyle} /></Field>
          <Field label="Last name"><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} maxLength={50} style={inputStyle} /></Field>
        </div>
        <Field label="Email address"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={254} style={inputStyle} /></Field>
        <Field label="Role">
          <select value={form.permissionId} onChange={(e) => setForm({ ...form, permissionId: e.target.value })} style={inputStyle}>
            <option value="">Choose role</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <ModalActions onClose={onClose} saving={saving} label="Send Invitation" />
      </form>
    </Modal>
  );
}

function EditModal({ user, roles, onClose, onSaved }) {
  const [form, setForm] = useState({ permissionId: user.permissionId, status: user.status, isArchived: user.isArchived });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: form });
      onSaved(`${user.name}: ${result.message}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${user.name}`}>
      <form onSubmit={submit}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 0 }}>{user.email}</p>
        {error && <p style={{ color: '#9b1c1c', fontSize: '13px' }}>{error}</p>}
        <Field label="Role">
          <select value={form.permissionId} onChange={(e) => setForm({ ...form, permissionId: e.target.value })} style={inputStyle}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Account status">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
            {STATUSES.map((st) => <option key={st} value={st}>{titleCase(st)}</option>)}
          </select>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
          <input type="checkbox" checked={form.isArchived} onChange={(e) => setForm({ ...form, isArchived: e.target.checked })} />
          Archive this account (hidden from reports, cannot sign in)
        </label>
        <ModalActions onClose={onClose} saving={saving} label="Save Changes" />
      </form>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: '14px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{label}</span>
      {children}
    </label>
  );
}

function ModalActions({ onClose, saving, label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
      <button type="button" onClick={onClose} style={outlineButtonStyle}>Cancel</button>
      <button type="submit" disabled={saving} style={{ ...navyButtonStyle, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : label}</button>
    </div>
  );
}

function MessageRow({ text, error }) {
  return (
    <tr>
      <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: error ? '#c0392b' : 'var(--text-muted)' }}>{text}</td>
    </tr>
  );
}

const cell = { padding: '14px 22px', whiteSpace: 'nowrap' };
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' };
const selectStyle = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' };
const navyButtonStyle = { background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const outlineButtonStyle = { background: '#fff', color: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
