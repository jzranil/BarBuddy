import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { downloadCsv, formatDate, timeAgo } from '../../lib/format';
import { validateEmail, validateName } from '../../lib/validation';
import { confirmAction, toastError, toastSuccess } from '../../lib/swal';
import { Skeleton, SkeletonTableRows } from '../../components/common/Skeleton';

const LIMIT = 10;

// User and role management (paper: Super Admin manages user roles with
// role-based access control).
export default function UserControlPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
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
  const filterRoles = users.data?.filterRoles ?? roles;
  const total = users.data?.total ?? 0;
  const s = summary.data ?? { totalUsers: 0, adminsCount: 0, lockedAccounts: 0, newThisMonth: 0 };
  const summaryLoading = !summary.data && !summary.error;

  const refresh = (text) => {
    setNotice(null);
    toastSuccess(text);
    users.reload();
    summary.reload();
  };

  const toggleArchive = async (user) => {
    const archiving = !user.isArchived;
    const ok = await confirmAction({
      title: archiving ? `Archive ${user.name}?` : `Restore ${user.name}?`,
      text: archiving
        ? 'The account is hidden from reports and can no longer sign in. You can restore it at any time.'
        : 'The account becomes active again and can sign in.',
      confirmText: archiving ? 'Yes, archive' : 'Yes, restore',
      danger: archiving,
    });
    if (!ok) return;
    try {
      const result = await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', body: { isArchived: archiving } });
      refresh(`${user.name}: ${result.message}`);
    } catch (err) {
      toastError(err.message);
    }
  };

  const deleteUser = async (user) => {
    const ok = await confirmAction({
      title: `Delete ${user.name}?`,
      html: `This permanently deletes <strong>${user.email}</strong>, their sign-in and their review history (answers, scores, badges). <br><br>This cannot be undone. Archive the account instead if you may need it later.`,
      confirmText: 'Yes, delete permanently',
      danger: true,
    });
    if (!ok) return;
    try {
      const result = await apiRequest(`/admin/users/${user.id}`, { method: 'DELETE' });
      refresh(`${user.name}: ${result.message}`);
    } catch (err) {
      toastError(err.message);
    }
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
    const byRole = (name) => all.filter((u) => u.role === name).length;
    const statusOf = (u) => (u.isArchived ? 'Archived' : u.invitePending ? 'Pending sign-up' : 'Active');
    downloadCsv(`barbuddy-users-report-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['BarBuddy Users Report'],
      ['Generated', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })],
      ['Filter', [role ? filterRoles.find((r) => r.id === role)?.name : 'All roles', query ? `search "${query}"` : ''].filter(Boolean).join(', ')],
      ['Total users', all.length],
      ['Reviewees', byRole('Reviewee')],
      ['Review Administrators', byRole('Review Administrator (Lawyer)')],
      ['Super Admins', byRole('Super Admin')],
      ['Active', all.filter((u) => statusOf(u) === 'Active').length],
      ['Pending sign-up', all.filter((u) => statusOf(u) === 'Pending sign-up').length],
      ['Archived', all.filter((u) => u.isArchived).length],
      [],
      ['Name', 'Email', 'Role', 'Status', 'Package', 'Package Ends', 'Joined', 'Last Activity'],
      ...all.map((u) => [
        u.name,
        u.email,
        u.role,
        statusOf(u),
        u.package || '',
        u.packageEnds ? formatDate(u.packageEnds) : '',
        formatDate(u.joinedDate),
        u.lastActivity ? formatDate(u.lastActivity) : '',
      ]),
    ]);
    toastSuccess(`Users report downloaded (${all.length} users).`);
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
        <KpiTile icon="group" label="TOTAL USERS" value={s.totalUsers.toLocaleString()} trendLabel="All roles" loading={summaryLoading} />
        <KpiTile icon="shield" label="ADMINS & LAWYERS" value={s.adminsCount} trendLabel="Elevated privileges" loading={summaryLoading} />
        <KpiTile icon="inventory_2" label="ARCHIVED" value={s.lockedAccounts} trendLabel="Hidden, cannot sign in" loading={summaryLoading} />
        <KpiTile icon="person_add" label="NEW THIS MONTH" value={s.newThisMonth} trendLabel="Last 30 days" loading={summaryLoading} />
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
            {filterRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => exportCsv().catch((err) => setNotice({ tone: 'error', text: err.message }))} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
            Download Users Report
          </button>
          <button onClick={() => setBulkOpen(true)} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
            Bulk Invite (CSV)
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
              {!users.data && !users.error && <SkeletonTableRows rows={6} cols={7} />}
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
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: user.isArchived ? 'var(--text-muted)' : user.invitePending ? 'var(--gold)' : '#2e7d32' }} />
                      {user.isArchived ? 'Archived' : user.invitePending ? 'Pending sign-up' : 'Active'}
                    </span>
                  </td>
                  <td style={cell}>
                    {user.isSuperAdmin ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protected</span>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <IconButton icon="edit" label={`Edit ${user.name}`} onClick={() => setEditing(user)} />
                        <IconButton
                          icon={user.isArchived ? 'unarchive' : 'archive'}
                          label={user.isArchived ? `Restore ${user.name}` : `Archive ${user.name}`}
                          onClick={() => toggleArchive(user)}
                        />
                        <IconButton icon="delete" label={`Delete ${user.name}`} onClick={() => deleteUser(user)} danger />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap', gap: '10px' }}>
          {!users.data && !users.error ? (
            <Skeleton width={140} height={12} />
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Showing {rows.length} of {total.toLocaleString()} users</span>
          )}
          <Pagination totalPages={Math.ceil(total / LIMIT) || 1} activePage={page} onPageChange={setPage} />
        </div>
      </div>

      {bulkOpen && <BulkInviteModal onClose={() => setBulkOpen(false)} onDone={(t) => { users.reload(); summary.reload(); if (t) toastSuccess(t); }} />}
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
    const roleName = roles.find((r) => r.id === form.permissionId)?.name;
    const ok = await confirmAction({
      title: 'Send this invitation?',
      text: `${form.firstName} ${form.lastName} (${form.email}) will receive an email to join BarBuddy as ${roleName}.`,
      confirmText: 'Yes, send invitation',
    });
    if (!ok) return;
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
          BarBuddy emails an invitation with a link to the registration page. When they register with this email, they get the role you choose here.
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
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, permissionId: user.permissionId });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = validateName(form.firstName, 'First name') || validateName(form.lastName, 'Last name');
    if (problem) return setError(problem);
    const roleChanged = form.permissionId !== user.permissionId;
    const roleName = roles.find((r) => r.id === form.permissionId)?.name;
    const ok = await confirmAction({
      title: 'Save these changes?',
      text: roleChanged
        ? `${user.name} will become a ${roleName}. Their access changes the next time they sign in.`
        : `Update the details of ${user.name}?`,
      confirmText: 'Yes, save changes',
    });
    if (!ok) return;
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <Field label="First name"><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} maxLength={50} style={inputStyle} /></Field>
          <Field label="Last name"><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} maxLength={50} style={inputStyle} /></Field>
        </div>
        <Field label="Role">
          <select value={form.permissionId} onChange={(e) => setForm({ ...form, permissionId: e.target.value })} style={inputStyle}>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <ModalActions onClose={onClose} saving={saving} label="Save Changes" />
      </form>
    </Modal>
  );
}

// Bulk invitations from a CSV of emails: email, first_name, last_name, role (optional)
const CSV_TEMPLATE = 'email,first_name,last_name,role\njuan.delacruz@example.com,Juan,Dela Cruz,reviewee\nmaria.santos@example.com,Maria,Santos,lawyer\n';
const pick = (row, ...keys) => {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => k.trim().toLowerCase().replace(/[\s-]+/g, '_') === key);
    if (found && String(row[found]).trim()) return String(row[found]).trim();
  }
  return '';
};

function BulkInviteModal({ onClose, onDone }) {
  const fileRef = useRef(null);
  const [rows, setRows] = useState(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  const readFile = (file) => {
    setError('');
    setResults(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return setError('Choose a .csv file.');
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        const parsed = data
          .map((r) => ({
            email: pick(r, 'email', 'email_address').toLowerCase(),
            firstName: pick(r, 'first_name', 'firstname', 'first'),
            lastName: pick(r, 'last_name', 'lastname', 'last'),
            role: pick(r, 'role') || 'reviewee',
          }))
          .filter((r) => r.email || r.firstName || r.lastName);
        if (parsed.length === 0) return setError('No rows found. Use the template: email, first_name, last_name, role.');
        if (parsed.length > 200) return setError('Invite at most 200 people per file.');
        setRows(
          parsed.map((r) => ({
            ...r,
            problem: validateEmail(r.email) || validateName(r.firstName, 'First name') || validateName(r.lastName, 'Last name') || '',
          }))
        );
      },
      error: () => setError('The file could not be read.'),
    });
  };

  const valid = (rows || []).filter((r) => !r.problem);

  const send = async () => {
    const ok = await confirmAction({
      title: `Send ${valid.length} invitation${valid.length === 1 ? '' : 's'}?`,
      text: 'Each person receives an email with a link to register. Rows with problems are skipped.',
      confirmText: 'Yes, send invitations',
    });
    if (!ok) return;
    setSending(true);
    setError('');
    try {
      const result = await apiRequest('/admin/users/bulk-invite', { method: 'POST', body: { invites: valid } });
      setResults(result);
      onDone(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barbuddy-invite-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const STATUS_TEXT = { invited: 'Invited', resent: 'Invited again', exists: 'Already registered', invalid: 'Invalid', duplicate: 'Duplicate', failed: 'Failed' };

  return (
    <Modal open onClose={onClose} title="Bulk Invite from CSV" width="620px">
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 0 }}>
        Upload a CSV with the columns <strong>email, first_name, last_name, role</strong>. Role is <em>reviewee</em> (default) or <em>lawyer</em>.
        Everyone receives an email with a link to register.
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={navyButtonStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
          {fileName ? 'Choose another file' : 'Choose CSV file'}
        </button>
        <button type="button" onClick={downloadTemplate} style={outlineButtonStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
          Download template
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {fileName && <p style={{ fontSize: '12px', margin: '0 0 10px' }}>File: <strong>{fileName}</strong></p>}
      {error && <p style={{ color: '#9b1c1c', fontSize: '13px' }}>{error}</p>}

      {rows && !results && (
        <>
          <p style={{ fontSize: '13px', margin: '0 0 8px' }}>
            <strong>{valid.length}</strong> ready to invite{rows.length > valid.length ? <>, <strong style={{ color: '#c0392b' }}>{rows.length - valid.length}</strong> with problems (skipped)</> : ''}.
          </p>
          <InviteRows rows={rows.map((r) => ({ email: r.email, name: `${r.firstName} ${r.lastName}`.trim(), info: r.problem || (/lawyer|admin/i.test(r.role) ? 'Review Administrator' : 'Reviewee'), bad: Boolean(r.problem) }))} />
        </>
      )}

      {results && (
        <>
          <p style={{ fontSize: '13px', margin: '0 0 8px' }}>
            Sent <strong>{results.summary.invited}</strong> · already registered <strong>{results.summary.exists}</strong> · invalid <strong>{results.summary.invalid}</strong> · failed <strong>{results.summary.failed}</strong>
          </p>
          <InviteRows rows={results.results.map((r) => ({ email: r.email, name: STATUS_TEXT[r.status] || r.status, info: r.message || '', bad: !['invited', 'resent'].includes(r.status) }))} />
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
        <button type="button" onClick={onClose} style={outlineButtonStyle}>{results ? 'Close' : 'Cancel'}</button>
        {!results && (
          <button type="button" onClick={send} disabled={sending || valid.length === 0} style={{ ...navyButtonStyle, opacity: sending || valid.length === 0 ? 0.6 : 1 }}>
            {sending ? 'Sending...' : `Send ${valid.length} Invitation${valid.length === 1 ? '' : 's'}`}
          </button>
        )}
      </div>
    </Modal>
  );
}

function InviteRows({ rows }) {
  return (
    <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.email}-${i}`} style={{ borderTop: i ? '1px solid var(--card-border)' : 'none' }}>
              <td style={{ padding: '8px 10px', wordBreak: 'break-all' }}>{r.email || <em>(no email)</em>}</td>
              <td style={{ padding: '8px 10px' }}>{r.name}</td>
              <td style={{ padding: '8px 10px', color: r.bad ? '#c0392b' : 'var(--text-muted)' }}>{r.info}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconButton({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{ background: 'none', border: `1px solid ${danger ? '#e5b8b8' : 'var(--card-border)'}`, borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: danger ? '#c0392b' : 'var(--navy)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
    </button>
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
