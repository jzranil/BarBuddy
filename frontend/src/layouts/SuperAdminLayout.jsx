import SuperAdminTopbar from '../components/superadmin/SuperAdminTopbar';
import SuperAdminSidebar from '../components/superadmin/SuperAdminSidebar';

export default function SuperAdminLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SuperAdminTopbar />
      <div style={{ display: 'flex' }}>
        <SuperAdminSidebar />
        <main style={{ flex: 1, padding: '28px 32px' }}>{children}</main>
      </div>
    </div>
  );
}
