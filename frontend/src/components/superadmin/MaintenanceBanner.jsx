import { useNavigate } from 'react-router-dom';
import { confirmAction } from '../../lib/swal';

export default function MaintenanceBanner() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: 'var(--navy)',
        borderRadius: 'var(--radius-lg)',
        padding: '22px 26px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1.5px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '18px' }}>shield</span>
        </div>
        <div>
          <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '4px' }}>Maintenance Mode Scheduler</h3>
          <p style={{ color: '#cfd3dc', fontSize: '13px', margin: 0, maxWidth: '440px' }}>
            Coordinate system-wide downtime for heavy model updates or server migrations.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={() => navigate('/coming-soon', { state: { title: 'Schedule Upgrade', description: 'Scheduling a maintenance window connects here once the infra API exists.' } })}
          style={{ background: '#fff', color: 'var(--navy)', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          Schedule Upgrade
        </button>
        <button
          onClick={async () => {
            // BACKEND TODO: hit a real emergency-stop endpoint once it exists.
            const confirmed = await confirmAction({ title: 'Trigger an emergency stop?', text: 'This would take BarBuddy offline immediately for every user.', confirmText: 'Yes, stop the system', danger: true });
            if (confirmed) {
              navigate('/coming-soon', { state: { title: 'Emergency Stop', description: 'Emergency shutdown connects here once the infra API exists.' } });
            }
          }}
          style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          Emergency Stop
        </button>
      </div>
    </div>
  );
}
