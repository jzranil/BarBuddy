import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import StatCard from '../../components/portal/StatCard';
import GaugeCircle from '../../components/portal/GaugeCircle';
import ExamRow from '../../components/portal/ExamRow';
import Button from '../../components/Button';
import { SUBJECTS, getZeroedSubjectStats } from '../../data/subjects';
import { getDummyExamsForSubject } from '../../data/exams';

const TABS = ['All Exams', 'Practice Exams', 'Mock Exams'];

// BACKEND TODO: same zeroed-data pattern as the other portal pages.
const subjectStats = getZeroedSubjectStats();

export default function SubjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Exams');
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once exam list has real data to filter

  const subject = SUBJECTS.find((s) => s.slug === slug);
  const stats = subject ? subjectStats[subject.slug] : null;
  const exams = subject ? getDummyExamsForSubject(subject.slug, subject.name) : []; // DUMMY DATA — see src/data/exams.js

  // Unknown subject slug in the URL — send them back to the subject list
  // instead of showing a broken page.
  if (!subject) {
    return <Navigate to="/subjects" replace />;
  }

  return (
    <PortalLayout>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '26px' }}>{subject.icon}</span>
          </div>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>{subject.name}</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '480px' }}>{subject.description}</p>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GaugeCircle value={stats.currentReadiness} size={64} stroke={7} label="" />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>CURRENT READINESS</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '14px' }}>{stats.readinessTrendLabel}</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard icon="monitoring" label="Exams Attempted" value={`${stats.examsAttempted} / ${stats.examsTotal}`} sublabel="0% curriculum coverage" tag="LIVE DATA" />
        <StatCard icon="military_tech" label="Average Score" value={`${stats.averageScore}%`} sublabel="No exams taken yet" tag="LIVE DATA" />
        <StatCard icon="verified_user" label="AI Proficiency" value={stats.aiProficiency} sublabel="Not enough data yet" tag="LIVE DATA" />
      </div>

      {/* Subject Curriculum */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px' }}>Subject Curriculum</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', color: 'var(--text-muted)' }}>
              search
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exams..."
              style={{ padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '200px' }}
            />
          </div>
          <Button
            variant="outline"
            icon="filter_list"
            onClick={() => navigate('/coming-soon', { state: { title: 'Filters', description: 'Exam filtering will be available once the exam catalog is connected to the backend.' } })}
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '18px' }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0 0 10px',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: activeTab === tab ? 'var(--navy)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Exam list — 2 dummy exams (1 completed, 1 not started) so the
          layout and Start Exam / View redirects can be checked before the
          backend exam catalog exists. */}
      <div style={{ marginBottom: '24px' }}>
        {exams
          .filter((exam) => activeTab === 'All Exams' || exam.type === activeTab.replace(/s$/, ''))
          .map((exam) => (
            <ExamRow key={exam.id} exam={exam} slug={subject.slug} />
          ))}
      </div>

      {/* AI Pro-Tip + Milestone */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '10px' }}>
            AI PRO-TIP
          </div>
          {/* BACKEND TODO: personalized tip generated by the telemetry-ai-parser Lambda */}
          <p style={{ color: '#e8e6e0', fontSize: '14px', lineHeight: 1.7, marginBottom: '18px' }}>
            Once you complete a few exams in {subject.name}, BarBuddy's AI will highlight the topics
            where your accuracy is dropping and recommend a focused quick-drill.
          </p>
          <Button
            variant="gold"
            onClick={() => navigate('/coming-soon', { state: { title: 'AI Recommendation', description: 'Personalized recommendations appear here after your first assessment.' } })}
          >
            Start Recommendation
          </Button>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>flag</span>
            <div>
              <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>No Milestones Yet</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Complete prerequisite lessons in {subject.name} to unlock your first milestone.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            disabled
            onClick={() => {}}
          >
            Claim Certificate of Mastery
          </Button>
        </div>
      </div>
    </PortalLayout>
  );
}

