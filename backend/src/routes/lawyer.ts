
import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { CONTENT_MANAGER_ROLES, requireUser } from '../lib/auth';
import { loadAllRevieweeSummaries, PASSING_AT, REVIEWEE_PERMISSION_ID } from '../lib/competency';
import { loadSubjects } from '../lib/subjects';

// Review Administrator monitoring: cohort performance and reviewee reports
// (paper: "monitor reviewee progress, and generate competency and performance reports").
export const lawyerRoutes = new Hono();

async function loadReviewees() {
  const { data, error } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_fname, user_lname, user_email, user_status, created_at, user_activity, bb_user_analytics_tbl ( user_analytics_last_active )')
    .eq('permission_id', REVIEWEE_PERMISSION_ID)
    .eq('is_archived', false)
    .order('user_lname');
  if (error) throw error;
  return data || [];
}

const SHORT_LABELS: Record<string, string> = {
  'Political Law': 'Political',
  'Labor Law': 'Labor',
  'Civil Law': 'Civil',
  'Criminal Law': 'Criminal',
  'Commercial Law': 'Commercial',
  'Taxation Law': 'Taxation',
  'Remedial Law': 'Remedial',
  Ethics: 'Ethics',
};

// GET /api/lawyer/overview
lawyerRoutes.get('/overview', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  try {
    const reviewees = await loadReviewees();
    const summaries = await loadAllRevieweeSummaries(reviewees.map((r) => r.user_id));
    const { subjects } = await loadSubjects();
    const all = [...summaries.values()];

    const since30 = Date.now() - 30 * 86400000;
    const activeReviewees = reviewees.filter((r: any) => {
      const last = r.bb_user_analytics_tbl?.user_analytics_last_active || r.user_activity;
      return last && new Date(last).getTime() >= since30;
    }).length;

    const rated = all.filter((s) => s.readinessRated);
    const avgReadiness = rated.length ? Math.round(rated.reduce((sum, s) => sum + s.readinessScore, 0) / rated.length) : 0;

    const subjectPerformance = subjects.map((subject) => {
      const scores = all
        .map((s) => Object.values(s.subjects).find((x) => x.subjectId === subject.question_subject_id))
        .filter((x) => x?.hasScore)
        .map((x) => x!.score);
      return {
        label: SHORT_LABELS[subject.question_subject_desc] || subject.question_subject_desc,
        current: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        target: PASSING_AT,
        reviewees: scores.length,
      };
    });

    const alacAxis = (key: 'answer' | 'legalBasis' | 'application' | 'conclusion') => {
      const values = all.map((s) => s.alac[key]).filter((v): v is number => v !== null);
      return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    };

    const [{ count: pending }, { count: flagged }, { count: questionBank }] = await Promise.all([
      supabaseAdmin.from('bb_feedbacks_tbl').select('feedback_id, bb_user_submissions_tbl!inner ( word_count )', { count: 'exact', head: true }).eq('feedback_status', 'pending').gt('bb_user_submissions_tbl.word_count', 0),
      supabaseAdmin.from('bb_feedbacks_tbl').select('feedback_id, bb_user_submissions_tbl!inner ( word_count )', { count: 'exact', head: true }).eq('feedback_status', 'flagged').gt('bb_user_submissions_tbl.word_count', 0),
      supabaseAdmin.from('bb_questions_tbl').select('question_id', { count: 'exact', head: true }).eq('is_archived', false),
    ]);

    return c.json({
      totalReviewees: reviewees.length,
      activeReviewees,
      pendingVerification: pending || 0,
      flaggedVerification: flagged || 0,
      avgReadiness,
      avgReadinessTarget: PASSING_AT,
      examReady: rated.filter((s) => s.readinessScore >= PASSING_AT).length,
      questionBankCount: questionBank || 0,
      subjectPerformance,
      competencyDistribution: [
        { label: 'Answer', value: alacAxis('answer') },
        { label: 'Legal Basis', value: alacAxis('legalBasis') },
        { label: 'Application', value: alacAxis('application') },
        { label: 'Conclusion', value: alacAxis('conclusion') },
      ],
    });
  } catch (error: any) {
    console.error('Lawyer overview error:', error);
    return c.json({ message: 'Unable to load cohort performance.' }, 500);
  }
});

// GET /api/lawyer/reviewees — monitoring report (exportable as CSV in the UI)
lawyerRoutes.get('/reviewees', async (c) => {
  const auth = await requireUser(c, CONTENT_MANAGER_ROLES);
  if (auth.response) return auth.response;

  try {
    const reviewees = await loadReviewees();
    const summaries = await loadAllRevieweeSummaries(reviewees.map((r) => r.user_id));

    const rows = reviewees.map((r: any) => {
      const s = summaries.get(r.user_id)!;
      const scored = Object.values(s.subjects).filter((x) => x.hasScore).sort((a, b) => a.score - b.score);
      const label = (name?: string) => (name === 'Ethics' ? 'Legal Ethics' : name || '—');
      return {
        id: r.user_id,
        name: `${r.user_fname || ''} ${r.user_lname || ''}`.trim() || r.user_email,
        email: r.user_email,
        status: r.user_status,
        joinedAt: r.created_at,
        lastActive: r.bb_user_analytics_tbl?.user_analytics_last_active || null,
        readiness: s.readinessRated ? s.readinessScore : null,
        readinessLabel: s.readinessLabel,
        competency: s.readinessRated ? s.overallCompetency : null,
        accuracy: s.counts.essaysVerified ? s.accuracy : null,
        essaysSubmitted: s.counts.essaysSubmitted,
        essaysVerified: s.counts.essaysVerified,
        essaysPending: s.counts.essaysPending,
        assessmentsCompleted: s.counts.assessmentsCompleted,
        streakDays: s.streakDays,
        level: s.level,
        xp: s.xpCurrent,
        strongest: scored.length ? label(scored[scored.length - 1].name) : '—',
        weakest: scored.length ? label(scored[0].name) : '—',
      };
    });

    return c.json({ reviewees: rows });
  } catch (error: any) {
    console.error('Reviewee report error:', error);
    return c.json({ message: 'Unable to load reviewees.' }, 500);
  }
});
