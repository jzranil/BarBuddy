
import { Hono, type Context } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { requireUser } from '../lib/auth';
import { loadRevieweeSummary, manilaDate, slugForSubject, WEIGHT_GROUPS, type RevieweeSummary } from '../lib/competency';
import { conditionReaders } from '../lib/engagement';
import { getAssessmentConfig } from '../lib/settings';
import { activatePlan, EXAM_DAYS, loadCatalog, loadPlan, loadSubscription, PACKAGES, packageInfo, type Subscription } from '../lib/packages';
import { paymentMethods, paymongoConfigured } from '../lib/paymongo';
import { CANCEL_LINK_MINUTES, CancelError, confirmCancellation, previewCancellation, requestCancellation } from '../lib/cancellation';
import { remainingQuestionCount, rolloutForUser, todaysDailySet } from '../lib/rollout';
import { mailConfigured } from '../lib/mailer';
import { aiConfigured } from '../lib/gemini';
import { mockUnlockStatus } from './assessments';
import { logEvent } from '../lib/logs';

// Competency and Performance Analytics Dashboard + engagement data for the
// reviewee portal (paper Figures 1.8 and 1.9).
export const revieweeRoutes = new Hono();

const ALAC_TIPS: Record<string, { label: string; tip: string }> = {
  answer: { label: 'Answer', tip: 'Open every essay with a direct "Yes" or "No" that answers the question asked.' },
  legalBasis: { label: 'Legal Basis', tip: 'Cite the exact codal provision, statute or doctrine — name the article or section.' },
  application: { label: 'Application', tip: 'Connect the rule to the facts with "In this case, ..." before concluding.' },
  conclusion: { label: 'Conclusion', tip: 'Close with a conclusion that restates your answer ("Therefore, ...").' },
};

