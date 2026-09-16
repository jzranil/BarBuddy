import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';
import PricingCard from '../components/PricingCard';
import FaqItem from '../components/FaqItem';
import { PRICING } from '../data/pricing';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQs', href: '#faqs' },
  { label: 'Contact Us', href: '#contact' },
];

// Map permission IDs to their specific dashboard routes
const ROLE_ROUTES = {
  '5bac543c-5f03-436a-85a8-2c8fc3c6b0e3': '/superadmin', // Super Admin
  '6642db37-fe3f-4c6f-8b82-427b381a9c69': '/lawyer',     // Lawyer
  'a11498ab-0a57-4ed2-9315-29167e6a2f63': '/dashboard',  // Reviewee
};

const FEATURES = [
  {
    icon: 'target',
    title: 'AI Assessment',
    description:
      'Instant scoring and detailed logic breakdown for every mock answer based on the latest Supreme Court jurisprudence.',
  },
  {
    icon: 'trending_up',
    title: 'Adaptive Learning',
    description:
      "Our algorithms identify your knowledge gaps and automatically adjust your study schedule to focus on high-yield subjects.",
  },
  {
    icon: 'verified',
    title: 'Lawyer Verification',
    description:
      'Get your complex legal essays reviewed by veteran practitioners who provide human nuance to your AI-scored performance.',
  },
];

const TESTIMONIALS = [
  {
    quote:
    'Answering bar questions every day gave me consistent practice and helped turn legal knowledge into actual bar-ready answers. It trained me to organize my thoughts with clarity and precision, even under time pressure. Over time, I noticed my issue- spotting and legal reasoning became much sharper. More importantly, the daily habit built real confidence in my answer-writing. By the time review season intensified, writing answers already felt second nature.',
    name: 'Atty. Sheridan Lance Carabio',
    role: 'University of the Philippines College of Law - 2024 Bar Passer',
  },
  {
    quote:
      "Answering bar questions consistently became one of the biggest factors that helped me pass the Bar. Reading concepts is important, but actually answering questions trained me to think like the examiner, apply the law under pressure, and spot issues faster. It exposed the topics I thought I understood but actually needed more work on. Over time, it improved not just my legal knowledge, but also my confidence, discipline, and time management. By exam day, answering felt familiar instead of overwhelming. Practice didn't just prepare me, it made the difference between studying the law and knowing how to use it.",
    name: 'Atty. John Samarita',
    role: 'University of the Philippines College of Law - 2025 Bar Passer',
  },
  {
    quote:
    'Practicing bar questions daily helped me develop strong discipline in my review routine. It pushed me to think like an examiner and focus on what truly matters in every answer. With each question, I became more comfortable writing concise yet well- supported answers. The constant practice exposed gaps in my knowledge and allowed steady improvement every day. Looking back, this habit became one of my best investments for bar preparation.',
    name: 'Atty. Winona Alexandra Castelo',
    role: 'University of the Philippines College of Law - 2025 Bar Passer',
  },
];

