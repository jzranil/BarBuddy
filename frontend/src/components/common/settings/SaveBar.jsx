import Button from '../../Button';

// Reused at the bottom of any settings section that has its own
// Save Changes action (Account & Profile, Notifications). Shows a clear
// "unsaved changes" indicator, then a transient "Saved" confirmation.
export default function SaveBar({ dirty, saved, onSave, saveLabel = 'Save Changes' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '20px',
        paddingTop: '18px',
        borderTop: '1px solid var(--card-border)',
      }}
    >
      {dirty && !saved && (
        <span style={{ fontSize: '12px', color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'var(--gold)' }}>fiber_manual_record</span>
          You have unsaved changes
        </span>
      )}
      {saved && (
        <span style={{ fontSize: '12px', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check_circle</span>
          Saved
        </span>
      )}
      <Button variant="navy" onClick={onSave} disabled={!dirty}>
        {saveLabel}
      </Button>
    </div>
  );
}
