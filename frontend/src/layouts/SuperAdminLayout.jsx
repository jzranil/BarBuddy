import SuperAdminTopbar from '../components/superadmin/SuperAdminTopbar';
import SuperAdminSidebar from '../components/superadmin/SuperAdminSidebar';
import Breadcrumb from '../components/common/Breadcrumb';
import SidebarBackdrop from '../components/common/SidebarBackdrop';

export default function SuperAdminLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SuperAdminTopbar />
      <div className="app-body" style={{ display: 'flex' }}>
        <SuperAdminSidebar />
        <SidebarBackdrop />
        <main className="app-main" style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          <Breadcrumb portal="superadmin" />
          <div className="page-transition">{children}</div>
        </main>
      </div>
    </div>
  );
}