// Published syllabus PDFs (each upload is one complete syllabus document)
async function publishedSyllabi() {
  const { data: tag } = await supabaseAdmin.from('bb_resource_tags_tbl').select('resource_tag_id').eq('resource_tag_title', 'Syllabus').maybeSingle();
  if (!tag) return [];
  const { data } = await supabaseAdmin
    .from('bb_resources_tbl')
    .select('resource_id, resource_desc, resource_file_name, resource_file_size, created_at, updated_at')
    .eq('resource_tags', tag.resource_tag_id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  return (data || []).map((r: any) => ({
    id: r.resource_id,
    title: r.resource_desc,
    fileName: r.resource_file_name,
    fileSize: r.resource_file_size,
    updatedAt: r.updated_at || r.created_at,
  }));
}

// Adaptive learning path (paper Ch. 1): weakness → learning resource →
// targeted practice → reassessment, updated as new verified results arrive.
function buildRecommendations(
  summary: RevieweeSummary,
  syllabi: Awaited<ReturnType<typeof publishedSyllabi>>,
  doneDailyToday: boolean,
  subscription: Subscription | null,
  mockUnlocked: boolean
) {
  const recs: any[] = [];

  if (!subscription?.active) {
    return [{ icon: 'inventory_2', title: 'Choose your review package', description: 'Pick the Bar subjects you want to review. Your daily questions start right away.', action: { type: 'package' } }];
  }

  if (!doneDailyToday) {
    recs.push({
      icon: 'today',
      title: "Answer today's daily questions",
      description: 'Released at 7:00 AM from your package subjects, starting with your weakest. Keep your streak alive.',
      action: { type: 'daily' },
    });
  }

  const weightOf = (slug: string) => WEIGHT_GROUPS.find((g) => g.slugs.includes(slug))?.weight ?? 0;
  const focus = Object.entries(summary.subjects)
    .filter(([slug, s]) => s.status !== 'Mastered' && subscription.subjectSlugs.includes(slug))
    .sort(([slugA, a], [slugB, b]) =>
      a.hasScore !== b.hasScore
        ? a.hasScore ? -1 : 1 // weak verified subjects first, then untested ones
        : a.hasScore
          ? a.score - b.score
          : weightOf(slugB) - weightOf(slugA)
    )
    .slice(0, 2);

  for (const [slug, s] of focus) {
    const name = s.name === 'Ethics' ? 'Legal Ethics' : s.name;
    const syllabus = syllabi[0];
    if (syllabus && !recs.some((r) => r.action.type === 'resource')) {
      recs.push({
        icon: 'menu_book',
        title: `Review ${name} in the syllabus`,
        description: s.hasScore
          ? `Your ${name} competency is ${Math.round(s.score)}%. Revisit its coverage in "${syllabus.title}".`
          : `You haven't been assessed in ${name} yet. Read its coverage in "${syllabus.title}" first.`,
        action: { type: 'resource', resourceId: syllabus.id },
      });
    }
    recs.push({
      icon: 'edit_note',
      title: `Practice ${name}`,
      description: s.hasScore
        ? `Targeted practice set to lift ${name} from ${Math.round(s.score)}% (${s.status}).`
        : `Take a ${name} practice set to measure your baseline.`,
      action: { type: 'practice', subjectSlug: slug },
    });
  }

  const weakestAlac = Object.entries(summary.alac)
    .filter(([, v]) => v !== null)
    .sort(([, a], [, b]) => (a as number) - (b as number))[0];
  if (weakestAlac && (weakestAlac[1] as number) < 75) {
    const t = ALAC_TIPS[weakestAlac[0]];
    recs.push({
      icon: 'psychology',
      title: `Strengthen your ${t.label}`,
      description: `Lawyers rated your ${t.label} at ${weakestAlac[1]}%. ${t.tip}`,
      action: { type: 'tip' },
    });
  }

  if (mockUnlocked) {
    recs.push({
      icon: 'assignment',
      title: 'Take a Mock Bar Examination',
      description: "Twenty essays for one examination day, divided among that day's subjects.",
      action: { type: 'mock' },
    });
  }

  return recs.slice(0, 5);
}

async function activeAssessments(userId: string) {
  const { data } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select('assessment_id, assessment_type, assessment_title, assessment_status, started_at, opened_at, expires_at, submitted_at, time_limit_minutes, reading_minutes, exam_day, bb_question_subjects_tbl ( question_subject_desc )')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('started_at', { ascending: false })
    .limit(20);
  return data || [];
}

// GET /api/reviewee/overview — dashboard + subjects page
revieweeRoutes.get('/overview', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const userId = auth.profile.user_id;

  const [{ summary }, syllabi, recent, config, subscription] = await Promise.all([
    loadRevieweeSummary(userId),
    publishedSyllabi(),
    activeAssessments(userId),
    getAssessmentConfig(),
    loadSubscription(userId),
  ]);
  const mockUnlock = await mockUnlockStatus(summary);

  const today = manilaDate();
  const daily = recent.find((a: any) => a.assessment_type === 'daily' && manilaDate(a.started_at) === today);
  const doneDailyToday = daily?.assessment_status === 'submitted';
  const now = Date.now();

  const inProgress = recent
    .filter((a: any) => a.assessment_status === 'in_progress' && a.expires_at && new Date(a.expires_at).getTime() > now)
    .map((a: any) => ({
      id: a.assessment_id,
      type: a.assessment_type,
      title: a.assessment_title,
      expiresAt: a.expires_at,
      minutesLeft: Math.max(0, Math.round((new Date(a.expires_at).getTime() - now) / 60000)),
    }));

  const upcoming = subscription?.active
    ? [
        ...inProgress.map((a) => ({ ...a, kind: 'resume' })),
        ...(daily?.assessment_status === 'submitted' || daily?.assessment_status === 'in_progress'
          ? []
          : [{ kind: 'daily', title: "Today's Daily Questions", detail: `${config.daily.questions} essays • ${config.daily.time_limit_minutes} min • released 7:00 AM` }]),
        ...(!mockUnlock.unlocked || inProgress.some((a) => a.type === 'mock')
          ? []
          : [{ kind: 'mock', title: 'Mock Bar Examination', detail: `${config.mock.questions} essays per examination day • ${Math.round(config.mock.time_limit_minutes / 60)} hrs` }]),
      ]
    : [];

  const recentResults = recent
    .filter((a: any) => a.assessment_status === 'submitted')
    .slice(0, 5)
    .map((a: any) => ({ id: a.assessment_id, title: a.assessment_title, type: a.assessment_type, submittedAt: a.submitted_at }));

  return c.json({
    profile: { name: auth.profile.full_name },
    summary,
    recommendations: buildRecommendations(summary, syllabi, doneDailyToday, subscription, mockUnlock.unlocked),
    upcoming,
    inProgress,
    recentResults,
    dailyStatus: !subscription?.active
      ? 'no_package'
      : daily
        ? daily.assessment_status === 'submitted'
          ? 'done'
          : daily.assessment_status === 'ready'
            ? 'ready'
            : 'in_progress'
        : 'available',
    subscription: subscription ? publicSubscription(subscription) : null,
    needsPackage: !subscription?.active,
    mockUnlock,
    config,
  });
});

