// AI comparison (Gemini) of an essay against the suggested answer. Shows a
// placeholder until GEMINI_API_KEY is configured on the server.
const ACCURACY_COLORS = {
  Matches: { bg: '#e8f5e9', color: '#2e7d32' },
  Correct: { bg: '#e8f5e9', color: '#2e7d32' },
  'Partially Matches': { bg: '#fdf7e9', color: '#8a6514' },
  'Does Not Match': { bg: '#fdf0f0', color: '#9b1c1c' },
  Incorrect: { bg: '#fdf0f0', color: '#9b1c1c' },
};

const MESSAGES = {
  not_configured:
    'The AI comparison and score will be shown here. Gemini is not connected yet, so this essay has not been compared with the suggested answer. It will be scored automatically once the AI is integrated.',
  pending: 'Gemini is comparing this answer with the suggested answer. This usually takes less than a minute.',
  processing: 'Gemini is comparing this answer with the suggested answer. This usually takes less than a minute.',
  failed: 'The AI comparison could not be generated this time. It will be retried automatically.',
  skipped: 'No answer was given, so there is nothing to compare.',
  no_suggested_answer: 'This question has no suggested answer yet, so the AI comparison is not available.',
};

export default function AiComparisonCard({ ai, audience = 'reviewee' }) {
  const status = ai?.status || 'not_configured';
  const accuracy = ai?.accuracy;
  const colors = ACCURACY_COLORS[accuracy];

  return (
    <div style={{ background: '#fff', border: '1px dashed var(--navy)', borderRadius: 'var(--radius-md)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>auto_awesome</span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)' }}>AI Comparison</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gemini · compared against the suggested answer</span>
        {status === 'done' && accuracy && colors && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, background: colors.bg, color: colors.color, borderRadius: '999px', padding: '3px 10px' }}>
            {accuracy}{ai.score !== null && ai.score !== undefined ? ` · ${Number(ai.score).toFixed(1)}/5` : ''}
          </span>
        )}
      </div>

      {status === 'done' ? (
        <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{ai.feedback}</p>
      ) : (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{MESSAGES[status] || MESSAGES.not_configured}</p>
      )}

      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '10px 0 0' }}>
        {audience === 'lawyer'
          ? 'Mark it as lawyer verified if it is correct, or flag it with an annotation.'
          : 'Avoid relying entirely on AI and verify the information yourself. A Review Administrator checks every AI result.'}
      </p>
    </div>
  );
}
