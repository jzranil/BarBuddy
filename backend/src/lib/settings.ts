
import { supabaseAdmin } from './supabase';

export type AssessmentType = 'daily' | 'mock' | 'practice';

export type AssessmentConfig = {
  questions: number;
  time_limit_minutes: number;
  reading_minutes: number;
};

// Defaults from the capstone paper: three daily practice questions and a
// twenty-essay mock Bar Examination. Admins can change these in Settings.
export const DEFAULT_ASSESSMENT_CONFIG: Record<AssessmentType, AssessmentConfig> = {
  daily: { questions: 3, time_limit_minutes: 60, reading_minutes: 5 },
  mock: { questions: 20, time_limit_minutes: 240, reading_minutes: 15 },
  practice: { questions: 5, time_limit_minutes: 90, reading_minutes: 5 },
};

export async function getAssessmentConfig(): Promise<Record<AssessmentType, AssessmentConfig>> {
  const { data } = await supabaseAdmin
    .from('bb_settings_tbl')
    .select('setting_key, setting_value')
    .like('setting_key', 'assessment.%');

  const config = structuredClone(DEFAULT_ASSESSMENT_CONFIG);

  for (const row of data || []) {
    const type = row.setting_key.replace('assessment.', '') as AssessmentType;
    if (config[type]) config[type] = { ...config[type], ...(row.setting_value as AssessmentConfig) };
  }

  return config;
}

export async function saveAssessmentConfig(type: AssessmentType, value: AssessmentConfig, userId: string) {
  const { error } = await supabaseAdmin.from('bb_settings_tbl').upsert({
    setting_key: `assessment.${type}`,
    setting_value: value,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

// Mock Bar unlock rule: a reviewee unlocks the per-day Mock Bar Examinations
// on reaching this level OR this learning streak (whichever comes first).
export type MockUnlockRule = { level: number; streak_days: number };
export const DEFAULT_MOCK_UNLOCK: MockUnlockRule = { level: 4, streak_days: 30 };

export async function getMockUnlockRule(): Promise<MockUnlockRule> {
  const { data } = await supabaseAdmin.from('bb_settings_tbl').select('setting_value').eq('setting_key', 'mock.unlock').maybeSingle();
  return { ...DEFAULT_MOCK_UNLOCK, ...((data?.setting_value as Partial<MockUnlockRule>) || {}) };
}

export async function saveMockUnlockRule(value: MockUnlockRule, userId: string) {
  const { error } = await supabaseAdmin.from('bb_settings_tbl').upsert({
    setting_key: 'mock.unlock',
    setting_value: value,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
