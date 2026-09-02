import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
import VerificationTable from '../../components/lawyer/VerificationTable';
import { DUMMY_VERIFICATION_QUEUE, TOTAL_PENDING_VERIFICATIONS, CASE_DETAILS } from '../../data/lawyer';

export default function VerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [revieweeSearch, setRevieweeSearch] = useState('');

  const requestedId = searchParams.get('case');
  const selectedCase = DUMMY_VERIFICATION_QUEUE.find((c) => c.id === requestedId) ?? DUMMY_VERIFICATION_QUEUE[0];
  const detail = CASE_DETAILS[selectedCase.id]; // undefined for every case except the demo one

  const [score, setScore] = useState(detail?.initialScore ?? selectedCase.aiScore);
  const [comments, setComments] = useState('');

  // Reset the editable fields whenever a different case is selected.
  useEffect(() => {
    setScore(detail?.initialScore ?? selectedCase.aiScore);
    setComments('');
  }, [selectedCase.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePublish = () => {
    // BACKEND TODO: PATCH /api/lawyer/verification-queue/{id} with the
    // adjusted score + comments, then move to the next case in the queue.
    navigate('/coming-soon', { state: { title: 'Verify & Publish Feedback', description: 'Publishing verified feedback to the reviewee will connect here once the backend exists.' } });
  };

  const handleFlag = () => {
    navigate('/coming-soon', { state: { title: 'Flag for Admin Review', description: 'Escalating a case to an admin will connect here once the backend exists.' } });
  };

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Content Management & Quality Control</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Verify reviewees answers and AI-generated feedback.
          </p>
        </div>
        <div style={{ position: 'relative', width: '280px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', color: 'var(--text-muted)' }}>
            search
          </span>
          <input
            value={revieweeSearch}
            onChange={(e) => setRevieweeSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && revieweeSearch.trim()) {
                // BACKEND TODO: GET /api/lawyer/reviewees?search=... then
                // jump to that reviewee's submission history.
                navigate('/coming-soon', { state: { title: 'Find Reviewee', description: `Searching for "${revieweeSearch}" across all submissions will connect here once the backend exists.` } });
              }
            }}
            placeholder="Search reviewee by name or email..."
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff' }}
          />
        </div>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid var(--card-border)', background: '#fff', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: 600, marginBottom: '20px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy)' }}>fact_check</span>
        AI Feedback Verification
      </div>

      <div style={{ marginBottom: '28px' }}>
        <VerificationTable cases={DUMMY_VERIFICATION_QUEUE} totalCount={TOTAL_PENDING_VERIFICATIONS} selectedId={selectedCase.id} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* LEFT: submission + AI critique */}
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>layers</span>
                Reviewee Submission
              </h3>
              <span style={{ fontSize: '11px', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '4px 10px', color: 'var(--text-muted)' }}>
                {detail?.submittedLabel ?? 'Submission details pending'}
              </span>
            </div>

            {detail ? (
              <>
                <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Question: {detail.question}</p>
                <blockquote style={{ borderLeft: '3px solid var(--navy)', background: 'var(--bg)', margin: 0, padding: '14px 16px', fontStyle: 'italic', fontSize: '13px', lineHeight: 1.7 }}>
                  "{detail.revieweeAnswer}"
                </blockquote>
              </>
            ) : (
              // BACKEND TODO: every case besides the demo one will show its
              // real question/answer here once GET /api/lawyer/verification-queue/{id} exists.
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Full submission content for {selectedCase.reviewee}'s {selectedCase.subject} answer will load here
                once connected to the backend.
              </p>
            )}
          </div>

          <div style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>forum</span>
                AI-Generated ALAC Feedback
              </h3>
              <button
                onClick={() => navigate('/coming-soon', { state: { title: 'Regenerate AI Analysis', description: 'Re-running the AI grader on this submission connects here once the backend exists.' } })}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Regenerate AI Analysis
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>trending_up</span>
                AI ALAC Critique
              </div>
              <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0 }}>
                {detail?.aiCritique ?? 'The AI critique for this submission will appear here once connected to the backend.'}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: lawyer verification panel */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'var(--navy)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>Lawyer Verification</span>
              <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '999px', padding: '3px 10px' }}>
                In Review
              </span>
            </div>

            <div style={{ background: '#fff', padding: '18px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                ADJUST OVERALL SCORE&nbsp;<span style={{ fontWeight: 400 }}>(CURRENT: {score})</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '16px', fontWeight: 700, textAlign: 'center' }}
                />
                <div style={{ display: 'grid', gap: '4px' }}>
                  <button onClick={() => setScore((s) => Math.min(100, s + 1))} style={stepperButtonStyle}>+</button>
                  <button onClick={() => setScore((s) => Math.max(0, s - 1))} style={stepperButtonStyle}>−</button>
                </div>
              </div>

              <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                LAWYER COMMENTS / CORRECTIONS
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)} // BACKEND TODO: debounce + auto-save this field
                placeholder="Add specific guidance or correct the AI's legal basis..."
                rows={5}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', resize: 'vertical', marginBottom: '6px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span>Auto-saving...</span>
                <span>{comments.length} characters</span>
              </div>

              <button
                onClick={handlePublish}
                style={{ width: '100%', background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                Verify & Publish Feedback
              </button>
              <button
                onClick={handleFlag}
                style={{ width: '100%', background: '#fff', color: '#c0392b', border: '1px solid #c0392b', borderRadius: '8px', padding: '12px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Flag for Admin Review
              </button>
            </div>
          </div>

          {detail?.qualityAlert && (
            <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', gap: '10px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>warning</span>
              <div>
                <div style={{ color: 'var(--gold)', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>AI QUALITY ALERT</div>
                <p style={{ color: '#e8e6e0', fontSize: '12px', lineHeight: 1.6, margin: 0 }}>{detail.qualityAlert}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </LawyerLayout>
  );
}

const stepperButtonStyle = {
  width: '28px',
  height: '17px',
  border: '1px solid var(--card-border)',
  background: '#fff',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer',
  lineHeight: 1,
};
