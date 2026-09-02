import Topbar from '../components/portal/Topbar';
import Sidebar from '../components/portal/Sidebar';
import Breadcrumb from '../components/common/Breadcrumb';

export default function PortalLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          <Breadcrumb portal="reviewee" />
          {children}
        </main>
      </div>
    </div>
  );
}
