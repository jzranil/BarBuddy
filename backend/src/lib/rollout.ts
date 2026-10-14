import { supabaseAdmin } from './supabase';
import { loadSubjects } from './subjects';
import { getAssessmentConfig } from './settings';
import { loadRevieweeSummary, manilaDate, REVIEWEE_PERMISSION_ID, slugForSubject } from './competency';
import { EXAM_DAYS, loadSubscription, mockAllocation, type Subscription } from './packages';
import { appUrl, dailyQuestionsEmail, sendMail } from './mailer';
import { logEvent } from './logs';

// ---------------------------------------------------------------------------
// Question selection — only the subjects in the reviewee's package, and never
// a question this reviewee has already been given (daily, mock or practice).
// ---------------------------------------------------------------------------

type PoolQuestion = { question_id: string; question_subject_id: string };

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function loadPool(subjectIds: string[]) {
  const pool: PoolQuestion[] = [];
  if (subjectIds.length === 0) return pool;
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from('bb_questions_tbl')
      .select('question_id, question_subject_id')
      .eq('is_archived', false)
      .in('question_subject_id', subjectIds)
      .order('question_id')
      .range(from, from + 999);
    if (error) throw error;
    pool.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return pool;
}

// Every question ever assigned to the reviewee (drafts included)
async function assignedQuestionIds(userId: string) {
  const ids = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin
      .from('bb_user_submissions_tbl')
      .select('question_id')
      .eq('user_id', userId)
      .order('user_submission_id')
      .range(from, from + 999);
    if (error) throw error;
    for (const row of data || []) ids.add(row.question_id);
    if (!data || data.length < 1000) break;
  }
  return ids;
}

export type PickRequest =
  | { type: 'daily'; count: number; subjectIds: string[]; dayGroups: string[][] }
  | { type: 'practice'; count: number; subjectIds: string[] }
  | { type: 'mock'; examDay: number; count: number; subjectIds: string[] };

export async function pickQuestions(userId: string, request: PickRequest) {
  const [{ subjects }, assigned, pool] = await Promise.all([
    loadSubjects(),
    assignedQuestionIds(userId),
    loadPool(request.subjectIds),
  ]);

  const fresh = pool.filter((q) => !assigned.has(q.question_id));
  const bySubject = new Map<string, PoolQuestion[]>();
  for (const q of shuffle(fresh)) {
    if (!bySubject.has(q.question_subject_id)) bySubject.set(q.question_subject_id, []);
    bySubject.get(q.question_subject_id)!.push(q);
  }
  const takeFrom = (subjectId: string, n: number) => (bySubject.get(subjectId) || []).splice(0, n);
  const chosen: PoolQuestion[] = [];

  if (request.type === 'mock') {
    // 20 essays divided among the examination day's subjects (Table 1.3 weights)
    const idForSlug = new Map(subjects.map((s) => [slugForSubject(s.question_subject_desc), s.question_subject_id]));
    for (const { slug, count } of mockAllocation(request.examDay, request.count)) {
      const id = idForSlug.get(slug);
      if (id && request.subjectIds.includes(id)) chosen.push(...takeFrom(id, count));
    }
    // Fill any shortfall from the same day's other subjects
    for (const id of request.subjectIds) {
      if (chosen.length >= request.count) break;
      chosen.push(...takeFrom(id, request.count - chosen.length));
    }
    return chosen.slice(0, request.count); // kept in subject order, like the actual Bar
  }

  if (request.type === 'daily') {
    // Adaptive rotation, weakest subject first. A one-day package rotates
    // through that day's subjects; Package 4 takes one question from each
    // examination day (Day 1, Day 2, Day 3) for cross-disciplinary review.
    const { summary } = await loadRevieweeSummary(userId);
    const scoreOf = (id: string) => {
      const s = Object.values(summary.subjects).find((x) => x.subjectId === id);
      return s?.hasScore ? s.score : -1;
    };
    const rank = (ids: string[]) => shuffle(ids).sort((a, b) => scoreOf(a) - scoreOf(b));
    const groups = request.dayGroups.length > 1 ? request.dayGroups.map(rank) : rank(request.subjectIds).map((id) => [id]);
    const hasLeft = () => request.subjectIds.some((id) => (bySubject.get(id) || []).length);

    for (let round = 0; chosen.length < request.count && hasLeft(); round++) {
      for (const group of groups) {
        if (chosen.length >= request.count) break;
        // This round's subject in the group, or the next one that still has questions
        for (let k = 0; k < group.length; k++) {
          const picked = takeFrom(group[(round + k) % group.length], 1);
          if (picked.length) {
            chosen.push(...picked);
            break;
          }
        }
      }
    }
    return chosen;
  }

  for (const id of request.subjectIds) chosen.push(...takeFrom(id, request.count - chosen.length));
  return shuffle(chosen.slice(0, request.count));
}

