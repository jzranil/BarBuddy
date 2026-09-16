import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
// import Button from '../../components/Button';
import BarChart from '../../components/lawyer/BarChart';
import RadarChart from '../../components/portal/RadarChart';
import VerificationTable from '../../components/lawyer/VerificationTable';
import CreateSubjectExamModal from '../../components/lawyer/CreateSubjectExamModal';
import SyllabusCard from '../../components/lawyer/SyllabusCard';
import {
  getZeroedLawyerDeskSummary,
  SUBJECT_PERFORMANCE,
  COMPETENCY_DISTRIBUTION,
  DUMMY_VERIFICATION_QUEUE,
  TOTAL_PENDING_VERIFICATIONS,
  DUMMY_SYLLABUS_CARDS,
  SUBJECT_TABS,
} from '../../data/lawyer';

const LAWYER_PID = '6642db37-fe3f-4c6f-8b82-427b381a9c69';

const ROLE_ROUTES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': '/superadmin', // Super Admin
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': '/dashboard',  // Reviewee
};

// BACKEND TODO: fetch from the API instead of the zeroed helper — see
// src/data/lawyer.js for the exact field names each component expects.
const summary = getZeroedLawyerDeskSummary();

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Subjects');
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once the question bank API exists
  const [examModalOpen, setExamModalOpen] = useState(false);

  // Authenticate & verify permission on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const { pid } = JSON.parse(storedUser);
      if (pid !== LAWYER_PID) {
        const targetRoute = ROLE_ROUTES[pid] || '/login';
        navigate(targetRoute, { replace: true });
      }
    } catch (err) {
      console.error('Invalid user session data:', err);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const visibleCards = DUMMY_SYLLABUS_CARDS.filter((card) => {
    if (activeTab === 'All Subjects' || activeTab === 'Question Bank') return true;
    if (activeTab === 'Active Exams') return card.status === 'Published';
    if (activeTab === 'Drafts') return card.status === 'Draft';
    return true;
  });

  return (
    <LawyerLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>{summary.lawyerName}'s Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>schedule</span>
            Welcome back. You have{' '}
            <strong style={{ color: 'var(--gold)' }}>{summary.pendingVerificationCount} pending verifications</strong> today.
          </p>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <KpiTile icon="group" label="Active Reviewees" value={summary.activeReviewees.toLocaleString()} sublabel={summary.activeRevieweesTrendLabel} onClick={() => navigate('/coming-soon', { state: { title: 'Reviewee Directory', description: 'A searchable list of all reviewees will live here.' } })} />
        <KpiTile icon="pending_actions" label="Pending Verification" value={summary.pendingVerificationCount} sublabel={`${summary.pendingCriticalCount} critical/flagged`} onClick={() => navigate('/lawyer/verification')} />
        <KpiTile icon="bar_chart" label="Avg. Readiness" value={`${summary.avgReadiness}%`} sublabel={`Target: ${summary.avgReadinessTarget}%`} onClick={() => navigate('/coming-soon', { state: { title: 'Readiness Analytics', description: 'Deeper cohort analytics will live here.' } })} />
        <KpiTile icon="menu_book" label="Question Bank" value={summary.questionBankCount.toLocaleString()} sublabel={`Across ${summary.questionBankSubjectCount} bar subjects`} onClick={() => navigate('/lawyer/curriculum')} />
      </div>

      {/* Cohort performance */}
      <h2 style={{ fontSize: '19px', marginBottom: '4px' }}>Cohort Performance Insights</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Real-time competency heatmaps and comparative metrics across the current review cycle.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '14px' }}>Subject Performance Heatmap</h4>
          <BarChart data={SUBJECT_PERFORMANCE} />
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Competency Distribution</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Legal skill assessment metrics</p>
          </div>
          <RadarChart axes={COMPETENCY_DISTRIBUTION} size={220} />
        </div>
      </div>

      {/* AI Verification Queue */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '19px' }}>AI Verification Queue</h2>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Review AI-generated feedback for student essay responses to ensure accuracy before publication.
      </p>
      <div style={{ marginBottom: '30px' }}>
        <VerificationTable cases={DUMMY_VERIFICATION_QUEUE} totalCount={TOTAL_PENDING_VERIFICATIONS} />
      </div>

      {/* Questionnaire Management */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '19px' }}>Questionnaire Management</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/lawyer/questionnaire')}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View All
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          </button>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'var(--text-muted)' }}>search</span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search question bank..."
              style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '190px' }}
            />
          </div>
          <IconButton icon="filter_list" onClick={() => navigate('/coming-soon', { state: { title: 'Filters', description: 'Filtering the question bank will be available once it is connected to the backend.' } })} />
        </div>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Manage the BarBuddy syllabus and update specialized mock exam content.
      </p>

      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '18px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {visibleCards.map((card) => (
          <SyllabusCard key={card.id} card={card} />
        ))}
        <button
          onClick={() => setExamModalOpen(true)}
          style={{
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
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>add_circle</span>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Create New Subject Exam</span>
        </button>
      </div>

      <CreateSubjectExamModal open={examModalOpen} onClose={() => setExamModalOpen(false)} />
    </LawyerLayout>
  );
}

function KpiTile({ icon, label, value, sublabel, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        background: '#fff',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 18px',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--gold)' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '22px', marginBottom: '2px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sublabel}</div>
    </button>
  );
}

function IconButton({ icon, onClick }) {
  return (
    <button onClick={onClick} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: '8px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--navy)' }}>{icon}</span>
    </button>
  );
}