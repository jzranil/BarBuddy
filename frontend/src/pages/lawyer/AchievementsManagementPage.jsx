import { useEffect, useState } from 'react';
import LawyerLayout from '../../layouts/LawyerLayout';
import Modal from '../../components/common/Modal';
import { apiRequest } from '../../lib/api';
import { CONDITION_LABELS, SUBJECT_GROUPS } from '../../lib/achievementConditions';
import { confirmAction } from '../../lib/swal';
import { usePaged } from '../../lib/usePaged';
import ListPager from '../../components/common/ListPager';
import { SkeletonCards } from '../../components/common/Skeleton';


const ICONS = ['psychology', 'trending_up', 'my_location', 'edit_note', 'event_available', 'calendar_month', 'task_alt', 'forum', 'autorenew', 'restart_alt', 'science', 'account_balance', 'diamond', 'military_tech', 'workspace_premium', 'verified', 'emoji_events', 'flag', 'local_fire_department', 'whatshot', 'quiz', 'auto_stories', 'auto_awesome', 'balance', 'gavel', 'shield', 'security', 'fact_check', 'timer', 'menu_book', 'school', 'star', 'bolt'];

const blank = { id: null, kind: 'badge', title: '', description: '', icon: 'military_tech', condition: 'questions_completed', threshold: 1, subjectId: '', subjectGroup: '', xpReward: 50, rarity: 'Common', category: '' };

