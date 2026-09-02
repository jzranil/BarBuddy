import { useState } from 'react';
import Button from '../../Button';
import Modal from '../Modal';
import { ACTIVE_SESSIONS } from '../../../data/settings';

const DEVICE_ICON = { 'Windows PC': 'computer', 'Mobile Device': 'smartphone' };

export default function SessionsCard() {
  const [sessions, setSessions] = useState(ACTIVE_SESSIONS);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const otherCount = sessions.filter((s) => !s.current).length;

  const logOutOne = (id) => setSessions((s) => s.filter((sess) => sess.id === id || sess.current));

  const logOutOthers = () => {
    // BACKEND TODO: POST /api/reviewee/sessions/revoke-others
    setSessions((s) => s.filter((sess) => sess.current));
    setConfirmOpen(false);
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '15px', margin: 0 }}>Active Sessions</h3>
        {otherCount > 0 && (
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            Log Out Other Sessions
          </Button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {sessions.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              padding: '12px 14px',
              border: '1px solid var(--card-border)',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '22px' }}>
                {DEVICE_ICON[s.device] ?? 'devices'}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>{s.device}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.browser} • {s.os}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Last active: {s.lastActive}</div>
              </div>
            </div>

            {s.current ? (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: '999px', padding: '4px 12px', whiteSpace: 'nowrap' }}>
                Current
              </span>
            ) : (
              <Button variant="outline" onClick={() => logOutOne(s.id)}>Log Out</Button>
            )}
          </div>
        ))}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Log Out Other Sessions" width="420px">
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 0 }}>
          Are you sure you want to log out of all other active sessions? Those devices will need to sign in again.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
          <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="navy" onClick={logOutOthers}>Log Out Others</Button>
        </div>
      </Modal>
    </div>
  );
}

const cardStyle = {
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
};