// GET /api/reviewee/achievements — XP, streak, badges, challenges, progression
revieweeRoutes.get('/achievements', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const userId = auth.profile.user_id;

  const [{ summary }, catalog, owned, recent] = await Promise.all([
    loadRevieweeSummary(userId),
    supabaseAdmin
      .from('bb_achievements_tbl')
      .select('achievement_id, achievement_title, achievement_icon, achievement_desc, achievement_condition, achievement_threshold, achievement_xp_reward, achievement_rarity, achievement_category, achievement_subject_group, bb_achievement_types_tbl ( achievement_type_desc ), bb_question_subjects_tbl ( question_subject_desc )')
      .eq('is_archived', false)
      .order('achievement_threshold'),
    supabaseAdmin.from('bb_user_achievements_tbl').select('achievement_id, awarded_at').eq('user_id', userId),
    activeAssessments(userId),
  ]);

  const awardedAt = new Map((owned.data || []).map((o) => [o.achievement_id, o.awarded_at]));
  const m = summary.metrics;
  const readers = conditionReaders(summary, new Set(awardedAt.keys()), catalog.data || []);

  const entries = (catalog.data || []).map((a: any) => {
    const subjectName = a.bb_question_subjects_tbl?.question_subject_desc;
    const subject = subjectName ? slugForSubject(subjectName) : undefined;
    const earnedAt = awardedAt.get(a.achievement_id) ?? null;
    return {
      id: a.achievement_id,
      kind: a.bb_achievement_types_tbl?.achievement_type_desc === 'Achievement' ? 'achievement' : 'badge',
      icon: a.achievement_icon || 'military_tech',
      name: a.achievement_title,
      description: a.achievement_desc || '',
      category: a.achievement_category || (subjectName ? (subjectName === 'Ethics' ? 'Legal Ethics' : subjectName) : 'General'),
      rarity: a.achievement_rarity || 'Common',
      xpReward: a.achievement_xp_reward,
      requirement: {
        type: a.achievement_condition,
        target: Number(a.achievement_threshold),
        subject,
        current: readers[a.achievement_condition]?.(a) ?? 0,
        groupLabel: WEIGHT_GROUPS.find((g) => g.key === a.achievement_subject_group)?.label,
      },
      earnedAt,
      awarded: Boolean(earnedAt),
    };
  });

  // Daily challenges reset every Philippine day
  const today = manilaDate();
  const todays = recent.filter((a: any) => a.assessment_status === 'submitted' && manilaDate(a.submitted_at) === today);
  const dailyChallenges = [
    { icon: 'today', title: "Complete today's daily questions", xpReward: 80, progressCurrent: todays.some((a: any) => a.assessment_type === 'daily') ? 1 : 0, progressTotal: 1 },
    { icon: 'edit_note', title: 'Finish a subject practice set', xpReward: 50, progressCurrent: todays.some((a: any) => a.assessment_type === 'practice') ? 1 : 0, progressTotal: 1 },
    { icon: 'local_fire_department', title: 'Keep your study streak going', xpReward: 0, progressCurrent: todays.length ? 1 : 0, progressTotal: 1 },
  ];

  const level = summary.level;
  const milestones = [
    { title: 'Foundations: First Assessments', requirement: 1, detail: 'Complete your first assessment' },
    { title: 'Political & Public Law Review', requirement: 3, detail: 'Reach Level 3' },
    { title: 'Labor & Social Legislation Proficiency', requirement: 5, detail: 'Reach Level 5' },
    { title: 'Civil Law Advanced Scenarios', requirement: 8, detail: 'Reach Level 8' },
    { title: 'Grand Mock Bar Readiness', requirement: 10, detail: 'Reach Level 10' },
  ];
  let currentSet = false;
  const progression = milestones.map((step, i) => {
    const done = i === 0 ? m.examsCompleted > 0 : level >= step.requirement;
    let status = done ? 'done' : 'locked';
    if (!done && !currentSet) {
      status = 'current';
      currentSet = true;
    }
    return { title: step.title, status, detail: done ? 'Completed' : status === 'current' ? `In progress: ${step.detail}` : `Requirement: ${step.detail}` };
  });

  const finalFrontier = {
    title: 'Grand Mock Bar Examination',
    requirements: [
      { label: 'Reach Level 10', met: level >= 10 },
      { label: 'Bar Readiness Score of 75+', met: summary.readinessScore >= 75 },
      { label: 'Complete 3 Mock Bar Examinations', met: m.studySessionsCompleted >= 3 },
      { label: 'Master at least 2 subjects', met: m.subjectsMastered >= 2 },
    ],
  };

  return c.json({
    summary: {
      displayName: auth.profile.full_name,
      levelTitle: summary.title,
      level: summary.level,
      xpCurrent: summary.xpCurrent,
      xpTarget: summary.xpTarget,
      streakDays: summary.streakDays,
      longestStreak: summary.longestStreak,
      expPoints: summary.xpCurrent,
    },
    metrics: m,
    badges: entries.filter((e) => e.kind === 'badge'),
    achievements: entries.filter((e) => e.kind === 'achievement'),
    dailyChallenges,
    progression,
    finalFrontier,
  });
});

