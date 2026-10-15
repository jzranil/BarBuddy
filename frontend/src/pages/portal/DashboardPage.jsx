import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import GaugeCircle from '../../components/portal/GaugeCircle';
import RadarChart from '../../components/portal/RadarChart';
import SubjectCard from '../../components/portal/SubjectCard';
import Button from '../../components/Button';
import { SUBJECTS, getZeroedSubjectStats, getZeroedUserSummary } from '../../data/subjects';
import { useApi } from '../../lib/useApi';
import { openSyllabusPdf } from '../../lib/useLawyerContent';
import { SkeletonPage, SkeletonList } from '../../components/common/Skeleton';

const REVIEWEE_PID = 'a11498ab-0a57-4ed2-9315-29167e6a2f63';

const ROLE_ROUTES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': '/superadmin', // Super Admin
  '6642db37-fe3f-4c6f-8b82-427b381a9c69': '/lawyer',     // Lawyer / Educator
};

const EMPTY_SUMMARY = getZeroedUserSummary();
const EMPTY_SUBJECTS = getZeroedSubjectStats();

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, error } = useApi('/reviewee/overview');
  const [actionError, setActionError] = useState('');

  const s = data?.summary;
  const userSummary = s
    ? {
        displayName: data.profile.name.split(' ')[0] || 'Reviewee',
        streakDays: s.streakDays,
        readinessScore: s.readinessScore,
        readinessLabel: s.readinessLabel,
        readinessRated: s.readinessRated,
        accuracy: s.accuracy,
        consistency: s.consistency,
        level: s.level,
        levelTitle: s.title,
        xpCurrent: s.xpCurrent,
        xpTarget: s.xpTarget,
      }
    : { ...EMPTY_SUMMARY, displayName: '…', readinessLabel: '' };
  const subjectStats = s?.subjects ?? EMPTY_SUBJECTS;
  const resume = data?.inProgress?.[0];
  const subscription = data?.subscription;
  const mockUnlock = data?.mockUnlock;

  // A reviewee chooses a review package first; that starts the daily rollout
  useEffect(() => {
    if (data?.needsPackage) navigate('/subscription', { replace: true });
  }, [data, navigate]);

  const runAction = async (action) => {
    setActionError('');
    try {
      if (action.type === 'package') navigate('/subscription');
      else if (action.type === 'daily' || action.type === 'mock') navigate(`/assessments/start/${action.type}`);
      else if (action.type === 'practice') navigate(`/assessments/start/practice?subject=${action.subjectSlug}`);
      else if (action.type === 'resource') await openSyllabusPdf(action.resourceId);
    } catch (err) {
      setActionError(err.message);
    }
  };

  // Authenticate & verify permission on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const { pid } = JSON.parse(storedUser);
      if (pid !== REVIEWEE_PID) {
        const targetRoute = ROLE_ROUTES[pid] || '/login';
        navigate(targetRoute, { replace: true });
      }
    } catch (err) {
      console.error('Invalid user session data:', err);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Only the Bar subjects in the reviewee's package
  const packageSlugs = data?.subscription?.subjectSlugs;
  const mySubjects = packageSlugs ? SUBJECTS.filter((s) => packageSlugs.includes(s.slug)) : SUBJECTS;

  const radarAxes = mySubjects.map((s) => ({
    label: s.name.replace(' Law', ''),
    value: subjectStats[s.slug]?.score ?? 0,
  }));

  if (!data && !error) {
    return (
      <PortalLayout>
        <SkeletonPage />
      </PortalLayout>
    );
  }

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
              PH BAR {new Date().getFullYear() + 1} CANDIDATE
            </span>
            <h1 style={{ color: '#fff', fontSize: '30px', marginBottom: '14px' }}>
              Welcome back, {userSummary.displayName}!
            </h1>
            <p style={{ color: '#cfd3dc', fontSize: '14px', lineHeight: 1.7, maxWidth: '520px' }}>
              You are currently on a{' '}
              <strong style={{ color: 'var(--gold)' }}>{userSummary.streakDays}-day learning streak</strong>.{' '}
              {userSummary.readinessRated
                ? <>Your Bar readiness is <strong style={{ color: 'var(--gold)' }}>{userSummary.readinessLabel.toLowerCase()}</strong> based on your AI-scored essays.</>
                : 'Answer your daily questions — your readiness score appears once the AI scores your essays.'}
            </p>
            {subscription?.active && (
              <p style={{ color: '#cfd3dc', fontSize: '12px', margin: '0 0 8px' }}>
                <strong style={{ color: '#fff' }}>{subscription.name}</strong> · {subscription.tagline} · {subscription.daysLeft} day{subscription.daysLeft === 1 ? '' : 's'} left ·
                {data.dailyStatus === 'done' ? " today's questions done" : data.dailyStatus === 'in_progress' ? " today's questions in progress" : " today's questions ready"}
              </p>
            )}
            {error && <p style={{ color: '#fca5a5', fontSize: '13px' }}>{error}</p>}
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {resume ? (
              <Button variant="gold" onClick={() => navigate(`/assessments/${resume.id}`)}>
                Resume Latest Assessment
              </Button>
            ) : data?.dailyStatus === 'done' ? (
              mockUnlock?.unlocked ? (
                <Button variant="gold" onClick={() => navigate('/assessments/start/mock')}>
                  Take a Mock Bar Exam
                </Button>
              ) : (
                <Button variant="gold" onClick={() => navigate('/subjects')}>
                  Practice a Subject
                </Button>
              )
            ) : (
              <Button variant="gold" onClick={() => navigate('/assessments/start/daily')}>
                Start Today's Questions
              </Button>
            )}
            <Button variant="outline-light" onClick={() => navigate('/assessments')}>
              My Assessments
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
              {userSummary.readinessRated ? userSummary.readinessLabel : 'Based on your scored essays, weighted by Bar subject'}
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
            {packageSlugs ? `Your ${mySubjects.length} ${data.subscription.name} subjects` : 'Subject mastery across the 8 Bar subjects'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {radarAxes.length >= 3 ? (
              <RadarChart axes={radarAxes} size={230} />
            ) : (
              <div style={{ width: '100%', display: 'grid', gap: '14px', padding: '20px 0' }}>
                {radarAxes.map((a) => (
                  <div key={a.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                      <span>{a.label}</span>
                      <strong>{Math.round(a.value)}%</strong>
                    </div>
                    <div style={{ height: '8px', background: 'var(--card-border)', borderRadius: '999px' }}>
                      <div style={{ width: `${Math.min(100, a.value)}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {mySubjects.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} stats={subjectStats[subject.slug] ?? EMPTY_SUBJECTS[subject.slug]} compact />
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
            <InfoRow icon="local_fire_department" label="LEARNING STREAK" value={`${userSummary.streakDays} Days`} sublabel={userSummary.streakDays ? 'Keep it going today' : 'Start a streak today'} />
            {mockUnlock && (
              <InfoRow
                icon={mockUnlock.unlocked ? 'lock_open' : 'lock'}
                label="MOCK BAR EXAMS"
                value={mockUnlock.unlocked ? 'Unlocked' : 'Locked'}
                sublabel={
                  mockUnlock.unlocked
                    ? '20 essays per exam day'
                    : `Unlocks at Level ${mockUnlock.rule.level} or a ${mockUnlock.rule.streak_days}-day streak`
                }
              />
            )}
            <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>EXPERIENCE POINTS</span>
                <span>{userSummary.xpCurrent} / {userSummary.xpTarget} XP</span>
              </div>
              <div style={{ height: '6px', borderRadius: '999px', background: 'var(--card-border)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, (userSummary.xpCurrent / userSummary.xpTarget) * 100)}%`, height: '100%', background: 'var(--navy)' }} />
              </div>
              <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                {userSummary.xpCurrent ? `${userSummary.xpTarget - userSummary.xpCurrent} XP to Level ${userSummary.level + 1}` : 'Complete your first assessment to start earning XP.'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>psychology</span>
            Recommended for You
          </h3>
          {actionError && <p style={{ fontSize: '12px', color: '#c0392b' }}>{actionError}</p>}
          <div style={{ display: 'grid', gap: '10px' }}>
            {(data?.recommendations ?? []).map((r) => (
              <RecommendationRow
                key={r.title}
                icon={r.icon}
                title={r.title}
                description={r.description}
                onClick={r.action.type === 'tip' ? undefined : () => runAction(r.action)}
              />
            ))}
            {data && data.recommendations.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>You're on track. Keep answering your daily questions.</p>
            )}
            {!data && !error && <SkeletonList rows={2} />}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>event</span>
            Upcoming Exams
          </h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            {(data?.upcoming ?? []).map((u) => (
              <RecommendationRow
                key={u.id || u.kind}
                icon={u.kind === 'resume' ? 'play_circle' : u.kind === 'daily' ? 'today' : 'assignment'}
                title={u.kind === 'resume' ? `Resume: ${u.title}` : u.title}
                description={u.kind === 'resume' ? `${u.minutesLeft} minute${u.minutesLeft === 1 ? '' : 's'} left before it auto-submits` : u.detail}
                onClick={() => (u.kind === 'resume' ? navigate(`/assessments/${u.id}`) : navigate(`/assessments/start/${u.kind}`))}
              />
            ))}
            {data && data.upcoming.length === 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No pending exams.</p>
              </div>
            )}
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
      disabled={!onClick}
      style={{
        textAlign: 'left',
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderLeft: '3px solid var(--gold)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        color: 'var(--navy)',
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