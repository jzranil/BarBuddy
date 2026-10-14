import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './api';

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

async function fetchLawyerContent() {
  try {
    const [questionBank, syllabusList] = await Promise.all([
      apiRequest('/questions/subjects'),
      apiRequest('/syllabi'),
    ]);

    return {
      error: '',
      subjects: questionBank.subjects,
      totalQuestions: questionBank.totalQuestions,
      syllabi: syllabusList.syllabi,
    };
  } catch (err) {
    return { error: err.message || 'Unable to load the question bank.' };
  }
}

// Question bank subjects + syllabus documents for the Lawyer pages,
// shaped as cards for <SyllabusCard>.
export function useLawyerContent() {
  const [subjects, setSubjects] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const apply = useCallback((result) => {
    setError(result.error);
    if (!result.error) {
      setSubjects(result.subjects);
      setTotalQuestions(result.totalQuestions);
      setSyllabi(result.syllabi);
    }
    setLoading(false);
  }, []);

  const reload = useCallback(async () => apply(await fetchLawyerContent()), [apply]);

  useEffect(() => {
    let active = true;
    fetchLawyerContent().then((result) => {
      if (active) apply(result);
    });
    return () => {
      active = false;
    };
  }, [apply]);

  const questionCards = subjects
    .filter((s) => s.questionCount > 0)
    .map((s) => ({
      id: `q-${s.id}`,
      kind: 'questions',
      subjectId: s.id,
      title: s.name,
      subject: 'Question Bank',
      status: 'Published',
      questionCount: s.questionCount,
      lastEdited: formatDate(s.lastUpdated),
    }));

  const syllabusCards = syllabi.map((row) => ({
    id: `s-${row.id}`,
    kind: 'syllabus',
    syllabusId: row.id,
    title: row.title,
    subject: 'Syllabus PDF',
    status: row.isArchived ? 'Archived' : 'Published',
    isArchived: row.isArchived,
    lastEdited: formatDate(row.updatedAt || row.createdAt),
  }));

  return {
    subjects,
    totalQuestions,
    subjectsWithQuestions: questionCards.length,
    syllabi,
    questionCards,
    syllabusCards,
    loading,
    error,
    reload,
  };
}

export async function openSyllabusPdf(syllabusId) {
  // Open the tab first so pop-up blockers allow it, then point it at the PDF
  const tab = window.open('', '_blank');

  try {
    const { url } = await apiRequest(`/syllabi/${syllabusId}/url`);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

// Downloads a syllabus PDF (the signed link is served as an attachment)
export async function downloadSyllabusPdf(syllabusId) {
  const { url } = await apiRequest(`/syllabi/${syllabusId}/url?download=1`);
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
