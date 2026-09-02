import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../Button';
import Modal from '../Modal';

// FRONTEND TODO: 2FA is not implemented on the backend yet — this only
// toggles local UI state so the flow can be reviewed. BACKEND TODO: wire to
// real TOTP/SMS enrollment once Cognito MFA is configured.
export default function TwoFactorCard() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: '15px', marginBottom: '6px' }}>Two-Factor Authentication</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '440px' }}>
            {enabled
              ? 'Your account is protected with two-factor authentication.'
              : 'Add an additional layer of security to your BarBuddy account.'}
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '999px',
            padding: '4px 12px',
            whiteSpace: 'nowrap',
            border: `1px solid ${enabled ? '#2e7d32' : 'var(--card-border)'}`,
            color: enabled ? '#2e7d32' : 'var(--text-muted)',
            background: enabled ? '#eaf5ec' : 'var(--bg)',
          }}
        >
          Status: {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
        {!enabled && (
          <Button
            variant="navy"
            onClick={() =>
              navigate('/coming-soon', {
                state: { title: 'Enable 2FA', description: 'TOTP / SMS enrollment connects here once Cognito MFA is configured.' },
              })
            }
          >
            Enable 2FA
          </Button>
        )}
        {enabled && (
          <>
            <Button
              variant="outline"
              onClick={() =>
                navigate('/coming-soon', {
                  state: { title: 'Manage 2FA', description: 'Managing backup codes and enrolled devices connects here once Cognito MFA is configured.' },
                })
              }
            >
              Manage 2FA
            </Button>
            <Button variant="outline" onClick={() => setConfirmDisable(true)}>
              Disable 2FA
            </Button>
          </>
        )}
      </div>

      <Modal open={confirmDisable} onClose={() => setConfirmDisable(false)} title="Disable Two-Factor Authentication" width="420px">
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: 0 }}>
          Are you sure you want to disable two-factor authentication? Your account will be less protected.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
          <Button variant="outline" onClick={() => setConfirmDisable(false)}>Cancel</Button>
          <Button
            variant="navy"
            onClick={() => {
              setEnabled(false);
              setConfirmDisable(false);
            }}
          >
            Disable
          </Button>
        </div>
      </Modal>
    </div>
  );
}

const cardStyle = {
  border: '1px solid var(--card-border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px',
};
