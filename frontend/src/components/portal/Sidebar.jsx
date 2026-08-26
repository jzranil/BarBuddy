import { useNavigate, useLocation } from 'react-router-dom';

// Single source of truth for portal nav — add a new page here and it shows
// up in the sidebar automatically. `path` items that don't have a real page
// yet route to /coming-soon (see ComingSoonPage.jsx).
const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'grid_view', path: '/dashboard' },
  { label: 'Subjects', icon: 'library_books', path: '/subjects' },
  { label: 'Achievements', icon: 'emoji_events', path: '/achievements' },
  { label: 'Subscription', icon: 'receipt_long', path: '/subscription' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => path !== '/coming-soon' && location.pathname.startsWith(path);

  return (
    <aside
      style={{
        width: '240px',
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid var(--card-border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 'calc(100vh - 65px)', // 65px = topbar height
      }}
    >
      <nav style={{ padding: '20px 12px', display: 'grid', gap: '4px' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path, item.state ? { state: item.state } : undefined)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: active ? 'var(--bg)' : 'transparent',
                borderLeft: active ? '3px solid var(--navy)' : '3px solid transparent',
                color: 'var(--navy)',
                fontWeight: active ? 600 : 500,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid var(--card-border)', display: 'grid', gap: '4px' }}>
        <button
          onClick={() => navigate('/coming-soon', { state: { title: 'Settings', description: 'Account settings will live here.' } })}
          style={sidebarFooterButtonStyle}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>settings</span>
          Settings
        </button>
        <button
          onClick={() => navigate('/login')} // BACKEND TODO: clear Cognito session/token before navigating
          style={{ ...sidebarFooterButtonStyle, color: '#c0392b' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

const sidebarFooterButtonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: 'var(--navy)',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
};
