import { useNavigate } from 'react-router-dom';
import SettingsSectionCard from './SettingsSectionCard';
import { APP_VERSION } from '../../../data/settings';

export default function AboutSection() {
  const navigate = useNavigate();

  const goComingSoon = (title, description) => navigate('/coming-soon', { state: { title, description } });

  return (
    <SettingsSectionCard
      id="about"
      icon="info"
      title="About"
      description="BarBuddy information and legal documents."
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span
          style={{
            width: '26px',
            height: '26px',
            background: 'var(--navy)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gold)',
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          B
        </span>
        <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '16px' }}>BarBuddy</span>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '620px', marginBottom: '24px' }}>
        BarBuddy is a subscription-based learning and review platform designed to help Philippine Bar
        Examination candidates assess their legal competency, practice answering questions, monitor their
        progress, and prepare more effectively for the Bar Examination.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Legal
          </div>
          <AboutLink label="Terms of Service" onClick={() => goComingSoon('Terms of Service', 'The full Terms of Service will be published here.')} />
          <AboutLink label="Privacy Policy" onClick={() => goComingSoon('Privacy Policy', 'The full Privacy Policy will be published here.')} />
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Licenses
          </div>
          <AboutLink
            label="Licenses & Credits"
            onClick={() => goComingSoon('Licenses & Credits', 'A list of third-party libraries and assets used by BarBuddy will be published here.')}
          />
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Version
          </div>
          <div style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 600 }}>BarBuddy v{APP_VERSION}</div>
        </div>
      </div>
    </SettingsSectionCard>
  );
}

function AboutLink({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'none',
        border: 'none',
        padding: '4px 0',
        marginBottom: '6px',
        fontSize: '13px',
        color: 'var(--navy)',
        fontWeight: 600,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {label}
      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>chevron_right</span>
    </button>
  );
}
