import LawyerLayout from '../../layouts/LawyerLayout';
import SettingsPageShell from '../../components/common/settings/SettingsPageShell';
import AccountProfileSection from '../../components/lawyer/settings/AccountProfileSection';
import VerificationPreferencesSection from '../../components/lawyer/settings/VerificationPreferencesSection';
import NotificationsSection from '../../components/common/settings/NotificationsSection';
import AppearanceSection from '../../components/common/settings/AppearanceSection';
import PrivacySecuritySection from '../../components/common/settings/PrivacySecuritySection';
import HelpSupportSection from '../../components/common/settings/HelpSupportSection';
import AboutSection from '../../components/common/settings/AboutSection';
// import { useNavigate } from 'react-router-dom';
import {
  getDefaultLawyerNotificationPreferences,
  LAWYER_NOTIFICATION_OPTIONS,
  LAWYER_FAQ_CATEGORIES,
  LAWYER_SUPPORT_CATEGORIES,
  LAWYER_REPORT_CATEGORIES,
} from '../../data/lawyer-settings';

const JUMP_LINKS = [
  { id: 'account-profile', label: 'Account & Profile', icon: 'account_circle' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'verification-preferences', label: 'Verification Preferences', icon: 'fact_check' },
  { id: 'privacy-security', label: 'Privacy & Security', icon: 'shield' },
  { id: 'help-support', label: 'Help & Support', icon: 'support_agent' },
  { id: 'about', label: 'About', icon: 'info' },
];

export default function LawyerSettingsPage() {
  // const navigate = useNavigate();

  return (
    <LawyerLayout>
      <SettingsPageShell
        subtitle="Manage your account, verification preferences, security, and support options."
        links={JUMP_LINKS}
      >
        <AccountProfileSection />
        <NotificationsSection
          options={LAWYER_NOTIFICATION_OPTIONS}
          defaultPrefs={getDefaultLawyerNotificationPreferences()}
          description="Manage your verification-related email notifications."
        />
        <AppearanceSection />
        <VerificationPreferencesSection />
        <PrivacySecuritySection />
        <HelpSupportSection
          faqCategories={LAWYER_FAQ_CATEGORIES}
          contactCategories={LAWYER_SUPPORT_CATEGORIES}
          reportCategories={LAWYER_REPORT_CATEGORIES}
          // extraOptions={[
          //   {
          //     icon: 'gavel',
          //     title: 'Verification Guidelines',
          //     description: 'Standards and rubric notes to follow when verifying reviewee answers.',
          //     actionLabel: 'View Guidelines',
          //     onClick: () =>
          //       navigate('/coming-soon', {
          //         state: { title: 'Verification Guidelines', description: 'The answer-verification standards and rubric will be published here.' },
          //       }),
          //   },
          // ]}
        />
        <AboutSection />
      </SettingsPageShell>
    </LawyerLayout>
  );
}
