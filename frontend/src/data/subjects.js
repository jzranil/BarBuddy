// ---------------------------------------------------------------------------
// SUBJECT METADATA — static content (names, icons, descriptions).
// This part does NOT come from the backend; it's the fixed list of the
// 8 Philippine Bar subjects and is safe to keep hardcoded.
// ---------------------------------------------------------------------------
export const SUBJECTS = [
  {
    slug: 'political-law',
    name: 'Political Law',
    icon: 'balance',
    description: 'Constitutional Law, Administrative Law, and Public International Law.',
  },
  {
    slug: 'labor-law',
    name: 'Labor Law',
    icon: 'work',
    description: 'Labor Standards, Labor Relations, and Social Legislation.',
  },
  {
    slug: 'civil-law',
    name: 'Civil Law',
    icon: 'group',
    description: 'Persons, Family Relations, Property, Obligations and Contracts, Succession.',
  },
  {
    slug: 'criminal-law',
    name: 'Criminal Law',
    icon: 'gavel',
    description: 'Revised Penal Code and Special Penal Laws.',
  },
  {
    slug: 'commercial-law',
    name: 'Commercial Law',
    icon: 'handshake',
    description: 'Corporation Law, Negotiable Instruments, Insurance, and Intellectual Property.',
  },
  {
    slug: 'tax-law',
    name: 'Tax Law',
    icon: 'account_balance',
    description: 'National Internal Revenue Code, Tariff and Customs, and Local Taxation.',
  },
  {
    slug: 'remedial-law',
    name: 'Remedial Law',
    icon: 'shield',
    description: 'Civil Procedure, Criminal Procedure, Evidence, and Special Proceedings.',
  },
  {
    slug: 'legal-ethics',
    name: 'Legal Ethics',
    icon: 'menu_book',
    description: 'Code of Professional Responsibility and Legal Forms.',
  },
];

// ---------------------------------------------------------------------------
// PERFORMANCE / ANALYTICS DATA — everything below is intentionally zeroed.
// There is no backend yet, so nothing here should be faked.
//
// BACKEND TODO: replace calls to `getZeroedSubjectStats()` and
// `getZeroedUserSummary()` with real API calls (e.g. GET /api/reviewee/summary
// and GET /api/reviewee/subjects) once Lambda + Supabase are wired up. Keep
// the SAME field names below so the components don't need to change — just
// swap where the data comes from.
// ---------------------------------------------------------------------------

// Per-subject performance stats. In the real app this is a map keyed by
// subject slug, coming from something like:
//   GET /api/reviewee/subjects  ->  { "political-law": { score: 85, ... }, ... }
export function getZeroedSubjectStats() {
  const stats = {};
  SUBJECTS.forEach((s) => {
    stats[s.slug] = {
      score: 0, // 0-100 competency score
      status: 'Not Started', // 'Mastered' | 'Reviewing' | 'Weak' | 'Not Started'
      trendDirection: null, // 'up' | 'down' | null
      trendLabel: 'No data yet',
      examsAttempted: 0,
      examsTotal: 0,
      averageScore: 0,
      aiProficiency: '—', // 'High' | 'Medium' | 'Low' | '—'
      currentReadiness: 0, // 0-100, shown in the small gauge on the subject page
      readinessTrendLabel: 'No data yet',
    };
  });
  return stats;
}

// Overall reviewee/dashboard summary — maps to something like
// GET /api/reviewee/summary
export function getZeroedUserSummary() {
  return {
    displayName: 'Atty. Candidate', // BACKEND TODO: pull from Cognito user profile
    email: 'reviewee@example.com', // BACKEND TODO: pull from Cognito user profile
    streakDays: 0,
    outperformPercent: 0,
    readinessScore: 0, // overall "Bar Readiness Score" gauge, 0-100
    accuracy: 0,
    consistency: '—', // 'High' | 'Medium' | 'Low' | '—'
    level: 0,
    levelTitle: '—',
    xpCurrent: 0,
    xpTarget: 15000,
  };
}

// Status badge -> color mapping, shared by SubjectCard everywhere it appears.
export const STATUS_STYLES = {
  Mastered: { border: 'var(--gold)', color: 'var(--navy)', bg: '#fdf7e9' },
  Reviewing: { border: 'var(--navy)', color: 'var(--navy)', bg: '#eef0f4' },
  Weak: { border: '#c0392b', color: '#c0392b', bg: '#fbeae8' },
  'Not Started': { border: 'var(--card-border)', color: 'var(--text-muted)', bg: '#f5f3ee' },
};
