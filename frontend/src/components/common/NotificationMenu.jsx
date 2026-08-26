import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Shared notification dropdown, used by every portal's topbar. Each topbar
// passes its own dummy list from src/data/notifications.js.
export default function NotificationMenu({ notifications: initialNotifications }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const menuRef = useRef(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markAllAsRead = () => {
    // BACKEND TODO: PATCH /api/notifications/read-all
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const openNotification = (n) => {
    // BACKEND TODO: PATCH /api/notifications/{id}/read, then deep-link to
    // whatever the notification is about (a submission, a case, etc).
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)));
    setOpen(false);
    navigate('/coming-soon', { state: { title: n.title, description: 'Jumping straight to what this notification is about connects here once the backend exists.' } });
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 0 }}
      >
        <span className="material-symbols-outlined" style={{ color: 'var(--navy)' }}>notifications</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -8,
              minWidth: '15px',
              height: '15px',
              borderRadius: '999px',
              background: '#c0392b',
              color: '#fff',
              fontSize: '9px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '38px',
            right: 0,
            width: '340px',
            background: '#fff',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 28px rgba(15,31,61,0.14)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              You're all caught up.
            </div>
          ) : (
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    gap: '10px',
                    padding: '12px 16px',
                    background: n.unread ? '#f7f9fc' : 'transparent',
                    border: 'none',
                    borderBottom: i === notifications.length - 1 ? 'none' : '1px solid var(--card-border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--navy)' }}>{n.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{n.title}</span>
                      {n.unread && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: '4px' }} />}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 4px', lineHeight: 1.4 }}>{n.description}</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{n.time}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
