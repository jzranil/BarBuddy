import { useNavigate } from 'react-router-dom';
import Button from '../Button';

// exam: item from src/data/exams.js (getDummyExamsForSubject)
// slug: the subject slug, needed to build the /subjects/:slug/exams/:examId/... routes
export default function ExamRow({ exam, slug }) {
  const navigate = useNavigate();
  const completed = exam.status === 'completed';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '220px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>
            {exam.type === 'Mock Exam' ? 'menu_book' : 'bolt'}
          </span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4 style={{ fontSize: '14px', margin: 0 }}>{exam.title}</h4>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '999px',
                background: completed ? '#eef0f4' : '#f5f3ee',
                color: completed ? 'var(--navy)' : 'var(--text-muted)',
              }}
            >
              {completed ? 'COMPLETED' : 'NOT STARTED'}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            {exam.type} {exam.completedLabel ? `• ${exam.completedLabel}` : ''}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '18px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.04em' }}>DURATION</div>
          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{exam.durationMinutes} min</div>
        </div>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.04em' }}>DETAILS</div>
          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{exam.totalQuestions} Questions</div>
        </div>
        {completed && (
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.04em' }}>YOUR SCORE</div>
            <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{exam.score}%</div>
          </div>
        )}
      </div>

      {completed ? (
        <Button variant="outline" onClick={() => navigate(`/subjects/${slug}/exams/${exam.id}/results`)}>
          View
        </Button>
      ) : (
        <Button variant="navy" onClick={() => navigate(`/subjects/${slug}/exams/${exam.id}/intro`)}>
          Start Exam
        </Button>
      )}
    </div>
  );
}
