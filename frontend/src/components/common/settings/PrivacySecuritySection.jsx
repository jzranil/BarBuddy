import SettingsSectionCard from './SettingsSectionCard';
import ChangePasswordCard from './ChangePasswordCard';
import LoginHistoryCard from './LoginHistoryCard';

// Identical across all three portals: change password (Amazon Cognito) and
// the account's recent sign-ins
export default function PrivacySecuritySection() {
  return (
    <SettingsSectionCard
      id="privacy-security"
      icon="shield"
      title="Privacy & Security"
      description="Manage your account security."
    >
      <div style={{ display: 'grid', gap: '18px' }}>
        <ChangePasswordCard />
        <LoginHistoryCard />
      </div>
    </SettingsSectionCard>
  );
}
