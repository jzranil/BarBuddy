import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
import VerificationTable from '../../components/lawyer/VerificationTable';
import { apiRequest } from '../../lib/api';
import { ALAC_COMPONENTS, GRADING_STANDARD, alacRatingLabel, formatDateTime, tidyQuestionText } from '../../lib/format';
import AiComparisonCard from '../../components/common/AiComparisonCard';

const TABS = [
  { key: 'pending', label: 'Awaiting Review' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'verified', label: 'Lawyer Verified' },
];
const PAGE_SIZE = 10;

const emptyForm = (item) => ({
  id: item?.id ?? null,
  annotation: item?.status === 'flagged' ? item?.comment ?? '' : '',
});

const gradeLabel = (score) => GRADING_STANDARD.find((g) => g.score === Math.round(score))?.label ?? '';

// Feedback History Management / lawyer verification (paper Figures 1.7, 3.34)
export default function VerificationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('pending');
  const [subjectId, setSubjectId] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [list, setList] = useState({ key: null, items: [], total: 0, counts: {} });
  const [detail, setDetail] = useState({ key: null, item: null, error: '' });
  const [form, setForm] = useState(emptyForm(null));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedId = searchParams.get('case');
  const listKey = `${status}|${subjectId}|${page}|${reload}`;
  const detailKey = selectedId ? `${selectedId}|${reload}` : null;

  useEffect(() => {
    apiRequest('/questions/subjects')
      .then((r) => setSubjects(r.subjects))
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ status, page: String(page), pageSize: String(PAGE_SIZE) });
    if (subjectId) params.set('subjectId', subjectId);
    apiRequest(`/verification?${params}`)
      .then((r) => active && setList({ key: listKey, items: r.items, total: r.total, counts: r.counts, error: '' }))
      .catch((err) => active && setList({ key: listKey, items: [], total: 0, counts: {}, error: err.message }));
    return () => {
      active = false;
    };
  }, [listKey, status, subjectId, page]);

  useEffect(() => {
    if (!detailKey) return undefined;
    let active = true;
    apiRequest(`/verification/${selectedId}`)
      .then((r) => active && setDetail({ key: detailKey, item: r.item, error: '' }))
      .catch((err) => active && setDetail({ key: detailKey, item: null, error: err.message }));
    return () => {
      active = false;
    };
  }, [detailKey, selectedId]);

  const loadingList = list.key !== listKey;
  const item = detail.key === detailKey ? detail.item : null;
  const loadingDetail = Boolean(detailKey) && detail.key !== detailKey;
  const current = item && form.id === item.id ? form : emptyForm(item);
  const update = (patch) => setForm({ ...current, ...patch });

  const select = (row) => {
    setNotice(null);
    setSearchParams({ case: row.id });
    window.scrollTo({ top: document.getElementById('review-panel')?.offsetTop ?? 0, behavior: 'smooth' });
  };

  const save = async (action) => {
    if (!item) return;
    if (action === 'flag' && current.annotation.trim().length < 5) {
      setNotice({ tone: 'error', text: 'Add an annotation explaining what the AI result got wrong before flagging.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const result = await apiRequest(`/verification/${item.id}`, {
        method: 'PUT',
        body:
          action === 'verify'
            ? { action: 'verify' }
            : { action: 'flag', annotation: current.annotation },
      });
      setNotice({ tone: 'success', text: `${result.message} The reviewee can now see it.` });
      setReload((n) => n + 1);

      // Move to the next submission in the current queue
      const next = list.items.find((row) => row.id !== item.id);
      if (next && status === 'pending') setSearchParams({ case: next.id });
    } catch (err) {
      setNotice({ tone: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Content Management & Quality Control</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            The AI scores every essay and rates its ALAC against the suggested answer. Mark the AI result as lawyer verified, or flag it with an annotation.
          </p>
        </div>
        <select
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by subject"
          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name === 'Ethics' ? 'Legal Ethics' : s.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatus(tab.key);
              setPage(1);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--card-border)',
              background: status === tab.key ? 'var(--navy)' : '#fff',
              color: status === tab.key ? '#fff' : 'var(--navy)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {tab.label}
            <span style={{ fontSize: '11px', background: status === tab.key ? 'var(--gold)' : 'var(--bg)', color: 'var(--navy)', borderRadius: '999px', padding: '1px 8px' }}>
              {list.counts?.[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {list.error && <Notice tone="error">{list.error}</Notice>}

      <div style={{ marginBottom: '28px', opacity: loadingList ? 0.6 : 1 }}>
        <VerificationTable
          items={list.items}
          total={list.total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          selectedId={selectedId}
          onSelect={select}
          emptyText={loadingList ? 'Loading submissions...' : status === 'pending' ? 'All caught up — no essays waiting for verification.' : `No ${status} submissions.`}
        />
      </div>

      <div id="review-panel" />
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}

      {!selectedId && !loadingList && list.items.length > 0 && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select a submission above to review it.</p>
      )}
      {loadingDetail && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading submission...</p>}
      {detail.error && detail.key === detailKey && <Notice tone="error">{detail.error}</Notice>}

      {item && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* LEFT: question, model answer, submission, structure check */}
          <div style={{ display: 'grid', gap: '20px', minWidth: 0 }}>
            <Card>
              <CardHeader icon="description" title={`${item.subject} — ${item.assessmentTitle || 'Assessment'}`} badge={`Submitted ${formatDateTime(item.submittedAt)}`} />
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Question</p>
              <p style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-line', textAlign: 'justify', hyphens: 'auto', margin: 0 }}>{tidyQuestionText(item.question)}</p>
            </Card>

            <Card>
              <CardHeader icon="layers" title={`${item.reviewee}'s Answer`} badge={`${item.wordCount} words`} />
              <blockquote style={{ borderLeft: '3px solid var(--navy)', background: 'var(--bg)', margin: 0, padding: '14px 16px', fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {item.answer}
              </blockquote>
            </Card>

            <div style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <CardHeader icon="balance" iconColor="var(--gold)" title="Lawyer-Approved Model Answer" />
              <p style={{ fontSize: '13px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, color: 'var(--navy)' }}>{item.modelAnswer}</p>
            </div>

            <AiComparisonCard ai={item.ai} audience="lawyer" />

            {item.structure && (
              <Card>
                <CardHeader icon="rule" title="Automated ALAC Structure Check" badge="Rule-based, not AI" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  {ALAC_COMPONENTS.map((c) => (
                    <div key={c.key} style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: item.structure[c.key] ? '#2e7d32' : '#c0392b' }}>
                        {item.structure[c.key] ? 'check_circle' : 'cancel'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.label}</span>
                    </div>
                  ))}
                </div>
                {item.structure.notes?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    {item.structure.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
              </Card>
            )}
          </div>

          {/* RIGHT: lawyer verification panel */}
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--navy)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Review Administrator Check</span>
                <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '999px', padding: '3px 10px', textTransform: 'uppercase' }}>
                  {item.status === 'verified' ? 'Lawyer Verified' : item.status === 'flagged' ? 'Flagged' : 'Awaiting Review'}
                </span>
              </div>

              <div style={{ background: '#fff', padding: '18px' }}>
                <Label>AI SCORE & ALAC RATING</Label>
                {item.ai?.score !== null && item.ai?.score !== undefined ? (
                  <div style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>{item.ai.score.toFixed(1)}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{gradeLabel(item.ai.score)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gemini verdict: {item.ai.accuracy || '—'}</div>
                    {item.ai.alac && (
                      <div style={{ display: 'grid', gap: '4px', marginTop: '10px' }}>
                        {ALAC_COMPONENTS.map((c) => (
                          <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                            <span>{c.label}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{item.ai.alac[c.key] === null || item.ai.alac[c.key] === undefined ? '—' : alacRatingLabel(item.ai.alac[c.key])}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--card-border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {item.ai?.status === 'pending' || item.ai?.status === 'processing'
                      ? 'The AI is still scoring this essay. Check back in a minute.'
                      : 'No AI score yet. Gemini is not connected, so this essay has not been scored or rated. It will be scored automatically once the AI is integrated.'}
                  </div>
                )}

                {item.status !== 'pending' && (
                  <div style={{ fontSize: '12px', marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: item.status === 'verified' ? '#e8f5e9' : '#fdf7e9', color: item.status === 'verified' ? '#2e7d32' : '#8a6514' }}>
                    {item.status === 'verified' ? 'Lawyer verified' : 'Flagged with annotation'}
                  </div>
                )}

                <button
                  onClick={() => save('verify')}
                  disabled={saving || item.ai?.score === null || item.ai?.score === undefined}
                  title={item.ai?.score === null || item.ai?.score === undefined ? 'There is no AI score to verify yet' : 'Confirm the AI score and comparison'}
                  style={{ width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '18px', opacity: saving || item.ai?.score === null || item.ai?.score === undefined ? 0.5 : 1 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                  Mark as Lawyer Verified
                </button>

                <Label>NOT CORRECT? FLAG WITH ANNOTATION</Label>
                <textarea
                  value={current.annotation}
                  onChange={(e) => update({ annotation: e.target.value })}
                  placeholder="Explain what the AI scoring or comparison got wrong, and the correct legal basis..."
                  rows={4}
                  maxLength={5000}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', resize: 'vertical', marginBottom: '8px', background: '#fff', color: 'var(--navy)' }}
                />
                <button
                  onClick={() => save('flag')}
                  disabled={saving}
                  style={{ width: '100%', background: '#fff', color: '#c0392b', border: '1px solid #c0392b', borderRadius: '8px', padding: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}
                >
                  {item.status === 'flagged' ? 'Update Flag & Annotation' : 'Flag with Annotation'}
                </button>
                {item.verifiedBy && (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '12px 0 0' }}>
                    Last reviewed by {item.verifiedBy} on {formatDateTime(item.verifiedAt)}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </LawyerLayout>
  );
}

function Card({ children }) {
  return <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '20px', minWidth: 0 }}>{children}</div>;
}

function CardHeader({ icon, title, badge, iconColor = 'var(--navy)' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '10px', flexWrap: 'wrap' }}>
      <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
        <span className="material-symbols-outlined" style={{ color: iconColor, fontSize: '18px' }}>{icon}</span>
        {title}
      </h3>
      {badge && (
        <span style={{ fontSize: '11px', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '4px 10px', color: 'var(--text-muted)' }}>{badge}</span>
      )}
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '8px' }}>{children}</div>;
}

function Notice({ tone, children }) {
  const error = tone === 'error';
  return (
    <div role="status" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', background: error ? '#fdf0f0' : '#e8f5e9', color: error ? '#9b1c1c' : '#2e7d32', border: `1px solid ${error ? '#e5b8b8' : '#b7dfba'}` }}>
      {children}
    </div>
  );
}
