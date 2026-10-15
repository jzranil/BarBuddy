import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContentBlocks from '../components/common/help-center/ContentBlocks';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../data/legal';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQs', href: '/#faqs' },
];

// Public /terms and /privacy pages (footer links), same text as data/legal.js
export default function PublicLegalDocPage({ kind = 'terms' }) {
  const doc = kind === 'privacy' ? PRIVACY_POLICY : TERMS_OF_SERVICE;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <Navbar links={NAV_LINKS} />
      <main className="page-transition" style={{ flex: 1, width: '100%', maxWidth: '860px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>{doc.title}</h1>
          {(doc.effectiveDate || doc.lastUpdated) && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              {doc.effectiveDate && `Effective Date: ${doc.effectiveDate}`}
              {doc.effectiveDate && doc.lastUpdated && ' · '}
              {doc.lastUpdated && `Last Updated: ${doc.lastUpdated}`}
            </p>
          )}
          <div style={{ marginBottom: '18px' }}>
            <ContentBlocks blocks={doc.intro} />
          </div>
          <div style={{ display: 'grid', gap: '18px' }}>
            {doc.sections.map((s) => (
              <section key={s.heading}>
                <h2 style={{ fontSize: '17px', marginBottom: '8px' }}>{s.heading}</h2>
                <ContentBlocks blocks={s.blocks} />
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
