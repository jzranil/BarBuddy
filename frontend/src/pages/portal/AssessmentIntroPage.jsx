import { useNavigate, useParams, Navigate } from 'react-router-dom';
import Button from '../../components/Button';
import { SUBJECTS } from '../../data/subjects';
import { getDummyExamById } from '../../data/exams';

// BACKEND TODO: swap this static list for real copy from a
// GET /api/exams/{examId} "rules" field, or keep it static if the rules are
// the same for every exam — either way, this component doesn't need to change.
const INSTRUCTIONS = [
  'This is a distraction-free environment. Leaving this tab may be logged.',
  'Your progress is auto-saved every 30 seconds.',
  'Ensure a stable internet connection for the final submission.',
  'The use of external AI or legal databases is strictly prohibited.',
];

// Intentionally NOT wrapped in PortalLayout — the mockup shows this as a
// full-screen, distraction-free card with no sidebar/topbar, matching the
// "distraction-free environment" instruction on the card itself.
export default function AssessmentIntroPage() {
  const { slug, examId } = useParams();
  const navigate = useNavigate();

  const subject = SUBJECTS.find((s) => s.slug === slug);
  const exam = subject ? getDummyExamById(slug, subject.name, examId) : null;

  if (!subject || !exam) {
    return <Navigate to="/subjects" replace />;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: '#fff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-card)',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--navy)' }}>
            description
          </span>
        </div>

        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>
          Mock Bar Assessment: {subject.name}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '26px' }}>
          Please read the instructions carefully before starting the exam.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px', textAlign: 'left' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>DURATION</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '17px' }}>{exam.durationMinutes} Minutes</div>
          </div>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px', textAlign: 'left' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>TOTAL QUESTIONS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '17px' }}>{exam.totalQuestions} Scenarios</div>
          </div>
        </div>

        <div style={{ textAlign: 'left', marginBottom: '28px' }}>
          <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--gold)' }}>info</span>
            Instructions:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '8px' }}>
            {INSTRUCTIONS.map((line) => (
              <li key={line} style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <Button
          variant="navy"
          fullWidth
          onClick={() => navigate(`/subjects/${slug}/exams/${examId}/take`)}
        >
          Start Examination
        </Button>

        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginTop: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Cancel and Return to Dashboard
        </button>
      </div>
    </div>
  );
}
