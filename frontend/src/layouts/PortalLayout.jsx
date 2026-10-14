import Topbar from '../components/portal/Topbar';
import Sidebar from '../components/portal/Sidebar';
import Breadcrumb from '../components/common/Breadcrumb';
import SidebarBackdrop from '../components/common/SidebarBackdrop';

export default function PortalLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar />
      <div className="app-body" style={{ display: 'flex' }}>
        <Sidebar />
        <SidebarBackdrop />
        <main className="app-main" style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          <Breadcrumb portal="reviewee" />
          {children}
        </main>
      </div>
    </div>
  );
}
