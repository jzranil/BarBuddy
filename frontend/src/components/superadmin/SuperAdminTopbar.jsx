import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileMenu from '../common/ProfileMenu';
import NotificationMenu from '../common/NotificationMenu';
import { getZeroedAdminProfile } from '../../data/superadmin';
import { ADMIN_NOTIFICATIONS } from '../../data/notifications';

// BACKEND TODO: fetch from the API instead of the zeroed helper.
const { name: adminName, email: adminEmail } = getZeroedAdminProfile();

export default function SuperAdminTopbar() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(''); // BACKEND TODO: wire up once there's a cross-platform search index

  return (
    <header
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/superadmin')}>
        <span
          style={{
            width: '30px',
            height: '30px',
            background: 'var(--navy)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
          }}
        >
          B
        </span>
        <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '18px' }}>BarBuddy</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            borderLeft: '1px solid var(--card-border)',
            paddingLeft: '14px',
          }}
        >
          ADMIN PORTAL
        </span>
      </div>

      <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
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
        <NotificationMenu notifications={ADMIN_NOTIFICATIONS} />

        <ProfileMenu name={adminName} email={adminEmail} role="Super Admin" settingsPath="/superadmin/settings" />
      </div>
    </header>
  );
}
