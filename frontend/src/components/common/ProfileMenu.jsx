import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Shared account menu, used by every portal's topbar (reviewee, lawyer,
// super admin). Pass `extraItems` for role-specific entries (e.g. "Go Pro"
// only makes sense for reviewees). Pass `settingsPath` for portals that have
// a real Settings page (currently just the reviewee portal) — when set,
// Edit profile / Preferences / Help center deep-link into its sections
// instead of falling back to /coming-soon.
//
// name/email/role: BACKEND TODO — each Topbar currently passes zeroed/demo
// values from its own data file; wire these to the real Cognito profile
// once auth exists.
export default function ProfileMenu({ name, email, role, extraItems = [], settingsPath }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [nightMode, setNightMode] = useState(false); // FRONTEND TODO: wire up a real dark theme; this is currently just a UI toggle
  const [photoDataUrl, setPhotoDataUrl] = useState(null); // client-side only preview — BACKEND TODO: upload to S3 / Cognito profile picture on change
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const goto = (path, state) => {
    setOpen(false);
    navigate(path, state ? { state } : undefined);
  };

  const Avatar = ({ size }) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: photoDataUrl ? `url(${photoDataUrl}) center/cover` : 'var(--bg)',
        border: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: 'var(--navy)',
        fontWeight: 700,
        fontSize: size * 0.36,
      }}
    >
      {!photoDataUrl && initials}
    </div>
  );

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0, borderRadius: '50%' }}
      >
        <Avatar size={36} />
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: '9px', height: '9px', borderRadius: '50%', background: '#2e7d32', border: '2px solid #fff' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '280px',
            background: '#fff',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 28px rgba(15,31,61,0.14)',
            overflow: 'hidden',
            zIndex: 100,
          }}
        >
          {/* Identity header */}
          <div style={{ padding: '18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              <Avatar size={48} />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change photo"
                title="Change photo"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--navy)',
                  border: '2px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '11px', color: '#fff' }}>photo_camera</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--navy)', marginTop: '2px' }}>{role}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--card-border)' }} />

          <MenuItem
            icon="person"
            label="Edit profile"
            onClick={() =>
              settingsPath
                ? goto(`${settingsPath}#account-profile`)
                : goto('/coming-soon', { title: 'Edit Profile', description: 'Editing your name, contact info, and bio connects here once the backend exists.' })
            }
          />
          <MenuItem
            icon="tune"
            label="Preferences"
            onClick={() =>
              settingsPath
                ? goto(`${settingsPath}#notifications`)
                : goto('/coming-soon', { title: 'Preferences', description: 'Notification and study preferences will live here.' })
            }
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--navy)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>dark_mode</span>
              Night mode
            </span>
            <ToggleSwitch checked={nightMode} onClick={() => setNightMode((v) => !v)} />
          </div>

          {extraItems.map((item) => (
            <MenuItem key={item.label} icon={item.icon} label={item.label} onClick={() => goto(item.path ?? '/coming-soon', item.state)} />
          ))}

          <MenuItem
            icon="help"
            label="Help center"
            onClick={() =>
              settingsPath
                ? goto(`${settingsPath}#help-support`)
                : goto('/coming-soon', { title: 'Help Center', description: 'FAQs and support articles will live here.' })
            }
          />

          <div style={{ borderTop: '1px solid var(--card-border)' }} />

          <MenuItem
            icon="logout"
            label="Sign out"
            danger
            onClick={() => goto('/login')} // BACKEND TODO: clear Cognito session/token before navigating
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '11px 18px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        color: danger ? '#c0392b' : 'var(--navy)',
        textAlign: 'left',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: danger ? '#c0392b' : 'var(--text-muted)' }}>{icon}</span>
      {label}
    </button>
  );
}

function ToggleSwitch({ checked, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={checked}
      style={{
        width: '38px',
        height: '22px',
        borderRadius: '999px',
        border: 'none',
        background: checked ? 'var(--navy)' : 'var(--card-border)',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '19px' : '3px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  );
}
