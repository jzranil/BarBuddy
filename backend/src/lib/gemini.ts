import { supabaseAdmin } from './supabase';
import { awardEarnedAchievements, refreshAverageScore } from './engagement';

// AI comparison (Gemini) of a reviewee's essay against the suggested answer.
// Active only when backend/.env has GEMINI_API_KEY (GEMINI_MODEL is optional).
// The AI's score and ALAC ratings are the grade; Review Administrators only
// mark the result lawyer verified or flag it with an annotation.

export const aiConfigured = () => Boolean(process.env.GEMINI_API_KEY);
const model = () => process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export function buildPrompt(question: string, suggestedAnswer: string, userAnswer: string) {
  return `You are BarBuddy, a Philippine Bar Exam answer evaluator.

Evaluate the User Answer ONLY against the Suggested Answer.
The Suggested Answer is the ONLY source of truth.

QUESTION TYPE:
Multiple Choice ONLY if the Question explicitly shows predefined choices (e.g., A/B/C/D, True/False, Select the correct answer).
Do NOT treat subparts like (a), (b), multiple sub-questions, or short answers as Multiple Choice.
If no explicit choices exist, treat as Essay.

RULES:
Do NOT use external legal knowledge.
Do NOT add doctrines, citations, distinctions, or requirements not found in the Suggested Answer.
Do NOT reward answers just because they sound legally plausible.
Evaluate legal substance, not wording.
This is a Suggested Answer comparison task, not doctrinal grading.

ALAC:
Assess by substance even if not explicitly structured.

Answer = User's legal position
Legal Basis = doctrine/rule in Suggested Answer
Application = User's application to facts
Conclusion = User's final legal outcome

SCORING:
Matches = all material outcomes match
Partially Matches = some material outcomes match, but material differences exist
Does Not Match = core outcomes materially differ

If the Suggested Answer provides an Alternative Answer, Alternate Answer, Alternative View, Alternative Conclusion, or any clearly identified alternative acceptable answer, evaluate the User Answer against BOTH the main Suggested Answer and the alternative answer(s).

A User Answer should be considered correct if it materially matches either:
- the main Suggested Answer, OR
- any alternative acceptable answer provided in the Suggested Answer.

When comparing, use the answer that provides the strongest valid match for the User Answer.

Material differences include:
- different legal conclusion
- different liability assignment
- different doctrine
- omission of required core point
- wrong result in a material sub-question

MULTIPLE CHOICE OUTPUT:
Result: Correct/Incorrect
Correct Answer: [exact answer from Suggested Answer]
[one short positive sentence]

ESSAY OUTPUT:
Accuracy Review: [Matches / Partially Matches / Does Not Match]

Reasoning Review: [Only material matches/differences.]

ALAC Review:

Answer: [Judgment]
Explanation: [Why]

Legal Basis: [Judgment]
Explanation: [Why / or Not Present in Suggested Answer]

Application: [Judgment]
Explanation: [Why]

Conclusion: [Judgment]
Explanation: [Why]

Grammar and Clarity: [Only if readability affects evaluation. Otherwise: No material readability issue.]

Improvement Suggestion: [One correction based ONLY on Suggested Answer.]

[One short positive sentence]

OUTPUT:
Plain text only.
No markdown.

IMPORTANT:
Do not output <think> tags.
Do not reveal chain of thought.
Do not explain internal reasoning.
Output only the final evaluation.

Question:
${question}

Suggested Answer:
${suggestedAnswer}

User Answer:
${userAnswer}`;
}

// "Matches" / "Partially Matches" / "Does Not Match" / "Correct" / "Incorrect"
function parseAccuracy(text: string) {
  const essay = text.match(/Accuracy Review:\s*(Partially Matches|Does Not Match|Matches)/i);
  if (essay) return essay[1].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const mc = text.match(/Result:\s*(Correct|Incorrect)/i);
  return mc ? mc[1][0].toUpperCase() + mc[1].slice(1).toLowerCase() : null;
}

// Five-point score (Bar Bulletin No. 4, s. 2025) from the AI's verdict:
// Matches 5.0 (4.0 when it notes readability problems), Partially Matches 3.0,
// Does Not Match 1.0; multiple choice Correct 5.0, Incorrect 1.0.
export function scoreFromEvaluation(text: string, accuracy: string | null) {
  if (accuracy === 'Correct') return 5;
  if (accuracy === 'Incorrect') return 1;
  if (accuracy === 'Partially Matches') return 3;
  if (accuracy === 'Does Not Match') return 1;
  if (accuracy === 'Matches') {
    const grammar = text.match(/Grammar and Clarity:\s*(.+)/i)?.[1] ?? '';
    return !grammar || /no material readability issue/i.test(grammar) ? 5 : 4;
  }
  return null;
}

