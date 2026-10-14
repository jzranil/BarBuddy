import { useEffect, useState } from 'react';
import SettingsSectionCard from './SettingsSectionCard';
import SaveBar from './SaveBar';
import { apiRequest } from '../../../lib/api';

const TYPES = [
  { key: 'daily', label: 'Daily Questions', hint: 'Three essays a day from the package subjects, released at 7:00 AM (paper default).', range: [1, 10] },
  { key: 'practice', label: 'Subject Practice Set', hint: 'Focused set from one Bar subject.', range: [1, 20] },
  { key: 'mock', label: 'Mock Bar Examination', hint: "Twenty essays per examination day, divided among that day's subjects (paper default).", range: [5, 40] },
];

// Assessment configuration (paper TC-SM-009: "Configure answer time limit").
// Editable by Review Administrators and Super Admins.
export default function AssessmentSettingsSection({ canRunRollout = false }) {
  const [config, setConfig] = useState(null);
  const [rollout, setRollout] = useState({ running: false, message: '' });
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    apiRequest('/admin/settings/assessments')
      .then((r) => {
        const loaded = { ...r.config, mockUnlock: r.mockUnlock };
        setConfig(loaded);
        setSaved(loaded);
      })
      .catch((err) => setError(err.message));
  }, []);

  const dirty = config && saved && JSON.stringify(config) !== JSON.stringify(saved);

  const set = (type, field, value) => {
    setJustSaved(false);
    setConfig({ ...config, [type]: { ...config[type], [field]: value === '' ? '' : Number(value) } });
  };

  const setUnlock = (field, value) => {
    setJustSaved(false);
    setConfig({ ...config, mockUnlock: { ...config.mockUnlock, [field]: value === '' ? '' : Number(value) } });
  };

  const runRollout = async () => {
    setRollout({ running: true, message: '' });
    try {
      const result = await apiRequest('/admin/rollout/run', { method: 'POST' });
      setRollout({ running: false, message: result.message });
    } catch (err) {
      setRollout({ running: false, message: err.message });
    }
  };

  const save = async () => {
    setError('');
    try {
      const result = await apiRequest('/admin/settings/assessments', { method: 'PUT', body: config });
      const next = { ...result.config, mockUnlock: result.mockUnlock };
      setConfig(next);
      setSaved(next);
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

          {config.mockUnlock && (
            <div style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Mock Bar Unlock Rule</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Reviewees unlock the per-day Mock Bar Examinations on reaching this level OR this learning streak, whichever comes first.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <NumberField label="Level" min={1} max={100} value={config.mockUnlock.level} onChange={(v) => setUnlock('level', v)} />
                <NumberField label="Learning streak (days)" min={1} max={365} value={config.mockUnlock.streak_days} onChange={(v) => setUnlock('streak_days', v)} />
              </div>
            </div>
          )}

          {canRunRollout && (
            <div style={{ border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px' }}>Daily Questions Rollout</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Runs automatically every day at 7:00 AM (Philippine time): releases each reviewee's daily questions and emails them. Run it now to release any sets that are still missing today.
              </div>
              <button
                type="button"
                onClick={runRollout}
                disabled={rollout.running}
                style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--navy)', background: 'transparent', color: 'var(--navy)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                {rollout.running ? 'Running...' : "Run Today's Rollout Now"}
              </button>
              {rollout.message && <p style={{ fontSize: '12px', margin: '8px 0 0' }}>{rollout.message}</p>}
            </div>
          )}
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
