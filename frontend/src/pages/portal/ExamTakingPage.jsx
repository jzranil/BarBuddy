import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { apiRequest } from '../../lib/api';
import { countWords, formatDuration, tidyQuestionText } from '../../lib/format';
import { confirmAction } from '../../lib/swal';
import { Skeleton } from '../../components/common/Skeleton';

const SAVE_DELAY_MS = 1200;
const RETRY_EVERY_MS = 15000;

const draftKey = (id) => `bb-assessment-drafts-${id}`;
const readDrafts = (id) => {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id))) || {};
  } catch {
    return {};
  }
};
const writeDrafts = (id, drafts) => {
  try {
    if (Object.keys(drafts).length) localStorage.setItem(draftKey(id), JSON.stringify(drafts));
    else localStorage.removeItem(draftKey(id));
  } catch {
    // Storage unavailable; the server copy is still saved
  }
};

// Simulated examination environment (paper Figure 3.26): one scrollable page
// with each question followed by its answer box, a countdown timer, reading
// period and auto-save.
export default function ExamTakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad] = useState({ done: false, error: '' });
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', at: null });
  const [readingSkipped, setReadingSkipped] = useState(() => localStorage.getItem(`bb-reading-skipped-${id}`) === '1');
  const [showStartModal, setShowStartModal] = useState(() => localStorage.getItem(`bb-started-${id}`) !== '1');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const questionsRef = useRef([]);
  const assessmentRef = useRef(null);
  const timersRef = useRef({});
  const submittedRef = useRef(false);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    assessmentRef.current = assessment;
  }, [assessment]);

  // Load questions and saved answers; local (unsynced) drafts win
  useEffect(() => {
    let active = true;
    apiRequest(`/assessments/${id}`)
      .then((r) => {
        if (!active) return;
        if (r.assessment.status === 'submitted') {
          writeDrafts(id, {});
          navigate(`/assessments/${id}/results`, { replace: true });
          return;
        }
        const local = readDrafts(id);
        setClockOffset(new Date(r.serverNow).getTime() - Date.now());
        setAssessment(r.assessment);
        setQuestions(
          r.questions.map((q) => {
            const unsynced = local[q.questionId] !== undefined && local[q.questionId] !== q.answer;
            return { ...q, answer: unsynced ? local[q.questionId] : q.answer, dirty: unsynced };
          })
        );
        setLoad({ done: true, error: '' });
      })
      .catch((err) => active && setLoad({ done: true, error: err.message }));
    return () => {
      active = false;
    };
  }, [id, navigate]);

  const submit = useCallback(
    async (auto) => {
      if (submittedRef.current) return; // prevents duplicate submissions
      submittedRef.current = true;
      setSubmitting(true);
      setSubmitError('');
      Object.values(timersRef.current).forEach(clearTimeout);

      try {
        const answers = questionsRef.current.map((q) => ({ questionId: q.questionId, answer: q.answer }));
        const result = await apiRequest(`/assessments/${id}/submit`, { method: 'POST', body: { answers, auto } });
        writeDrafts(id, {});
        navigate(`/assessments/${id}/results`, {
          replace: true,
          state: { justSubmitted: true, auto, newAchievements: result.newAchievements ?? [], xpEarned: result.xpEarned ?? 0 },
        });
      } catch (err) {
        submittedRef.current = false;
        setSubmitError(err.message);
      } finally {
        setSubmitting(false);
      }
    },
    [id, navigate]
  );

  const saveAnswer = useCallback(
    async (questionId, answer) => {
      setSaveStatus((s) => ({ ...s, state: 'saving' }));
      try {
        await apiRequest(`/assessments/${id}/answers/${questionId}`, { method: 'PUT', body: { answer } });
        const drafts = readDrafts(id);
        if (drafts[questionId] === answer) {
          delete drafts[questionId];
          writeDrafts(id, drafts);
        }
        setQuestions((prev) => prev.map((q) => (q.questionId === questionId && q.answer === answer ? { ...q, dirty: false } : q)));
        setSaveStatus({ state: 'saved', at: Date.now() });
      } catch (err) {
        if (/time is up/i.test(err.message)) {
          submit(true);
          return;
        }
        setSaveStatus({ state: navigator.onLine ? 'error' : 'offline', at: null, message: err.message });
      }
    },
    [id, submit]
  );

  const flushDirty = useCallback(() => {
    questionsRef.current.filter((q) => q.dirty).forEach((q) => saveAnswer(q.questionId, q.answer));
  }, [saveAnswer]);

  // Clock tick: updates the timer and auto-submits when time runs out
  useEffect(() => {
    let lastRetry = Date.now();
    const interval = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const a = assessmentRef.current;
      if (a && !submittedRef.current && t + clockOffset >= new Date(a.expiresAt).getTime()) {
        submit(true);
      }
      if (t - lastRetry > RETRY_EVERY_MS && navigator.onLine) {
        lastRetry = t;
        flushDirty();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [clockOffset, submit, flushDirty]);

  // Re-sync answers typed while offline (paper TC-ESSAY-012)
  useEffect(() => {
    const onOnline = () => flushDirty();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flushDirty]);

  // Warn before leaving with answers that are not yet on the server
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (questionsRef.current.some((q) => q.dirty) && !submittedRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  if (!load.done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '40px 20px', display: 'grid', gap: '18px' }}>
          <Skeleton width="40%" height={20} />
          {[0, 1].map((i) => (
            <div key={i} style={{ display: 'grid', gap: '10px' }}>
              <Skeleton width="30%" height={12} />
              <Skeleton height={14} />
              <Skeleton width="90%" height={14} />
              <Skeleton height={180} radius={10} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (load.error || !assessment) {
    return (
      <FullScreenMessage>
        <p style={{ color: '#c0392b' }}>{load.error || 'Assessment not found.'}</p>
        <button onClick={() => navigate('/assessments')} style={linkButton}>Back to My Assessments</button>
      </FullScreenMessage>
    );
  }

  const serverNow = now + clockOffset;
  const startedAt = new Date(assessment.startedAt).getTime();
  const expiresAt = new Date(assessment.expiresAt).getTime();
  const readingEndsAt = startedAt + assessment.readingMinutes * 60000;
  const inReading = !readingSkipped && serverNow < readingEndsAt;
  const secondsLeft = Math.max(0, Math.round((expiresAt - serverNow) / 1000));
  const totalSeconds = Math.max(1, (expiresAt - startedAt) / 1000);
  const answeredCount = questions.filter((q) => countWords(q.answer) > 0).length;
  const flaggedCount = questions.filter((q) => q.flagged).length;
  const lowTime = secondsLeft <= 300;

  const updateAnswer = (qid, text) => {
    setQuestions((prev) => prev.map((q) => (q.questionId === qid ? { ...q, answer: text, dirty: true } : q)));
    const drafts = readDrafts(id);
    drafts[qid] = text;
    writeDrafts(id, drafts);
    clearTimeout(timersRef.current[qid]);
    timersRef.current[qid] = setTimeout(() => saveAnswer(qid, text), SAVE_DELAY_MS);
  };

  const toggleFlag = (index) => {
    const q = questions[index];
    setQuestions((prev) => prev.map((item, i) => (i === index ? { ...item, flagged: !item.flagged } : item)));
    apiRequest(`/assessments/${id}/answers/${q.questionId}`, { method: 'PUT', body: { flagged: !q.flagged } }).catch(() => {});
  };

  // Submission confirmation (paper TC-ESSAY-010)
  const askSubmit = async () => {
    if (answeredCount === 0) {
      await confirmAction({ title: 'Nothing to submit yet', text: 'Write an answer to at least one question before submitting.', confirmText: 'Keep answering', icon: 'info' });
      return;
    }
    const ok = await confirmAction({
      title: 'Submit your answers?',
      html:
        `You answered <strong>${answeredCount} of ${questions.length}</strong> question${questions.length === 1 ? '' : 's'}` +
        (flaggedCount ? ` and flagged <strong>${flaggedCount}</strong> for review` : '') +
        '.' +
        (answeredCount < questions.length ? '<br><span style="color:#c0392b">Unanswered questions are scored 0.0.</span>' : '') +
        "<br>You can't change your answers after submitting.",
      confirmText: 'Submit final answers',
      cancelText: 'Keep answering',
    });
    if (ok) submit(false);
  };

  const jumpTo = (index) => {
    document.getElementById(`question-${index + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startAnswering = () => {
    localStorage.setItem(`bb-reading-skipped-${id}`, '1');
    setReadingSkipped(true);
  };

  const dismissStart = () => {
    localStorage.setItem(`bb-started-${id}`, '1');
    setShowStartModal(false);
  };

  const saveLabel =
    saveStatus.state === 'saving'
      ? 'Saving...'
      : saveStatus.state === 'offline'
        ? 'Offline — saved on this device'
        : saveStatus.state === 'error'
          ? 'Not saved — retrying'
          : saveStatus.at
            ? 'All changes saved'
            : 'Auto-save on';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* TOP BAR: title, timer, save status, submit */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff', borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <BrandLogo variant="mark" height={26} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{assessment.title}</div>
              <div style={{ fontSize: '11px', color: saveStatus.state === 'error' || saveStatus.state === 'offline' ? '#c0392b' : 'var(--text-muted)' }}>
                {answeredCount}/{questions.length} answered · {saveLabel}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <div aria-live="polite" style={{ textAlign: 'right' }}>
              <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '16px', color: lowTime ? '#c0392b' : 'var(--navy)' }}>
                {inReading ? formatDuration((readingEndsAt - serverNow) / 1000) : formatDuration(secondsLeft)}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>{inReading ? 'READING' : 'REMAINING'}</div>
            </div>
            <button onClick={askSubmit} disabled={submitting} style={{ ...navyButton, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
        <div style={{ height: '2px', background: 'var(--card-border)' }}>
          <div style={{ width: `${Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100)}%`, height: '100%', background: lowTime ? '#c0392b' : 'var(--gold)' }} />
        </div>
      </header>

      <main style={{ maxWidth: '820px', margin: '0 auto', padding: '24px 20px 120px' }}>
        {submitError && (
          <div role="alert" style={{ background: '#fdf0f0', color: '#9b1c1c', border: '1px solid #e5b8b8', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>{submitError}</div>
        )}

        {inReading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', border: '1px solid var(--card-border)', background: '#fff', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: 'var(--navy)' }}>
            <span>
              <strong>Reading period.</strong> Read every question first. Answering opens in {formatDuration((readingEndsAt - serverNow) / 1000)}.
            </span>
            <button onClick={startAnswering} style={outlineButton}>Start answering now</button>
          </div>
        )}

        {/* Question jump links (useful for 20-question Mock Bars) */}
        {questions.length > 3 && (
          <nav aria-label="Questions" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {questions.map((q, i) => {
              const done = countWords(q.answer) > 0;
              return (
                <button
                  key={q.questionId}
                  onClick={() => jumpTo(i)}
                  title={`${q.subject}${q.flagged ? ' (flagged)' : ''}`}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `1px solid ${q.flagged ? 'var(--gold)' : done ? 'var(--navy)' : 'var(--card-border)'}`,
                    background: done ? 'var(--navy)' : 'transparent',
                    color: done ? '#fff' : 'var(--navy)',
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </nav>
        )}

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px' }}>
          Structure each answer with ALAC: Answer, Legal Basis, Application, Conclusion.
        </p>

        {questions.map((q, i) => {
          const words = countWords(q.answer);
          return (
            <section key={q.questionId} id={`question-${i + 1}`} style={{ scrollMarginTop: '80px', paddingBottom: '32px', marginBottom: '32px', borderBottom: i === questions.length - 1 ? 'none' : '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                  QUESTION {i + 1} · {q.subject.toUpperCase()}
                </span>
                <button
                  onClick={() => toggleFlag(i)}
                  aria-label={q.flagged ? `Remove flag from question ${i + 1}` : `Flag question ${i + 1} for review`}
                  aria-pressed={q.flagged}
                  title={q.flagged ? 'Flagged for review' : 'Flag for review'}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: q.flagged ? 'var(--gold)' : 'var(--text-muted)', display: 'flex' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>flag</span>
                </button>
              </div>

              <div style={{ fontSize: '15px', lineHeight: 1.75, color: 'var(--navy)', whiteSpace: 'pre-line', textAlign: 'justify', hyphens: 'auto', marginBottom: '16px' }}>{tidyQuestionText(q.text)}</div>

              <textarea
                value={q.answer}
                onChange={(e) => updateAnswer(q.questionId, e.target.value)}
                readOnly={inReading}
                placeholder={inReading ? 'Answering opens after the reading period.' : 'Write your answer here...'}
                aria-label={`Answer to question ${i + 1}`}
                style={{
                  width: '100%',
                  minHeight: '200px',
                  fieldSizing: 'content',
                  resize: 'vertical',
                  border: '1px solid var(--card-border)',
                  borderRadius: '10px',
                  outline: 'none',
                  padding: '14px 16px',
                  fontSize: '14px',
                  lineHeight: 1.75,
                  fontFamily: 'Inter, sans-serif',
                  color: 'var(--navy)',
                  background: '#fff',
                  opacity: inReading ? 0.6 : 1,
                  cursor: inReading ? 'not-allowed' : 'text',
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', textAlign: 'right' }}>
                {words} word{words === 1 ? '' : 's'}
              </div>
            </section>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {answeredCount} of {questions.length} answered
          </span>
          <button onClick={askSubmit} disabled={submitting} style={{ ...navyButton, padding: '11px 22px', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      </main>

      {/* "READY TO BEGIN?" START MODAL */}
      {showStartModal && (
        <Overlay>
          <div style={{ background: 'var(--navy)', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '24px' }}>play_arrow</span>
            </div>
            <h3 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>Ready to Begin?</h3>
          </div>
          <div style={{ padding: '22px 24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: '0 0 12px' }}>
              You have <strong>{questions.length} question{questions.length === 1 ? '' : 's'}</strong>
              {assessment.readingMinutes ? <>, a <strong>{assessment.readingMinutes}-minute reading period</strong>,</> : ''} and{' '}
              <strong>{assessment.timeLimitMinutes} minutes</strong> to answer. The timer is already running.
            </p>
            <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Answers are saved automatically and submitted when time runs out.
            </p>
            <button onClick={dismissStart} style={{ ...navyButton, width: '100%', justifyContent: 'center', padding: '12px' }}>
              {inReading ? 'Start Reading' : 'Start Answering'}
            </button>
          </div>
        </Overlay>
      )}

    </div>
  );
}

function Overlay({ children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 31, 61, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div role="dialog" aria-modal="true" style={{ background: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '440px', width: '100%', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

function FullScreenMessage({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--navy)' }}>
      <div>{children}</div>
    </div>
  );
}

const navyButton = { background: 'var(--navy)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' };
const outlineButton = { background: '#fff', color: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '9px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const linkButton = { background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' };
