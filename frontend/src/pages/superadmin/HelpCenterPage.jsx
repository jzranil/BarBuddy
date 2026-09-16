import SuperAdminLayout from '../../layouts/SuperAdminLayout';
import HelpCenterContent from '../../components/common/help-center/HelpCenterContent';

export default function HelpCenterPage() {
  return (
    <SuperAdminLayout>
      <HelpCenterContent role="superadmin" />
    </SuperAdminLayout>
  );
}
