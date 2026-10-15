import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';
import { SUBJECTS } from '../../data/subjects';
import { useApi } from '../../lib/useApi';
import { ASSESSMENT_TYPE_LABELS, formatDateTime } from '../../lib/format';
import { usePaged } from '../../lib/usePaged';
import ListPager from '../../components/common/ListPager';
import { SkeletonList } from '../../components/common/Skeleton';


const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'score_high', label: 'Highest score' },
  { value: 'score_low', label: 'Lowest score' },
];

const TYPES = [
  { value: '', label: 'All types' },
  { value: 'daily', label: 'Daily Questions' },
  { value: 'practice', label: 'Practice Sets' },
  { value: 'mock', label: 'Mock Bar Exams' },
];

// Assessment hub: start daily / practice / mock assessments and review the
// submission history (paper TC-ESSAY-011, -013, -014).
export default function AssessmentHistoryPage() {
  const navigate = useNavigate();
  const [sort, setSort] = useState('newest');
  const [type, setType] = useState('');
  const { data: pkg } = useApi('/reviewee/packages');
  const packageSlugs = pkg?.subscription?.active ? pkg.subscription.subjectSlugs : null;
  const practiceSubjects = packageSlugs ? SUBJECTS.filter((s) => packageSlugs.includes(s.slug)) : SUBJECTS;
  const [pickedSubject, setPracticeSubject] = useState(null);
  const practiceSubject = practiceSubjects.some((s) => s.slug === pickedSubject) ? pickedSubject : practiceSubjects[0]?.slug;
  const params = new URLSearchParams({ sort });
  if (type) params.set('type', type);
  const { data, error, loading } = useApi(`/assessments?${params}`);
  const rows = data?.assessments ?? [];
  const paged = usePaged(rows, 8);

  return (
    <PortalLayout>
      <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>My Assessments</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
        Answer essay questions in a timed Bar environment, then review your AI score, ALAC feedback and the Review Administrator's check.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <StartCard icon="today" title="Daily Questions" description="Three essays from your package, released daily at 7:00 AM. Never the same question twice." action="Start Today's Set" onClick={() => navigate('/assessments/start/daily')} />
        <StartCard icon="edit_note" title="Subject Practice Set" description="Target one Bar subject with a focused set of essays." onClick={() => navigate(`/assessments/start/practice?subject=${practiceSubject}`)} action="Start Practice">
          <select value={practiceSubject} onChange={(e) => setPracticeSubject(e.target.value)} aria-label="Practice subject" style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', marginBottom: '12px', background: '#fff', color: 'var(--navy)' }}>
            {practiceSubjects.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </StartCard>
        <StartCard icon="assignment" title="Mock Bar Examination" description="Twenty essays for one examination day. Unlocks at a 30-day streak or Level 4." action="Start Mock Exam" onClick={() => navigate('/assessments/start/mock')} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '20px' }}>Submission History</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type" style={selectStyle}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort assessments" style={selectStyle}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
          </select>
        </div>
      </div>

      {error && <p style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '12px', opacity: loading ? 0.6 : 1 }}>
        {!data && !error && <SkeletonList rows={4} />}
        {data && rows.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            No assessments yet. Start with today's daily questions above.
          </div>
        )}
        {paged.pageItems.map((a) => {
          const inProgress = a.status === 'in_progress';
          const ready = a.status === 'ready';
          return (
            <div key={a.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>
                    {a.type === 'mock' ? 'assignment' : a.type === 'daily' ? 'today' : 'edit_note'}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '14px', margin: 0 }}>{a.title}</h4>
                    <StatusTag a={a} />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    {ASSESSMENT_TYPE_LABELS[a.type]} • {ready ? `Released ${formatDateTime(a.startedAt)}` : inProgress ? `Started ${formatDateTime(a.startedAt)}` : `Submitted ${formatDateTime(a.submittedAt)}`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '18px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                <Detail label="ANSWERED" value={`${a.answered}/${a.totalQuestions}`} />
                <Detail label="VERIFIED" value={`${a.verified}/${a.totalQuestions}`} />
                <Detail label="SCORE" value={a.score === null ? '—' : `${a.score}%`} />
                {ready ? (
                  <Button variant="navy" onClick={() => navigate(`/assessments/${a.id}`)}>Start</Button>
                ) : inProgress || a.status === 'expired' ? (
                  <Button variant="navy" onClick={() => navigate(`/assessments/${a.id}`)}>{inProgress ? 'Resume' : 'Open'}</Button>
                ) : (
                  <Button variant="outline" onClick={() => navigate(`/assessments/${a.id}/results`)}>View</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ListPager paged={paged} noun="assessments" />
    </PortalLayout>
  );
}

function StatusTag({ a }) {
  const map = {
    ready: { label: 'READY TO ANSWER', bg: '#e8f5e9', color: '#2e7d32' },
    in_progress: { label: 'IN PROGRESS', bg: '#fdf7e9', color: '#8a6514' },
    expired: { label: 'TIME UP', bg: '#fdf0f0', color: '#9b1c1c' },
    submitted: a.pending ? { label: 'AWAITING VERIFICATION', bg: '#eef0f4', color: 'var(--navy)' } : { label: 'VERIFIED', bg: '#e8f5e9', color: '#2e7d32' },
  };
  const s = map[a.status] ?? map.submitted;
  return <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', padding: '2px 8px', borderRadius: '999px', background: s.bg, color: s.color }}>{s.label}</span>;
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '10px', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{value}</div>
    </div>
  );
}

function StartCard({ icon, title, description, action, onClick, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
      <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '26px', marginBottom: '8px' }}>{icon}</span>
      <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>{title}</h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px', flex: 1 }}>{description}</p>
      {children}
      <Button variant="navy" fullWidth onClick={onClick}>{action}</Button>
    </div>
  );
}

const selectStyle = { padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' };
