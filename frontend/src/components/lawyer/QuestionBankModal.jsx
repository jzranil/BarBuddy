import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { apiRequest } from '../../lib/api';

const PAGE_SIZE = 10;

// Browse the imported questions and model answers.
// subject: { id, name } to limit to one subject, or null for every subject.
export default function QuestionBankModal({ open, onClose, subject, initialSearch = '' }) {
  return (
    <Modal open={open} onClose={onClose} title={subject ? `${subject.name} — Question Bank` : 'Question Bank'} width="820px">
      {/* Remount per subject/search so every opening starts fresh */}
      {open && <QuestionBankBody key={`${subject?.id ?? 'all'}|${initialSearch}`} subject={subject} initialSearch={initialSearch} />}
    </Modal>
  );
}

function QuestionBankBody({ subject, initialSearch }) {
  const [search, setSearch] = useState(initialSearch);
  const [query, setQuery] = useState(initialSearch);
  // Page belongs to the query it was chosen for; a new search starts at page 1
  const [pageState, setPageState] = useState({ query: initialSearch, page: 1 });
  const [response, setResponse] = useState({ key: null, questions: [], total: 0, error: '' });
  const [expanded, setExpanded] = useState(null);

  const page = pageState.query === query ? pageState.page : 1;
  const setPage = (next) => setPageState({ query, page: next });
  const subjectId = subject?.id || '';
  const requestKey = `${subjectId}|${query}|${page}`;
  const loading = response.key !== requestKey;
  const data = response;
  const error = response.key === requestKey ? response.error : '';

  // Debounce typing in the search box
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
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
  }, [requestKey, subjectId, query, page]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <>
      <div style={{ position: 'relative', marginBottom: '14px' }}>
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

      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        {loading ? 'Loading questions...' : `${data.total.toLocaleString()} question(s)${query ? ` matching "${query}"` : ''}`}
      </div>

      {error && (
        <div style={{ background: '#fdf0f0', color: '#9b1c1c', border: '1px solid #e5b8b8', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

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
                    Model answer
                  </div>
                  <div style={{ fontSize: '13px', whiteSpace: 'pre-wrap', color: 'var(--navy)' }}>{q.question_model_answer}</div>
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
