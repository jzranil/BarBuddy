import { useRef, useState } from 'react';
import Modal from '../common/Modal';
import { apiRequest } from '../../lib/api';
import { parseQuestionCsv, REQUIRED_COLUMNS } from '../../lib/csvQuestions';
import { confirmAction } from '../../lib/swal';

const BATCH_SIZE = 500;
const MAX_LISTED_ISSUES = 100;

// stage: 'select' → 'checking' → 'review' → 'importing' → 'done'
export default function QuestionCSVUploadModal({ open = true, onClose, onSuccess }) {
  const fileInputRef = useRef(null);
  const [stage, setStage] = useState('select');
  const [fileName, setFileName] = useState('');
  const [fatal, setFatal] = useState('');
  const [review, setReview] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);

  const busy = stage === 'checking' || stage === 'importing';

  const reset = () => {
    setStage('select');
    setFileName('');
    setFatal('');
    setReview(null);
    setProgress({ done: 0, total: 0 });
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (busy) return;
    reset();
    onClose?.();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    reset();
    setFileName(file.name);
    setStage('checking');

    const parsed = await parseQuestionCsv(file);

    if (parsed.fatal) {
      setFatal(parsed.fatal);
      setStage('select');
      return;
    }

    try {
      // Ask the server which subjects exist and which questions are already stored
      const check = parsed.rows.length
        ? await apiRequest('/questions/check', {
            method: 'POST',
            body: {
              rows: parsed.rows.map((r) => ({ subject: r.subject, question_text: r.question_text })),
            },
          })
        : { results: [] };

      const { subjects } = await apiRequest('/questions/subjects');
      const validSubjects = subjects.map((s) => s.name).join(', ');

      const errors = [...parsed.errors];
      const duplicates = [...parsed.duplicates];
      const existing = [];
      const ready = [];
      const firstLineByKey = new Map();

      parsed.rows.forEach((row, index) => {
        const status = check.results[index];

        if (status?.status === 'unknown_subject') {
          errors.push({ line: row.line, message: `Unknown subject "${row.subject}". Use one of: ${validSubjects}.` });
          return;
        }

        if (status?.status === 'existing') {
          existing.push({ line: row.line, subject: status.subject });
          return;
        }

        // Catch duplicates that only match after subject names are resolved
        // (e.g. "Legal Ethics" and "Ethics" in the same file)
        const key = `${status.subject}|${row.question_text.toLowerCase()}`;

        if (firstLineByKey.has(key)) {
          duplicates.push({ line: row.line, firstLine: firstLineByKey.get(key), subject: status.subject });
          return;
        }

        firstLineByKey.set(key, row.line);
        ready.push({ ...row, subject: status.subject });
      });

      errors.sort((a, b) => a.line - b.line);
      duplicates.sort((a, b) => a.line - b.line);

      const bySubject = {};
      ready.forEach((row) => {
        bySubject[row.subject] = (bySubject[row.subject] || 0) + 1;
      });

      setReview({ totalRows: parsed.totalRows, ready, errors, duplicates, existing, bySubject });
      setStage('review');
    } catch (error) {
      setFatal(error.message);
      setStage('select');
    }
  };

  const handleImport = async () => {
    if (!review || review.errors.length > 0 || review.ready.length === 0) return;
    if (!(await confirmAction({ title: `Import ${review.ready.length} question${review.ready.length === 1 ? '' : 's'}?`, text: 'They will be added to the question bank and can be given to reviewees.', confirmText: 'Yes, import' }))) return;

    setStage('importing');
    setFatal('');

    const rows = review.ready.map(({ subject, question_text, question_model_answer }) => ({
      subject,
      question_text,
      question_model_answer,
    }));

    let inserted = 0;
    let skipped = 0;

    setProgress({ done: 0, total: rows.length });

    try {
      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = rows.slice(start, start + BATCH_SIZE);
        const response = await apiRequest('/questions/import', {
          method: 'POST',
          body: { questions: batch },
        });

        inserted += response.inserted;
        skipped += response.skipped;
        setProgress({ done: Math.min(start + batch.length, rows.length), total: rows.length });
      }

      const summary = {
        inserted,
        skipped: skipped + review.existing.length + review.duplicates.length,
      };

      setResult(summary);
      setStage('done');
      onSuccess?.(summary);
    } catch (error) {
      setFatal(
        `${error.message} ${inserted > 0 ? `${inserted} question(s) were imported before the error.` : ''}`.trim()
      );
      setStage('review');
      if (inserted > 0) onSuccess?.({ inserted, skipped });
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Questions (CSV)" width="760px">
      {stage !== 'done' && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 0, marginBottom: '16px' }}>
          Upload a CSV with the columns <code>{REQUIRED_COLUMNS.join(', ')}</code>. Duplicate questions — repeated
          in the file or already in the question bank — are skipped automatically.
        </p>
      )}

      {fatal && <Alert tone="error">{fatal}</Alert>}

      {(stage === 'select' || stage === 'checking') && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={stage === 'checking'}
          style={dropZoneStyle}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '26px', color: 'var(--navy)' }}>
            {stage === 'checking' ? 'hourglass_top' : 'upload_file'}
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
            {stage === 'checking' ? `Checking ${fileName}...` : 'Click to choose a CSV file'}
          </span>
          <span style={{ fontSize: '11px' }}>.csv only, up to 10 MB</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {review && (stage === 'review' || stage === 'importing') && (
        <>
          <div style={fileRowStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>description</span>
            <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileName}
            </span>
            {stage === 'review' && (
              <button type="button" onClick={() => fileInputRef.current?.click()} style={linkButtonStyle}>
                Choose another file
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <Stat label="Rows in file" value={review.totalRows} />
            <Stat label="Ready to import" value={review.ready.length} tone="good" />
            <Stat label="Duplicates in file" value={review.duplicates.length} tone={review.duplicates.length ? 'warn' : undefined} />
            <Stat label="Already in bank" value={review.existing.length} tone={review.existing.length ? 'warn' : undefined} />
            <Stat label="Errors" value={review.errors.length} tone={review.errors.length ? 'error' : undefined} />
          </div>

          {review.errors.length > 0 && (
            <IssueList
              tone="error"
              title={`${review.errors.length} row(s) must be fixed before importing`}
              items={review.errors.map((e) => `Row ${e.line}: ${e.message}`)}
            />
          )}

          {review.duplicates.length > 0 && (
            <IssueList
              tone="warn"
              title={`${review.duplicates.length} duplicate row(s) in this file will be skipped`}
              items={review.duplicates.map((d) => `Row ${d.line} repeats row ${d.firstLine} (${d.subject})`)}
            />
          )}

          {review.existing.length > 0 && (
            <IssueList
              tone="warn"
              title={`${review.existing.length} question(s) are already in the question bank and will be skipped`}
              items={review.existing.map((d) => `Row ${d.line} (${d.subject})`)}
            />
          )}

          {Object.keys(review.bySubject).length > 0 && (
            <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={tableHeaderStyle}>New questions by subject</div>
              {Object.entries(review.bySubject).map(([subject, count]) => (
                <div key={subject} style={tableRowStyle}>
                  <span>{subject}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
          )}

          {stage === 'importing' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Importing {progress.done} of {progress.total} questions...
              </div>
              <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                    background: 'var(--gold)',
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            </div>
          )}

          {review.errors.length === 0 && review.ready.length === 0 && (
            <Alert tone="warn">Every question in this file is already in the question bank. Nothing new to import.</Alert>
          )}
        </>
      )}

      {stage === 'done' && result && (
        <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '42px', color: '#2e7d32' }}>check_circle</span>
          <h4 style={{ fontSize: '18px', margin: '8px 0 6px' }}>Import complete</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            <strong style={{ color: 'var(--navy)' }}>{result.inserted}</strong> new question(s) added to the question bank.
            {result.skipped > 0 && ` ${result.skipped} duplicate(s) skipped.`}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
        {stage === 'done' ? (
          <button type="button" onClick={handleClose} style={navyButtonStyle}>Done</button>
        ) : (
          <>
            <button type="button" onClick={handleClose} disabled={busy} style={outlineButtonStyle}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={stage !== 'review' || !review || review.errors.length > 0 || review.ready.length === 0}
              style={{
                ...navyButtonStyle,
                opacity: stage !== 'review' || !review || review.errors.length > 0 || review.ready.length === 0 ? 0.5 : 1,
              }}
            >
              {stage === 'importing'
                ? 'Importing...'
                : `Import ${review?.ready.length ? review.ready.length : ''} Question${review?.ready.length === 1 ? '' : 's'}`}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

const TONES = {
  good: { bg: '#e8f5e9', color: '#2e7d32', border: '#b7dfba' },
  warn: { bg: '#fdf7e9', color: '#8a6514', border: '#ecd9a6' },
  error: { bg: '#fdf0f0', color: '#9b1c1c', border: '#e5b8b8' },
};

function Alert({ tone, children }) {
  const t = TONES[tone];
  return (
    <div style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', marginBottom: '16px' }}>
      {children}
    </div>
  );
}

function Stat({ label, value, tone }) {
  const t = tone ? TONES[tone] : null;
  return (
    <div
      style={{
        border: `1px solid ${t ? t.border : 'var(--card-border)'}`,
        background: t ? t.bg : 'transparent',
        borderRadius: '8px',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: t ? t.color : 'var(--text-muted)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '20px', color: t ? t.color : 'var(--navy)' }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function IssueList({ tone, title, items }) {
  const t = TONES[tone];
  return (
    <details open={tone === 'error'} style={{ border: `1px solid ${t.border}`, borderRadius: '8px', marginBottom: '12px' }}>
      <summary style={{ cursor: 'pointer', background: t.bg, color: t.color, padding: '9px 12px', fontSize: '12px', fontWeight: 700, borderRadius: '8px' }}>
        {title}
      </summary>
      <ul style={{ margin: 0, padding: '8px 12px 10px 30px', maxHeight: '160px', overflowY: 'auto', fontSize: '12px', color: 'var(--navy)' }}>
        {items.slice(0, MAX_LISTED_ISSUES).map((item) => (
          <li key={item} style={{ marginBottom: '3px' }}>{item}</li>
        ))}
        {items.length > MAX_LISTED_ISSUES && (
          <li style={{ color: 'var(--text-muted)' }}>…and {items.length - MAX_LISTED_ISSUES} more</li>
        )}
      </ul>
    </details>
  );
}

const dropZoneStyle = {
  width: '100%',
  border: '1.5px dashed var(--card-border)',
  borderRadius: '8px',
  background: 'var(--bg)',
  padding: '26px 18px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
};

const fileRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 12px',
  marginBottom: '14px',
};

const tableHeaderStyle = {
  background: 'var(--bg)',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const tableRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 12px',
  fontSize: '13px',
  borderTop: '1px solid var(--card-border)',
};

const linkButtonStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--navy)',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0,
};

const navyButtonStyle = {
  background: 'var(--navy)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const outlineButtonStyle = {
  background: '#fff',
  color: 'var(--navy)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 18px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};
