import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, Navigate } from 'react-router-dom';
import Button from '../../components/Button';
import { SUBJECTS } from '../../data/subjects';
import { useApi, startAssessment } from '../../lib/useApi';
import { apiRequest } from '../../lib/api';

const TITLES = {
  daily: "Today's Daily Questions",
  mock: 'Mock Bar Examination',
  practice: 'Practice Set',
};

const DESCRIPTIONS = {
  daily: "Today's essay questions from your package subjects, released at 7:00 AM. You never get the same question twice. Completing them keeps your learning streak alive.",
  mock: "A Mock Bar for one examination day: 20 essays divided among that day's subjects using the Bar subject weights.",
  practice: 'A focused set of essays from one subject to target a weak area. Your first practice set each day earns XP.',
};

const subjectName = (slug) => SUBJECTS.find((s) => s.slug === slug)?.name ?? slug;

// Intentionally NOT wrapped in PortalLayout — a full-screen, distraction-free
// card before the simulated examination environment.
export default function AssessmentIntroPage() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subjectSlug = searchParams.get('subject');
  const subject = SUBJECTS.find((s) => s.slug === subjectSlug);
  const { data } = useApi('/reviewee/config');
  const { data: plan } = useApi(type === 'mock' ? '/assessments/mock-plan' : null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [needsPackage, setNeedsPackage] = useState(false);
  const [completedId, setCompletedId] = useState(null);
  const [pickedDay, setPickedDay] = useState(null);

  const includedDays = (plan?.days || []).filter((d) => d.included);
  const examDay = pickedDay ?? includedDays[0]?.day ?? null;
  const mockLocked = type === 'mock' && plan && !plan.unlock.unlocked;

  if (!TITLES[type] || (type === 'practice' && !subject)) {
    return <Navigate to="/assessments" replace />;
  }

  const config = data?.config?.[type];
  const totalMinutes = config ? config.reading_minutes + config.time_limit_minutes : null;

  const instructions = [
    config?.reading_minutes
      ? `You start with a ${config.reading_minutes}-minute reading period. Read the questions first — you can begin answering early with "Start Answering".`
      : 'You can start answering right away.',
    'Your answers are auto-saved as you type, even if your internet connection drops briefly.',
    'The timer keeps running if you leave. When time runs out, your answers are submitted automatically.',
    'Structure each answer with ALAC: Answer, Legal Basis, Application, Conclusion.',
    'Blank answers score 0.0 under the five-point standard. Lawyers grade every other answer.',
  ];

  const begin = async () => {
    setStarting(true);
    setError('');
    try {
      const id = await startAssessment(type, subjectSlug, type === 'mock' ? examDay : undefined);
      navigate(`/assessments/${id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setNeedsPackage(Boolean(err.details?.needsPackage));
      // Today's daily set was already done: offer its results instead
      if (type === 'daily') {
        apiRequest('/assessments?type=daily')
          .then((r) => setCompletedId(r.assessments.find((a) => a.status === 'submitted')?.id ?? null))
          .catch(() => {});
      }
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '560px', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-card)', padding: '36px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--navy)' }}>
            {type === 'mock' ? 'assignment' : type === 'daily' ? 'today' : 'edit_note'}
          </span>
        </div>

        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
          {type === 'practice' ? `${subject.name} ${TITLES.practice}` : TITLES[type]}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '26px' }}>{DESCRIPTIONS[type]}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <InfoBox label="TOTAL QUESTIONS" value={config ? `${config.questions} Essays` : '…'} />
          <InfoBox label="READING PERIOD" value={config ? `${config.reading_minutes} Minutes` : '…'} />
          <InfoBox label="ANSWER TIME" value={config ? `${config.time_limit_minutes} Minutes` : '…'} />
        </div>

        {type === 'mock' && plan && (
          <div style={{ textAlign: 'left', marginBottom: '24px' }}>
            {mockLocked ? (
              <div style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: '10px', padding: '12px 14px', fontSize: '13px' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>lock</span>
                  Mock Bar Examinations are locked
                </strong>
                Reach <strong>Level {plan.unlock.rule.level}</strong> or a <strong>{plan.unlock.rule.streak_days}-day learning streak</strong> to unlock them.
                You are Level {plan.unlock.level} with a best streak of {plan.unlock.streak} day{plan.unlock.streak === 1 ? '' : 's'}.
              </div>
            ) : (
              <>
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Choose the examination day</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {plan.days.map((d) => (
                    <label
                      key={d.day}
                      style={{
                        display: 'block',
                        border: `1px solid ${examDay === d.day ? 'var(--navy)' : 'var(--card-border)'}`,
                        borderRadius: '10px',
                        padding: '10px 12px',
                        opacity: d.included ? 1 : 0.5,
                        cursor: d.included ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700 }}>
                        <input type="radio" name="exam-day" disabled={!d.included} checked={examDay === d.day} onChange={() => setPickedDay(d.day)} />
                        {d.label}{d.included ? '' : ' (not in your package)'}
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 24px' }}>
                        {d.allocation.map((a) => `${a.count} ${subjectName(a.slug)}`).join(' · ')}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: 'left', marginBottom: '28px' }}>
          <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--gold)' }}>info</span>
            Instructions:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '8px' }}>
            {instructions.map((line) => (
              <li key={line} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{line}</li>
            ))}
          </ul>
          {totalMinutes && (
            <p style={{ fontSize: '12px', color: 'var(--navy)', marginTop: '12px', marginBottom: 0 }}>
              Total session time: <strong>{totalMinutes} minutes</strong>.
            </p>
          )}
        </div>

        {error && (
          <div role="alert" style={{ background: '#fdf0f0', color: '#9b1c1c', border: '1px solid #e5b8b8', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px', textAlign: 'left' }}>
            {error}
            {needsPackage && (
              <button onClick={() => navigate('/subscription')} style={{ display: 'block', marginTop: '6px', background: 'none', border: 'none', padding: 0, color: '#9b1c1c', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                Choose a review package
              </button>
            )}
            {completedId && (
              <button onClick={() => navigate(`/assessments/${completedId}/results`)} style={{ display: 'block', marginTop: '6px', background: 'none', border: 'none', padding: 0, color: '#9b1c1c', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                View today's results
              </button>
            )}
          </div>
        )}

        <Button variant="navy" fullWidth onClick={begin} disabled={starting || !config || (type === 'mock' && (!plan || mockLocked || !examDay))}>
          {starting ? 'Preparing your questions...' : 'Start Examination'}
        </Button>
        <button onClick={() => navigate('/dashboard')} style={{ marginTop: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer' }}>
          Cancel and Return to Dashboard
        </button>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px', textAlign: 'left' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '17px' }}>{value}</div>
    </div>
  );
}
