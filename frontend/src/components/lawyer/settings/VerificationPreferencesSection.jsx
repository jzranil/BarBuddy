import { useState } from 'react';
import SettingsSectionCard from '../../common/settings/SettingsSectionCard';
import SaveBar from '../../common/settings/SaveBar';
import ToggleSwitch from '../../common/settings/ToggleSwitch';
import {
  getDefaultVerificationPreferences,
  VERIFICATION_QUEUE_OPTIONS,
  ANSWER_REVIEW_DISPLAY_OPTIONS,
} from '../../../data/lawyer-settings';

const INITIAL_PREFS = getDefaultVerificationPreferences();

// AI Evaluation and Competency Information are mandatory parts of the
// verification workflow — they're always shown, never toggle-able, so they
// can't accidentally be hidden from a step that requires them.
const MANDATORY_DISPLAY_ITEMS = [
  { icon: 'smart_toy', label: 'AI Evaluation', description: 'Always shown — required to cross-check your verification.' },
  { icon: 'insights', label: 'Competency Information', description: 'Always shown — required context for scoring accuracy.' },
];

export default function VerificationPreferencesSection() {
  const [prefs, setPrefs] = useState(INITIAL_PREFS);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(prefs) !== JSON.stringify(INITIAL_PREFS);

  const toggle = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    // BACKEND TODO: PUT /api/lawyer/verification-preferences with `prefs`.
    setSaved(true);
  };

  return (
    <SettingsSectionCard
      id="verification-preferences"
      icon="fact_check"
      title="Verification Preferences"
      description="Customize how your verification queue and answer reviews behave."
    >
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
        Verification Queue
      </div>
      <PreferenceList options={VERIFICATION_QUEUE_OPTIONS} prefs={prefs} onToggle={toggle} />

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '22px 0 4px' }}>
        Answer Review Display
      </div>

      <div style={{ display: 'grid', gap: '2px', marginBottom: '2px' }}>
        {MANDATORY_DISPLAY_ITEMS.map((item, i) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--card-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.description}</div>
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2e7d32', border: '1px solid #2e7d32', borderRadius: '999px', padding: '3px 10px', whiteSpace: 'nowrap' }}>
              Always On
            </span>
          </div>
        ))}
      </div>

      <PreferenceList options={ANSWER_REVIEW_DISPLAY_OPTIONS} prefs={prefs} onToggle={toggle} startBorder />

      <SaveBar dirty={dirty} saved={saved} onSave={handleSave} />
    </SettingsSectionCard>
  );
}

function PreferenceList({ options, prefs, onToggle, startBorder = false }) {
  return (
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
            borderTop: i === 0 && !startBorder ? 'none' : '1px solid var(--card-border)',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{opt.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.description}</div>
          </div>
          <ToggleSwitch checked={prefs[opt.key]} onChange={(v) => onToggle(opt.key, v)} label={opt.label} />
        </div>
      ))}
    </div>
  );
}
