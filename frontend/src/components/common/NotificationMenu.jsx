import { useState, useRef, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { timeAgo } from '../../lib/format';

const READ_KEY = 'bb-read-announcements';
const readIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY)) || []);
  } catch {
    return new Set();
  }
};
const saveReadIds = (ids) => {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    // Read state is a convenience only
  }
};

// Shared notification dropdown, used by every portal's topbar. Shows the
// system announcements published by the Super Admin for the user's role
// (paper TC-SA-001). Read state is remembered in this browser.
export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let active = true;
    apiRequest('/announcements')
      .then((r) => {
        if (!active) return;
        const read = readIds();
        setNotifications(
          r.announcements.map((a) => ({
            id: a.id,
            icon: 'campaign',
            title: a.title,
            description: a.body,
            time: timeAgo(a.createdAt),
            unread: !read.has(a.id),
          }))
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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
    const read = readIds();
    notifications.forEach((n) => read.add(n.id));
    saveReadIds(read);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const openNotification = (n) => {
    const read = readIds();
    read.add(n.id);
    saveReadIds(read);
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item)));
    setExpanded(expanded === n.id ? null : n.id);
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
            width: 'min(340px, calc(100vw - 24px))',
            background: '#fff',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 28px rgba(15,31,61,0.14)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--card-border)' }}>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Announcements</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No announcements yet.
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
                    color: 'var(--navy)',
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
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 4px', lineHeight: 1.4, whiteSpace: expanded === n.id ? 'pre-wrap' : 'normal', display: expanded === n.id ? 'block' : '-webkit-box', WebkitLineClamp: expanded === n.id ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.description}</p>
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
