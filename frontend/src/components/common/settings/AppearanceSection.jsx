import { useState } from 'react';
import SettingsSectionCard from './SettingsSectionCard';
import { THEME_OPTIONS, FONT_SIZE_OPTIONS } from '../../../data/settings';

// FRONTEND TODO: Theme and Font Size are local UI state only — connect to a
// real global theme context / typography scale once one exists (same
// treatment as the Night Mode toggle in ProfileMenu.jsx).
export default function AppearanceSection() {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');

  return (
    <SettingsSectionCard
      id="appearance"
      icon="palette"
      title="Appearance"
      description="Customize how BarBuddy looks for you."
    >
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Theme
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '26px' }}>
        {THEME_OPTIONS.map((opt) => {
          const active = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={active}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${active ? 'var(--navy)' : 'var(--card-border)'}`,
                background: active ? 'var(--bg)' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: active ? 'var(--gold)' : 'var(--text-muted)', fontSize: '20px' }}>
                {opt.icon}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>{opt.label}</span>
              {active && (
                <span className="material-symbols-outlined" style={{ marginLeft: 'auto', color: 'var(--navy)', fontSize: '18px' }}>
                  check_circle
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Font Size
      </div>
      <div
        style={{
          display: 'inline-flex',
          border: '1px solid var(--card-border)',
          borderRadius: '999px',
          padding: '3px',
          gap: '2px',
        }}
      >
        {FONT_SIZE_OPTIONS.map((opt) => {
          const active = fontSize === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFontSize(opt.value)}
              aria-pressed={active}
              style={{
                border: 'none',
                borderRadius: '999px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                background: active ? 'var(--navy)' : 'transparent',
                color: active ? '#fff' : 'var(--navy)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </SettingsSectionCard>
  );
}
