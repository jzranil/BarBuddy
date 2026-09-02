import { Link, useLocation, useParams } from 'react-router-dom';
import { SUBJECTS } from '../../data/subjects';
import { getDummyExamById } from '../../data/exams';

// Static route → label maps, one per portal. Kept in sync with each
// Sidebar's NAV_ITEMS labels so the breadcrumb trail always matches what
// the sidebar calls a page.
const REVIEWEE_LABELS = {
  '/dashboard': 'Dashboard',
  '/subjects': 'Subjects',
  '/achievements': 'Achievements',
  '/subscription': 'Subscription',
  '/settings': 'Settings',
};

const LAWYER_LABELS = {
  '/lawyer': 'Dashboard',
  '/lawyer/verification': 'Verification',
  '/lawyer/curriculum': 'Curriculum',
  '/lawyer/questionnaire': 'Questionnaire',
  '/lawyer/settings': 'Settings',
};

const SUPERADMIN_LABELS = {
  '/superadmin': 'Dashboard',
  '/superadmin/user-control': 'User Control',
  '/superadmin/system-logs': 'System Logs',
  '/superadmin/payment': 'Payment Management',
  '/superadmin/settings': 'Settings',
};

const STAGE_LABELS = { intro: 'Intro', take: 'Take Exam', results: 'Results' };

function buildRevieweeCrumbs(pathname, params, stateTitle) {
  const crumbs = [{ label: 'Dashboard', path: '/dashboard' }];
  if (pathname === '/dashboard') return crumbs;

  if (pathname === '/coming-soon') {
    crumbs.push({ label: stateTitle || 'Coming Soon' });
    return crumbs;
  }

  if (REVIEWEE_LABELS[pathname]) {
    crumbs.push({ label: REVIEWEE_LABELS[pathname] });
    return crumbs;
  }

  if (pathname === '/achievements/sanctum' || pathname === '/achievements/badges') {
    crumbs.push({ label: 'Achievements', path: '/achievements' });
    crumbs.push({ label: pathname === '/achievements/sanctum' ? 'Achievements Sanctum' : 'Badges' });
    return crumbs;
  }

  // /subjects/:slug and the exam intro/take/results sub-routes
  if (params.slug) {
    const subject = SUBJECTS.find((s) => s.slug === params.slug);
    const subjectName = subject?.name ?? params.slug;
    crumbs.push({ label: 'Subjects', path: '/subjects' });

    if (!params.examId) {
      crumbs.push({ label: subjectName });
      return crumbs;
    }

    crumbs.push({ label: subjectName, path: `/subjects/${params.slug}` });
    const exam = getDummyExamById(params.slug, subjectName, params.examId);
    crumbs.push({ label: exam?.title ?? 'Assessment' });

    const stage = Object.keys(STAGE_LABELS).find((s) => pathname.endsWith(`/${s}`));
    if (stage) crumbs.push({ label: STAGE_LABELS[stage] });
    return crumbs;
  }

  return crumbs;
}

function buildStaticCrumbs(pathname, labels, rootPath) {
  const crumbs = [{ label: labels[rootPath] ?? 'Dashboard', path: rootPath }];
  if (pathname === rootPath) return crumbs;
  if (labels[pathname]) crumbs.push({ label: labels[pathname] });
  return crumbs;
}

// portal: 'reviewee' | 'lawyer' | 'superadmin'
export default function Breadcrumb({ portal }) {
  const location = useLocation();
  const params = useParams();

  let crumbs;
  if (portal === 'lawyer') {
    crumbs = buildStaticCrumbs(location.pathname, LAWYER_LABELS, '/lawyer');
  } else if (portal === 'superadmin') {
    crumbs = buildStaticCrumbs(location.pathname, SUPERADMIN_LABELS, '/superadmin');
  } else {
    crumbs = buildRevieweeCrumbs(location.pathname, params, location.state?.title);
  }

  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: '18px' }}>
      <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px', margin: 0, padding: 0, fontSize: '12px' }}>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {i === 0 && (
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  home
                </span>
              )}
              {crumb.path && !isLast ? (
                <Link
                  to={crumb.path}
                  style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--navy)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: isLast ? 'var(--navy)' : 'var(--text-muted)', fontWeight: isLast ? 700 : 500 }}>
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--card-border)' }}>
                  chevron_right
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