const FAQS = [
  {
    question: 'How accurate is the AI feedback?',
    answer:
      'Our AI is trained specifically on Philippine Supreme Court decisions, bar exam patterns, and canonical legal texts. While it does not replace human legal advice, it maintains a 95% alignment rate with professional lawyer grading rubrics.',
  },
  {
    question: 'Can I use BarBuddy for Law School exams?',
    answer:
      'Yes. Many law students use BarBuddy to practice essay structuring and legal reasoning ahead of midterms and finals, not just the bar exam.',
  },
  {
    question: 'Is my data secure and private?',
    answer:
      'All submissions are encrypted in transit and at rest, and handled in accordance with the Data Privacy Act of 2012 (RA 10173).',
  },
  {
    question: 'Does the Pro plan include the physical Codals?',
    answer:
      'No. All plans are digital-only and include access to our continuously updated 2024 jurisprudence database.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  // Automatically redirect if an active session exists
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const { pid } = JSON.parse(storedUser);
        const redirectPath = ROLE_ROUTES[pid] || '/dashboard';
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('Failed to parse active user session:', err);
      }
    }
  }, [navigate]);

  return (
    <div>
      <Navbar links={NAV_LINKS} />

      {/* HERO */}
      <section style={{ background: 'var(--bg)', padding: '72px 0 48px', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <span className="eyebrow">Your Trusted Bar Exam Companion</span>
          <h1 style={{ fontSize: '44px', lineHeight: 1.15, margin: '20px 0' }}>
            Master the Philippine Bar with{' '}
            <span style={{ color: 'var(--gold)' }}>BarBuddy</span> !
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '28px' }}>
            Elevate your bar review with personalized competency assessments, adaptive study
            roadmaps, and real-time feedback from our specialized AI.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '48px' }}>
            <Button variant="gold" onClick={() => navigate('/signup')}>
              Get Started Free
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              View Packages
            </Button>
          </div>
        </div>

        <div
          className="container"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            maxWidth: '820px',
          }}
        >
          {[
            ['92%', 'Pass Rate Estimate'],
            ['15k+', 'Cases Analyzed'],
            ['24/7', 'AI Mentorship'],
            ['500+', 'Lawyer Reviews'],
          ].map(([num, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: 700 }}>
                {num}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '64px 0', background: '#fff' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
          <h2 style={{ fontSize: '28px', marginBottom: '12px' }}>Precision-Engineered for Excellence</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            We combine the rigorous logic of legal practice with modern data science to give you
            a decisive edge in the Philippine Bar Examinations.
          </p>
        </div>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* PERSONALIZED PATH */}
      <section id="how-it-works" style={{ padding: '64px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div
            style={{
              background: 'var(--navy)',
              borderRadius: 'var(--radius-lg)',
              height: '320px',
            }}
          />
          <div>
            <h2 style={{ fontSize: '26px', marginBottom: '22px' }}>Your Personalized Path to the Bar</h2>
            {[
              ['1', 'Diagnose Your Level', 'Take our baseline mock exam to benchmark your current competency across all eight subjects.'],
              ['2', 'Follow the AI Roadmap', 'BarBuddy generates a custom study sequence focusing on your weakest areas first.'],
              ['3', 'Verify with Professionals', 'Submit your best essays for peer review and professional lawyer feedback to polish your writing.'],
            ].map(([num, title, desc]) => (
              <div key={num} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--navy)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {num}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>{desc}</p>
                </div>
              </div>
            ))}
            <Button variant="navy" onClick={() => navigate('/signup')}>
              Start Your Journey
            </Button>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '64px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h2 style={{ fontSize: '24px', marginBottom: '6px' }}>Success Stories</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                Join the thousands of candidates who passed with BarBuddy.
              </p>
            </div>
            <span style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 600 }}>
              ★ 4.9/5 Rating by Bar Candidates
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} {...t} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '36px' }}>
            <Button variant="navy" onClick={() => navigate('/signup')}>
              Create Account →
            </Button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '64px 0' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px' }}>
          <h2 style={{ fontSize: '26px', marginBottom: '10px' }}>Transparent Pricing</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Choose the plan that fits your study pace. All plans include access to our 2024
            jurisprudence database.
          </p>
        </div>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '20px' }}>
          {PRICING.map((p) => (
            <PricingCard key={p.name} {...p} onSubscribe={() => navigate('/signup')} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" style={{ padding: '64px 0', background: '#fff' }}>
        <div className="container" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
          <span className="eyebrow">Have Questions?</span>
          <h2 style={{ fontSize: '26px', margin: '16px 0 30px' }}>Frequently Asked Questions</h2>
        </div>
        <div className="container" style={{ maxWidth: '700px', margin: '0 auto' }}>
          {FAQS.map((f) => (
            <FaqItem key={f.question} {...f} />
          ))}
          <div
            style={{
              background: 'var(--navy)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'center',
              marginTop: '30px',
            }}
          >
            <h3 style={{ color: '#fff', fontSize: '17px', marginBottom: '6px' }}>Still have questions?</h3>
            <p style={{ color: '#cfd3dc', fontSize: '13px', marginBottom: '16px' }}>
              Our support team of legal researchers is ready to help you.
            </p>
            <Button variant="gold" onClick={() => navigate('/#contact')}>
              Contact Support Team
            </Button>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="contact" style={{ background: 'var(--navy)', padding: '56px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ color: '#fff', fontSize: '26px', marginBottom: '12px' }}>
            Ready to become a Member of the Bar?
          </h2>
          <p style={{ color: '#cfd3dc', fontSize: '14px', marginBottom: '24px' }}>
            Join thousands of future lawyers who are already using BarBuddy to study smarter, not
            harder.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <Button variant="gold" onClick={() => navigate('/signup')}>
              Create Your Account
            </Button>
            <Button variant="outline-light" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
              View Pricing
            </Button>
          </div>
        </div>
      </section>

      <Footer variant="full" />
    </div>
  );
}