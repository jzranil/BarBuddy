import Topbar from '../components/portal/Topbar';
import Sidebar from '../components/portal/Sidebar';

export default function PortalLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Topbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '28px 32px' }}>{children}</main>
      </div>
    </div>
  );
}
