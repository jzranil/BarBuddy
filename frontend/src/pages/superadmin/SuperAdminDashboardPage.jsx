import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import ComboChart from '../../components/superadmin/ComboChart';
// import MaintenanceBanner from '../../components/superadmin/MaintenanceBanner';
import { getDefaultAiConfig } from '../../data/superadmin';
import { useApi } from '../../lib/useApi';
import { timeAgo } from '../../lib/format';
import { Skeleton } from '../../components/common/Skeleton';

const SUPER_ADMIN_PID = '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3';

const ROLE_ROUTES = {
  '6642db37-fe3f-4c6f-8b82-427b381a9c69': '/lawyer',     // Lawyer / Educator
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': '/dashboard',  // Reviewee
};


export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const [aiConfig, setAiConfig] = useState(getDefaultAiConfig());
  const { data: overview, error, reload } = useApi('/admin/overview');
  const o = overview ?? {
    users: { reviewees: 0, lawyers: 0, admins: 0, total: 0 },
    content: { questions: 0, syllabi: 0 },
    assessments: { submissions: 0, pendingVerification: 0, startedLast30Days: 0 },
    avgReadiness: 0,
    errorsLast24h: 0,
    activity: [],
    recentLogs: [],
  };
  const loading = !overview && !error;
  const verifiedPercent = o.assessments.submissions
    ? Math.round(((o.assessments.submissions - o.assessments.pendingVerification) / o.assessments.submissions) * 100)
    : 0;

  // Authenticate & verify permission on load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const { pid } = JSON.parse(storedUser);
      if (pid !== SUPER_ADMIN_PID) {
        const targetRoute = ROLE_ROUTES[pid] || '/login';
        navigate(targetRoute, { replace: true });
      }
    } catch (err) {
      console.error('Invalid user session data:', err);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleApplyChanges = () => {
    // BACKEND TODO: PATCH /api/admin/ai-config with { selectedModel, temperature, strictAlacEnforcement }
    navigate('/coming-soon', { state: { title: 'Apply AI Config Changes', description: 'Saving global AI parameters connects here once the backend exists.' } });
  };

  const handleReset = () => setAiConfig(getDefaultAiConfig());

  return (
    <SuperAdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '26px', marginBottom: '6px' }}>System Governance Dashboard</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Platform-wide oversight of users, assessments, content and system activity.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/superadmin/system-logs', { state: { title: 'Full Logs', description: 'Full historical logs connect here once the backend exists.' } })}
            style={outlineButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
            Full Logs
          </button>
          <button
            onClick={reload}
            style={navyButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            System Refresh
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiTile icon="group" label="TOTAL REVIEWEES" value={o.users.reviewees.toLocaleString()} trendLabel={`${o.users.lawyers} Review Administrators • ${o.users.admins} Super Admins`} loading={loading} />
        <KpiTile icon="edit_note" label="ESSAYS SUBMITTED" value={o.assessments.submissions.toLocaleString()} trendLabel={`${o.assessments.startedLast30Days} assessments in 30 days`} loading={loading} />
        <KpiTile icon="pending_actions" label="PENDING VERIFICATION" value={o.assessments.pendingVerification.toLocaleString()} trendLabel={`${verifiedPercent}% of essays verified`} loading={loading} />
        <KpiTile icon="monitor_heart" label="ERRORS (24H)" value={o.errorsLast24h} trendLabel={o.errorsLast24h ? 'Check the system logs' : 'No errors logged'} trendPositive={!o.errorsLast24h} loading={loading} />
      </div>

      {/* Revenue vs AI ops + infrastructure pulse */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Assessment Activity</h3>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg)', borderRadius: '999px', padding: '4px 10px' }}>LAST 6 MONTHS</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Assessments started and submitted by reviewees each month</p>
          {error && <p style={{ color: '#c0392b', fontSize: '12px' }}>{error}</p>}
          {loading ? (
            <div role="status" aria-label="Loading" style={{ height: '260px', display: 'flex', alignItems: 'flex-end', gap: '18px', padding: '0 4px 22px 46px' }}>
              {[55, 72, 48, 80, 62, 68].map((h, i) => (
                <Skeleton key={i} height={`${h}%`} radius={4} style={{ flex: 1 }} />
              ))}
            </div>
          ) : (
            <ComboChart data={o.activity.map((a) => ({ month: a.label, revenue: a.started, aiCost: a.submitted }))} barLabel="Started" lineLabel="Submitted" />
          )}
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--navy)' }}>dns</span>
            Platform Pulse
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Content and review progress</p>

          <MetricBar label="Essays verified by lawyers" valueLabel={`${verifiedPercent}%`} percent={verifiedPercent} loading={loading} />
          <MetricBar label="Average reviewee readiness" valueLabel={`${o.avgReadiness}%`} percent={o.avgReadiness} loading={loading} />
          <MetricBar label="Questions in the bank" valueLabel={o.content.questions.toLocaleString()} percent={Math.min(100, (o.content.questions / 2000) * 100)} loading={loading} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px', fontSize: '12px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px' }}>SYLLABI</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>public</span>
                {loading ? <Skeleton width={90} height={12} /> : `${o.content.syllabi} active syllabi`}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px' }}>DB STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>storage</span>
                {overview ? 'Connected' : error ? 'Unavailable' : 'Checking...'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI orchestration + audit logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px', marginBottom: '28px', alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--gold)' }}>tune</span>
              AI Model Orchestration
            </h4>
            <span style={{ fontSize: '10px', fontWeight: 700, border: '1px solid var(--gold)', color: 'var(--navy)', borderRadius: '999px', padding: '3px 10px' }}>
              {aiConfig.version}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>Global parameters for feedback generation</p>

          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            MODEL SELECTOR &nbsp;<span style={{ fontWeight: 400 }}>Current: {aiConfig.selectedModel}</span>
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {aiConfig.availableModels.map((model) => (
              <button
                key={model}
                onClick={() => setAiConfig((c) => ({ ...c, selectedModel: model }))}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: aiConfig.selectedModel === model ? 'none' : '1px solid var(--card-border)',
                  background: aiConfig.selectedModel === model ? 'var(--navy)' : '#fff',
                  color: aiConfig.selectedModel === model ? '#fff' : 'var(--navy)',
                }}
              >
                {model}
              </button>
            ))}
          </div>

          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>AI TEMPERATURE</span>
            <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{aiConfig.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={aiConfig.temperature}
            onChange={(e) => setAiConfig((c) => ({ ...c, temperature: Number(e.target.value) }))}
            style={{ width: '100%', marginBottom: '6px' }}
          />
          <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Lower values are more deterministic and legal-standard focused.
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-border)', paddingTop: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Strict ALAC Enforcement</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Validate all outputs against ALAC structure</div>
            </div>
            <ToggleSwitch
              checked={aiConfig.strictAlacEnforcement}
              onChange={() => setAiConfig((c) => ({ ...c, strictAlacEnforcement: !c.strictAlacEnforcement }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button onClick={handleReset} style={outlineButtonStyle}>Reset</button>
            <button onClick={handleApplyChanges} style={navyButtonStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>save</span>
              Apply Changes
            </button>
          </div>
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>terminal</span>
              System Audit Logs
            </h4>
            <button
              onClick={() => navigate('/superadmin/system-logs')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="More options"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Recent administrative and system actions</p>

          <div style={{ display: 'grid', gap: '2px' }}>
            {loading &&
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'grid', gap: '6px' }}>
                    <Skeleton width="70%" height={13} />
                    <Skeleton width="35%" height={10} />
                  </div>
                  <Skeleton width={56} height={11} />
                  <Skeleton width={72} height={20} radius={999} />
                </div>
              ))}
            {!loading && o.recentLogs.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No events recorded yet.</p>}
            {o.recentLogs.map((log) => (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {log.user}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                  {timeAgo(log.createdAt)}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '3px 10px', color: 'var(--navy)' }}>
                  {log.service}
                </span>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              onClick={() => navigate('/superadmin/system-logs')}
              style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              View All Historical Logs
            </button>
          </div>
        </div>
      </div>

      {/* <MaintenanceBanner /> */}
    </SuperAdminLayout>
  );
}

function MetricBar({ label, valueLabel, percent, loading }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '6px' }}>
        <span>{label}</span>
        {loading ? <Skeleton width={36} height={12} /> : <span style={{ fontWeight: 600 }}>{valueLabel}</span>}
      </div>
      {loading ? (
        <Skeleton height={5} radius={999} />
      ) : (
        <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px' }}>
          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
        </div>
      )}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '42px',
        height: '24px',
        borderRadius: '999px',
        border: 'none',
        background: checked ? 'var(--navy)' : 'var(--card-border)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      aria-pressed={checked}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '21px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  );
}

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