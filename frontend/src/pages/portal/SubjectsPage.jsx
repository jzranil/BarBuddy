import { useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import SubjectCard from '../../components/portal/SubjectCard';
import { SUBJECTS, getZeroedSubjectStats, getZeroedUserSummary } from '../../data/subjects';

// BACKEND TODO: same as DashboardPage — swap these for real API calls once
// they exist. Field names already match the components.
const userSummary = getZeroedUserSummary();
const subjectStats = getZeroedSubjectStats();


export default function SubjectsPage() {
  const navigate = useNavigate();

  return (
    <PortalLayout>
      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '24px' }}>
        {/* LEFT: subject grid */}
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>Subject Competencies</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>
            A comprehensive view of all subjects and your current competency levels.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {SUBJECTS.map((subject) => (
              <SubjectCard key={subject.slug} subject={subject} stats={subjectStats[subject.slug]} />
            ))}
          </div>
        </div>

        {/* RIGHT: streak, study behavior DNA, recent exams */}
        <div style={{ display: 'grid', gap: '16px', alignContent: 'start' }}>
          <div style={{ background: 'var(--gold)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--navy)' }}>local_fire_department</span>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--navy)', letterSpacing: '0.05em' }}>LEARNING STREAK</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px', color: 'var(--navy)' }}>
                {userSummary.streakDays} Days
              </div>
            </div>
          </div>

          

          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>fact_check</span>
              Recent Examinations
            </h4>
            {/* BACKEND TODO: list the reviewee's last N completed exams here */}
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
              No exams completed yet.
            </p>
            <button
              onClick={() => navigate('/subjects')}
              style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0 }}
            >
              Pick a subject to get started →
            </button>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
