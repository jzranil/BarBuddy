import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';
import { useApi } from '../../lib/useApi';
import AiComparisonCard from '../../components/common/AiComparisonCard';
import { aiRetryPending } from '../../lib/format';
import HighlightableText, { HighlightToolbar } from '../../components/common/HighlightableText';
import { useHighlights } from '../../lib/useHighlights';
import { ALAC_COMPONENTS, ASSESSMENT_TYPE_LABELS, GRADING_STANDARD, alacRatingLabel, formatDateTime, tidyQuestionText } from '../../lib/format';
import { SkeletonPage } from '../../components/common/Skeleton';

// Assessment Feedback page (paper Figure 3.27): overall score, readiness level,
// ALAC-based feedback per component and the lawyer's verified evaluation.
export default function ExamResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, error, reload } = useApi(`/assessments/${id}/results`);
  const [openIndexes, setOpenIndexes] = useState(() => new Set([0]));
  const [printing, setPrinting] = useState(false);
  const { highlights, enabled: canHighlight, add, recolor, remove } = useHighlights(id);
  const justSubmitted = location.state?.justSubmitted;

  // Refresh while Gemini is still comparing answers (not while an essay waits
  // minutes or hours for a retry because Gemini was busy)
  const aiWorking = Boolean(
    data?.questions?.some((q) => ['pending', 'processing'].includes(q.feedback?.ai?.status) && !aiRetryPending(q.feedback.ai))
  );
  useEffect(() => {
    if (!aiWorking) return undefined;
    const timer = setInterval(reload, 8000);
    return () => clearInterval(timer);
  }, [aiWorking, reload]);

  // The PDF report always shows every essay, then the page goes back as it was.
  // flushSync because the browser captures the page right after beforeprint.
  useEffect(() => {
    const onBeforePrint = () => flushSync(() => setPrinting(true));
    const onAfterPrint = () => setPrinting(false);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  if (error) {
    return (
      <PortalLayout>
        <p style={{ color: '#c0392b' }}>{error}</p>
        <Button variant="navy" onClick={() => navigate('/assessments')}>Back to My Assessments</Button>
      </PortalLayout>
    );
  }

  if (!data) {
    return (
      <PortalLayout>
        <SkeletonPage />
      </PortalLayout>
    );
  }

  const { assessment, summary, questions } = data;
  const allOpen = questions.every((_, index) => openIndexes.has(index));

  const toggleQuestion = (index) => {
    const next = new Set(openIndexes);
    if (!next.delete(index)) next.add(index);
    setOpenIndexes(next);
  };

  return (
    <PortalLayout>
      <div className="no-print" style={{ marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/assessments')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_left</span>
          My Assessments
        </button>
      </div>

      {justSubmitted && (
        <div role="status" style={{ background: '#e8f5e9', border: '1px solid #b7dfba', color: '#2e7d32', borderRadius: '10px', padding: '14px 18px', marginBottom: '18px', fontSize: '13px' }}>
          <strong>{location.state.auto ? 'Time is up — your answers were submitted automatically.' : 'Your answers were submitted.'}</strong>{' '}
          {location.state.xpEarned ? `You earned ${location.state.xpEarned} XP. ` : ''}
          Compare your answers with the suggested answers below. A lawyer will grade each essay on the five-point standard; your results update here once verified.
          {location.state.newAchievements?.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: '-3px', marginRight: '4px' }}>military_tech</span>
              New badge{location.state.newAchievements.length === 1 ? '' : 's'} unlocked: <strong>{location.state.newAchievements.join(', ')}</strong>
            </div>
          )}
        </div>
      )}

      {data.ai && !data.ai.configured && (
        <div role="note" style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: '10px', padding: '12px 16px', marginBottom: '18px', fontSize: '13px', display: 'flex', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gold)' }}>info</span>
          <span>
            <strong>AI comparison is not integrated yet.</strong> Each essay shows where the Gemini comparison will appear. Your answers are still checked for ALAC structure and graded by a lawyer.
          </span>
        </div>
      )}

      {/* Header card */}
      <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', margin: 0 }}>{assessment.title}</h1>
            {summary.fullyVerified && (
              <span style={{ fontSize: '10px', fontWeight: 700, background: '#fdf7e9', border: '1px solid var(--gold)', color: 'var(--navy)', borderRadius: '999px', padding: '3px 10px' }}>
                Lawyer Verified
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
            Submitted {formatDateTime(assessment.submittedAt)} • {ASSESSMENT_TYPE_LABELS[assessment.type]}
            {assessment.autoSubmitted ? ' • Auto-submitted' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Metric label="SCORE">
            {summary.score === null ? '—' : summary.score}
            <span style={{ fontSize: '14px', fontWeight: 400 }}>{summary.score === null ? '' : '/100'}</span>
          </Metric>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>READINESS</div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '4px 12px', display: 'inline-block', marginTop: '2px' }}>
              {summary.readinessLabel}
            </span>
          </div>
          <div style={{ minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <span>VERIFIED</span>
              <span>{summary.verified}/{summary.totalQuestions}</span>
            </div>
            <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px' }}>
              <div style={{ width: `${(summary.verified / Math.max(1, summary.totalQuestions)) * 100}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {canHighlight && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '220px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>ink_highlighter</span>
            Select any text in a question or answer to highlight it. Your highlights are saved and only you can see them.
          </p>
        )}
        <button
          onClick={() => setOpenIndexes(allOpen ? new Set() : new Set(questions.map((_, index) => index)))}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{allOpen ? 'unfold_less' : 'unfold_more'}</span>
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* One section per essay */}
      <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
        {questions.map((q, index) => (
          <QuestionResult key={q.submissionId} q={q} highlights={highlights} open={printing || openIndexes.has(index)} onToggle={() => toggleQuestion(index)} />
        ))}
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
        <Button variant="outline" onClick={() => window.print()}>Download PDF Report</Button>
        <Button variant="navy" onClick={() => navigate('/dashboard')}>Back to Dashboard →</Button>
      </div>

      {canHighlight && <HighlightToolbar highlights={highlights} onAdd={add} onRecolor={recolor} onRemove={remove} />}
    </PortalLayout>
  );
}

function QuestionResult({ q, highlights, open, onToggle }) {
  const fb = q.feedback;
  const hasScore = fb?.score !== null && fb?.score !== undefined;
  const grade = hasScore ? GRADING_STANDARD.find((g) => g.score === Math.round(fb.score)) : null;
  const statusLabel = !hasScore
    ? 'Awaiting AI score'
    : fb.status === 'verified'
      ? `${fb.score}/5 • Lawyer verified`
      : fb.status === 'flagged'
        ? `${fb.score}/5 • Flagged`
        : `${fb.score}/5 • AI scored`;

  return (
    <div style={{ border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: '100%', background: 'var(--navy)', border: 'none', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', textAlign: 'left' }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>description</span>
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, flex: 1, minWidth: 0 }}>
          {q.order}. {q.subject} — {q.title}
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy)', background: hasScore ? 'var(--gold)' : '#e8e6e0', borderRadius: '999px', padding: '3px 10px', whiteSpace: 'nowrap' }}>
          {statusLabel}
        </span>
        <span className="material-symbols-outlined no-print" style={{ color: '#fff', fontSize: '18px' }}>{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div style={{ padding: '18px 20px', display: 'grid', gap: '16px' }}>
          <HighlightableText
            text={tidyQuestionText(q.question)}
            submissionId={q.submissionId}
            target="question"
            highlights={highlights}
            style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line', textAlign: 'justify', hyphens: 'auto' }}
          />

          <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={sectionLabel}>YOUR ANSWER</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{q.wordCount} Words</span>
            </div>
            {q.answer ? (
              <HighlightableText text={q.answer} submissionId={q.submissionId} target="answer" highlights={highlights} style={blockText} />
            ) : (
              <p style={blockText}><em style={{ color: 'var(--text-muted)' }}>No answer given.</em></p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#fdf7e9', border: '1px solid var(--gold)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>balance</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Suggested (Model) Answer</span>
              </div>
              {q.modelAnswer ? (
                <HighlightableText text={q.modelAnswer} submissionId={q.submissionId} target="model_answer" highlights={highlights} style={blockText} />
              ) : (
                <p style={blockText}><em style={{ color: 'var(--text-muted)' }}>No suggested answer has been provided for this question yet.</em></p>
              )}
            </div>

            <div style={{ background: '#eef0f7', border: '1px solid var(--navy)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>rule</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>ALAC Breakdown</span>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {ALAC_COMPONENTS.map((c) => {
                  const lawyerRating = hasScore ? fb.alac[c.key] : null;
                  const detected = fb?.structure?.[c.key];
                  return (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', color: 'var(--navy)' }}>
                      <span><strong>{c.label}</strong></span>
                      <span>
                        {lawyerRating !== null && lawyerRating !== undefined
                          ? alacRatingLabel(lawyerRating)
                          : detected === undefined
                            ? '—'
                            : detected
                              ? 'Detected'
                              : 'Not detected'}
                      </span>
                    </div>
                  );
                })}
              </div>
              {fb?.structure?.notes?.length > 0 && !hasScore && (
                <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--navy)', lineHeight: 1.6 }}>
                  {fb.structure.notes.map((n) => <li key={n}>{n}</li>)}
                </ul>
              )}
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '10px 0 0' }}>
                {hasScore ? 'ALAC ratings by the AI evaluation.' : 'Automated structure check (rule-based) until the AI rates your ALAC.'}
              </p>
            </div>
          </div>

          <AiComparisonCard ai={fb?.ai} />

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderTop: '3px solid var(--gold)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--navy)' }}>verified</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Score & Review</span>
              {fb?.verifiedBy && (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {fb.verifiedBy} • {formatDateTime(fb.verifiedAt)}
                </span>
              )}
            </div>
            {hasScore ? (
              <>
                <p style={{ fontSize: '13px', margin: '0 0 8px', color: 'var(--navy)' }}>
                  <strong>AI score: {Number(fb.score).toFixed(1)} — {grade?.label}.</strong> {grade?.criteria}
                </p>
                <p style={{ fontSize: '12px', margin: fb.status !== 'pending' && fb.comment ? '0 0 8px' : 0, color: fb.status === 'verified' ? '#2e7d32' : fb.status === 'flagged' ? '#8a6514' : 'var(--text-muted)' }}>
                  {fb.status === 'verified'
                    ? 'A lawyer checked and verified this AI result.'
                    : fb.status === 'flagged'
                      ? 'A Review Administrator flagged this AI result. See the annotation below.'
                      : 'A Review Administrator will check this AI result.'}
                </p>
                {fb.status !== 'pending' && fb.comment && (
                  <div style={{ background: fb.status === 'verified' ? '#f1f8f2' : '#fdf7e9', border: `1px solid ${fb.status === 'verified' ? '#a5d6a7' : 'var(--gold)'}`, borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: fb.status === 'verified' ? '#2e7d32' : '#8a6514', marginBottom: '4px' }}>
                      {fb.status === 'verified' ? "LAWYER'S COMMENT" : 'REVIEWER ANNOTATION'}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{fb.comment}</p>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Your score and ALAC rating appear here once the AI scores this essay.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, children }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '26px' }}>{children}</div>
    </div>
  );
}

const blockText = { fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' };
const sectionLabel = { fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)' };
