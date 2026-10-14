import { useState } from 'react';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDateTime } from '../../lib/format';

const AUDIENCES = {
  all: 'Everyone',
  reviewee: 'Reviewees',
  lawyer: 'Review Administrators',
  super_admin: 'Super Admins',
};

const blank = { id: null, title: '', body: '', audience: 'all', isPublished: true };

// System announcements (paper TC-SA-001: "Publish a System Announcement").
// Published announcements appear in the bell menu of the chosen audience.
export default function AnnouncementsPage() {
  const { data, error, reload } = useApi('/announcements/manage');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const items = (data?.announcements ?? []).filter((a) => a.isArchived === showArchived);

  const act = async (request) => {
    try {
      const r = await request();
      setNotice({ tone: 'success', text: r.message });
      reload();
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    }
  };

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>System Announcements</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '600px' }}>
            Publish notices such as maintenance schedules or new syllabus releases. They appear in the bell menu of the selected users.
          </p>
        </div>
        <button onClick={() => setEditing({ ...blank })} style={navyButton}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>campaign</span>
          New Announcement
        </button>
      </div>

      {notice && (
        <div role="status" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', background: notice.tone === 'error' ? '#fdf0f0' : '#e8f5e9', color: notice.tone === 'error' ? '#9b1c1c' : '#2e7d32', border: `1px solid ${notice.tone === 'error' ? '#e5b8b8' : '#b7dfba'}` }}>
          {notice.text}
        </div>
      )}
      {error && <p style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '18px' }}>
        {[false, true].map((archived) => (
          <button
            key={String(archived)}
            onClick={() => setShowArchived(archived)}
            style={{ background: 'none', border: 'none', padding: '0 0 10px', fontSize: '13px', fontWeight: 600, color: showArchived === archived ? 'var(--navy)' : 'var(--text-muted)', borderBottom: showArchived === archived ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer' }}
          >
            {archived ? 'Archived' : 'Current'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {!data && !error && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading announcements...</p>}
        {data && items.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{showArchived ? 'No archived announcements.' : 'No announcements yet.'}</p>}
        {items.map((a) => (
          <div key={a.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '16px', margin: 0 }}>{a.title}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {AUDIENCES[a.audience]} • {formatDateTime(a.createdAt)}{a.author ? ` • ${a.author}` : ''}
                </div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, alignSelf: 'flex-start', borderRadius: '999px', padding: '3px 10px', background: a.isPublished ? '#e8f5e9' : '#eef0f4', color: a.isPublished ? '#2e7d32' : 'var(--text-muted)' }}>
                {a.isPublished ? 'PUBLISHED' : 'DRAFT'}
              </span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 12px' }}>{a.body}</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <LinkButton icon="edit" onClick={() => setEditing(a)}>Edit</LinkButton>
              <LinkButton icon={a.isPublished ? 'visibility_off' : 'visibility'} onClick={() => act(() => apiRequest(`/announcements/${a.id}`, { method: 'PATCH', body: { isPublished: !a.isPublished } }))}>
                {a.isPublished ? 'Unpublish' : 'Publish'}
              </LinkButton>
              <LinkButton icon={a.isArchived ? 'unarchive' : 'archive'} muted onClick={() => act(() => apiRequest(`/announcements/${a.id}`, { method: 'PATCH', body: { isArchived: !a.isArchived } }))}>
                {a.isArchived ? 'Restore' : 'Archive'}
              </LinkButton>
              <LinkButton
                icon="delete"
                danger
                onClick={() => {
                  if (window.confirm(`Delete "${a.title}"? This cannot be undone.`)) act(() => apiRequest(`/announcements/${a.id}`, { method: 'DELETE' }));
                }}
              >
                Delete
              </LinkButton>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AnnouncementForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ tone: 'success', text: message });
            reload();
          }}
        />
      )}
    </SuperAdminLayout>
  );
}

function AnnouncementForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (form.body.trim().length < 5) return setError('Write the announcement message.');
    setSaving(true);
    setError('');
    try {
      const body = { title: form.title, body: form.body, audience: form.audience, isPublished: form.isPublished };
      const result = form.id
        ? await apiRequest(`/announcements/${form.id}`, { method: 'PATCH', body })
        : await apiRequest('/announcements', { method: 'POST', body });
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={form.id ? 'Edit Announcement' : 'New Announcement'} width="560px">
      <form onSubmit={submit} noValidate>
        {error && <p style={{ color: '#9b1c1c', fontSize: '13px', marginTop: 0 }}>{error}</p>}
        <Field label="Title">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} style={input} placeholder="e.g. Scheduled maintenance on Saturday" />
        </Field>
        <Field label="Message">
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={3000} rows={6} style={{ ...input, resize: 'vertical' }} />
        </Field>
        <Field label="Show to">
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} style={input}>
            {Object.entries(AUDIENCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '16px' }}>
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Publish now (unchecked saves it as a draft)
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={outlineButton}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...navyButton, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : form.isPublished ? 'Publish' : 'Save Draft'}</button>
        </div>
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

function LinkButton({ icon, children, onClick, muted, danger }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: danger ? '#c0392b' : muted ? 'var(--text-muted)' : 'var(--navy)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
      {children}
    </button>
  );
}

const input = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)', fontFamily: 'Inter, sans-serif' };
const navyButton = { background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const outlineButton = { background: '#fff', color: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
