import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileMenu from '../common/ProfileMenu';
import SidebarToggle from '../common/SidebarToggle';
import NotificationMenu from '../common/NotificationMenu';
import { getZeroedLawyerDeskSummary } from '../../data/lawyer';
import BrandLogo from '../BrandLogo';

// BACKEND TODO: fetch from the API instead of the zeroed helper.
const { lawyerName, lawyerEmail } = getZeroedLawyerDeskSummary();

export default function LawyerTopbar() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once there's a reviewees/cases index to search

  return (
    <header
      className="app-topbar"
      style={{
        height: '65px',
        borderBottom: '3px solid var(--gold)',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '20px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <SidebarToggle />

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/lawyer')}>
        <BrandLogo height={34} />
        <span
          className="app-topbar-label"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            borderLeft: '1px solid var(--card-border)',
            paddingLeft: '14px',
          }}
        >
          LAWYER PORTAL
        </span>
      </div>

      <div className="app-topbar-search" style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '17px', color: 'var(--text-muted)' }}>
          search
        </span>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search subjects or cases..."
          style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: 'var(--bg)' }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
        <NotificationMenu />

        <ProfileMenu name={lawyerName} email={lawyerEmail} role="Lawyer" settingsPath="/lawyer/settings" />
      </div>
    </header>
  );
}
