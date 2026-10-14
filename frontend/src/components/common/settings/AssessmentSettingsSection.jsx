import { useEffect, useState } from 'react';
import SettingsSectionCard from './SettingsSectionCard';
import SaveBar from './SaveBar';
import { apiRequest } from '../../../lib/api';

const TYPES = [
  { key: 'daily', label: 'Daily Questions', hint: 'Three practice essays a day (paper default).', range: [1, 10] },
  { key: 'practice', label: 'Subject Practice Set', hint: 'Focused set from one Bar subject.', range: [1, 20] },
  { key: 'mock', label: 'Mock Bar Examination', hint: 'Twenty essays weighted like the Bar (paper default).', range: [5, 40] },
];

// Assessment configuration (paper TC-SM-009: "Configure answer time limit").
// Editable by Review Administrators and Super Admins.
export default function AssessmentSettingsSection() {
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    apiRequest('/admin/settings/assessments')
      .then((r) => {
        setConfig(r.config);
        setSaved(r.config);
      })
      .catch((err) => setError(err.message));
  }, []);

  const dirty = config && saved && JSON.stringify(config) !== JSON.stringify(saved);

  const set = (type, field, value) => {
    setJustSaved(false);
    setConfig({ ...config, [type]: { ...config[type], [field]: value === '' ? '' : Number(value) } });
  };

  const save = async () => {
    setError('');
    try {
      const result = await apiRequest('/admin/settings/assessments', { method: 'PUT', body: config });
      setConfig(result.config);
      setSaved(result.config);
      setJustSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <SettingsSectionCard
      id="assessment-settings"
      icon="timer"
      title="Assessment Settings"
      description="Question counts, reading period and answer time limit for each assessment type. Changes apply to newly started assessments."
    >
      {error && <p style={{ color: '#9b1c1c', fontSize: '13px', marginTop: 0 }}>{error}</p>}
      {!config && !error && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading settings...</p>}

      {config && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {TYPES.map((t) => (
            <div key={t.key} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>{t.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{t.hint}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <NumberField label="Questions" min={t.range[0]} max={t.range[1]} value={config[t.key].questions} onChange={(v) => set(t.key, 'questions', v)} />
                <NumberField label="Reading period (min)" min={0} max={60} value={config[t.key].reading_minutes} onChange={(v) => set(t.key, 'reading_minutes', v)} />
                <NumberField label="Answer time limit (min)" min={5} max={600} value={config[t.key].time_limit_minutes} onChange={(v) => set(t.key, 'time_limit_minutes', v)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {config && <SaveBar dirty={dirty} saved={justSaved && !dirty} onSave={save} />}
    </SettingsSectionCard>
  );
}

function NumberField({ label, value, onChange, min, max }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', fontSize: '13px', background: '#fff', color: 'var(--navy)' }}
      />
    </label>
  );
}