// Badges and Achievements Management (paper Figures 1.9, 3.9)
export default function AchievementsManagementPage() {
  const [data, setData] = useState({ key: null, items: [], error: '' });
  const [reload, setReload] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [reviewees, setReviewees] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(null);
  const [awarding, setAwarding] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let active = true;
    apiRequest('/achievements')
      .then((r) => active && setData({ key: reload, items: r.items, error: '' }))
      .catch((err) => active && setData({ key: reload, items: [], error: err.message }));
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    apiRequest('/questions/subjects').then((r) => setSubjects(r.subjects)).catch(() => {});
    apiRequest('/lawyer/reviewees').then((r) => setReviewees(r.reviewees)).catch(() => {});
  }, []);

  const refresh = (text, tone = 'success') => {
    if (text) setNotice({ tone, text });
    setReload((n) => n + 1);
  };

  const act = async (fn) => {
    try {
      const result = await fn();
      refresh(result.message);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    }
  };

  const items = data.items.filter((a) => a.isArchived === showArchived);
  const paged = usePaged(items, 12);
  const loading = data.key !== reload;

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Badges & Achievements</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '620px' }}>
            Create badges, set the conditions that award them automatically, or assign them to reviewees yourself.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={async () => (await confirmAction({ title: 'Re-check every reviewee?', text: 'Badges are awarded automatically to every reviewee who now meets a condition.', confirmText: 'Yes, re-check' })) && act(() => apiRequest('/achievements/recheck', { method: 'POST' }))} style={outlineButton}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>sync</span>
            Re-check Conditions
          </button>
          <button onClick={() => setEditing({ ...blank })} style={navyButton}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            New Badge
          </button>
        </div>
      </div>

      {notice && <Notice tone={notice.tone} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {data.error && <Notice tone="error">{data.error}</Notice>}

      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '18px' }}>
        {[false, true].map((archived) => (
          <button
            key={String(archived)}
            onClick={() => setShowArchived(archived)}
            style={{ background: 'none', border: 'none', padding: '0 0 10px', fontSize: '13px', fontWeight: 600, color: showArchived === archived ? 'var(--navy)' : 'var(--text-muted)', borderBottom: showArchived === archived ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer' }}
          >
            {archived ? 'Archived' : 'Active'} ({data.items.filter((a) => a.isArchived === archived).length})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {loading && <div style={{ gridColumn: '1 / -1' }}><SkeletonCards count={6} height={150} min={260} /></div>}
        {!loading && items.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{showArchived ? 'No archived badges.' : 'No badges yet. Create the first one.'}</p>
        )}
        {paged.pageItems.map((a) => (
          <div key={a.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '22px' }}>{a.icon}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '15px', margin: 0 }}>{a.title}</h4>
                  <span style={pill}>{a.kind === 'achievement' ? 'Achievement' : 'Badge'}</span>
                  <span style={pill}>{a.rarity}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>{a.description || 'No description.'}</p>
              </div>
            </div>
            <div style={{ fontSize: '12px', background: 'var(--bg)', borderRadius: '8px', padding: '8px 10px' }}>
              <strong>Condition:</strong> {CONDITION_LABELS[a.condition] || a.condition}
              {a.condition !== 'manual' && <> ≥ {a.threshold}{a.subjectName ? ` in ${a.subjectName === 'Ethics' ? 'Legal Ethics' : a.subjectName}` : ''}{a.subjectGroup ? ` in ${SUBJECT_GROUPS.find((g) => g.key === a.subjectGroup)?.label ?? a.subjectGroup}` : ''}</>}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              +{a.xpReward} XP • Awarded to {a.awardedCount} reviewee{a.awardedCount === 1 ? '' : 's'}
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: 'auto' }}>
              <LinkButton icon="edit" onClick={() => setEditing({ ...a, subjectId: a.subjectId || '', subjectGroup: a.subjectGroup || '' })}>Edit</LinkButton>
              {!a.isArchived && <LinkButton icon="person_add" onClick={() => setAwarding(a)}>Award</LinkButton>}
              <LinkButton icon={a.isArchived ? 'unarchive' : 'archive'} muted onClick={async () => (await confirmAction({ title: a.isArchived ? `Restore "${a.title}"?` : `Archive "${a.title}"?`, text: a.isArchived ? 'Reviewees can earn it again.' : 'Reviewees will no longer see or earn it. You can restore it later.', confirmText: a.isArchived ? 'Yes, restore' : 'Yes, archive' })) && act(() => apiRequest(`/achievements/${a.id}`, { method: 'PATCH', body: { isArchived: !a.isArchived } }))}>
                {a.isArchived ? 'Restore' : 'Archive'}
              </LinkButton>
              <LinkButton
                icon="delete"
                danger
                onClick={async () => {
                  if (await confirmAction({ title: `Delete "${a.title}"?`, text: `It will also be removed from ${a.awardedCount} reviewee(s). This cannot be undone.`, confirmText: 'Yes, delete', danger: true })) {
                    act(() => apiRequest(`/achievements/${a.id}`, { method: 'DELETE' }));
                  }
                }}
              >
                Delete
              </LinkButton>
            </div>
          </div>
        ))}
      </div>
      <ListPager paged={paged} noun="badges" />

      {editing && (
        <BadgeForm
          initial={editing}
          subjects={subjects}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            refresh(message);
          }}
        />
      )}

      {awarding && (
        <AwardForm
          badge={awarding}
          reviewees={reviewees}
          onClose={() => setAwarding(null)}
          onSaved={(message) => {
            setAwarding(null);
            refresh(message);
          }}
        />
      )}
    </LawyerLayout>
  );
}

