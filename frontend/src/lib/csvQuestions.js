import Papa from 'papaparse';

// Validation rules for the question bank CSV import.
// Expected columns: subject, question_text, question_model_answer
export const REQUIRED_COLUMNS = ['subject', 'question_text', 'question_model_answer'];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 10000;
const MIN_QUESTION_LENGTH = 10;
const MAX_SUBJECT_LENGTH = 200;
const MAX_TEXT_LENGTH = 100000;

// Same comparison the database uses for duplicates: subject + question text,
// ignoring letter case and surrounding spaces.
function duplicateKey(subject, questionText) {
  return `${subject.toLowerCase().replace(/\s+/g, ' ')}|${questionText.toLowerCase()}`;
}

// Parses and validates a CSV file in the browser.
// Resolves to { rows, errors, duplicates, totalRows }:
//   rows:       unique, valid rows ({ line, subject, question_text, question_model_answer })
//   errors:     problems that must be fixed before importing ({ line, message })
//   duplicates: rows repeated inside the file ({ line, firstLine, subject })
export function parseQuestionCsv(file) {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      resolve({ fatal: 'Please select a .csv file.' });
      return;
    }

    if (file.size === 0) {
      resolve({ fatal: 'The CSV file is empty.' });
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      resolve({ fatal: 'The CSV file must be 10 MB or smaller.' });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      // trim() also removes the UTF-8 BOM Excel adds before the first header
      transformHeader: (header) => header.trim().toLowerCase(),
      complete: (result) => {
        const headers = result.meta.fields || [];
        const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

        if (missing.length > 0) {
          resolve({
            fatal: `Missing column(s): ${missing.join(', ')}. The first row must be: ${REQUIRED_COLUMNS.join(', ')}`,
          });
          return;
        }

        if (result.data.length === 0) {
          resolve({ fatal: 'The CSV file has no question rows.' });
          return;
        }

        if (result.data.length > MAX_ROWS) {
          resolve({ fatal: `The CSV file has ${result.data.length} rows. The maximum is ${MAX_ROWS}.` });
          return;
        }

        const errors = [];
        const duplicates = [];
        const rows = [];
        const firstLineByKey = new Map();

        // Line numbers count physical rows in a spreadsheet: header is row 1
        result.errors.forEach((error) => {
          errors.push({ line: (error.row ?? 0) + 2, message: `CSV format problem: ${error.message}` });
        });

        result.data.forEach((raw, index) => {
          const line = index + 2;
          const subject = String(raw.subject ?? '').trim();
          const questionText = String(raw.question_text ?? '').trim();
          const modelAnswer = String(raw.question_model_answer ?? '').trim();

          const missingFields = [
            !subject && 'subject',
            !questionText && 'question_text',
            !modelAnswer && 'question_model_answer',
          ].filter(Boolean);

          if (missingFields.length > 0) {
            errors.push({ line, message: `Missing ${missingFields.join(', ')}.` });
            return;
          }

          if (subject.length > MAX_SUBJECT_LENGTH) {
            errors.push({ line, message: 'Subject is too long.' });
            return;
          }

          if (questionText.length < MIN_QUESTION_LENGTH) {
            errors.push({ line, message: `Question must be at least ${MIN_QUESTION_LENGTH} characters.` });
            return;
          }

          if (questionText.length > MAX_TEXT_LENGTH || modelAnswer.length > MAX_TEXT_LENGTH) {
            errors.push({ line, message: 'Question or model answer is too long.' });
            return;
          }

          const key = duplicateKey(subject, questionText);

          if (firstLineByKey.has(key)) {
            duplicates.push({ line, firstLine: firstLineByKey.get(key), subject });
            return;
          }

          firstLineByKey.set(key, line);
          rows.push({ line, subject, question_text: questionText, question_model_answer: modelAnswer });
        });

        resolve({ rows, errors, duplicates, totalRows: result.data.length });
      },
      error: (error) => resolve({ fatal: error.message }),
    });
  });
}
