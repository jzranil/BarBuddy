import { useState } from 'react';
import LawyerLayout from '../../layouts/LawyerLayout';
import CreateSubjectExamModal from '../../components/lawyer/CreateSubjectExamModal';
import LawyerContentGrid from '../../components/lawyer/LawyerContentGrid';
import QuestionBankModal from '../../components/lawyer/QuestionBankModal';
import QuestionCSVUploadModal from '../../components/lawyer/QuestionCSVUploadModal';
import NewSyllabusItemModal from '../../components/lawyer/NewSyllabusItemModal';
import { useLawyerContent } from '../../lib/useLawyerContent';
import { CONTENT_TABS } from '../../data/lawyer';

export default function QuestionnairePage() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState(null);
  const content = useLawyerContent();

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Questionnaire Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {content.loading
              ? 'Loading question bank...'
              : `${content.totalQuestions.toLocaleString()} questions across ${content.subjectsWithQuestions} subjects • ${content.syllabi.filter((s) => !s.isArchived).length} active syllabus PDF(s)`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setCsvModalOpen(true)} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
            Import Questions (CSV)
          </button>
          <button onClick={() => setSyllabusModalOpen(true)} style={outlineButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
            Upload Syllabus
          </button>
          <button onClick={() => setExamModalOpen(true)} style={navyButtonStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Create New Subject Exam
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setQuestionSearch(searchTerm.trim());
            }}
            style={{ position: 'relative' }}
          >
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search question bank..."
              aria-label="Search question bank (press Enter to search question text)"
              style={{ padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '220px' }}
            />
          </form>
          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)' }} />
          <IconButton icon="grid_view" label="Grid view" active={viewMode === 'grid'} onClick={() => setViewMode('grid')} />
          <IconButton icon="view_list" label="List view" active={viewMode === 'list'} onClick={() => setViewMode('list')} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '20px' }}>
        {CONTENT_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 0 10px',
              fontSize: '13px',
              fontWeight: 600,
              color: activeTab === tab ? 'var(--navy)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <LawyerContentGrid
        content={content}
        tab={activeTab}
        searchTerm={searchTerm}
        viewMode={viewMode}
        footer={
          <button onClick={() => setCsvModalOpen(true)} style={viewMode === 'grid' ? dashedCardStyle : dashedRowStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: viewMode === 'grid' ? '26px' : '20px' }}>add_circle</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Import Questions (CSV)</span>
          </button>
        }
      />

      <CreateSubjectExamModal open={examModalOpen} onClose={() => setExamModalOpen(false)} />
      <QuestionBankModal
        open={questionSearch !== null}
        subject={null}
        initialSearch={questionSearch || ''}
        onClose={() => setQuestionSearch(null)}
        onChanged={() => content.reload()}
      />
      {csvModalOpen && (
        <QuestionCSVUploadModal onClose={() => setCsvModalOpen(false)} onSuccess={() => content.reload()} />
      )}
      <NewSyllabusItemModal
        open={syllabusModalOpen}
        onClose={() => setSyllabusModalOpen(false)}
        existingTitles={content.syllabi.filter((s) => !s.isArchived).map((s) => s.title)}
        onCreated={() => content.reload()}
      />
    </LawyerLayout>
  );
}

function IconButton({ icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      style={{
        background: active ? 'var(--navy)' : '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: '8px',
        width: '34px',
        height: '34px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '17px', color: active ? '#fff' : 'var(--navy)' }}>{icon}</span>
    </button>
  );
}

const dashedCardStyle = {
  border: '1.5px dashed var(--card-border)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '30px 16px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  minHeight: '160px',
};

const dashedRowStyle = {
  border: '1.5px dashed var(--card-border)',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '16px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
};

const navyButtonStyle = {
  background: 'var(--navy)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const outlineButtonStyle = {
  background: '#fff',
  color: 'var(--navy)',
  border: '1px solid var(--card-border)',
  borderRadius: '8px',
  padding: '10px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};