// GET /api/reviewee/resources — published syllabi (paper TC-SM-008)
revieweeRoutes.get('/resources', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;
  return c.json({ resources: await publishedSyllabi() });
});

// GET /api/reviewee/config — assessment settings shown before starting
revieweeRoutes.get('/config', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  return c.json({ config: await getAssessmentConfig() });
});

// GET /api/reviewee/subjects/:slug — essays answered in one subject + its syllabi
revieweeRoutes.get('/subjects/:slug', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  const slug = c.req.param('slug');
  const [{ summary }, syllabi] = await Promise.all([loadRevieweeSummary(auth.profile.user_id), publishedSyllabi()]);
  const stats = summary.subjects[slug];
  if (!stats) return c.json({ message: 'Subject not found.' }, 404);

  const { data, error } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select(`
      user_submission_id, assessment_id, submitted_at, word_count,
      bb_questions_tbl!inner ( question_text, question_subject_id ),
      bb_assessments_tbl ( assessment_title, assessment_type ),
      bb_feedbacks_tbl ( feedback_status, feedback_score )
    `)
    .eq('user_id', auth.profile.user_id)
    .eq('submission_status', 'submitted')
    .eq('bb_questions_tbl.question_subject_id', stats.subjectId)
    .order('submitted_at', { ascending: false })
    .limit(100);

  if (error) return c.json({ message: 'Unable to load your essays.' }, 500);

  const essays = (data || []).map((s: any) => ({
    id: s.user_submission_id,
    assessmentId: s.assessment_id,
    assessmentTitle: s.bb_assessments_tbl?.assessment_title,
    assessmentType: s.bb_assessments_tbl?.assessment_type,
    title: s.bb_questions_tbl.question_text.replace(/\s+/g, ' ').slice(0, 110),
    submittedAt: s.submitted_at,
    wordCount: s.word_count,
    status: s.bb_feedbacks_tbl?.feedback_status ?? 'pending',
    score: s.bb_feedbacks_tbl?.feedback_score === null || s.bb_feedbacks_tbl?.feedback_score === undefined ? null : Number(s.bb_feedbacks_tbl.feedback_score),
  }));

  const ranked = Object.entries(summary.subjects).sort(([, a], [, b]) => (a.hasScore ? a.score : -1) - (b.hasScore ? b.score : -1));
  const position = ranked.findIndex(([s]) => s === slug);
  const tip = !stats.hasScore
    ? 'Take a practice set to establish your baseline in this subject. Your competency appears once a lawyer verifies your essays.'
    : stats.status === 'Mastered'
      ? 'Excellent work. Keep this subject fresh with a weekly practice set and focus your energy on weaker subjects.'
      : `This is your #${position + 1} weakest subject at ${Math.round(stats.score)}%. Review the syllabus, then take a practice set to raise it toward the 75% passing mark.`;

  return c.json({
    stats,
    essays,
    syllabi,
    tip,
  });
});

function publicSubscription(sub: Subscription) {
  const { subjectIds: _ids, ...rest } = sub;
  return rest;
}

