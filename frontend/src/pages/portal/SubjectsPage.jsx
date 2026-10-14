import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import SubjectCard from '../../components/portal/SubjectCard';
import { SUBJECTS, getZeroedSubjectStats } from '../../data/subjects';
import { useApi } from '../../lib/useApi';
import { ASSESSMENT_TYPE_LABELS, timeAgo } from '../../lib/format';

const EMPTY_SUBJECTS = getZeroedSubjectStats();

export default function SubjectsPage() {
  const navigate = useNavigate();
  const { data, error } = useApi('/reviewee/overview');
  const subjectStats = data?.summary.subjects ?? EMPTY_SUBJECTS;

  return (
    <PortalLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '24px' }}>
        {/* LEFT: subject grid */}
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Subject Competencies</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
            Your competency in each Bar subject, based on lawyer-verified essays. Pick a subject to practice or review past answers.
          </p>
          {error && <p style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {SUBJECTS.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} stats={subjectStats[subject.slug] ?? EMPTY_SUBJECTS[subject.slug]} />
            ))}
          </div>
        </div>

        {/* RIGHT: streak, bar weights, recent exams */}
        <div style={{ display: 'grid', gap: '16px', alignContent: 'start' }}>
          <div style={{ background: 'var(--gold)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--navy)' }}>local_fire_department</span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.05em' }}>LEARNING STREAK</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px', color: 'var(--navy)' }}>
                {data?.summary.streakDays ?? 0} Days
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>balance</span>
              Bar Subject Weights
            </h4>
            {(data?.summary.groups ?? []).map((g) => (
              <div key={g.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', padding: '6px 0', borderTop: '1px solid var(--card-border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{g.label}</span>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{g.competency === null ? '—' : `${Math.round(g.competency)}%`} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({g.weight}%)</span></span>
              </div>
            ))}
            {!data && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Loading...</p>}
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>fact_check</span>
              Recent Examinations
            </h4>
            {(data?.recentResults ?? []).map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/assessments/${r.id}/results`)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px solid var(--card-border)', padding: '8px 0', cursor: 'pointer', color: 'var(--navy)' }}
              >
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ASSESSMENT_TYPE_LABELS[r.type]} • {timeAgo(r.submittedAt)}</div>
              </button>
            ))}
            {data && data.recentResults.length === 0 && (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>No exams completed yet.</p>
                <button
                  onClick={() => navigate('/assessments/start/daily')}
                  style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0 }}
                >
                  Start today's questions →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