// ALAC ratings (0 missing, 1 partial, 2 complete) from the "ALAC Review" section
export function alacFromEvaluation(text: string) {
  const start = text.search(/ALAC Review:/i);
  if (start < 0) return null;
  const section = text.slice(start);
  const rate = (label: string) => {
    const judgment = section.match(new RegExp(`^\\s*${label}:\\s*(.+)$`, 'im'))?.[1] ?? '';
    if (!judgment) return null;
    if (/not present|missing|absent|does not match|incorrect|wrong|fails|no /i.test(judgment)) return 0;
    if (/partial|partly|incomplete|somewhat|weak/i.test(judgment)) return 1;
    return 2;
  };
  return { answer: rate('Answer'), legalBasis: rate('Legal Basis'), application: rate('Application'), conclusion: rate('Conclusion') };
}

const cleanOutput = (text: string) =>
  text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();

export async function evaluateAnswer(question: string, suggestedAnswer: string, userAnswer: string) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model()}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildPrompt(question, suggestedAnswer, userAnswer) }] }],
      generationConfig: { temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(60000),
  });

  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `Gemini request failed (${res.status}).`);

  const text = cleanOutput((body?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join(''));
  if (!text) throw new Error('Gemini returned an empty evaluation.');
  const accuracy = parseAccuracy(text);
  return { text, accuracy, score: scoreFromEvaluation(text, accuracy), alac: alacFromEvaluation(text), model: model() };
}

// Evaluates every submitted essay of an assessment that still needs an AI review
export async function runAiComparisons(assessmentId: string) {
  if (!aiConfigured()) return;

  const { data: items } = await supabaseAdmin
    .from('bb_user_submissions_tbl')
    .select('user_submission_answer, feedback_id, bb_questions_tbl ( question_text, question_model_answer ), bb_feedbacks_tbl!inner ( ai_status )')
    .eq('assessment_id', assessmentId)
    .eq('submission_status', 'submitted')
    .in('bb_feedbacks_tbl.ai_status', ['pending', 'not_configured', 'failed']);

  let scored = 0;
  for (const item of (items || []) as any[]) {
    const answer = String(item.user_submission_answer || '').trim();
    const question = item.bb_questions_tbl?.question_text || '';
    const suggested = item.bb_questions_tbl?.question_model_answer || '';
    if (!answer) {
      await supabaseAdmin.from('bb_feedbacks_tbl').update({ ai_status: 'skipped' }).eq('feedback_id', item.feedback_id);
      continue;
    }
    if (!suggested.trim()) {
      await supabaseAdmin.from('bb_feedbacks_tbl').update({ ai_status: 'no_suggested_answer' }).eq('feedback_id', item.feedback_id);
      continue;
    }

    // Claim the row so parallel requests do not evaluate it twice
    const { data: claimed } = await supabaseAdmin
      .from('bb_feedbacks_tbl')
      .update({ ai_status: 'processing' })
      .eq('feedback_id', item.feedback_id)
      .in('ai_status', ['pending', 'not_configured', 'failed'])
      .select('feedback_id')
      .maybeSingle();
    if (!claimed) continue;

    try {
      const result = await evaluateAnswer(question, suggested, answer);
      await supabaseAdmin
        .from('bb_feedbacks_tbl')
        .update({
          ai_status: 'done',
          ai_feedback: result.text,
          ai_accuracy: result.accuracy,
          ai_score: result.score,
          ai_alac: result.alac,
          ai_model: result.model,
          ai_generated_at: new Date().toISOString(),
          // The AI grade counts right away
          feedback_score: result.score,
          alac_answer: result.alac?.answer ?? null,
          alac_legal_basis: result.alac?.legalBasis ?? null,
          alac_application: result.alac?.application ?? null,
          alac_conclusion: result.alac?.conclusion ?? null,
        })
        .eq('feedback_id', item.feedback_id);
    } catch (error: any) {
      console.error('Gemini evaluation error:', error?.message || error);
      await supabaseAdmin.from('bb_feedbacks_tbl').update({ ai_status: 'failed', ai_feedback: null }).eq('feedback_id', item.feedback_id);
    }
    scored += 1;
  }

  if (scored > 0) {
    const { data: assessment } = await supabaseAdmin.from('bb_assessments_tbl').select('user_id').eq('assessment_id', assessmentId).maybeSingle();
    if (assessment?.user_id) {
      await refreshAverageScore(assessment.user_id);
      await awardEarnedAchievements(assessment.user_id);
    }
  }
}
