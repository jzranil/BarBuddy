import SuperAdminTopbar from '../components/superadmin/SuperAdminTopbar';
import SuperAdminSidebar from '../components/superadmin/SuperAdminSidebar';
import Breadcrumb from '../components/common/Breadcrumb';

export default function SuperAdminLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SuperAdminTopbar />
      <div style={{ display: 'flex' }}>
        <SuperAdminSidebar />
        <main style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          <Breadcrumb portal="superadmin" />
          {children}
        </main>
      </div>
    </div>
  );
}
