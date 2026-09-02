import { useState } from 'react';
import SettingsSectionCard from './SettingsSectionCard';
import SaveBar from './SaveBar';
import ToggleSwitch from './ToggleSwitch';

// Generic email-notification-preferences section, reused by all three
// portals — each role passes its own `options` list (key/label/description)
// and `defaultPrefs` object so the toggles shown are relevant to what that
// role actually does. BACKEND TODO: swap `onSave` for a real PUT to that
// role's notification-preferences endpoint.
export default function NotificationsSection({ options, defaultPrefs, description = 'Manage your email notification preferences.' }) {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(defaultPrefs);

  const toggle = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <SettingsSectionCard
      id="notifications"
      icon="notifications"
      title="Notifications"
      description={description}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
        Email Notification Preferences
      </div>

      <div style={{ display: 'grid', gap: '2px' }}>
        {options.map((opt, i) => (
          <div
            key={opt.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--card-border)',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{opt.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.description}</div>
            </div>
            <ToggleSwitch checked={prefs[opt.key]} onChange={(v) => toggle(opt.key, v)} label={opt.label} />
          </div>
        ))}
      </div>

      <SaveBar dirty={dirty} saved={saved} onSave={handleSave} />
    </SettingsSectionCard>
  );
}