function BadgeForm({ initial, subjects, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (patch) => setForm({ ...form, ...patch });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.title.trim().length < 3) return setError('Title must be at least 3 characters.');
    if (form.condition === 'subject_score' && !form.subjectId) return setError('Choose the subject for this condition.');
    if (form.condition === 'group_score' && !form.subjectGroup) return setError('Choose the Bar subject group for this condition.');
    if (!(await confirmAction({ title: form.id ? 'Save changes to this badge?' : 'Create this badge?', text: 'Reviewees who meet the condition will earn it automatically.', confirmText: form.id ? 'Yes, save' : 'Yes, create' }))) return;

    setSaving(true);
    try {
      const body = { ...form, threshold: Number(form.threshold), xpReward: Number(form.xpReward) };
      const result = form.id
        ? await apiRequest(`/achievements/${form.id}`, { method: 'PATCH', body })
        : await apiRequest('/achievements', { method: 'POST', body });
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={form.id ? 'Edit Badge' : 'New Badge'} width="560px">
      <form onSubmit={submit} noValidate>
        {error && <Notice tone="error">{error}</Notice>}
        <Row>
          <Field label="Type">
            <select value={form.kind} onChange={(e) => set({ kind: e.target.value })} style={input}>
              <option value="badge">Badge (milestone)</option>
              <option value="achievement">Achievement</option>
            </select>
          </Field>
          <Field label="Rarity">
            <select value={form.rarity} onChange={(e) => set({ rarity: e.target.value })} style={input}>
              {['Common', 'Rare', 'Legendary'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
        </Row>
        <Field label="Title *">
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} style={input} placeholder="e.g. Consistent Reviewer" />
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={300} rows={2} style={{ ...input, resize: 'vertical' }} placeholder="Shown to reviewees on the badge card" />
        </Field>
        <Field label="Icon">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => set({ icon })}
                aria-label={icon}
                aria-pressed={form.icon === icon}
                style={{ width: '36px', height: '36px', borderRadius: '8px', border: `1px solid ${form.icon === icon ? 'var(--navy)' : 'var(--card-border)'}`, background: form.icon === icon ? 'var(--navy)' : 'transparent', color: form.icon === icon ? 'var(--gold)' : 'var(--navy)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Award condition">
          <select value={form.condition} onChange={(e) => set({ condition: e.target.value })} style={input}>
            {Object.entries(CONDITION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </Field>
        {form.condition !== 'manual' && (
          <Row>
            <Field label="Threshold *">
              <input type="number" min={1} value={form.threshold} onChange={(e) => set({ threshold: e.target.value })} style={input} />
            </Field>
            {form.condition === 'group_score' && (
              <Field label="Subject group *">
                <select value={form.subjectGroup} onChange={(e) => set({ subjectGroup: e.target.value })} style={input}>
                  <option value="">Choose group</option>
                  {SUBJECT_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </Field>
            )}
            {form.condition === 'subject_score' && (
              <Field label="Subject *">
                <select value={form.subjectId} onChange={(e) => set({ subjectId: e.target.value })} style={input}>
                  <option value="">Choose subject</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name === 'Ethics' ? 'Legal Ethics' : s.name}</option>)}
                </select>
              </Field>
            )}
          </Row>
        )}
        <Row>
          <Field label="XP reward">
            <input type="number" min={0} max={10000} value={form.xpReward} onChange={(e) => set({ xpReward: e.target.value })} style={input} />
          </Field>
          <Field label="Category">
            <input value={form.category} onChange={(e) => set({ category: e.target.value })} maxLength={60} style={input} placeholder="e.g. Consistency" />
          </Field>
        </Row>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} style={outlineButton}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...navyButton, opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save Badge'}</button>
        </div>
      </form>
    </Modal>
  );
}

function AwardForm({ badge, reviewees, onClose, onSaved }) {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!userId) return setError('Choose a reviewee.');
    if (!(await confirmAction({ title: `Award "${badge.title}"?`, text: 'The reviewee receives the badge and its XP reward right away.', confirmText: 'Yes, award' }))) return;
    setSaving(true);
    try {
      const result = await apiRequest(`/achievements/${badge.id}/award`, { method: 'POST', body: { userId } });
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Award "${badge.title}"`}>
      <form onSubmit={submit}>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Reviewee">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} style={input}>
            <option value="">Choose a reviewee</option>
            {reviewees.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.email})</option>)}
          </select>
        </Field>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>The reviewee also receives {badge.xpReward} XP.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} style={outlineButton}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...navyButton, opacity: saving ? 0.6 : 1 }}>{saving ? 'Awarding...' : 'Award Badge'}</button>
        </div>
      </form>
    </Modal>
  );
}

function Row({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>{children}</div>;
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

function Notice({ tone, children, onClose }) {
  const error = tone === 'error';
  return (
    <div role="status" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', background: error ? '#fdf0f0' : '#e8f5e9', color: error ? '#9b1c1c' : '#2e7d32', border: `1px solid ${error ? '#e5b8b8' : '#b7dfba'}` }}>
      {children}
      {onClose && (
        <button onClick={onClose} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
        </button>
      )}
    </div>
  );
}

const input = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)', fontFamily: 'Inter, sans-serif' };
const pill = { fontSize: '10px', fontWeight: 700, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '1px 8px', color: 'var(--text-muted)' };
const navyButton = { background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const outlineButton = { background: '#fff', color: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
