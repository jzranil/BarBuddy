import { supabaseAdmin } from './supabase';
import { loadSubjects } from './subjects';
import { manilaDate, slugForSubject, WEIGHT_GROUPS } from './competency';

// 2026 Philippine Bar Examination schedule — three examination days
export const EXAM_DAYS = [
  { day: 1, label: 'Day 1', subjects: 'Political & Public International Law; Commercial & Taxation Laws', slugs: ['political-law', 'commercial-law', 'tax-law'] },
  { day: 2, label: 'Day 2', subjects: 'Civil Law (incl. Land Titles & Deeds); Labor Law & Social Legislation', slugs: ['civil-law', 'labor-law'] },
  { day: 3, label: 'Day 3', subjects: 'Criminal Law; Remedial Law, Legal & Judicial Ethics with Practical Exercises', slugs: ['criminal-law', 'remedial-law', 'legal-ethics'] },
];

// Review packages (payment is not enabled yet — reviewees choose freely)
export const PACKAGES = [
  { package: 1, name: 'Package 1', tagline: 'Day 1 Subjects', subjects: 'Political, Commercial and Taxation Laws', days: [1] },
  { package: 2, name: 'Package 2', tagline: 'Day 2 Subjects', subjects: 'Civil and Labor Laws', days: [2] },
  { package: 3, name: 'Package 3', tagline: 'Day 3 Subjects', subjects: 'Criminal, Remedial Law and Legal Ethics', days: [3] },
  { package: 4, name: 'Package 4', tagline: 'All Subjects', subjects: 'All Bar subjects (Day 1, 2 and 3)', days: [1, 2, 3] },
];

export const packageInfo = (pkg: number | null | undefined) => PACKAGES.find((p) => p.package === pkg) ?? null;

export const slugsForPackage = (pkg: number) =>
  EXAM_DAYS.filter((d) => packageInfo(pkg)?.days.includes(d.day)).flatMap((d) => d.slugs);

// Splits a Mock Bar for one examination day across that day's subjects using
// the Table 1.3 weights (a group's weight is shared by its subjects).
export function mockAllocation(day: number, total = 20) {
  const slugs = EXAM_DAYS.find((d) => d.day === day)?.slugs ?? [];
  const weightOf = (slug: string) => {
    const group = WEIGHT_GROUPS.find((g) => g.slugs.includes(slug));
    return group ? group.weight / group.slugs.length : 0;
  };
  const sum = slugs.reduce((s, slug) => s + weightOf(slug), 0) || 1;
  const rows = slugs.map((slug) => {
    const exact = (total * weightOf(slug)) / sum;
    return { slug, count: Math.floor(exact), rem: exact - Math.floor(exact) };
  });
  let left = total - rows.reduce((s, r) => s + r.count, 0);
  for (const r of [...rows].sort((a, b) => b.rem - a.rem)) {
    if (left-- <= 0) break;
    r.count += 1;
  }
  return rows.map(({ slug, count }) => ({ slug, count }));
}

export type Subscription = {
  subscriptionId: string;
  package: number;
  name: string;
  tagline: string;
  subjects: string;
  days: number[];
  durationDays: number;
  price: number;
  startedAt: string | null;
  expiresOn: string | null;
  active: boolean;
  daysLeft: number;
  subjectIds: string[];
  subjectSlugs: string[];
};

export async function loadCatalog() {
  const { data, error } = await supabaseAdmin
    .from('bb_subscriptions_tbl')
    .select('subscription_id, subscription_desc, subscription_duration, subscription_price, subscription_package')
    .not('subscription_package', 'is', null)
    .eq('is_archived', false)
    .order('subscription_package')
    .order('subscription_duration', { ascending: false });
  if (error) throw error;
  return data || [];
}

// The reviewee's chosen package, or null when they have not chosen one yet
export async function loadSubscription(userId: string): Promise<Subscription | null> {
  const { data: user } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('subscription_id, subscription_started_at, user_subscription_expiry, bb_subscriptions_tbl ( subscription_id, subscription_duration, subscription_price, subscription_package )')
    .eq('user_id', userId)
    .maybeSingle();

  const sub: any = user?.bb_subscriptions_tbl;
  const info = packageInfo(sub?.subscription_package);
  if (!sub || !info) return null;

  const { subjects } = await loadSubjects();
  const slugs = slugsForPackage(info.package);
  const subjectIds = subjects.filter((s) => slugs.includes(slugForSubject(s.question_subject_desc))).map((s) => s.question_subject_id);

  const expiresOn = user?.user_subscription_expiry ? manilaDate(user.user_subscription_expiry) : null;
  const today = manilaDate();
  const daysLeft = expiresOn ? Math.max(0, Math.round((Date.parse(expiresOn) - Date.parse(today)) / 86400000) + 1) : 0;

  return {
    subscriptionId: sub.subscription_id,
    package: info.package,
    name: info.name,
    tagline: info.tagline,
    subjects: info.subjects,
    days: info.days,
    durationDays: sub.subscription_duration,
    price: Number(sub.subscription_price),
    startedAt: user?.subscription_started_at ?? null,
    expiresOn,
    active: Boolean(expiresOn && expiresOn >= today),
    daysLeft,
    subjectIds,
    subjectSlugs: slugs,
  };
}

// A listed (non-archived) package plan, or null
export async function loadPlan(subscriptionId: string) {
  const { data } = await supabaseAdmin
    .from('bb_subscriptions_tbl')
    .select('subscription_id, subscription_duration, subscription_price, subscription_package')
    .eq('subscription_id', subscriptionId)
    .eq('is_archived', false)
    .not('subscription_package', 'is', null)
    .maybeSingle();
  return data && packageInfo(data.subscription_package) ? data : null;
}

// Starts a plan today (replacing any current package). Returns the last day.
export async function activatePlan(userId: string, plan: { subscription_id: string; subscription_duration: number }) {
  const start = new Date();
  const lastDay = manilaDate(new Date(start.getTime() + (plan.subscription_duration - 1) * 86400000));
  const { error } = await supabaseAdmin
    .from('bb_users_tbl')
    .update({
      subscription_id: plan.subscription_id,
      subscription_started_at: start.toISOString(),
      user_subscription_expiry: new Date(`${lastDay}T23:59:59+08:00`).toISOString(),
      updated_at: start.toISOString(),
    })
    .eq('user_id', userId);
  if (error) throw error;
  return lastDay;
}
