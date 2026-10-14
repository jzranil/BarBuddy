import { useNavigate } from 'react-router-dom';
import ProfileMenu from '../common/ProfileMenu';
import SidebarToggle from '../common/SidebarToggle';
import NotificationMenu from '../common/NotificationMenu';
import { getZeroedUserSummary } from '../../data/subjects';
import { REVIEWEE_NOTIFICATIONS } from '../../data/notifications';
import BrandLogo from '../BrandLogo';

// BACKEND TODO: fetch from the API instead of the zeroed helper.
const { displayName, email } = getZeroedUserSummary();

export default function Topbar() {
  const navigate = useNavigate();

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
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <SidebarToggle />

      <div
        style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
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
          REVIEWEE PORTAL
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <NotificationMenu notifications={REVIEWEE_NOTIFICATIONS} />

        <ProfileMenu
          name={displayName}
          email={email}
          role="Reviewee"
          settingsPath="/settings"
          extraItems={[
            {
              icon: 'auto_awesome',
              label: 'Go Pro',
              path: '/subscription',
            },
          ]}
        />
      </div>
    </header>
  );
}
