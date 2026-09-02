import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsSectionCard from './SettingsSectionCard';
import ContactSupportModal from './ContactSupportModal';
import ReportProblemModal from './ReportProblemModal';
import FaqItem from '../../FaqItem';
import Button from '../../Button';

// Generic Help & Support section, reused by all three portals.
// - `faqCategories`, `contactCategories`, `reportCategories` are role-specific content.
// - `extraOptions` lets a role insert additional support cards (e.g. the
//   Lawyer's "Verification Guidelines" or the Super Admin's "Admin
//   Documentation") right after Help Center, without duplicating this file.
export default function HelpSupportSection({ faqCategories, contactCategories, reportCategories, extraOptions = [] }) {
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <SettingsSectionCard
      id="help-support"
      icon="support_agent"
      title="Help & Support"
      description="Get assistance and report issues."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '28px' }}>
        <SupportOption
          icon="menu_book"
          title="Help Center"
          description="Find guides and information about using BarBuddy."
          actionLabel="Visit Help Center"
          onClick={() =>
            navigate('/coming-soon', { state: { title: 'Help Center', description: 'Guides and how-to articles will live here.' } })
          }
        />
        {extraOptions.map((opt) => (
          <SupportOption key={opt.title} {...opt} />
        ))}
        <SupportOption
          icon="mail"
          title="Contact Support"
          description="Send the BarBuddy team a message about anything account-related."
          actionLabel="Contact Support"
          onClick={() => setContactOpen(true)}
        />
        <SupportOption
          icon="flag"
          title="Report a Problem"
          description="Flag a bug or system issue you've run into."
          actionLabel="Report a Problem"
          onClick={() => setReportOpen(true)}
        />
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
        Frequently Asked Questions
      </div>

      {faqCategories.map((cat) => (
        <div key={cat.category} style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--navy)', marginBottom: '2px' }}>{cat.category}</div>
          <div>
            {cat.questions.map((item) => (
              <FaqItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      ))}

      <ContactSupportModal open={contactOpen} onClose={() => setContactOpen(false)} categories={contactCategories} />
      <ReportProblemModal open={reportOpen} onClose={() => setReportOpen(false)} categories={reportCategories} />
    </SettingsSectionCard>
  );
}

function SupportOption({ icon, title, description, actionLabel, onClick }) {
  return (
    <div style={{ border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <span className="material-symbols-outlined" style={{ color: 'var(--gold)', fontSize: '22px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
      </div>
      <Button variant="outline" onClick={onClick}>{actionLabel}</Button>
    </div>
  );
}
