import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import ContentBlocks from '../components/common/help-center/ContentBlocks';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../data/legal';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQs', href: '/#faqs' },
];

// Shown after Signup's "Create Account" button, before the new account can
// reach the dashboard. Reuses the exact Terms and Conditions / Privacy
// Policy content from data/legal.js (sourced from
// BarBuddy_Terms_and_Conditions_and_Privacy_Policy.docx) — same content the
// Settings > About page links to, just presented here as a scrollable,
// must-read step in the signup flow.
export default function TermsAcceptancePage() {
  const navigate = useNavigate();
  const [readTerms, setReadTerms] = useState(false);
  const [readPolicy, setReadPolicy] = useState(false);

  const canProceed = readTerms && readPolicy;

  const handleAccept = () => {
    if (!canProceed) return;
    // BACKEND TODO: POST /api/auth/accept-terms (record acceptance + a
    // timestamp against the new account) before granting dashboard access.
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar links={NAV_LINKS} />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>
              <div
                style={{
                  background: '#fff',
                border: '1px solid var(--card-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '32px',
                boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        border: '1.5px solid var(--navy)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Playfair Display, serif',
                        fontWeight: 700,
                        color: 'var(--navy)',
                      }}
                    >
                      B
                    </span>
                    <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '19px' }}>
                      BarBuddy
                    </span>
                  </div>
                  <h1 style={{ fontSize: '22px', marginBottom: '6px' }}>Terms &amp; Conditions</h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Please review and accept the following before continuing to your dashboard.
                  </p>
                </div>

                {/* Scrollable Terms of Service + Privacy Policy content */}
                <div
                  style={{
                    maxHeight: '340px',
                    overflowY: 'auto',
                    border: '1px solid var(--card-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                    marginBottom: '20px',
                    background: 'var(--bg)',
                  }}
                >
                  <LegalExcerpt doc={TERMS_OF_SERVICE} />
                  <div style={{ borderTop: '1px solid var(--card-border)', margin: '20px 0' }} />
                  <LegalExcerpt doc={PRIVACY_POLICY} />
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--navy)', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    required
                    checked={readTerms}
                    onChange={(e) => setReadTerms(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I have read the <strong>Terms and Conditions</strong>. <span style={{ color: 'var(--gold)' }}>*</span>
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: 'var(--navy)', marginBottom: '20px' }}>
                  <input
                    type="checkbox"
                    required
                    checked={readPolicy}
                    onChange={(e) => setReadPolicy(e.target.checked)}
                    style={{ marginTop: '2px' }}
                  />
                  <span>
                    I have read the <strong>Privacy Policy</strong>. <span style={{ color: 'var(--gold)' }}>*</span>
                  </span>
                </label>

                <Button variant="navy" fullWidth icon="arrow_forward" disabled={!canProceed} onClick={handleAccept}>
                  I Accept the Terms &amp; Conditions
                </Button>
                
                {/* <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                  <input type="checkbox" name="subscribeUpdates" checked={form.subscribeUpdates} onChange={handleChange} style={{ marginTop: '2px' }} />
                  Send me exam updates, legal news, and platform announcements.
                </label> */}

                {!canProceed && (
                  <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', marginBottom: 0 }}>
                    Both required boxes must be checked before you can continue.
                  </p>
                )}
              </div>
            </div>
      </main>

      <Footer variant="minimal" />
    </div>
  );
}

// Compact, read-only rendering of a legal document inside the scroll box —
// same section structure as the full Legal page, just without the jump-nav
// chrome that page needs.
function LegalExcerpt({ doc }) {
  return (
    <div>
      <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>{doc.title}</h3>
      {(doc.effectiveDate || doc.lastUpdated) && (
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
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
            <h4 style={{ fontSize: '13px', color: 'var(--navy)', marginBottom: '6px' }}>{s.heading}</h4>
            <ContentBlocks blocks={s.blocks} />
          </div>
        ))}
      </div>
    </div>
  );
}
