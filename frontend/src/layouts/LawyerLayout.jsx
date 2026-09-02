import LawyerTopbar from '../components/lawyer/LawyerTopbar';
import LawyerSidebar from '../components/lawyer/LawyerSidebar';
import Breadcrumb from '../components/common/Breadcrumb';

export default function LawyerLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <LawyerTopbar />
      <div style={{ display: 'flex' }}>
        <LawyerSidebar />
        <main style={{ flex: 1, minWidth: 0, padding: '28px 32px' }}>
          <Breadcrumb portal="lawyer" />
          {children}
        </main>
      </div>
    </div>
  );
}
