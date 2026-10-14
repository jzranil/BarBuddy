import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { apiRequest } from '../../lib/api';
import { countWords, formatDuration } from '../../lib/format';

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

// Simulated examination environment (paper Figure 3.26): countdown timer,
// question navigator, essay workspace, reading period and auto-save.
export default function ExamTakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [load, setLoad] = useState({ done: false, error: '' });
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [clockOffset, setClockOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', at: null });
  const [readingSkipped, setReadingSkipped] = useState(() => localStorage.getItem(`bb-reading-skipped-${id}`) === '1');
  const [showStartModal, setShowStartModal] = useState(() => localStorage.getItem(`bb-started-${id}`) !== '1');
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        setConfirmOpen(false);
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

  const activeQuestion = questions[activeIndex];
  const wordCount = useMemo(() => countWords(activeQuestion?.answer ?? ''), [activeQuestion?.answer]);

  if (!load.done) {
    return <FullScreenMessage>Loading your assessment...</FullScreenMessage>;
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

  const updateAnswer = (text) => {
    const qid = activeQuestion.questionId;
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
            ? `Auto-saved ${Math.max(0, Math.round((now - saveStatus.at) / 1000))}s ago`
            : 'Auto-save on';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* TOP BAR */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', gap: '16px', flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <BrandLogo variant="mark" height={30} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--navy)' }}>{assessment.title.toUpperCase()}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {activeQuestion?.subject} — Question {activeIndex + 1} of {questions.length}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }} aria-live="polite">
          <span className="material-symbols-outlined" style={{ color: lowTime ? '#c0392b' : 'var(--navy)', fontSize: '18px' }}>{inReading ? 'menu_book' : 'schedule'}</span>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px', color: lowTime ? '#c0392b' : 'var(--navy)' }}>
              {inReading ? formatDuration((readingEndsAt - serverNow) / 1000) : formatDuration(secondsLeft)}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{inReading ? 'READING PERIOD' : 'TIME REMAINING'}</div>
          </div>
          <div style={{ flex: 1, height: '5px', background: 'var(--card-border)', borderRadius: '999px', minWidth: '80px' }}>
            <div style={{ width: `${Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100)}%`, height: '100%', background: lowTime ? '#c0392b' : 'var(--navy)', borderRadius: '999px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: saveStatus.state === 'error' || saveStatus.state === 'offline' ? '#c0392b' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{saveStatus.state === 'offline' ? 'cloud_off' : 'save'}</span>
            {saveLabel}
          </span>
          <button onClick={() => setConfirmOpen(true)} disabled={submitting} style={{ ...navyButton, opacity: submitting ? 0.6 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
            {submitting ? 'Submitting...' : 'Final Submission'}
          </button>
        </div>
      </header>

      {submitError && (
        <div role="alert" style={{ background: '#fdf0f0', color: '#9b1c1c', borderBottom: '1px solid #e5b8b8', padding: '10px 24px', fontSize: '13px' }}>{submitError}</div>
      )}

      <div className="exam-layout" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* LEFT: question list */}
        <aside className="exam-nav" style={{ width: '260px', flexShrink: 0, background: '#fff', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 16px 8px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>QUESTION LIST</div>
            <div style={{ display: 'grid', gap: '4px' }}>
              {questions.map((q, i) => {
                const done = countWords(q.answer) > 0;
                return (
                  <div key={q.questionId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', padding: '8px 10px', background: i === activeIndex ? 'var(--navy)' : 'transparent', color: i === activeIndex ? '#fff' : 'var(--navy)' }}>
                    <button onClick={() => setActiveIndex(i)} style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '13px', textAlign: 'left', cursor: 'pointer', flex: 1, padding: 0, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{i + 1}. {q.subject}</div>
                      <div style={{ fontSize: '11px', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
                    </button>
                    <span className="material-symbols-outlined" title={q.flagged ? 'Flagged' : done ? 'Answered' : 'Unanswered'} style={{ fontSize: '16px', opacity: 0.85, color: q.flagged ? 'var(--gold)' : 'inherit' }}>
                      {q.flagged ? 'flag' : done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>ANSWERED {answeredCount}/{questions.length}</span>
              <span>{Math.round((answeredCount / Math.max(1, questions.length)) * 100)}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px' }}>
              <div style={{ width: `${(answeredCount / Math.max(1, questions.length)) * 100}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
            </div>
          </div>
        </aside>

        {/* CENTER: question */}
        <main className="exam-question" style={{ flex: 1, padding: '28px 32px', maxWidth: '620px', overflowY: 'auto', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg)', border: '1px solid var(--card-border)', borderRadius: '999px', padding: '4px 12px' }}>
              Question {activeIndex + 1} of {questions.length} • {activeQuestion.subject}
            </span>
            <button onClick={() => toggleFlag(activeIndex)} aria-label={activeQuestion.flagged ? 'Remove flag' : 'Flag this question'} aria-pressed={activeQuestion.flagged} style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeQuestion.flagged ? 'var(--gold)' : 'var(--text-muted)' }}>
              <span className="material-symbols-outlined">flag</span>
            </button>
          </div>
          <h4 style={{ fontSize: '13px', textDecoration: 'underline', marginBottom: '10px' }}>Legal Problem:</h4>
          <div style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--navy)', whiteSpace: 'pre-wrap' }}>{activeQuestion.text}</div>
        </main>

        {/* RIGHT: answer editor */}
        <section className="exam-editor" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--card-border)', background: '#fff', position: 'relative', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--card-border)', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--navy)' }}>YOUR ANSWER</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ANSWER • LEGAL BASIS • APPLICATION • CONCLUSION</span>
          </div>

          <textarea
            value={activeQuestion.answer}
            onChange={(e) => updateAnswer(e.target.value)}
            readOnly={inReading}
            placeholder={inReading ? '' : 'Begin writing your answer here...'}
            aria-label={`Answer to question ${activeIndex + 1}`}
            style={{ flex: 1, minHeight: '320px', border: 'none', outline: 'none', resize: 'none', padding: '20px', fontSize: '14px', lineHeight: 1.8, fontFamily: 'Inter, sans-serif', color: 'var(--navy)', background: '#fff' }}
          />

          {inReading && (
            <div style={{ position: 'absolute', inset: '41px 0 57px 0', background: 'rgba(240, 236, 228, 0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--navy)' }}>menu_book</span>
                <h3 style={{ fontSize: '17px', margin: '8px 0' }}>Reading Period</h3>
                <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.6 }}>
                  Read all the questions first. Answering opens in <strong>{formatDuration((readingEndsAt - serverNow) / 1000)}</strong>.
                </p>
                <button onClick={startAnswering} style={navyButton}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  Start Answering Now
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--card-border)', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {wordCount} WORDS &nbsp;•&nbsp; {activeQuestion.answer.length} CHARACTERS
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setActiveIndex(activeIndex - 1)} disabled={activeIndex === 0} style={{ background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: activeIndex === 0 ? 'not-allowed' : 'pointer', opacity: activeIndex === 0 ? 0.5 : 1, color: 'var(--navy)' }}>
                ← Previous
              </button>
              <button onClick={() => setActiveIndex(activeIndex + 1)} disabled={activeIndex === questions.length - 1} style={{ ...navyButton, cursor: activeIndex === questions.length - 1 ? 'not-allowed' : 'pointer', opacity: activeIndex === questions.length - 1 ? 0.5 : 1 }}>
                Next →
              </button>
            </div>
          </div>
        </section>
      </div>

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

      {/* SUBMISSION CONFIRMATION (paper TC-ESSAY-010) */}
      {confirmOpen && (
        <Overlay>
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Submit your answers?</h3>
            <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, marginBottom: '6px' }}>
              You answered <strong>{answeredCount} of {questions.length}</strong> question{questions.length === 1 ? '' : 's'}
              {flaggedCount ? <> and flagged <strong>{flaggedCount}</strong> for review</> : ''}.
            </p>
            {answeredCount < questions.length && (
              <p style={{ fontSize: '12px', color: '#9b1c1c', marginBottom: '6px' }}>
                Unanswered questions will be scored 0.0 under the five-point grading standard.
              </p>
            )}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>You can't change your answers after submitting.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => setConfirmOpen(false)} disabled={submitting} style={outlineButton}>Keep Answering</button>
              <button onClick={() => submit(false)} disabled={submitting || answeredCount === 0} style={{ ...navyButton, opacity: submitting || answeredCount === 0 ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Final Answers'}
              </button>
            </div>
            {answeredCount === 0 && <p style={{ fontSize: '12px', color: '#9b1c1c', marginTop: '10px', marginBottom: 0 }}>Write an answer to at least one question before submitting.</p>}
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
