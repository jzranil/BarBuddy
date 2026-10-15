import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { apiRequest } from '../../lib/api';
import { confirmAction } from '../../lib/swal';

const PAGE_SIZE = 10;

// Browse and manage questions with their lawyer-approved model answers
// (paper Figure 3.6: create, edit, archive and delete questions).
// subject: { id, name } to limit to one subject, or null for every subject.
// onChanged: called after a question is added, edited, archived or deleted.
export default function QuestionBankModal({ open, onClose, subject, initialSearch = '', onChanged }) {
  return (
    <Modal open={open} onClose={onClose} title={subject ? `${subject.name} — Question Bank` : 'Question Bank'} width="820px">
      {/* Remount per subject/search so every opening starts fresh */}
      {open && <QuestionBankBody key={`${subject?.id ?? 'all'}|${initialSearch}`} subject={subject} initialSearch={initialSearch} onChanged={onChanged} />}
    </Modal>
  );
}

function QuestionBankBody({ subject, initialSearch, onChanged }) {
  const [search, setSearch] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch);
  const [archived, setArchived] = useState(false);
  const [reload, setReload] = useState(0);
  // Page belongs to the query/filter it was chosen for; a new search starts at page 1
  const [pageState, setPageState] = useState({ filter: `${initialSearch}|false`, page: 1 });
  const [response, setResponse] = useState({ key: null, questions: [], total: 0, error: '' });
  const [expanded, setExpanded] = useState(null);
  const [editing, setEditing] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [notice, setNotice] = useState(null);

  const filter = `${query}|${archived}`;
  const page = pageState.filter === filter ? pageState.page : 1;
  const setPage = (next) => setPageState({ filter, page: next });
  const subjectId = subject?.id || '';
  const requestKey = `${subjectId}|${filter}|${page}|${reload}`;
  const loading = response.key !== requestKey;
  const data = response;
  const error = response.key === requestKey ? response.error : '';

  // Debounce typing in the search box
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    apiRequest('/questions/subjects').then((r) => setSubjects(r.subjects)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), status: archived ? 'archived' : 'active' });
    if (subjectId) params.set('subjectId', subjectId);
    if (query) params.set('search', query);

    apiRequest(`/questions?${params}`)
      .then((result) => {
        if (!cancelled) setResponse({ key: requestKey, questions: result.questions, total: result.total, error: '' });
      })
      .catch((err) => {
        if (!cancelled) setResponse({ key: requestKey, questions: [], total: 0, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [requestKey, subjectId, query, page, archived]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  const changed = (text) => {
    setNotice({ tone: 'success', text });
    setReload((n) => n + 1);
    onChanged?.();
  };

  const act = async (request) => {
    setNotice(null);
    try {
      const result = await request();
      changed(result.message);
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    }
  };

  if (editing) {
    return (
      <QuestionForm
        initial={editing}
        subjects={subjects}
        onCancel={() => setEditing(null)}
        onSaved={(message) => {
          setEditing(null);
          changed(message);
        }}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text..."
            aria-label="Search questions"
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
          />
        </div>
        <div style={{ display: 'inline-flex', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
          {[false, true].map((value) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setArchived(value)}
              aria-pressed={archived === value}
              style={{ border: 'none', padding: '8px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: archived === value ? 'var(--navy)' : 'transparent', color: archived === value ? '#fff' : 'var(--navy)' }}
            >
              {value ? 'Archived' : 'Active'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEditing({ id: null, subjectId: subjectId || '', questionText: '', modelAnswer: '' })}
          style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Add Question
        </button>
      </div>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {loading ? 'Loading questions...' : `${data.total.toLocaleString()} ${archived ? 'archived ' : ''}question(s)${query ? ` matching "${query}"` : ''}`}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div style={{ display: 'grid', gap: '8px' }}>
        {data.questions.map((q, index) => {
          const isOpen = expanded === q.question_id;
          return (
            <div key={q.question_id} style={{ border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : q.question_id)}
                aria-expanded={isOpen}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: '10px', color: 'var(--navy)' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>
                  {(page - 1) * PAGE_SIZE + index + 1}.
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    flex: 1,
                    whiteSpace: isOpen ? 'pre-wrap' : 'normal',
                    display: isOpen ? 'block' : '-webkit-box',
                    WebkitLineClamp: isOpen ? 'unset' : 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {q.question_text}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {isOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--card-border)', background: 'var(--bg)', padding: '12px 14px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Lawyer-approved model answer
                  </div>
                  <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', color: 'var(--navy)', marginBottom: '12px' }}>{q.question_model_answer}</div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Action icon="edit" onClick={() => setEditing({ id: q.question_id, subjectId: q.question_subject_id, questionText: q.question_text, modelAnswer: q.question_model_answer || '' })}>
                      Edit
                    </Action>
                    <Action icon={q.is_archived ? 'unarchive' : 'archive'} muted onClick={async () => {
                        if (await confirmAction({ title: q.is_archived ? 'Restore this question?' : 'Archive this question?', text: q.is_archived ? 'It can be given to reviewees again.' : 'It will no longer be given to reviewees. You can restore it later.', confirmText: q.is_archived ? 'Yes, restore' : 'Yes, archive' })) {
                          act(() => apiRequest(`/questions/${q.question_id}`, { method: 'PATCH', body: { isArchived: !q.is_archived } }));
                        }
                      }}>
                      {q.is_archived ? 'Restore' : 'Archive'}
                    </Action>
                    <Action
                      icon="delete"
                      danger
                      onClick={async () => {
                        if (await confirmAction({ title: 'Delete this question?', text: 'The question and its model answer are permanently deleted. This cannot be undone.', confirmText: 'Yes, delete', danger: true })) {
                          act(() => apiRequest(`/questions/${q.question_id}`, { method: 'DELETE' }));
                        }
                      }}
                    >
                      Delete
                    </Action>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && !error && data.questions.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', margin: 0 }}>
            No questions found.
          </p>
        )}
      </div>

      {data.total > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <PagerButton icon="chevron_left" label="Previous" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)} />
            <PagerButton icon="chevron_right" label="Next" disabled={page >= totalPages || loading} onClick={() => setPage(page + 1)} />
          </div>
        </div>
      )}
    </>
  );
}

function QuestionForm({ initial, subjects, onCancel, onSaved }) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.subjectId) return setError('Choose the Bar subject.');
    if (form.questionText.trim().length < 10) return setError('The question must be at least 10 characters.');
    if (!form.modelAnswer.trim()) return setError('The lawyer-approved model answer is required.');
    if (!(await confirmAction({ title: form.id ? 'Save changes to this question?' : 'Add this question?', text: form.id ? 'Reviewees will see the updated question and model answer.' : 'It joins the question bank and can be given to reviewees.', confirmText: form.id ? 'Yes, save' : 'Yes, add question' }))) return;

    setSaving(true);
    try {
      const body = { subjectId: form.subjectId, questionText: form.questionText, modelAnswer: form.modelAnswer };
      const result = form.id
        ? await apiRequest(`/questions/${form.id}`, { method: 'PATCH', body })
        : await apiRequest('/questions', { method: 'POST', body });
      onSaved(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const label = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' };
  const input = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)', fontFamily: 'Inter, sans-serif' };

  return (
    <form onSubmit={submit} noValidate>
      <h4 style={{ fontSize: '15px', marginBottom: '14px' }}>{form.id ? 'Edit Question' : 'Add Question'}</h4>
      {error && <Alert tone="error">{error}</Alert>}
      <label style={{ display: 'block', marginBottom: '14px' }}>
        <span style={label}>Bar subject *</span>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} style={input}>
          <option value="">Choose subject</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name === 'Ethics' ? 'Legal Ethics' : s.name}</option>)}
        </select>
      </label>
      <label style={{ display: 'block', marginBottom: '14px' }}>
        <span style={label}>Question *</span>
        <textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} rows={7} style={{ ...input, resize: 'vertical' }} placeholder="Facts of the problem and the question asked" />
      </label>
      <label style={{ display: 'block', marginBottom: '14px' }}>
        <span style={label}>Lawyer-approved model answer *</span>
        <textarea value={form.modelAnswer} onChange={(e) => setForm({ ...form, modelAnswer: e.target.value })} rows={7} style={{ ...input, resize: 'vertical' }} placeholder="Answer, legal basis, application and conclusion" />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button type="button" onClick={onCancel} style={{ background: '#fff', color: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
        <button type="submit" disabled={saving} style={{ background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
}

function Action({ icon, children, onClick, muted, danger }) {
  return (
    <button type="button" onClick={onClick} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: danger ? '#c0392b' : muted ? 'var(--text-muted)' : 'var(--navy)' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{icon}</span>
      {children}
    </button>
  );
}

function Alert({ tone, children }) {
  const isError = tone === 'error';
  return (
    <div role="status" style={{ background: isError ? '#fdf0f0' : '#e8f5e9', color: isError ? '#9b1c1c' : '#2e7d32', border: `1px solid ${isError ? '#e5b8b8' : '#b7dfba'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', marginBottom: '12px' }}>
      {children}
    </div>
  );
}

function PagerButton({ icon, label, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        color: 'var(--navy)',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
    </button>
  );
}
