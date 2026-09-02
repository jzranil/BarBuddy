import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsSectionCard from '../../common/settings/SettingsSectionCard';
import SaveBar from '../../common/settings/SaveBar';
import ToggleSwitch from '../../common/settings/ToggleSwitch';
import FormField from '../../common/FormField';
import Button from '../../Button';
import { getDefaultSystemPreferences, TIME_ZONE_OPTIONS } from '../../../data/superadmin-settings';

const INITIAL_PREFS = getDefaultSystemPreferences();

export default function SystemPreferencesSection() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(INITIAL_PREFS);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(INITIAL_PREFS);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPrefs((p) => ({ ...p, [name]: value }));
    setSaved(false);
  };

  const toggleMaintenance = (value) => {
    setPrefs((p) => ({ ...p, maintenanceMode: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // BACKEND TODO: PUT /api/admin/system-preferences with `prefs`.
    setSaved(true);
  };

  return (
    <SettingsSectionCard
      id="system-preferences"
      icon="tune"
      title="System Preferences"
      description="Platform-wide configuration for the BarBuddy system."
    >
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        General Settings
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4px 20px', marginBottom: '22px' }}>
        <FormField label="Platform Name" name="platformName" value={prefs.platformName} onChange={handleChange} />
        <FormField label="System Email" type="email" name="systemEmail" value={prefs.systemEmail} onChange={handleChange} />
        <FormField label="Time Zone" type="select" name="timeZone" value={prefs.timeZone} onChange={handleChange} options={TIME_ZONE_OPTIONS} />
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Review Settings
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '22px' }}>
        <ConfigLink
          icon="quiz"
          title="Daily Question Configuration"
          description="Manage how daily practice questions are generated and scheduled."
          onClick={() => navigate('/coming-soon', { state: { title: 'Daily Question Configuration', description: 'Daily question scheduling controls will live here.' } })}
        />
        <ConfigLink
          icon="fact_check"
          title="Verification Configuration"
          description="Set verification deadlines and routing rules for lawyer reviewers."
          onClick={() => navigate('/coming-soon', { state: { title: 'Verification Configuration', description: 'Verification routing and deadline controls will live here.' } })}
        />
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Maintenance
      </div>
      <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)' }}>Maintenance Mode</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Temporarily block reviewee and lawyer sign-in while you make changes.
            </div>
          </div>
          <ToggleSwitch checked={prefs.maintenanceMode} onChange={toggleMaintenance} label="Maintenance Mode" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: prefs.maintenanceMode ? '#c0392b' : '#2e7d32' }}>
            {prefs.maintenanceMode ? 'warning' : 'check_circle'}
          </span>
          System Status: {prefs.maintenanceMode ? 'Maintenance Mode Active' : 'Operational'}
        </div>
      </div>

      <SaveBar dirty={dirty} saved={saved} onSave={handleSave} />
    </SettingsSectionCard>
  );
}

function ConfigLink({ icon, title, description, onClick }) {
  return (
    <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '20px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <Button variant="outline" onClick={onClick}>Configure</Button>
    </div>
  );
}
