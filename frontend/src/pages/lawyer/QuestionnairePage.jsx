import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
import SyllabusCard from '../../components/lawyer/SyllabusCard';
import CreateSubjectExamModal from '../../components/lawyer/CreateSubjectExamModal';
import { DUMMY_SYLLABUS_CARDS, SUBJECT_TABS } from '../../data/lawyer';

export default function QuestionnairePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Subjects');
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once the question bank API exists
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [examModalOpen, setExamModalOpen] = useState(false);

  const visibleCards = DUMMY_SYLLABUS_CARDS.filter((card) => {
    const matchesTab =
      activeTab === 'All Subjects' || activeTab === 'Question Bank'
        ? true
        : activeTab === 'Active Exams'
        ? card.status === 'Published'
        : activeTab === 'Drafts'
        ? card.status === 'Draft'
        : true;
    const matchesSearch =
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) || card.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <LawyerLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Questionnaire Management</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Manage the BarBuddy questionnaires and update specialized mock exam content.
          </p>
        </div>
        <button onClick={() => setExamModalOpen(true)} style={navyButtonStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
          Create New Subject Exam
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search question bank..."
              style={{ padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '220px' }}
            />
          </div>
          <IconButton
            icon="filter_list"
            onClick={() => navigate('/coming-soon', { state: { title: 'Filters', description: 'Filtering the question bank will be available once it is connected to the backend.' } })}
          />
          <div style={{ width: '1px', height: '24px', background: 'var(--card-border)' }} />
          <IconButton icon="grid_view" active={viewMode === 'grid'} onClick={() => setViewMode('grid')} />
          <IconButton icon="view_list" active={viewMode === 'list'} onClick={() => setViewMode('list')} />
        </div>
      </div>

      {/* Subject tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '20px' }}>
        {SUBJECT_TABS.map((tab) => (
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

      {/* Cards / rows */}
      <div
        style={
          viewMode === 'grid'
            ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }
            : { display: 'grid', gap: '12px' }
        }
      >
        {visibleCards.map((card) => (
          <SyllabusCard key={card.id} card={card} viewMode={viewMode} />
        ))}

        {viewMode === 'grid' ? (
          <button onClick={() => setExamModalOpen(true)} style={dashedCardStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>add_circle</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Create New Subject Exam</span>
          </button>
        ) : (
          <button onClick={() => setExamModalOpen(true)} style={dashedRowStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Create New Subject Exam</span>
          </button>
        )}

        {visibleCards.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
            No subjects match "{searchTerm}".
          </p>
        )}
      </div>

      <CreateSubjectExamModal open={examModalOpen} onClose={() => setExamModalOpen(false)} />
    </LawyerLayout>
  );
}

function IconButton({ icon, onClick, active }) {
  return (
    <button
      onClick={onClick}
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
