import { useState } from 'react';
import SyllabusCard from './SyllabusCard';
import QuestionBankModal from './QuestionBankModal';
import { apiRequest } from '../../lib/api';
import { openSyllabusPdf } from '../../lib/useLawyerContent';
import { confirmAction } from '../../lib/swal';
import { SkeletonCards } from '../../components/common/Skeleton';

// Question bank + syllabus cards shared by the Lawyer Desk and the
// Questionnaire Management page.
// content:  result of useLawyerContent()
// tab:      'All' | 'Question Bank' | 'Syllabi'
// limit:    show at most this many cards (dashboard preview)
// footer:   extra node rendered as the last grid cell (e.g. "Import" card)
export default function LawyerContentGrid({ content, tab = 'All', searchTerm = '', viewMode = 'grid', limit, footer }) {
  const [openSubject, setOpenSubject] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const term = searchTerm.trim().toLowerCase();

  const cards = [
    ...(tab === 'Syllabi' ? [] : content.questionCards),
    ...(tab === 'Question Bank' ? [] : content.syllabusCards.filter((c) => tab === 'Syllabi' || !c.isArchived)),
  ].filter((card) => !term || card.title.toLowerCase().includes(term) || card.subject.toLowerCase().includes(term));

  const visible = limit ? cards.slice(0, limit) : cards;

  const run = async (id, action) => {
    setBusyId(id);
    setActionError('');
    try {
      await action();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const actionsFor = (card) => {
    if (card.kind === 'questions') {
      return [
        {
          icon: 'visibility',
          label: 'View Questions',
          onClick: () => setOpenSubject({ id: card.subjectId, name: card.title }),
        },
      ];
    }

    return [
      {
        icon: 'visibility',
        label: 'View PDF',
        onClick: () => run(card.id, () => openSyllabusPdf(card.syllabusId)),
      },
      {
        icon: card.isArchived ? 'unarchive' : 'archive',
        label: card.isArchived ? 'Restore' : 'Archive',
        muted: true,
        disabled: busyId === card.id,
        onClick: async () =>
          (await confirmAction({ title: card.isArchived ? 'Restore this syllabus?' : 'Archive this syllabus?', confirmText: card.isArchived ? 'Yes, restore' : 'Yes, archive' })) &&
          run(card.id, async () => {
            await apiRequest(`/syllabi/${card.syllabusId}`, {
              method: 'PATCH',
              body: { isArchived: !card.isArchived },
            });
            await content.reload();
          }),
      },
    ];
  };

  const gridStyle =
    viewMode === 'grid'
      ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }
      : { display: 'grid', gap: '12px' };

  return (
    <>
      {(content.error || actionError) && (
        <div style={{ background: '#fdf0f0', color: '#9b1c1c', border: '1px solid #e5b8b8', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', marginBottom: '14px' }}>
          {content.error || actionError}
        </div>
      )}

      <div style={gridStyle}>
        {content.loading && (
          <div style={{ gridColumn: '1 / -1' }}><SkeletonCards count={4} height={140} /></div>
        )}

        {!content.loading &&
          visible.map((card) => (
            <SyllabusCard key={card.id} card={card} viewMode={viewMode} actions={actionsFor(card)} />
          ))}

        {!content.loading && !content.error && cards.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', gridColumn: '1 / -1', margin: 0 }}>
            {term
              ? `Nothing matches "${searchTerm}".`
              : tab === 'Syllabi'
                ? 'No syllabus PDFs have been uploaded yet.'
                : 'No questions yet. Import a CSV to build the question bank.'}
          </p>
        )}

        {footer}
      </div>

      <QuestionBankModal open={!!openSubject} subject={openSubject} onClose={() => setOpenSubject(null)} onChanged={() => content.reload()} />
    </>
  );
}
