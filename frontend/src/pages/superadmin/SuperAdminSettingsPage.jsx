import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import SettingsPageShell from '../../components/common/settings/SettingsPageShell';
import AccountProfileSection from '../../components/superadmin/settings/AccountProfileSection';
import SystemPreferencesSection from '../../components/superadmin/settings/SystemPreferencesSection';
import NotificationsSection from '../../components/common/settings/NotificationsSection';
import AppearanceSection from '../../components/common/settings/AppearanceSection';
import PrivacySecuritySection from '../../components/common/settings/PrivacySecuritySection';
import HelpSupportSection from '../../components/common/settings/HelpSupportSection';
import AboutSection from '../../components/common/settings/AboutSection';
import {
  getDefaultAdminNotificationPreferences,
  ADMIN_NOTIFICATION_OPTIONS,
  ADMIN_FAQ_CATEGORIES,
  ADMIN_SUPPORT_CATEGORIES,
  ADMIN_REPORT_CATEGORIES,
} from '../../data/superadmin-settings';

const JUMP_LINKS = [
  { id: 'account-profile', label: 'Account & Profile', icon: 'account_circle' },
  { id: 'notifications', label: 'Notifications', icon: 'notifications' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'system-preferences', label: 'System Preferences', icon: 'tune' },
  { id: 'privacy-security', label: 'Privacy & Security', icon: 'shield' },
  { id: 'help-support', label: 'Help & Support', icon: 'support_agent' },
  { id: 'about', label: 'About', icon: 'info' },
];

export default function SuperAdminSettingsPage() {

  return (
    <SuperAdminLayout>
      <SettingsPageShell
        subtitle="Manage your account, platform configuration, security, and support options."
        links={JUMP_LINKS}
      >
        <AccountProfileSection />
        <NotificationsSection
          options={ADMIN_NOTIFICATION_OPTIONS}
          defaultPrefs={getDefaultAdminNotificationPreferences()}
          description="Manage your platform and operations email notifications."
        />
        <AppearanceSection />
        <SystemPreferencesSection />
        <PrivacySecuritySection showSecurityAlerts />
        <HelpSupportSection
          faqCategories={ADMIN_FAQ_CATEGORIES}
          contactCategories={ADMIN_SUPPORT_CATEGORIES}
          reportCategories={ADMIN_REPORT_CATEGORIES}
          
        />
        <AboutSection />
      </SettingsPageShell>
    </SuperAdminLayout>
  );
}
