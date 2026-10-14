
// Deterministic (rule-based, non-AI) ALAC structure check.
//
// The capstone paper describes a "deterministic rule-based validation layer"
// that checks whether an essay contains the four ALAC components
// (Answer, Legal Basis, Application, Conclusion). This is that layer only:
// it detects the *presence* of each component from wording patterns and never
// grades legal correctness. The official score always comes from the lawyer.

export type StructureCheck = {
  answer: boolean;
  legalBasis: boolean;
  application: boolean;
  conclusion: boolean;
  componentsFound: number;
  wordCount: number;
  notes: string[];
};

const ANSWER_OPENERS =
  /^(yes|no|the (answer|contention|claim|petition|motion|act|contract|marriage|sale|donation|accused)|[a-z]+('s)? (claim|contention) is|it (is|was) (not )?(valid|void|correct|proper|tenable)|i (agree|disagree)|(he|she|they|it|[a-z]+) (is|are|was|were|may|can|cannot|should|must) (not )?(be )?(liable|entitled|valid|correct|guilty|proper|allowed))/i;

const LEGAL_BASIS =
  /\b(art(icle)?\.?\s*\d+|sec(tion)?\.?\s*\d+|rule\s+\d+|r\.\s?a\.?\s*(no\.?\s*)?\d+|republic act|p\.\s?d\.?\s*(no\.?\s*)?\d+|presidential decree|batas pambansa|b\.p\.|g\.r\.\s*no|constitution|civil code|family code|labor code|revised penal code|rules of court|corporation code|tax code|nirc|doctrine|jurisprudence|supreme court|(v|vs)\.\s+[A-Z])/i;

const APPLICATION =
  /\b(in this case|in the (present|instant) case|in the case at bar|here,|applying|in the given (facts|problem)|the facts (show|state|reveal)|since [a-z]+ (did|was|is|has)|because [a-z]+ (did|was|is|has))/i;

const CONCLUSION_WORDS = /\b(therefore|thus|hence|accordingly|consequently|in conclusion|as such|for these reasons|it follows that)\b/i;

export function checkStructure(text: string): StructureCheck {
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean ? clean.split(' ') : [];
  const opening = words.slice(0, 25).join(' ');
  const closing = words.slice(-45).join(' ');

  const result = {
    answer: ANSWER_OPENERS.test(opening),
    legalBasis: LEGAL_BASIS.test(clean),
    application: APPLICATION.test(clean),
    conclusion: words.length > 30 && CONCLUSION_WORDS.test(closing),
  };

  const notes: string[] = [];
  if (!result.answer) notes.push('Start with a direct answer (e.g. "Yes, ..." or "No, ...") in the first sentence.');
  if (!result.legalBasis) notes.push('Cite the specific legal basis: the article, section, law or jurisprudence relied on.');
  if (!result.application) notes.push('Apply the rule to the facts (e.g. "In this case, ...").');
  if (!result.conclusion) notes.push('End with a conclusion that restates your answer (e.g. "Therefore, ...").');

  return {
    ...result,
    componentsFound: Object.values(result).filter(Boolean).length,
    wordCount: words.length,
    notes,
  };
}

export function structureSummary(check: StructureCheck) {
  const found = [
    check.answer && 'Answer',
    check.legalBasis && 'Legal Basis',
    check.application && 'Application',
    check.conclusion && 'Conclusion',
  ].filter(Boolean);

  return `Automated ALAC structure check (not AI): ${check.componentsFound}/4 components detected${
    found.length ? ` (${found.join(', ')})` : ''
  }. ${check.notes.join(' ')}`.trim();
}
