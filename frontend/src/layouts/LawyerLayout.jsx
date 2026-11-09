import LawyerTopbar from '../components/lawyer/LawyerTopbar';
import LawyerSidebar from '../components/lawyer/LawyerSidebar';
import Breadcrumb from '../components/common/Breadcrumb';
import SidebarBackdrop from '../components/common/SidebarBackdrop';
import { useRequireSession } from '../lib/session';

export default function LawyerLayout({ children }) {
  useRequireSession();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <LawyerTopbar />
      <div className="app-body" style={{ display: 'flex' }}>
        <LawyerSidebar />
        <SidebarBackdrop />
        <main className="app-main" style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          <Breadcrumb portal="lawyer" />
          <div className="page-transition">{children}</div>
        </main>
      </div>
    </div>
  );
}
