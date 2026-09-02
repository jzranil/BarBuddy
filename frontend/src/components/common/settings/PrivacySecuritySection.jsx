import { useState } from 'react';
import SettingsSectionCard from './SettingsSectionCard';
import ChangePasswordCard from './ChangePasswordCard';
import TwoFactorCard from './TwoFactorCard';
import SessionsCard from './SessionsCard';
import LoginHistoryCard from './LoginHistoryCard';
import ToggleSwitch from './ToggleSwitch';

// Identical across all three portals, except Super Admin gets an extra
// "Security Alerts" toggle since that account carries the highest level of
// access on the platform (`showSecurityAlerts` opts into it).
export default function PrivacySecuritySection({ showSecurityAlerts = false }) {
  const [securityAlerts, setSecurityAlerts] = useState(true);

  return (
    <SettingsSectionCard
      id="privacy-security"
      icon="shield"
      title="Privacy & Security"
      description="Manage your account security."
    >
      <div style={{ display: 'grid', gap: '18px' }}>
        <ChangePasswordCard />
        <TwoFactorCard />

        {showSecurityAlerts && (
          <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Security Alerts</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '440px' }}>
                  Get emailed immediately about suspicious sign-ins or unusual activity on your admin account.
                </p>
              </div>
              <ToggleSwitch checked={securityAlerts} onChange={setSecurityAlerts} label="Security Alerts" />
            </div>
          </div>
        )}

        <SessionsCard />
        <LoginHistoryCard />
      </div>
    </SettingsSectionCard>
  );
}
