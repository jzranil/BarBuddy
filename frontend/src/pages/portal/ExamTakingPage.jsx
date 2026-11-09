import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo';
import { apiRequest } from '../../lib/api';
import { useRequireSession } from '../../lib/session';
import { ASSESSMENT_TYPE_LABELS, countWords, formatDuration, tidyQuestionText } from '../../lib/format';
import { alertMessage, confirmAction } from '../../lib/swal';
import { Skeleton } from '../../components/common/Skeleton';
import '../../styles/exam.css';

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

// Opening words of the "call of the question" (the instruction to the examinee)
const CALL_START = /^(decide|discuss|explain|rule|resolve|state|give|define|distinguish|enumerate|cite|answer|is|was|were|are|can|could|may|should|will|would|does|did|do|has|have|what|who|whom|which|how|why|when|where)\b/i;
const isCall = (text) => /\?["')\]]*$/.test(text) || CALL_START.test(text.replace(/^["'(]+/, ''));

// Splits a question into its facts ("Legal Problem") and the call of the question
function splitQuestion(text) {
  const paragraphs = tidyQuestionText(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return { problem: [], call: '' };
  const last = paragraphs[paragraphs.length - 1];
  // Lettered sub-questions stay together with the facts
  if (/^\(?[a-z0-9ivx]{1,4}[).]\s/i.test(last)) return { problem: paragraphs, call: '' };
  if (paragraphs.length > 1 && isCall(last)) return { problem: paragraphs.slice(0, -1), call: last };
  const sentences = last.split(/(?<=[.?!]["')]?)\s+(?=["'(]?[A-Z])/);
  if (sentences.length > 1 && isCall(sentences[sentences.length - 1])) {
    return { problem: [...paragraphs.slice(0, -1), sentences.slice(0, -1).join(' ')], call: sentences[sentences.length - 1] };
  }
  return { problem: paragraphs, call: '' };
}

// "4h 00m" / "15m"
function formatSpan(totalSeconds) {
  const minutes = Math.max(0, Math.floor(totalSeconds / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

// Simulated examination environment (paper Figure 3.26): exam sections and
// question list, one question at a time beside its answer editor, a timer,
// reading period and auto-save.
export default function ExamTakingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  useRequireSession();

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
  const [current, setCurrent] = useState(() => Number(localStorage.getItem(`bb-current-${id}`)) || 0);
  const [align, setAlign] = useState('left');
  // "Show Question" / "Answer" buttons (paper scope 5): which pane is hidden, if any
  const [hiddenPane, setHiddenPane] = useState(null);

  const questionsRef = useRef([]);
  const assessmentRef = useRef(null);
  const timersRef = useRef({});
  const submittedRef = useRef(false);
  const editorRef = useRef(null);
  const questionPaneRef = useRef(null);

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
        localStorage.removeItem(`bb-current-${id}`);
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
      <div className="bb-exam">
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
  if (load.error || !assessment || questions.length === 0) {
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
  const secondsUsed = Math.min(totalSeconds, Math.max(0, (serverNow - startedAt) / 1000));
  const answeredCount = questions.filter((q) => countWords(q.answer) > 0).length;
  const flaggedCount = questions.filter((q) => q.flagged).length;
  const lowTime = secondsLeft <= 300;

  const index = Math.min(Math.max(0, current), questions.length - 1);
  const q = questions[index];
  const words = countWords(q.answer);
  const { problem, call } = splitQuestion(q.text);
  const isLast = index === questions.length - 1;

  // Exam sections: the subjects in this assessment, in question order
  const sections = [];
  questions.forEach((item, i) => {
    const found = sections.find((s) => s.name === item.subject);
    if (found) found.count += 1;
    else sections.push({ name: item.subject, first: i, count: 1 });
  });

  const updateAnswer = (qid, text) => {
    setQuestions((prev) => prev.map((item) => (item.questionId === qid ? { ...item, answer: text, dirty: true } : item)));
    const drafts = readDrafts(id);
    drafts[qid] = text;
    writeDrafts(id, drafts);
    clearTimeout(timersRef.current[qid]);
    timersRef.current[qid] = setTimeout(() => saveAnswer(qid, text), SAVE_DELAY_MS);
  };

  const toggleFlag = (i) => {
    const item = questions[i];
    setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, flagged: !x.flagged } : x)));
    apiRequest(`/assessments/${id}/answers/${item.questionId}`, { method: 'PUT', body: { flagged: !item.flagged } }).catch(() => {});
  };

  const goTo = (i) => {
    const next = Math.min(Math.max(0, i), questions.length - 1);
    setCurrent(next);
    localStorage.setItem(`bb-current-${id}`, String(next));
    questionPaneRef.current?.scrollTo({ top: 0 });
  };

  // Bullet / numbered list: toggles a marker on every selected line (answers are plain text)
  const toggleList = (kind) => {
    const el = editorRef.current;
    if (!el || inReading) return;
    const value = q.answer;
    const start = value.lastIndexOf('\n', el.selectionStart - 1) + 1;
    let end = value.indexOf('\n', el.selectionEnd);
    if (end === -1) end = value.length;
    const lines = value.slice(start, end).split('\n');
    const marker = kind === 'bullet' ? /^• / : /^\d+\. /;
    const stripped = lines.map((line) => line.replace(/^(• |\d+\. )/, ''));
    const block = (lines.every((line) => marker.test(line)) ? stripped : stripped.map((line, i) => (kind === 'bullet' ? `• ${line}` : `${i + 1}. ${line}`))).join('\n');
    updateAnswer(q.questionId, value.slice(0, start) + block + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + block.length);
    });
  };

  // Submission confirmation (paper TC-ESSAY-010). A blank essay cannot be
  // submitted (TC-ESSAY-002): the reviewee stays on the exam at the first
  // blank question. Only the timer's auto-submit records blanks (0.0).
  const askSubmit = async () => {
    const blank = questions.map((item, i) => (countWords(item.answer) > 0 ? null : i)).filter((i) => i !== null);
    if (blank.length) {
      await alertMessage({
        title: 'Answer every question first',
        html:
          `Question${blank.length === 1 ? '' : 's'} <strong>${blank.map((i) => i + 1).join(', ')}</strong> ${blank.length === 1 ? 'is' : 'are'} still blank. ` +
          'Write an answer to each question before submitting.',
        confirmText: 'Keep answering',
      });
      goTo(blank[0]);
      return;
    }
    const ok = await confirmAction({
      title: 'Submit your answers?',
      html:
        `You answered all <strong>${questions.length}</strong> question${questions.length === 1 ? '' : 's'}` +
        (flaggedCount ? ` and flagged <strong>${flaggedCount}</strong> for review` : '') +
        ".<br>You can't change your answers after submitting.",
      confirmText: 'Submit final answers',
      cancelText: 'Keep answering',
    });
    if (ok) submit(false);
  };

  const startAnswering = () => {
    localStorage.setItem(`bb-reading-skipped-${id}`, '1');
    setReadingSkipped(true);
  };

  // Each button shows or hides its pane; one of the two always stays open
  const togglePane = (pane) => {
    const other = pane === 'question' ? 'answer' : 'question';
    if (hiddenPane === pane) {
      setHiddenPane(null);
    } else if (hiddenPane !== other) {
      setHiddenPane(pane);
      return;
    }
    if (pane === 'answer') requestAnimationFrame(() => editorRef.current?.focus());
  };

  const dismissStart = () => {
    localStorage.setItem(`bb-started-${id}`, '1');
    setShowStartModal(false);
  };

  const savedSecondsAgo = saveStatus.at ? Math.max(0, Math.round((now - saveStatus.at) / 1000)) : null;
  const saveLabel =
    saveStatus.state === 'saving'
      ? 'Saving...'
      : saveStatus.state === 'offline'
        ? 'Offline — saved on this device'
        : saveStatus.state === 'error'
          ? 'Not saved — retrying'
          : savedSecondsAgo !== null
            ? `Auto-saved ${savedSecondsAgo < 60 ? `${savedSecondsAgo}s` : `${Math.floor(savedSecondsAgo / 60)}m`} ago`
            : 'Auto-save on';
  const saveProblem = saveStatus.state === 'error' || saveStatus.state === 'offline';

  return (
    <div className={`bb-exam${lowTime ? ' is-low-time' : ''}`}>
      <div className="bb-exam-shell">
        {/* TOP BAR: exam title, time consumed, save status, submit */}
        <header className="bb-exam-top">
          <div className="bb-exam-brand">
            <span className="bb-exam-brand-wordmark"><BrandLogo variant="compact" height={30} /></span>
            <span className="bb-exam-brand-markonly"><BrandLogo variant="mark" height={28} /></span>
            <span className="bb-exam-brand-divider" />
            <div style={{ minWidth: 0 }}>
              <div className="bb-exam-title">{assessment.title}</div>
              <div className="bb-exam-subtitle">
                {ASSESSMENT_TYPE_LABELS[assessment.type] ?? 'Assessment'} · {answeredCount} of {questions.length} answered
              </div>
            </div>
          </div>

          <div className="bb-exam-timer" aria-live="polite" title={`${formatDuration(secondsLeft)} remaining`}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--exam-muted)' }}>schedule</span>
            <div>
              <div className="bb-exam-timer-value">
                {inReading ? formatDuration((readingEndsAt - serverNow) / 1000) : formatDuration(secondsUsed)}
              </div>
              <div className="bb-exam-timer-label">
                {inReading ? 'Reading period' : lowTime ? `${formatDuration(secondsLeft)} left` : 'Time consumed'}
              </div>
            </div>
            <div className="bb-exam-timer-bar">
              <span style={{ width: `${(secondsUsed / totalSeconds) * 100}%` }} />
            </div>
          </div>

          <div className="bb-exam-top-actions">
            <div className="bb-exam-view" role="group" aria-label="Show panes">
              <button
                className={`bb-exam-view-btn${hiddenPane !== 'question' ? ' is-on' : ''}`}
                onClick={() => togglePane('question')}
                aria-pressed={hiddenPane !== 'question'}
                title={hiddenPane === 'question' ? 'Show the question' : 'Hide the question'}
              >
                <span className="material-symbols-outlined">article</span>
                <span className="bb-exam-view-text">Show Question</span>
              </button>
              <button
                className={`bb-exam-view-btn${hiddenPane !== 'answer' ? ' is-on' : ''}`}
                onClick={() => togglePane('answer')}
                aria-pressed={hiddenPane !== 'answer'}
                title={hiddenPane === 'answer' ? 'Show your answer' : 'Hide your answer'}
              >
                <span className="material-symbols-outlined">edit_note</span>
                <span className="bb-exam-view-text">Answer</span>
              </button>
            </div>
            <span className={`bb-exam-save${saveProblem ? ' is-problem' : ''}`} title={saveStatus.message || saveLabel}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{saveProblem ? 'cloud_off' : 'save'}</span>
              <span className="bb-exam-save-text">{saveLabel}</span>
            </span>
            <button className="bb-exam-btn bb-exam-btn-navy" onClick={askSubmit} disabled={submitting}>
              <span className="material-symbols-outlined">send</span>
              <span className="bb-exam-final-text">{submitting ? 'Submitting...' : 'Final Submission'}</span>
            </button>
          </div>
        </header>

        <div className={`bb-exam-body${hiddenPane ? ` is-${hiddenPane}-hidden` : ''}`}>
          {/* LEFT: exam sections, question list, total progress */}
          <aside className="bb-exam-pane bb-exam-side">
            <h2 className="bb-exam-side-heading">Exam Sections</h2>
            <div className="bb-exam-sections">
              {sections.map((s) => {
                const active = s.name === q.subject;
                return (
                  <button
                    key={s.name}
                    className={`bb-exam-section${active ? ' is-active' : ''}`}
                    onClick={() => !active && goTo(s.first)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className="material-symbols-outlined">{active ? 'menu_book' : 'gavel'}</span>
                    <span className="bb-exam-section-name">{s.name}</span>
                    <span className="bb-exam-section-tag">{active ? 'Active' : `${s.count} Q${s.count === 1 ? '' : 's'}`}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="bb-exam-side-heading">Question List</h2>
            <ol className="bb-exam-qlist" aria-label="Questions">
              {questions.map((item, i) => {
                const answered = countWords(item.answer) > 0;
                const cls = ['bb-exam-q', i === index && 'is-current', (answered || item.flagged) && 'is-touched', item.flagged && 'is-flagged'].filter(Boolean).join(' ');
                return (
                  <li key={item.questionId}>
                    <button className={cls} onClick={() => goTo(i)} aria-current={i === index ? 'step' : undefined} title={`${item.subject}: ${item.title}`}>
                      <span className="bb-exam-q-num">{i + 1}.</span>
                      <span className="bb-exam-q-title">{item.title}</span>
                      {item.flagged ? (
                        <span className="material-symbols-outlined" aria-label="Flagged">flag</span>
                      ) : answered ? (
                        <span className="material-symbols-outlined" aria-label="Answered">check_circle</span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="bb-exam-progress">
              <div className="bb-exam-progress-row">
                <span>TOTAL PROGRESS</span>
                <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
              </div>
              <div className="bb-exam-progress-bar">
                <span style={{ width: `${(answeredCount / questions.length) * 100}%` }} />
              </div>
            </div>
          </aside>

          {/* MIDDLE: the question */}
          <section ref={questionPaneRef} className="bb-exam-pane bb-exam-question" aria-label={`Question ${index + 1}`}>
            <div className="bb-exam-question-head">
              <div>
                <span className="bb-exam-chip">Question {index + 1} of {questions.length}</span>
                <h1 className="bb-exam-question-title">{q.subject}</h1>
              </div>
              <button
                className={`bb-exam-flag${q.flagged ? ' is-on' : ''}`}
                onClick={() => toggleFlag(index)}
                aria-label={q.flagged ? `Remove flag from question ${index + 1}` : `Flag question ${index + 1} for review`}
                aria-pressed={q.flagged}
                title={q.flagged ? 'Flagged for review' : 'Flag for review'}
              >
                <span className="material-symbols-outlined">flag</span>
              </button>
            </div>

            <h3 className="bb-exam-problem-label">Legal Problem:</h3>
            <div className="bb-exam-problem">
              {problem.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {call && <blockquote className="bb-exam-call">{call}</blockquote>}

            <p className="bb-exam-note">
              NOTE: Structure your answer with ALAC: Answer, Legal Basis, Application and Conclusion. Answer every question before
              submitting; questions still blank when time runs out are scored 0.0.
            </p>
          </section>

          {/* RIGHT: answer editor */}
          <section className="bb-exam-pane bb-exam-answer" aria-label="Your answer">
            {submitError && <div role="alert" className="bb-exam-alert">{submitError}</div>}
            {inReading && !showStartModal && (
              <div className="bb-exam-reading">
                <span>
                  <strong>Reading period.</strong> Answering opens in {formatDuration((readingEndsAt - serverNow) / 1000)}.
                </span>
                <button className="bb-exam-btn bb-exam-btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={startAnswering}>
                  Start answering now
                </button>
              </div>
            )}

            <div className="bb-exam-editor">
              <div className="bb-exam-toolbar" role="toolbar" aria-label="Answer formatting">
                {['format_bold', 'format_italic', 'format_underlined'].map((icon) => (
                  <button key={icon} className="bb-exam-tool" disabled title="Answers are saved as plain text" aria-label={icon.replace('format_', '')}>
                    <span className="material-symbols-outlined">{icon}</span>
                  </button>
                ))}
                <span className="bb-exam-tool-gap" />
                <button className="bb-exam-tool" onClick={() => toggleList('bullet')} disabled={inReading} title="Bulleted list" aria-label="Bulleted list">
                  <span className="material-symbols-outlined">format_list_bulleted</span>
                </button>
                <button className="bb-exam-tool" onClick={() => toggleList('number')} disabled={inReading} title="Numbered list" aria-label="Numbered list">
                  <span className="material-symbols-outlined">format_list_numbered</span>
                </button>
                <span className="bb-exam-tool-gap" />
                {['left', 'center', 'right'].map((a) => (
                  <button key={a} className={`bb-exam-tool${align === a ? ' is-on' : ''}`} onClick={() => setAlign(a)} aria-pressed={align === a} title={`Align ${a}`} aria-label={`Align ${a}`}>
                    <span className="material-symbols-outlined">{`format_align_${a}`}</span>
                  </button>
                ))}
                <span className="bb-exam-toolbar-label">STANDARD LEGAL FORMAT</span>
              </div>
              <textarea
                ref={editorRef}
                className="bb-exam-textarea"
                value={q.answer}
                onChange={(e) => updateAnswer(q.questionId, e.target.value)}
                readOnly={inReading}
                placeholder={inReading ? 'Answering opens after the reading period.' : 'Write your answer here...'}
                aria-label={`Answer to question ${index + 1}`}
                style={{ textAlign: align }}
              />
            </div>

            <div className="bb-exam-answer-foot">
              <span className="bb-exam-count">{words.toLocaleString()}<small>Words</small></span>
              <span className="bb-exam-count">{q.answer.length.toLocaleString()}<small>Characters</small></span>
              <div className="bb-exam-nav">
                <button className="bb-exam-btn bb-exam-btn-outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
                  <span className="material-symbols-outlined">chevron_left</span>
                  Previous Question
                </button>
                {isLast ? (
                  <button className="bb-exam-btn bb-exam-btn-navy" onClick={askSubmit} disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                    <span className="material-symbols-outlined">send</span>
                  </button>
                ) : (
                  <button className="bb-exam-btn bb-exam-btn-navy" onClick={() => goTo(index + 1)}>
                    Next Question
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                )}
              </div>
            </div>

            {/* "READY TO BEGIN?" START MODAL (covers the answer pane only) */}
            {showStartModal && (
              <div className="bb-exam-overlay">
                <div className="bb-exam-modal" role="dialog" aria-modal="true" aria-labelledby="bb-exam-ready-title">
                  <button className="bb-exam-modal-close" onClick={dismissStart} aria-label="Close">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <div className="bb-exam-modal-head">
                    <div className="bb-exam-modal-play">
                      <span className="material-symbols-outlined">play_arrow</span>
                    </div>
                    <h3 id="bb-exam-ready-title">Ready to Begin?</h3>
                  </div>
                  <div className="bb-exam-modal-body">
                    <p>Once clicked, the system will begin monitoring and analyzing your answering patterns throughout the duration of the examination.</p>
                    <p className="is-hint">Please ensure you are ready before proceeding.</p>
                    <div className="bb-exam-modal-usage">
                      You have used <strong>{formatSpan(secondsUsed)}</strong> of your allotted <strong>{formatSpan(totalSeconds)}</strong>.
                    </div>
                    <button className="bb-exam-btn bb-exam-btn-navy" style={{ width: '100%', padding: '12px' }} onClick={dismissStart} autoFocus>
                      {inReading ? 'Start Reading' : 'Start Answering'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FullScreenMessage({ children }) {
  return (
    <div className="bb-exam" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', fontSize: '14px' }}>
      <div>{children}</div>
    </div>
  );
}

const linkButton = { background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' };
