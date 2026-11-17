import { useState } from 'react';
import SettingsSectionCard from './SettingsSectionCard';
import SaveBar from './SaveBar';
import ToggleSwitch from './ToggleSwitch';
import { apiRequest } from '../../../lib/api';
import { useApi } from '../../../lib/useApi';

// Generic email-notification-preferences section, reused by all three
// portals — each role passes its own `options` list (key/label/description)
// and `defaultPrefs` object so the toggles shown are relevant to what that
// role actually does. Saved per account (GET/PUT /api/user/notifications);
// the 7 AM daily questions email follows "dailyQuestionReminders".
export default function NotificationsSection({ options, defaultPrefs, description = 'Manage your email notification preferences.' }) {
  const { data, error: loadError } = useApi('/user/notifications');
  const [savedNow, setSavedNow] = useState(null); // saved during this visit
  const [changes, setChanges] = useState({}); // toggled but not saved yet
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // The stored choices over the role's defaults, once loaded
  const stored = savedNow ?? (data ? { ...defaultPrefs, ...data.prefs } : null);
  const current = { ...(stored ?? defaultPrefs), ...changes };
  const dirty = Boolean(stored) && Object.keys(changes).some((key) => changes[key] !== stored[key]);

  const toggle = (key, value) => {
    if (!stored) return;
    setChanges((c) => ({ ...c, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiRequest('/user/notifications', { method: 'PUT', body: { prefs: current } });
      setSavedNow(current);
      setChanges({});
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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

      {(loadError || error) && <p role="alert" style={{ color: '#c0392b', fontSize: '13px', margin: '6px 0' }}>{loadError || error}</p>}

      <div style={{ display: 'grid', gap: '2px', opacity: stored ? 1 : 0.6 }}>
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
            <ToggleSwitch checked={current[opt.key]} onChange={(v) => toggle(opt.key, v)} label={opt.label} />
          </div>
        ))}
      </div>

      <SaveBar dirty={dirty && !saving} saved={saved} onSave={handleSave} />
    </SettingsSectionCard>
  );
}
