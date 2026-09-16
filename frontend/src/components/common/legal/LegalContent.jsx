import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ContentBlocks from '../help-center/ContentBlocks';
import { TERMS_OF_SERVICE, PRIVACY_POLICY, USER_ACKNOWLEDGMENT, LICENSES_CREDITS, LEGAL_NOTICE, FOOTER_TAGLINE, COPYRIGHT_LINE } from '../../../data/legal';

const JUMP_LINKS = [
  { id: TERMS_OF_SERVICE.id, label: 'Terms of Service', icon: 'gavel' },
  { id: PRIVACY_POLICY.id, label: 'Privacy Policy', icon: 'shield' },
  { id: LICENSES_CREDITS.id, label: 'Licenses & Credits', icon: 'copyright' },
  { id: LEGAL_NOTICE.id, label: 'Legal Notice', icon: 'info' },
];

// Single shared Legal & About page reused by all three portals. AboutSection
// links to `${legalPath}#terms-of-service`, `#privacy-policy`, and
// `#licenses-credits` — this component scrolls to whichever section the
// hash names, the same deep-linking pattern used by the Help Center page.
export default function LegalContent() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50);
    return () => clearTimeout(timer);
  }, [hash]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Legal & About</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px', maxWidth: '620px' }}>
        Information about BarBuddy's terms, privacy practices, and third-party resources.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '10px',
          marginBottom: '22px',
          borderBottom: '1px solid var(--card-border)',
        }}
      >
        {JUMP_LINKS.map((link) => (
          <button
            key={link.id}
            onClick={() => scrollTo(link.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--navy)',
              background: '#fff',
              border: '1px solid var(--card-border)',
              borderRadius: '999px',
              padding: '7px 14px',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--gold)' }}>{link.icon}</span>
            {link.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        <LegalDocument doc={TERMS_OF_SERVICE} />
        <LegalDocument doc={PRIVACY_POLICY} />
        <AcknowledgmentDocument doc={USER_ACKNOWLEDGMENT} />
        <LicensesDocument doc={LICENSES_CREDITS} />
        <NoticeDocument doc={LEGAL_NOTICE} />
      </div>

      <div style={{ textAlign: 'center', padding: '28px 0 8px' }}>
        <p style={{ fontFamily: 'Playfair Display, serif', fontSize: '14px', color: 'var(--navy)', margin: '0 0 4px' }}>{FOOTER_TAGLINE}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{COPYRIGHT_LINE}</p>
      </div>
    </>
  );
}

function DocHeader({ title, effectiveDate, lastUpdated }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
      <h2 style={{ fontSize: '19px', margin: 0 }}>{title}</h2>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {effectiveDate && <span>Effective Date: {effectiveDate}</span>}
        {lastUpdated && <span>Last Updated: {lastUpdated}</span>}
      </span>
    </div>
  );
}

function LegalDocument({ doc }) {
  return (
    <section id={doc.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '24px', scrollMarginTop: '85px' }}>
      <DocHeader title={doc.title} effectiveDate={doc.effectiveDate} lastUpdated={doc.lastUpdated} />
      <div style={{ marginBottom: '16px' }}>
        <ContentBlocks blocks={doc.intro} />
      </div>
      <div style={{ display: 'grid', gap: '18px' }}>
        {doc.sections.map((s) => (
          <div key={s.heading} style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--navy)', marginBottom: '8px' }}>{s.heading}</h3>
            <ContentBlocks blocks={s.blocks} />
          </div>
        ))}
      </div>
    </section>
  );
}

function AcknowledgmentDocument({ doc }) {
  return (
    <section id={doc.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '24px', scrollMarginTop: '85px' }}>
      <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>{doc.title}</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '14px' }}>{doc.intro}</p>
      <div style={{ display: 'grid', gap: '8px' }}>
        {doc.items.map((item) => (
          <div key={item} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--gold)', flexShrink: 0, marginTop: '1px' }}>check_circle</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LicensesDocument({ doc }) {
  return (
    <section id={doc.id} style={{ background: '#fff', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '24px', scrollMarginTop: '85px' }}>
      <DocHeader title={doc.title} />
      <div style={{ marginBottom: '16px' }}>
        <ContentBlocks blocks={doc.intro} />
      </div>
      <div style={{ display: 'grid', gap: '18px' }}>
        {doc.categories.map((c) => (
          <div key={c.heading} style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--navy)', marginBottom: '8px' }}>{c.heading}</h3>
            <ContentBlocks blocks={c.blocks} />
          </div>
        ))}
      </div>
    </section>
  );
}

function NoticeDocument({ doc }) {
  return (
    <section id={doc.id} style={{ background: 'var(--navy)', borderRadius: 'var(--radius-lg)', padding: '24px', scrollMarginTop: '85px' }}>
      <h2 style={{ fontSize: '16px', color: 'var(--bg)', margin: '0 0 10px' }}>{doc.title}</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {doc.blocks.map((b, i) =>
          b.type === 'p' ? (
            <p key={i} style={{ fontSize: '13px', color: 'var(--gold-soft)', lineHeight: 1.65, margin: 0 }}>{b.text}</p>
          ) : (
            <ul key={i} style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '4px' }}>
              {b.items.map((item) => (
                <li key={item} style={{ fontSize: '13px', color: 'var(--gold-soft)', lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
          )
        )}
      </div>
    </section>
  );
}
