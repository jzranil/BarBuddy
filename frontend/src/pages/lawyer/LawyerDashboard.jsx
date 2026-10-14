import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LawyerLayout from '../../layouts/LawyerLayout';
// import Button from '../../components/Button';
import BarChart from '../../components/lawyer/BarChart';
import RadarChart from '../../components/portal/RadarChart';
import VerificationTable from '../../components/lawyer/VerificationTable';
import LawyerContentGrid from '../../components/lawyer/LawyerContentGrid';
import QuestionBankModal from '../../components/lawyer/QuestionBankModal';
import QuestionCSVUploadModal from '../../components/lawyer/QuestionCSVUploadModal';
import NewSyllabusItemModal from '../../components/lawyer/NewSyllabusItemModal';
import { useLawyerContent } from '../../lib/useLawyerContent';
import { apiRequest } from '../../lib/api';
import { CONTENT_TABS } from '../../data/lawyer';

const LAWYER_PID = '6642db37-fe3f-4c6f-8b82-427b381a9c69';

const ROLE_ROUTES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': '/superadmin', // Super Admin
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': '/dashboard',  // Reviewee
};

const EMPTY_OVERVIEW = {
  totalReviewees: 0,
  activeReviewees: 0,
  pendingVerification: 0,
  flaggedVerification: 0,
  avgReadiness: 0,
  avgReadinessTarget: 75,
  examReady: 0,
  subjectPerformance: [],
  competencyDistribution: [
    { label: 'Answer', value: 0 },
    { label: 'Legal Basis', value: 0 },
    { label: 'Application', value: 0 },
    { label: 'Conclusion', value: 0 },
  ],
};

export default function LawyerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState(null);
  const [lawyerName, setLawyerName] = useState('');
  const content = useLawyerContent();
  const [summary, setSummary] = useState(EMPTY_OVERVIEW);
  const [queue, setQueue] = useState({ items: [], total: 0 });

  useEffect(() => {
    apiRequest('/lawyer/overview')
      .then(setSummary)
      .catch(() => setSummary(EMPTY_OVERVIEW));
    apiRequest('/verification?status=pending&pageSize=5')
      .then((r) => setQueue({ items: r.items, total: r.total }))
      .catch(() => setQueue({ items: [], total: 0 }));
  }, []);

  useEffect(() => {
    apiRequest('/user/profile')
      .then((profile) => setLawyerName(profile.name))
      .catch(() => setLawyerName(''));
  }, []);

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

  return (
    <LawyerLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>{lawyerName ? `${lawyerName}'s Dashboard` : 'Lawyer Dashboard'}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', marginRight: '6px', verticalAlign: '-2px' }}>schedule</span>
            Welcome back. You have{' '}
            <strong style={{ color: 'var(--gold)' }}>{summary.pendingVerification} pending verification{summary.pendingVerification === 1 ? '' : 's'}</strong>.
          </p>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
        <KpiTile icon="group" label="Active Reviewees" value={summary.activeReviewees.toLocaleString()} sublabel={`Active in the last 30 days • ${summary.totalReviewees} total`} onClick={() => navigate('/lawyer/reviewees')} />
        <KpiTile icon="pending_actions" label="Pending Verification" value={summary.pendingVerification} sublabel={`${summary.flaggedVerification} flagged for review`} onClick={() => navigate('/lawyer/verification')} />
        <KpiTile icon="bar_chart" label="Avg. Readiness" value={`${summary.avgReadiness}%`} sublabel={`Target: ${summary.avgReadinessTarget}% • ${summary.examReady} exam-ready`} onClick={() => navigate('/lawyer/reviewees')} />
        <KpiTile
          icon="menu_book"
          label="Question Bank"
          value={content.loading ? '—' : content.totalQuestions.toLocaleString()}
          sublabel={`Across ${content.subjectsWithQuestions} of ${content.subjects.length || 8} bar subjects`}
          onClick={() => setQuestionSearch('')}
        />
      </div>

      {/* Cohort performance */}
      <h2 style={{ fontSize: '19px', marginBottom: '4px' }}>Cohort Performance Insights</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Real-time competency heatmaps and comparative metrics across the current review cycle.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '14px' }}>Subject Performance Heatmap</h4>
          {summary.subjectPerformance.length ? (
            <BarChart data={summary.subjectPerformance} />
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Subject averages appear once essays are verified.</p>
          )}
        </div>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>ALAC Competency Distribution</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Average lawyer ratings per ALAC component</p>
          </div>
          <RadarChart axes={summary.competencyDistribution} size={220} />
        </div>
      </div>

      {/* AI Verification Queue */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '19px' }}>Verification Queue</h2>
        <button
          onClick={() => navigate('/lawyer/verification')}
          style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          Open Queue
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
        </button>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        Essays waiting for a five-point score and ALAC verification before results are released to reviewees.
      </p>
      <div style={{ marginBottom: '30px' }}>
        <VerificationTable items={queue.items} total={queue.total} onSelect={(c) => navigate(`/lawyer/verification?case=${c.id}`)} />
      </div>

      {/* Questionnaire Management */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '19px' }}>Questionnaire Management</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/lawyer/questionnaire')}
            style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View All
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
          </button>
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
              style={{ padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '190px' }}
            />
          </form>
          <HeaderButton icon="upload_file" label="Import CSV" onClick={() => setCsvModalOpen(true)} />
          <HeaderButton icon="picture_as_pdf" label="Upload Syllabus" onClick={() => setSyllabusModalOpen(true)} />
        </div>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Manage the BarBuddy question bank and syllabus documents. Press Enter in the search box to search question text.
      </p>

      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '18px' }}>
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
        limit={7}
        footer={
          <button
            onClick={() => setQuestionSearch('')}
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
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Add Questions</span>
          </button>
        }
      />
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


function HeaderButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--navy)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{icon}</span>
      {label}
    </button>
  );
}
