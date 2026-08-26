import { useLocation, useNavigate } from 'react-router-dom';
import PortalLayout from '../../layouts/PortalLayout';
import Button from '../../components/Button';

// Reached whenever a button doesn't have a real destination page yet.
// Pass context via navigate('/coming-soon', { state: { title, description } }).
export default function ComingSoonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { title = 'Coming Soon', description = 'This part of BarBuddy is still being built.' } =
    location.state || {};

  return (
    <PortalLayout>
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '14px',
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--gold)' }}>
          construction
        </span>
        <h1 style={{ fontSize: '24px' }}>{title}</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '14px' }}>{description}</p>
        <Button variant="navy" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </PortalLayout>
  );
}
