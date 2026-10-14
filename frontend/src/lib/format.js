// Shared display helpers for dates, scores and grading labels.

export function formatDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, options);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function timeAgo(value) {
  if (!value) return '—';
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

// Table 1.2 — Philippine Bar Examination Five-Point Qualitative Grading Standard
export const GRADING_STANDARD = [
  { score: 5, label: 'Excellent', criteria: 'Correct legal conclusion, correct legal bases, clear, complete and polished with minimal grammar errors.' },
  { score: 4, label: 'Very Good', criteria: 'Correct legal conclusion and correct legal bases, but with flaws in grammar or presentation.' },
  { score: 3, label: 'Good', criteria: 'Correct legal conclusion, but cites incorrect legal bases, or mixes correct and incorrect/inapplicable bases.' },
  { score: 2, label: 'Fair', criteria: 'Incorrect legal conclusion, but shows capacity for effective legal reasoning and adequate reference to legal authorities.' },
  { score: 1, label: 'Poor', criteria: 'Incorrect legal conclusion and lacks ability to reason and communicate effectively, despite a bona fide attempt.' },
  { score: 0, label: 'No Credit', criteria: 'No answer, or irrelevant, incoherent or nonsensical text.' },
];

// Table 1.1 — ALAC Answering Framework
export const ALAC_COMPONENTS = [
  { key: 'answer', letter: 'A', label: 'Answer', hint: 'A clear, definitive legal conclusion at the start.' },
  { key: 'legalBasis', letter: 'L', label: 'Legal Basis', hint: 'Relevant codal provisions, statutes or jurisprudence, accurately cited.' },
  { key: 'application', letter: 'A', label: 'Application', hint: 'Links the facts of the problem to the legal doctrines.' },
  { key: 'conclusion', letter: 'C', label: 'Conclusion', hint: 'A concise summary that reinforces the answer.' },
];

export const ALAC_RATINGS = [
  { value: 2, label: 'Complete' },
  { value: 1, label: 'Partial' },
  { value: 0, label: 'Missing' },
];

export const alacRatingLabel = (value) => ALAC_RATINGS.find((r) => r.value === value)?.label ?? 'Not rated';

export const ASSESSMENT_TYPE_LABELS = {
  daily: 'Daily Questions',
  mock: 'Mock Bar Exam',
  practice: 'Practice Set',
};

export function downloadCsv(filename, rows) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map((r) => r.map(escape).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
