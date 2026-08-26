import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { SUBJECTS } from '../../data/subjects';
import { getDummyExamById, DEMO_QUESTION_BANK } from '../../data/exams';

const TOOLBAR_ICONS = ['format_bold', 'format_italic', 'format_underlined', 'format_list_bulleted', 'format_list_numbered', 'format_align_left', 'format_align_center'];

function formatElapsed(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function ExamTakingPage() {
  const { slug, examId } = useParams();
  const navigate = useNavigate();

  const subject = SUBJECTS.find((s) => s.slug === slug);
  const exam = subject ? getDummyExamById(slug, subject.name, examId) : null;

  // Question list state — seeded from the demo bank, but tracked locally so
  // clicking around and typing an answer actually updates the UI.
  // BACKEND TODO: this whole block becomes "load questions + saved answers
  // for this exam attempt from GET /api/exams/{examId}/attempt".
  const [questions, setQuestions] = useState(
    () => DEMO_QUESTION_BANK.map((q) => ({ ...q, status: q.initialStatus, answer: '' }))
  );
  const initialIndex = DEMO_QUESTION_BANK.findIndex((q) => q.initialStatus === 'current');
  const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const [showStartModal, setShowStartModal] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(15 * 60); // demo starts at 15m, matching the mockup
  const [secondsSinceSave, setSecondsSinceSave] = useState(12);

  const totalAllottedSeconds = (exam?.durationMinutes ?? 120) * 60;

  // Live timer — purely visual, does not persist anywhere yet.
  useEffect(() => {
    if (showStartModal) return undefined;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setSecondsSinceSave((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showStartModal]);

  const activeQuestion = questions[activeIndex];

  const wordCount = useMemo(
    () => (activeQuestion.answer.trim() ? activeQuestion.answer.trim().split(/\s+/).length : 0),
    [activeQuestion.answer]
  );

  if (!subject || !exam) {
    return <Navigate to="/subjects" replace />;
  }

  const updateAnswer = (text) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === activeIndex ? { ...q, answer: text, status: text.trim() ? 'completed' : q.status } : q))
    );
    setSecondsSinceSave(0); // BACKEND TODO: this is where the real auto-save PATCH call would fire (debounced)
  };

  const toggleFlag = (index) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, status: q.status === 'flagged' ? 'unanswered' : 'flagged' } : q))
    );
  };

  const goTo = (index) => {
    if (index < 0 || index >= questions.length) return;
    setActiveIndex(index);
  };

  const handleFinalSubmission = () => {
    // BACKEND TODO: POST the full set of answers to
    // /api/exams/{examId}/submit, then navigate once the server confirms.
    const confirmed = window.confirm('Submit your exam? You will not be able to change your answers after this.');
    if (confirmed) {
      navigate(`/subjects/${slug}/exams/${examId}/results`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* TOP BAR */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid var(--card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '26px',
              height: '26px',
              background: 'var(--navy)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              fontFamily: 'Playfair Display, serif',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            B
          </span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--navy)' }}>
              PHILIPPINE BAR EXAMINATIONS 2024
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {subject.name} — {activeQuestion.title}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '220px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--navy)', fontSize: '18px' }}>schedule</span>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '15px' }}>
              {formatElapsed(elapsedSeconds)}
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TIME CONSUMED</div>
          </div>
          <div style={{ flex: 1, height: '5px', background: 'var(--card-border)', borderRadius: '999px', minWidth: '80px' }}>
            <div
              style={{
                width: `${Math.min(100, (elapsedSeconds / totalAllottedSeconds) * 100)}%`,
                height: '100%',
                background: 'var(--navy)',
                borderRadius: '999px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>save</span>
            Auto-saved {secondsSinceSave}s ago
          </span>
          <button
            onClick={handleFinalSubmission}
            style={{
              background: 'var(--navy)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
            Final Submission
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* LEFT: sections + question list */}
        <aside style={{ width: '260px', flexShrink: 0, background: '#fff', borderRight: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '18px 16px 8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              EXAM SECTIONS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--navy)', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>menu_book</span>
                {subject.name}
              </span>
              <span style={{ fontSize: '10px', background: 'var(--gold)', color: 'var(--navy)', borderRadius: '999px', padding: '2px 8px', fontWeight: 700 }}>Active</span>
            </div>
            {/* BACKEND TODO: real exams may have multiple sections; hardcoded
                second section here just to match the mockup's "locked next
                section" pattern. */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
                Next Section
              </span>
              <span style={{ fontSize: '11px' }}>Locked</span>
            </div>
          </div>

          <div style={{ padding: '8px 16px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '8px 0' }}>
              QUESTION LIST
            </div>
            <div style={{ display: 'grid', gap: '4px' }}>
              {questions.map((q, i) => (
                <div
                  key={q.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    background: i === activeIndex ? 'var(--navy)' : 'transparent',
                    color: i === activeIndex ? '#fff' : 'var(--navy)',
                    cursor: 'pointer',
                  }}
                >
                  <button
                    onClick={() => goTo(i)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      flex: 1,
                      padding: 0,
                    }}
                  >
                    {i + 1}. {q.title}
                  </button>
                  <button
                    onClick={() => toggleFlag(i)}
                    aria-label="Flag question"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.8 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                      {q.status === 'completed' ? 'check_circle' : q.status === 'flagged' ? 'flag' : 'radio_button_unchecked'}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <span>TOTAL PROGRESS</span>
              <span>{Math.round((questions.filter((q) => q.status === 'completed').length / questions.length) * 100)}%</span>
            </div>
            <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px' }}>
              <div
                style={{
                  width: `${(questions.filter((q) => q.status === 'completed').length / questions.length) * 100}%`,
                  height: '100%',
                  background: 'var(--navy)',
                  borderRadius: '999px',
                }}
              />
            </div>
          </div>
        </aside>

        {/* CENTER: question content */}
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '620px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'var(--bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '999px',
                padding: '4px 12px',
              }}
            >
              Question {activeIndex + 1} of {questions.length}
            </span>
            <button
              onClick={() => toggleFlag(activeIndex)}
              aria-label="Flag this question"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeQuestion.status === 'flagged' ? 'var(--gold)' : 'var(--text-muted)' }}
            >
              <span className="material-symbols-outlined">flag</span>
            </button>
          </div>

          <h2 style={{ fontSize: '22px', marginBottom: '18px' }}>{activeQuestion.title}</h2>

          {activeQuestion.legalProblem ? (
            <>
              <h4 style={{ fontSize: '13px', textDecoration: 'underline', marginBottom: '10px' }}>Legal Problem:</h4>
              {activeQuestion.legalProblem.map((para, i) => (
                <p key={i} style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--navy)', marginBottom: '14px' }}>
                  {para}
                </p>
              ))}
              <blockquote
                style={{
                  borderLeft: '3px solid var(--navy)',
                  background: 'var(--bg)',
                  margin: '0 0 16px',
                  padding: '14px 16px',
                  fontStyle: 'italic',
                  fontSize: '14px',
                  color: 'var(--navy)',
                }}
              >
                {activeQuestion.prompt}
              </blockquote>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{activeQuestion.note}</p>
            </>
          ) : (
            // BACKEND TODO: every question besides the demo one pulls its
            // real legal-problem text + prompt from the question bank API.
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              This question's content will load here once it's pulled from the exam bank.
            </p>
          )}
        </main>

        {/* RIGHT: answer editor */}
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--card-border)', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--card-border)' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {TOOLBAR_ICONS.map((icon) => (
                // BACKEND TODO / FRONTEND TODO: purely decorative for now —
                // wire these up to a real rich-text editor (e.g. TipTap) if
                // formatted answers are required.
                <button
                  key={icon}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                  aria-label={icon}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{icon}</span>
                </button>
              ))}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>STANDARD LEGAL FORMAT</span>
          </div>

          <textarea
            value={activeQuestion.answer}
            onChange={(e) => updateAnswer(e.target.value)}
            placeholder="Begin writing your answer here..."
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: '20px',
              fontSize: '14px',
              lineHeight: 1.8,
              fontFamily: 'Inter, sans-serif',
              color: 'var(--navy)',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--card-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {wordCount} WORDS &nbsp;•&nbsp; {activeQuestion.answer.length} CHARACTERS
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                style={{
                  background: 'none',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  cursor: activeIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: activeIndex === 0 ? 0.5 : 1,
                }}
              >
                ← Previous Question
              </button>
              <button
                onClick={() => goTo(activeIndex + 1)}
                disabled={activeIndex === questions.length - 1}
                style={{
                  background: 'var(--navy)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: activeIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: activeIndex === questions.length - 1 ? 0.5 : 1,
                }}
              >
                Next Question →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* "READY TO BEGIN?" START MODAL */}
      {showStartModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 31, 61, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', maxWidth: '420px', width: '100%', overflow: 'hidden' }}>
            <div style={{ background: 'var(--navy)', padding: '28px', textAlign: 'center', position: 'relative' }}>
              <button
                onClick={() => setShowStartModal(false)}
                aria-label="Close"
                style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '24px' }}>play_arrow</span>
              </div>
              <h3 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>Ready to Begin?</h3>
            </div>

            <div style={{ padding: '22px 24px' }}>
              <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: '0 0 4px' }}>
                Once clicked, the system will begin monitoring and analyzing your answering patterns
                throughout the duration of the examination.
              </p>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Please ensure you are ready before proceeding.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '18px' }}>
                You have used <strong style={{ color: 'var(--navy)' }}>{Math.floor(elapsedSeconds / 60)}m</strong> of your allotted{' '}
                <strong style={{ color: 'var(--navy)' }}>{Math.floor(totalAllottedSeconds / 3600)}h {Math.floor((totalAllottedSeconds % 3600) / 60)}m</strong>.
              </p>
              <button
                onClick={() => setShowStartModal(false)}
                style={{
                  width: '100%',
                  background: 'var(--navy)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Start Answering
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
