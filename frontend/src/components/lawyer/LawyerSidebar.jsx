import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: '/lawyer' },
  { label: 'Verification', icon: 'fact_check', path: '/lawyer/verification' },
  { label: 'Curriculum', icon: 'menu_book', path: '/lawyer/curriculum' },
  { label: 'Questionnaire', icon: 'gpp_good', path: '/lawyer/questionnaire' },
];

export default function LawyerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // "/lawyer" itself should only be active on an exact match, otherwise it
  // would also light up for /lawyer/verification and /lawyer/curriculum.
  const isActive = (path) => (path === '/lawyer' ? location.pathname === '/lawyer' : location.pathname.startsWith(path));

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
        minHeight: 'calc(100vh - 65px)',
      }}
    >
      <nav style={{ padding: '20px 12px', display: 'grid', gap: '4px' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
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
          onClick={() => navigate('/coming-soon', { state: { title: 'Settings', description: 'Lawyer account settings will live here.' } })}
          style={footerButtonStyle}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>settings</span>
          Settings
        </button>
        <button
          onClick={() => navigate('/login')} // BACKEND TODO: clear Cognito session/token before navigating
          style={{ ...footerButtonStyle, color: '#c0392b' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

const footerButtonStyle = {
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
