import PortalLayout from '../../layouts/PortalLayout';
import SettingsPageShell from '../../components/common/settings/SettingsPageShell';
import AccountProfileSection from '../../components/portal/settings/AccountProfileSection';
import NotificationsSection from '../../components/common/settings/NotificationsSection';
import AppearanceSection from '../../components/common/settings/AppearanceSection';
import PrivacySecuritySection from '../../components/common/settings/PrivacySecuritySection';
import HelpSupportSection from '../../components/common/settings/HelpSupportSection';
import AboutSection from '../../components/common/settings/AboutSection';
import {
  getDefaultNotificationPreferences,
  NOTIFICATION_OPTIONS,
  FAQ_CATEGORIES,
  SUPPORT_CATEGORIES,
  REPORT_CATEGORIES,
} from '../../data/settings';

const JUMP_LINKS = [
  { id: 'account-profile', label: 'Account & Profile', icon: 'account_circle' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'privacy-security', label: 'Privacy & Security', icon: 'shield' },
  { id: 'help-support', label: 'Help & Support', icon: 'support_agent' },
  { id: 'about', label: 'About', icon: 'info' },
];

export default function SettingsPage() {
  return (
    <PortalLayout>
      <SettingsPageShell
        subtitle="Manage your account, preferences, security, and support options."
        links={JUMP_LINKS}
      >
        <AccountProfileSection />
        <NotificationsSection
          options={NOTIFICATION_OPTIONS}
          defaultPrefs={getDefaultNotificationPreferences()}
          description="Manage your email notification preferences."
        />
        <AppearanceSection />
        <PrivacySecuritySection />
        <HelpSupportSection
          faqCategories={FAQ_CATEGORIES}
          contactCategories={SUPPORT_CATEGORIES}
          reportCategories={REPORT_CATEGORIES}
          helpCenterPath="/help-center"
        />
        <AboutSection legalPath="/legal" />
      </SettingsPageShell>
    </PortalLayout>
  );
}
