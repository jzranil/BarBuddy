import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSidebar } from '../../lib/sidebar';
import { confirmAction } from '../../lib/swal';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: 'dashboard', path: '/lawyer' },
  { label: 'Verification', icon: 'fact_check', path: '/lawyer/verification' },
  { label: 'Curriculum', icon: 'menu_book', path: '/lawyer/curriculum' },
  { label: 'Questionnaire', icon: 'gpp_good', path: '/lawyer/questionnaire' },
  { label: 'Reviewees', icon: 'groups', path: '/lawyer/reviewees' },
  { label: 'Badges', icon: 'military_tech', path: '/lawyer/achievements' },
  { label: 'System Logs', icon: 'receipt_long', path: '/lawyer/logs' },
];

export default function LawyerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, close } = useSidebar();

  // Close the slide-in menu (small screens) after moving to another page
  useEffect(() => {
    close();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    if (!(await confirmAction({ title: 'Log out of BarBuddy?', text: 'You can sign back in anytime.', confirmText: 'Yes, log out' }))) return;
    await supabase.auth.signOut();
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  // "/lawyer" itself should only be active on an exact match, otherwise it
  // would also light up for /lawyer/verification and /lawyer/curriculum.
  const isActive = (path) => (path === '/lawyer' ? location.pathname === '/lawyer' : location.pathname.startsWith(path));

  return (
    <aside
      className={`app-sidebar${isOpen ? ' is-open' : ''}`}
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
          onClick={() => navigate('/lawyer/settings')}
          style={{
            ...footerButtonStyle,
            background: isActive('/lawyer/settings') ? 'var(--bg)' : 'transparent',
            borderLeft: isActive('/lawyer/settings') ? '3px solid var(--navy)' : '3px solid transparent',
            fontWeight: isActive('/lawyer/settings') ? 600 : 500,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>settings</span>
          Settings
        </button>
        <button
          onClick={signOut}
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