// GET /api/reviewee/packages — review packages + current choice
revieweeRoutes.get('/packages', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;

  const [catalog, subscription] = await Promise.all([loadCatalog(), loadSubscription(auth.profile.user_id)]);
  return c.json({
    packages: PACKAGES.map((p) => ({
      ...p,
      examDays: EXAM_DAYS.filter((d) => p.days.includes(d.day)),
      plans: catalog
        .filter((row: any) => row.subscription_package === p.package)
        .map((row: any) => ({ subscriptionId: row.subscription_id, durationDays: row.subscription_duration, price: Number(row.subscription_price) })),
    })),
    subscription: subscription ? publicSubscription(subscription) : null,
    paymentEnabled: paymongoConfigured(),
    paymentMethods: paymongoConfigured() ? paymentMethods() : [],
    emailConfigured: mailConfigured(),
    aiConfigured: aiConfigured(),
  });
});

// POST /api/reviewee/subscription — { subscriptionId } choose a package. The
// first daily set is released right away and emailed (for testing).
revieweeRoutes.post('/subscription', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const userId = auth.profile.user_id;

  // Once PayMongo is set up, packages are activated only by a paid checkout
  if (paymongoConfigured()) {
    return c.json({ message: 'Pay for this package to activate it.', paymentRequired: true }, 402);
  }

  const body = await c.req.json().catch(() => null);
  const plan = await loadPlan(String(body?.subscriptionId || ''));
  if (!plan) return c.json({ message: 'Choose one of the listed packages.' }, 400);

  const info = packageInfo(plan.subscription_package)!;
  let lastDay: string;
  try {
    lastDay = await activatePlan(userId, plan);
  } catch {
    return c.json({ message: 'Unable to save your package.' }, 500);
  }

  await logEvent(userId, 'subscription', `Chose ${info.name} (${plan.subscription_duration} days).`);

  const rollout = await rolloutForUser(userId, { email: true });
  const subscription = await loadSubscription(userId);

  return c.json({
    message: `${info.name} is active until ${lastDay}.`,
    subscription: subscription ? publicSubscription(subscription) : null,
    rollout,
  });
});

const cancelFailure = (c: Context, err: unknown) => {
  if (err instanceof CancelError) return c.json({ message: err.message }, err.status);
  throw err;
};

// POST /api/reviewee/subscription/cancel — emails a confirmation link
revieweeRoutes.post('/subscription/cancel', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  try {
    const r = await requestCancellation(auth.profile.user_id);
    return c.json({
      message: `We sent a confirmation link to ${r.email}. Open it within ${CANCEL_LINK_MINUTES} minutes to cancel your package.`,
      ...r,
    });
  } catch (err) {
    return cancelFailure(c, err);
  }
});

// POST /api/reviewee/subscription/cancel/preview — { token } (public: the
// emailed token is the proof). What the confirmation page shows.
revieweeRoutes.post('/subscription/cancel/preview', async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    return c.json(await previewCancellation(String(body?.token || '')));
  } catch (err) {
    return cancelFailure(c, err);
  }
});

// POST /api/reviewee/subscription/cancel/confirm — { token } ends the package
revieweeRoutes.post('/subscription/cancel/confirm', async (c) => {
  const body = await c.req.json().catch(() => null);
  try {
    const r = await confirmCancellation(String(body?.token || ''));
    return c.json({ message: `${r.packageName} has been cancelled. We emailed you a confirmation.` });
  } catch (err) {
    return cancelFailure(c, err);
  }
});

// POST /api/reviewee/daily/email — resend today's daily questions email
revieweeRoutes.post('/daily/email', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const result = await rolloutForUser(auth.profile.user_id, { email: true, resend: true });
  if (result.status === 'no_package') return c.json({ message: 'Choose a review package first.', needsPackage: true }, 403);
  if (result.status === 'exhausted') return c.json({ message: 'No unused questions are left in your package.' }, 409);
  return c.json({ ...result, message: result.email?.sent ? `Sent to ${result.email.to}.` : result.email?.reason });
});

// GET /api/reviewee/daily — today's set and how many unused questions remain
revieweeRoutes.get('/daily', async (c) => {
  const auth = await requireUser(c, ['reviewee']);
  if (auth.response) return auth.response;
  const subscription = await loadSubscription(auth.profile.user_id);
  if (!subscription) return c.json({ today: null, remaining: 0, needsPackage: true });
  const [today, remaining] = await Promise.all([
    todaysDailySet(auth.profile.user_id),
    remainingQuestionCount(auth.profile.user_id, subscription.subjectIds),
  ]);
  return c.json({
    today: today ? { id: today.assessment_id, status: today.assessment_status, emailedAt: today.email_sent_at } : null,
    remaining,
    needsPackage: !subscription.active,
  });
});
