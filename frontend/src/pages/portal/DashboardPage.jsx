import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import GaugeCircle from '../../components/portal/GaugeCircle';
import RadarChart from '../../components/portal/RadarChart';
import SubjectCard from '../../components/portal/SubjectCard';
import Button from '../../components/Button';
import { SUBJECTS, getZeroedSubjectStats, getZeroedUserSummary } from '../../data/subjects';

// BACKEND TODO: fetch these two from the API instead of the zeroed helpers,
// e.g. via a useEffect + useState pair once GET /api/reviewee/summary and
// GET /api/reviewee/subjects exist. Field names already match what the
// components expect, so swapping the data source shouldn't require touching
// any JSX below.
const userSummary = getZeroedUserSummary();
const subjectStats = getZeroedSubjectStats();

export default function DashboardPage() {
  const navigate = useNavigate();

  const radarAxes = SUBJECTS.map((s) => ({
    label: s.name.replace(' Law', ''),
    value: subjectStats[s.slug].score,
  }));

  return (
    <PortalLayout>
      {/* HERO + READINESS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Welcome card */}
        <div
          style={{
            background: 'var(--navy)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
          }}
        >
          <div>
            <span
              style={{
                display: 'inline-block',
                background: 'var(--gold)',
                color: 'var(--navy)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                padding: '5px 12px',
                borderRadius: '999px',
                marginBottom: '16px',
              }}
            >
              PH BAR 2024 CANDIDATE
            </span>
            <h1 style={{ color: '#fff', fontSize: '30px', marginBottom: '14px' }}>
              Welcome back, {userSummary.displayName}!
            </h1>
            {/* BACKEND TODO: streak / outperform copy — currently reads 0 because there's no history yet */}
            <p style={{ color: '#cfd3dc', fontSize: '14px', lineHeight: 1.7, maxWidth: '520px' }}>
              You are currently on a{' '}
              <strong style={{ color: 'var(--gold)' }}>{userSummary.streakDays}-day learning streak</strong>.
              Once you complete your first mock exam, we'll show how you compare to other candidates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              variant="gold"
              onClick={() =>
                navigate('/coming-soon', {
                  state: { title: 'Resume Last Assessment', description: 'Pick up where you left off — available once an assessment has been started.' },
                })
              }
            >
              Resume Last Assessment
            </Button>
            <Button
              variant="outline-light"
              onClick={() => navigate('/subscription')}
            >
              View Study Plan
            </Button>
          </div>
        </div>

        {/* Bar Readiness Score */}
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>track_changes</span>
              Bar Readiness Score
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Predicted chance of passing based on current competency
            </p>
          </div>

          <GaugeCircle value={userSummary.readinessScore} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '16px' }}>
            <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ACCURACY</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '17px' }}>{userSummary.accuracy}%</div>
            </div>
            <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CONSISTENCY</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '17px' }}>{userSummary.consistency}</div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPETENCY PROFILE + SUBJECT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Competency Profile</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Subject mastery across the 8 bar pillars
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadarChart axes={radarAxes} size={230} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--navy)', marginRight: 6 }} />Your Level</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px' }}>Subject Competency</h3>
            <button
              onClick={() => navigate('/subjects')}
              style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              View Detailed Breakdown
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {SUBJECTS.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} stats={subjectStats[subject.slug]} compact />
            ))}
          </div>
        </div>
      </div>

      {/* STUDY PROGRESS / AI RECOMMENDATIONS / UPCOMING EXAMS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        {/* Study Progress */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Study Progress</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <InfoRow icon="military_tech" label="CURRENT LEVEL" value={`Level ${userSummary.level}`} sublabel={userSummary.levelTitle} />
            <InfoRow icon="local_fire_department" label="LEARNING STREAK" value={`${userSummary.streakDays} Days`} sublabel="Start a streak today" />
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>EXPERIENCE POINTS</span>
                <span>{userSummary.xpCurrent} / {userSummary.xpTarget} XP</span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'var(--card-border)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (userSummary.xpCurrent / userSummary.xpTarget) * 100)}%`, height: '100%', background: 'var(--navy)' }} />
              </div>
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                Complete your first assessment to start earning XP.
              </p>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>psychology</span>
            AI Recommendations
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {/* BACKEND TODO: replace this placeholder list with real recommendations from the telemetry-ai-parser Lambda */}
            <RecommendationRow
              icon="balance"
              title="Take your first diagnostic exam"
              description="We'll generate personalized recommendations after your baseline assessment."
              onClick={() => navigate('/coming-soon', { state: { title: 'Diagnostic Exam', description: 'Baseline assessment flow — coming once the backend is connected.' } })}
            />
          </div>
        </div>

        {/* Upcoming Exams */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>event</span>
            Upcoming Exams
          </h3>
          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No pending exams.</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}

function InfoRow({ icon, label, value, sublabel }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '16px' }}>
          {value} <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: '12px', color: 'var(--text-muted)' }}>{sublabel}</span>
        </div>
      </div>
    </div>
  );
}

function RecommendationRow({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderLeft: '3px solid var(--gold)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        gap: '12px',
        cursor: 'pointer',
      }}
    >
      <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '20px', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '3px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</div>
      </div>
    </button>
  );
}
