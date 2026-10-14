
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
