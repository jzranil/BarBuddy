import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import KpiTile from '../../components/superadmin/KpiTile';
import ComboChart from '../../components/superadmin/ComboChart';
// import MaintenanceBanner from '../../components/superadmin/MaintenanceBanner';
import {
  getZeroedDashboardSummary,
  REVENUE_VS_AI_OPS,
  getZeroedInfrastructurePulse,
  getDefaultAiConfig,
  DUMMY_SYSTEM_LOGS,
} from '../../data/superadmin';

// BACKEND TODO: fetch from the API instead of these zeroed/default helpers.
const summary = getZeroedDashboardSummary();
const infra = getZeroedInfrastructurePulse();

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const [aiConfig, setAiConfig] = useState(getDefaultAiConfig());

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
            Comprehensive oversight of BarBuddy's infrastructure and legal AI services.
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
            onClick={() => navigate('/coming-soon', { state: { title: 'System Refresh', description: 'Manually re-syncing system metrics connects here once the backend exists.' } })}
            style={navyButtonStyle}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            System Refresh
          </button>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiTile icon="group" label="TOTAL REVIEWEES" value={summary.totalReviewees.toLocaleString()} trendLabel={summary.totalRevieweesTrendLabel} />
        <KpiTile icon="payments" label="MONTHLY REVENUE" value={`₱${summary.monthlyRevenue}`} trendLabel={summary.monthlyRevenueTrendLabel} />
        <KpiTile icon="settings_suggest" label="AI API USAGE" value={`${summary.aiApiUsage} req`} trendLabel={summary.aiApiUsageTrendLabel} />
        <KpiTile icon="monitor_heart" label="SYSTEM HEALTH" value={`${summary.systemHealth}%`} trendLabel={summary.systemHealthLabel} />
      </div>

      {/* Revenue vs AI ops + infrastructure pulse */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '15px', margin: 0 }}>Revenue vs. AI Operations</h3>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--bg)', borderRadius: '999px', padding: '4px 10px' }}>MTD: +0.0%</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Fiscal performance correlated with token consumption</p>
          <ComboChart data={REVENUE_VS_AI_OPS} formatY={(v) => `₱${v}k`} />
        </div>

        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '22px' }}>
          <h4 style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '17px', color: 'var(--navy)' }}>dns</span>
            Infrastructure Pulse
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>Real-time resource allocation</p>

          <MetricBar label="AI Inference Latency" valueLabel={infra.aiInferenceLatencyLabel} percent={infra.aiInferenceLoadPercent} />
          <MetricBar label="Database I/O Ops" valueLabel={infra.dbIoLabel} percent={infra.dbIoLoadPercent} />
          <MetricBar label="Server CPU Utilization" valueLabel={`${infra.serverCpuPercent}%`} percent={infra.serverCpuPercent} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '18px', fontSize: '12px' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px' }}>REGION</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>public</span>
                {infra.region}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '0.05em', marginBottom: '2px' }}>DB STATUS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>storage</span>
                {infra.dbStatus}
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
              onClick={() => navigate('/coming-soon', { state: { title: 'Log Options', description: 'Export and column options connect here once the backend exists.' } })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              aria-label="More options"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>more_vert</span>
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Recent administrative and system actions</p>

          <div style={{ display: 'grid', gap: '2px' }}>
            {DUMMY_SYSTEM_LOGS.slice(0, 5).map((log) => (
              <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.description}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>by {log.performedBy}</div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                  {log.timestamp.split(' ')[1]}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, border: '1px solid var(--card-border)', borderRadius: '999px', padding: '3px 10px', color: 'var(--navy)' }}>
                  {log.role}
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

function MetricBar({ label, valueLabel, percent }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{valueLabel}</span>
      </div>
      <div style={{ height: '5px', background: 'var(--card-border)', borderRadius: '999px' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--navy)', borderRadius: '999px' }} />
      </div>
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