// Unused questions left for the reviewee in their package
export async function remainingQuestionCount(userId: string, subjectIds: string[]) {
  const [assigned, pool] = await Promise.all([assignedQuestionIds(userId), loadPool(subjectIds)]);
  return pool.filter((q) => !assigned.has(q.question_id)).length;
}

export async function insertDrafts(userId: string, assessmentId: string, questions: PoolQuestion[]) {
  const { error } = await supabaseAdmin.from('bb_user_submissions_tbl').insert(
    questions.map((q, index) => ({
      user_id: userId,
      question_id: q.question_id,
      assessment_id: assessmentId,
      question_order: index + 1,
      user_submission_answer: '',
      submission_status: 'draft',
      is_archived: false,
    }))
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Daily rollout — one set per reviewee per Philippine day, released at 7:00 AM
// ---------------------------------------------------------------------------

export const ROLLOUT_HOUR = 7; // Asia/Manila

const manilaDayStart = (date = manilaDate()) => new Date(`${date}T00:00:00+08:00`).toISOString();

export async function todaysDailySet(userId: string) {
  const { data } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .select('assessment_id, assessment_status, email_sent_at, started_at')
    .eq('user_id', userId)
    .eq('assessment_type', 'daily')
    .gte('started_at', manilaDayStart())
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// Creates today's daily set (status "ready" — the timer starts when the
// reviewee opens it). Returns the existing set when one was already released.
export async function createDailySet(userId: string, subscription: Subscription) {
  const existing = await todaysDailySet(userId);
  if (existing) return { assessmentId: existing.assessment_id as string, created: false, questionCount: null as number | null };

  const config = (await getAssessmentConfig()).daily;
  const { subjects } = await loadSubjects();
  const dayGroups = EXAM_DAYS.filter((d) => subscription.days.includes(d.day)).map((d) =>
    subjects.filter((x) => d.slugs.includes(slugForSubject(x.question_subject_desc))).map((x) => x.question_subject_id)
  );
  const questions = await pickQuestions(userId, { type: 'daily', count: config.questions, subjectIds: subscription.subjectIds, dayGroups });
  if (questions.length === 0) return { assessmentId: null, created: false, questionCount: 0, exhausted: true };

  const title = `Daily Questions — ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}`;
  const { data, error } = await supabaseAdmin
    .from('bb_assessments_tbl')
    .insert({
      user_id: userId,
      assessment_type: 'daily',
      assessment_title: title,
      assessment_status: 'ready',
      reading_minutes: config.reading_minutes,
      time_limit_minutes: config.time_limit_minutes,
      started_at: new Date().toISOString(),
      expires_at: null,
    })
    .select('assessment_id')
    .single();

  if (error) {
    // Another request released today's set first (unique daily index)
    if (error.code === '23505') {
      const again = await todaysDailySet(userId);
      return { assessmentId: (again?.assessment_id as string) ?? null, created: false, questionCount: null };
    }
    throw error;
  }

  await insertDrafts(userId, data.assessment_id, questions);
  await logEvent(userId, 'rollout', `Released "${title}" (${questions.length} questions, ${subscription.name}).`);
  return { assessmentId: data.assessment_id as string, created: true, questionCount: questions.length };
}

// Emails a daily set to the reviewee and records when it was sent
export async function emailDailySet(userId: string, assessmentId: string, subscription: Subscription) {
  const [{ data: user }, { count }] = await Promise.all([
    supabaseAdmin.from('bb_users_tbl').select('user_fname, user_lname, user_email').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('bb_user_submissions_tbl').select('user_submission_id', { count: 'exact', head: true }).eq('assessment_id', assessmentId),
  ]);
  if (!user?.user_email) return { sent: false, reason: 'The reviewee has no email address.' };

  const message = dailyQuestionsEmail({
    name: `${user.user_fname || ''} ${user.user_lname || ''}`.trim(),
    packages: subscription.name,
    questionCount: count ?? 0,
    link: `${appUrl()}/assessments/start/daily`,
  });

  try {
    const result = await sendMail(user.user_email, message);
    if (!result.sent) return result;
  } catch (error: any) {
    console.error('Daily email error:', error?.message || error);
    await logEvent(userId, 'rollout', `Daily questions email to ${user.user_email} failed: ${error?.message || 'unknown error'}`, 'ERROR');
    return { sent: false, reason: 'The email could not be sent. Check the SMTP settings in backend/.env.' };
  }

  await supabaseAdmin.from('bb_assessments_tbl').update({ email_sent_at: new Date().toISOString() }).eq('assessment_id', assessmentId);
  await logEvent(userId, 'rollout', `Emailed today's daily questions to ${user.user_email}.`);
  return { sent: true as const, to: user.user_email as string };
}

// Releases (and emails) today's set for one reviewee
export async function rolloutForUser(userId: string, options: { email: boolean; resend?: boolean }) {
  const subscription = await loadSubscription(userId);
  if (!subscription?.active) return { status: 'no_package' as const };

  const set = await createDailySet(userId, subscription);
  if (!set.assessmentId) return { status: 'exhausted' as const };

  let email: { sent: boolean; reason?: string; to?: string } = { sent: false, reason: 'skipped' };
  if (options.email) {
    const today = await todaysDailySet(userId);
    if (!today?.email_sent_at || options.resend) email = await emailDailySet(userId, set.assessmentId, subscription);
    else email = { sent: false, reason: "Today's questions were already emailed." };
  }

  return { status: set.created ? ('released' as const) : ('existing' as const), assessmentId: set.assessmentId, email };
}

// Runs at 7:00 AM Manila for every reviewee with an active package
export async function runDailyRollout() {
  const { data: users, error } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id')
    .eq('permission_id', REVIEWEE_PERMISSION_ID)
    .eq('is_archived', false)
    .not('subscription_id', 'is', null)
    .gte('user_subscription_expiry', new Date().toISOString());
  if (error) throw error;

  const totals = { reviewees: users?.length ?? 0, released: 0, emailed: 0, failed: 0 };
  for (const { user_id } of users || []) {
    try {
      const result = await rolloutForUser(user_id, { email: true });
      if (result.status === 'released') totals.released += 1;
      if ('email' in result && result.email?.sent) totals.emailed += 1;
    } catch (err: any) {
      totals.failed += 1;
      console.error('Rollout error for', user_id, err?.message || err);
    }
  }
  console.log(`[rollout ${manilaDate()}] ${JSON.stringify(totals)}`);
  return totals;
}

// True once the clock has passed 7:00 AM in Manila today
export function isPastRolloutTime(now = new Date()) {
  const hour = Number(now.toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hourCycle: 'h23' }));
  return hour >= ROLLOUT_HOUR;
}
