
import { supabaseAdmin } from './supabase';

export type Subject = {
  question_subject_id: string;
  question_subject_desc: string;
};

// Alternative names used in CSV files → name stored in bb_question_subjects_tbl
const SUBJECT_ALIASES: Record<string, string> = {
  'legal ethics': 'ethics',
  'legal and judicial ethics': 'ethics',
  'judicial ethics': 'ethics',
  'mercantile law': 'commercial law',
  'taxation': 'taxation law',
  'tax law': 'taxation law',
  'political and international law': 'political law',
  'constitutional law': 'political law',
  'labor law and social legislation': 'labor law',
  'criminal law and procedure': 'criminal law',
  'remedial law and procedure': 'remedial law',
};

export function normalizeSubjectName(name: string) {
  const clean = name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, ' ').trim();
  return SUBJECT_ALIASES[clean] ?? clean;
}

// Key used to detect duplicate questions. Matches the database unique index
// bb_questions_subject_text_unique (question_subject_id, lower(trim(question_text))).
export function questionKey(subjectId: string, questionText: string) {
  return `${subjectId}|${questionText.trim().toLowerCase()}`;
}

export async function loadSubjects() {
  const { data, error } = await supabaseAdmin
    .from('bb_question_subjects_tbl')
    .select('question_subject_id, question_subject_desc')
    .order('question_subject_desc');

  if (error) throw error;

  const subjects = (data || []) as Subject[];
  const byName = new Map(
    subjects.map((s) => [normalizeSubjectName(s.question_subject_desc), s])
  );

  return {
    subjects,
    resolve: (name: string) => byName.get(normalizeSubjectName(name)) ?? null,
  };
}

// Duplicate keys of every question already stored for the given subjects
export async function loadExistingQuestionKeys(subjectIds: string[]) {
  const keys = new Set<string>();
  if (subjectIds.length === 0) return keys;

  const PAGE = 1000;

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from('bb_questions_tbl')
      .select('question_subject_id, question_text')
      .in('question_subject_id', subjectIds)
      .order('question_id')
      .range(from, from + PAGE - 1);

    if (error) throw error;

    for (const row of data || []) {
      keys.add(questionKey(row.question_subject_id, row.question_text));
    }

    if (!data || data.length < PAGE) break;
  }

  return keys;
}
