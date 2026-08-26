import LawyerTopbar from '../components/lawyer/LawyerTopbar';
import LawyerSidebar from '../components/lawyer/LawyerSidebar';

export default function LawyerLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <LawyerTopbar />
      <div style={{ display: 'flex' }}>
        <LawyerSidebar />
        <main style={{ flex: 1, padding: '28px 32px' }}>{children}</main>
      </div>
    </div>
  );
}
