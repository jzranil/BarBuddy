import Modal from '../Modal';
import ContentBlocks from '../help-center/ContentBlocks';

// Shows a full legal document (data/legal.js shape) in a scrollable modal,
// e.g. from the "Terms of Service" / "Privacy Policy" links on Sign Up.
export default function LegalDocModal({ doc, onClose }) {
  if (!doc) return null;
  return (
    <Modal open onClose={onClose} title={doc.title} width="720px">
      <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '6px' }}>
        {(doc.effectiveDate || doc.lastUpdated) && (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 0, marginBottom: '12px' }}>
            {doc.effectiveDate && `Effective Date: ${doc.effectiveDate}`}
            {doc.effectiveDate && doc.lastUpdated && ' · '}
            {doc.lastUpdated && `Last Updated: ${doc.lastUpdated}`}
          </p>
        )}
        <div style={{ marginBottom: '14px' }}>
          <ContentBlocks blocks={doc.intro} />
        </div>
        <div style={{ display: 'grid', gap: '14px' }}>
          {doc.sections.map((s) => (
            <div key={s.heading}>
              <h4 style={{ fontSize: '14px', color: 'var(--navy)', marginBottom: '6px' }}>{s.heading}</h4>
              <ContentBlocks blocks={s.blocks} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'var(--navy-fill)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
