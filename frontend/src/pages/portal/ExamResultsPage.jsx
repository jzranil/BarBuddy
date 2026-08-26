import { useNavigate, useParams, Navigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';
import { SUBJECTS } from '../../data/subjects';
import { getDummyExamById, DEMO_RESULT } from '../../data/exams';

export default function ExamResultsPage() {
  const { slug, examId } = useParams();
  const navigate = useNavigate();

  const subject = SUBJECTS.find((s) => s.slug === slug);
  const exam = subject ? getDummyExamById(slug, subject.name, examId) : null;

  // Only the completed demo exam has full result content — an exam that
  // hasn't been taken yet has no results to show.
  if (!subject || !exam || exam.status !== 'completed') {
    return <Navigate to={`/subjects/${slug ?? ''}`} replace />;
  }

  const result = DEMO_RESULT; // BACKEND TODO: GET /api/exams/{examId}/results

  return (
    <PortalLayout>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate(`/subjects/${slug}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
        >
          {subject.name}
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
        </button>
      </div>

      {/* Header card */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--card-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '18px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', margin: 0 }}>{exam.title}</h1>
            {result.lawyerVerified && (
              <span style={{ fontSize: '10px', fontWeight: 700, background: '#fdf7e9', border: '1px solid var(--gold)', color: 'var(--navy)', borderRadius: '999px', padding: '3px 10px' }}>
                Lawyer Verified
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
            {exam.completedLabel} • Mock Exam #{exam.mockNumber}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SCORE</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>
              {result.score}<span style={{ fontSize: '14px', fontWeight: 400 }}>/{result.maxScore}</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>READINESS</div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '4px 12px', display: 'inline-block', marginTop: '2px' }}>
              {result.readinessLabel}
            </span>
          </div>
          <div style={{ minWidth: '110px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <span>PERCENTILE</span>
              <span>{result.percentile}th</span>
            </div>
            <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px' }}>
              <div style={{ width: `${result.percentile}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Question prompt */}
      <div style={{ background: 'var(--navy)', borderRadius: '10px 10px 0 0', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>description</span>
        <h3 style={{ color: '#fff', fontSize: '15px', margin: 0 }}>{result.question.title}</h3>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '18px 20px', marginBottom: '18px' }}>
        <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0 }}>{result.question.body}</p>
      </div>

      {/* Original answer */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px 20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>YOUR ORIGINAL ANSWER</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{result.originalAnswer.wordCount} Words</span>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0 }}>{result.originalAnswer.text}</p>
      </div>

      {/* Model answer + AI critique */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>balance</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Model Answer</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0 }}>{result.modelAnswer}</p>
        </div>
        <div style={{ background: '#eef0f7', border: '1px solid var(--navy)', borderRadius: 'var(--radius-md)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>trending_up</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>AI ALAC Critique</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0 }}>{result.aiCritique}</p>
        </div>
      </div>

      {/* Lawyer feedback */}
      <h3 style={{ fontSize: '17px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--navy)' }}>verified</span>
        Lawyer Feedback
      </h3>
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderTop: '3px solid var(--gold)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--card-border)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{result.lawyerFeedback.name}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: '999px', padding: '2px 8px' }}>VERIFIER</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {result.lawyerFeedback.role} • {result.lawyerFeedback.verifiedDate}
            </div>
          </div>
        </div>
        <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>gavel</span>
            Lawyer's Final Disposition
          </div>
          <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
            "{result.lawyerFeedback.disposition}"
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button
          variant="outline"
          onClick={() => navigate('/coming-soon', { state: { title: 'Download PDF Report', description: 'PDF export will be available once report generation is connected to the backend.' } })}
        >
          Download PDF Report
        </Button>
        <Button variant="navy" onClick={() => navigate('/dashboard')}>
          Back to Dashboard →
        </Button>
      </div>
    </PortalLayout>
  );
}
