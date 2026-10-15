import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import StatCard from '../../components/portal/StatCard';
import GaugeCircle from '../../components/portal/GaugeCircle';
import Button from '../../components/Button';
import { SUBJECTS } from '../../data/subjects';
import { useApi } from '../../lib/useApi';
import { openSyllabusPdf } from '../../lib/useLawyerContent';
import { ASSESSMENT_TYPE_LABELS, timeAgo } from '../../lib/format';
import { usePaged } from '../../lib/usePaged';
import ListPager from '../../components/common/ListPager';
import { SkeletonList } from '../../components/common/Skeleton';


const TABS = ['All Essays', 'Verified', 'Awaiting Verification'];

export default function SubjectDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All Essays');
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfError, setPdfError] = useState('');

  const subject = SUBJECTS.find((s) => s.slug === slug);
  const { data, error } = useApi(subject ? `/reviewee/subjects/${slug}` : null);

  const stats = data?.stats;
  const term = searchTerm.trim().toLowerCase();
  const essays = (data?.essays ?? []).filter((e) => {
    const matchesTab = activeTab === 'All Essays' || (activeTab === 'Verified' ? e.status === 'verified' : e.status !== 'verified');
    return matchesTab && (!term || e.title.toLowerCase().includes(term));
  });
  const paged = usePaged(essays, 8);

  // Unknown subject slug in the URL — send them back to the subject list
  if (!subject) {
    return <Navigate to="/subjects" replace />;
  }

  const openPdf = async (id) => {
    setPdfError('');
    try {
      await openSyllabusPdf(id);
    } catch (err) {
      setPdfError(err.message);
    }
  };

  return (
    <PortalLayout>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '10px', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '26px' }}>{subject.icon}</span>
          </div>
          <div>
            <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>{subject.name}</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '480px' }}>{subject.description}</p>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <GaugeCircle value={stats?.currentReadiness ?? 0} size={64} stroke={7} label="" />
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SUBJECT COMPETENCY</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '14px' }}>{stats?.readinessTrendLabel ?? '…'}</div>
          </div>
        </div>
      </div>

      {error && <p style={{ color: '#c0392b', fontSize: '13px' }}>{error}</p>}

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard icon="monitoring" label="Essays Answered" value={`${stats?.essaysSubmitted ?? 0}`} sublabel={`${stats?.essaysVerified ?? 0} verified by a lawyer`} tag="LIVE DATA" />
        <StatCard icon="military_tech" label="Average Score" value={stats?.hasScore ? `${Math.round(stats.averageScore)}%` : '—'} sublabel={stats?.hasScore ? `${stats.status} • ${stats.trendLabel}` : 'No verified essays yet'} tag="LIVE DATA" />
        <StatCard icon="verified_user" label="ALAC Structure" value={stats?.aiProficiency ?? '—'} sublabel="How complete your Answer, Legal Basis, Application and Conclusion are" tag="LIVE DATA" />
      </div>

      {/* Essays in this subject */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontSize: '20px' }}>Your {subject.name} Essays</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', color: 'var(--text-muted)' }}>
              search
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search essays..."
              aria-label="Search essays"
              style={{ padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', width: '200px', background: '#fff', color: 'var(--navy)' }}
            />
          </div>
          <Button variant="navy" icon="edit_note" onClick={() => navigate(`/assessments/start/practice?subject=${slug}`)}>
            Start Practice Set
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--card-border)', marginBottom: '18px', flexWrap: 'wrap' }}>
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

      <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
        {!data && !error && <SkeletonList rows={3} />}
        {data && essays.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
            {data.essays.length === 0 ? `You haven't answered any ${subject.name} essays yet. Start a practice set to begin.` : 'No essays match this filter.'}
          </div>
        )}
        {paged.pageItems.map((e) => (
          <button
            key={e.id}
            onClick={() => navigate(`/assessments/${e.assessmentId}/results`)}
            style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', cursor: 'pointer', textAlign: 'left', color: 'var(--navy)' }}
          >
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {ASSESSMENT_TYPE_LABELS[e.assessmentType] ?? 'Assessment'} • {e.wordCount} words • {timeAgo(e.submittedAt)}
              </div>
            </div>
            <StatusPill status={e.status} score={e.score} />
          </button>
        ))}
        <ListPager paged={paged} noun="essays" style={{ marginTop: 4 }} />
      </div>

      {/* Study tip + syllabi */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
        <div style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '10px' }}>STUDY TIP</div>
          <p style={{ color: '#e8e6e0', fontSize: '14px', lineHeight: 1.7, marginBottom: '18px' }}>
            {data?.tip ?? `Answer ${subject.name} essays to receive a personalized study tip.`}
          </p>
          <Button variant="gold" onClick={() => navigate(`/assessments/start/practice?subject=${slug}`)}>
            Start Practice Set
          </Button>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
          <h4 style={{ fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gold)' }}>menu_book</span>
            Bar Syllabus
          </h4>
          {pdfError && <p style={{ color: '#c0392b', fontSize: '12px' }}>{pdfError}</p>}
          {(data?.syllabi ?? []).map((r) => (
            <button
              key={r.id}
              onClick={() => openPdf(r.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: 'none', border: 'none', borderTop: '1px solid var(--card-border)', padding: '10px 0', cursor: 'pointer', textAlign: 'left', color: 'var(--navy)', fontSize: '13px', fontWeight: 600 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--navy)' }}>picture_as_pdf</span>
              <span style={{ flex: 1 }}>{r.title}</span>
            </button>
          ))}
          {data && data.syllabi.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No syllabus has been published yet.</p>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

function StatusPill({ status, score }) {
  const styles = {
    verified: { bg: '#e8f5e9', color: '#2e7d32', label: `Verified • ${score}/5` },
    flagged: { bg: '#fdf7e9', color: '#8a6514', label: 'Under further review' },
    pending: { bg: '#eef0f4', color: 'var(--navy)', label: 'Awaiting verification' },
  };
  const s = styles[status] ?? styles.pending;
  return <span style={{ fontSize: '11px', fontWeight: 700, borderRadius: '999px', padding: '4px 10px', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
}
