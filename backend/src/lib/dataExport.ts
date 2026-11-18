import { supabaseAdmin } from './supabase';

// Super Admin → Settings → Database Records: CSV exports of BarBuddy's tables
// (paper use case "Manage database records"). Tables holding secrets (reset
// tokens, authenticator keys) are never offered, and any column whose name
// looks secret is left out of every export.
export const EXPORT_TABLES = [
  { key: 'users', table: 'bb_users_tbl', label: 'Users', description: 'Accounts, roles and status' },
  { key: 'subscriptions', table: 'bb_subscriptions_tbl', label: 'Review packages', description: 'Package plans and prices' },
  { key: 'payments', table: 'bb_payments_tbl', label: 'Payments', description: 'Payment links, receipts and status' },
  { key: 'questions', table: 'bb_questions_tbl', label: 'Questions', description: 'Question bank and model answers' },
  { key: 'question-subjects', table: 'bb_question_subjects_tbl', label: 'Question subjects', description: 'Bar subjects' },
  { key: 'assessments', table: 'bb_assessments_tbl', label: 'Assessments', description: 'Daily, practice and mock exam sessions' },
  { key: 'submissions', table: 'bb_user_submissions_tbl', label: 'Submissions', description: 'Reviewee essay answers' },
  { key: 'feedbacks', table: 'bb_feedbacks_tbl', label: 'AI and lawyer feedback', description: 'Scores, ALAC ratings and verification' },
  { key: 'analytics', table: 'bb_user_analytics_tbl', label: 'Competency analytics', description: 'Per-subject competency and readiness' },
  { key: 'highlights', table: 'bb_user_highlights_tbl', label: 'Highlights and notes', description: 'Reviewee highlights on results' },
  { key: 'achievements', table: 'bb_achievements_tbl', label: 'Badges', description: 'Badge definitions' },
  { key: 'achievement-types', table: 'bb_achievement_types_tbl', label: 'Badge types', description: 'Badge categories' },
  { key: 'user-achievements', table: 'bb_user_achievements_tbl', label: 'Earned badges', description: 'Badges earned by reviewees' },
  { key: 'resources', table: 'bb_resources_tbl', label: 'Syllabi', description: 'Syllabus records (not the PDF files)' },
  { key: 'resource-tags', table: 'bb_resource_tags_tbl', label: 'Syllabus tags', description: 'Subject and exam-day tags' },
  { key: 'announcements', table: 'bb_announcements_tbl', label: 'Announcements', description: 'Announcements and notifications' },
  { key: 'logs', table: 'bb_logs_tbl', label: 'System logs', description: 'Activity and audit log' },
  { key: 'ai-usage', table: 'bb_ai_usage_tbl', label: 'AI API usage', description: 'Gemini requests, tokens and errors' },
  { key: 'permissions', table: 'bb_permissions_tbl', label: 'Roles', description: 'Role definitions' },
] as const;

// e.g. payment_token, but not AI usage counts such as prompt_tokens
const SECRET_COLUMN = /(^|_)(token|secret|password|hash|otp|key)(_|$)|checkout_url/i;
const PAGE = 1000;
export const MAX_EXPORT_ROWS = 20000;
// Lambda responses are capped at 6 MB; stop well before that
const MAX_EXPORT_CHARS = 4_500_000;

// Spreadsheet apps run cells that start with = + - @ as formulas; prefix
// those (unless they are plain numbers) so a stored value can't become one
function cell(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /^[=+\-@\t\r]/.test(text) && !/^[+-]?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;
}

export async function exportCounts() {
  return Promise.all(
    EXPORT_TABLES.map(async (t) => {
      const { count, error } = await supabaseAdmin.from(t.table).select('*', { count: 'exact', head: true });
      return { key: t.key, label: t.label, description: t.description, rows: error ? null : count ?? 0 };
    })
  );
}

export async function exportTable(key: string) {
  const config = EXPORT_TABLES.find((t) => t.key === key);
  if (!config) return null;

  const records: Record<string, unknown>[] = [];
  let truncated = false;
  let size = 0;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin.from(config.table).select('*').range(from, from + PAGE - 1);
    if (error) throw new Error(`Could not read ${config.label}: ${error.message}`);
    for (const record of data || []) {
      size += JSON.stringify(record).length;
      if (records.length >= MAX_EXPORT_ROWS || size > MAX_EXPORT_CHARS) {
        truncated = true;
        break;
      }
      records.push(record);
    }
    if (truncated || !data || data.length < PAGE) break;
  }

  const columns = [...new Set(records.flatMap((r) => Object.keys(r)))].filter((c) => !SECRET_COLUMN.test(c));
  return {
    label: config.label,
    filename: `barbuddy-${config.key}-${new Date().toISOString().slice(0, 10)}.csv`,
    columns,
    rows: records.map((r) => columns.map((c) => cell(r[c]))),
    truncated,
  };
}
