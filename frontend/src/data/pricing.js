// Shared subscription package catalog. Used by:
//   - src/pages/LandingPage.jsx (public pricing section)
//   - src/pages/portal/SubscriptionPage.jsx (reviewee upgrade options)
//
// BACKEND TODO: this can likely stay static (pricing doesn't usually need a
// database), but if plans/prices are meant to change without a redeploy,
// swap this for GET /api/billing/packages and keep the same field names —
// PricingCard.jsx already expects exactly this shape.
export const PRICING = [
  {
    id: 'package-1',
    name: 'Package 1: Day 1',
    icon: 'menu_book',
    subtitle: 'Political Law, Commercial Law, Taxation Law',
    questionsNote: '3 daily questions per subject',
    tiers: [
      { days: 65, price: '₱1,099', note: 'Approx ₱16.91/day' },
      { days: 45, price: '₱899', note: 'Approx ₱19.98/day' },
      { days: 14, price: '₱399', note: 'Approx ₱28.50/day' },
      { days: 7, price: '₱229', note: 'Approx ₱32.71/day' },
    ],
  },
  {
    id: 'package-2',
    name: 'Package 2: Day 2',
    icon: 'balance',
    subtitle: 'Civil Law, Labor Law',
    questionsNote: '3 daily questions per subject',
    tiers: [
      { days: 65, price: '₱1,099', note: 'Approx ₱16.91/day' },
      { days: 45, price: '₱899', note: 'Approx ₱19.98/day' },
      { days: 14, price: '₱399', note: 'Approx ₱28.50/day' },
      { days: 7, price: '₱229', note: 'Approx ₱32.71/day' },
    ],
  },
  {
    id: 'package-3',
    name: 'Package 3: Day 3',
    icon: 'gavel',
    subtitle: 'Criminal Law, Remedial Law, Legal Ethics',
    questionsNote: '3 daily questions per subject',
    tiers: [
      { days: 65, price: '₱1,099', note: 'Approx ₱16.91/day' },
      { days: 45, price: '₱899', note: 'Approx ₱19.98/day' },
      { days: 14, price: '₱399', note: 'Approx ₱28.50/day' },
      { days: 1, price: '₱229', note: '₱229.00/day' },
    ],
  },
  {
    id: 'package-4',
    name: 'Package 4: All Subjects',
    icon: 'star',
    subtitle: 'All Bar Subjects Included',
    questionsNote: 'Rotation rule: 1 question each from Day 1–Day 2 for continuous cross-disciplinary review',
    featured: true,
    tiers: [
      { days: 65, price: '₱1,449', note: 'Approx ₱22.29/day' },
      { days: 45, price: '₱1,209', note: 'Approx ₱26.87/day' },
      { days: 14, price: '₱449', note: 'Approx ₱32.07/day' },
      { days: 7, price: '₱299', note: 'Approx ₱42.71/day' },
    ],
  },
];

// The "Basic / Free Trial" tier shown below the paid packages — not part of
// the PRICING array above since it isn't a purchasable package with tiers.
export const FREE_TRIAL = {
  name: 'Free Trial',
  tagline: 'Perfect for casual study and initial assessment.',
  features: [
    '1 Full Diagnostic Exam',
    'Daily AI Jurisprudence Snippets',
    'Performance Dashboard',
    'Limited AI Feedback (5/mo)',
  ],
};

// ---------------------------------------------------------------------------
// Current reviewee subscription — zeroed to "on the free trial, nothing
// purchased yet" until billing is wired up.
//
// BACKEND TODO: replace with GET /api/billing/subscription. Once someone
// has an active paid plan, `isPremium` becomes true and the fields below
// (packageName, daysRemaining, daysTotal, nextBillingLabel) get populated —
// SubscriptionPage.jsx already branches on `isPremium` to show either state.
// ---------------------------------------------------------------------------
export function getZeroedSubscriptionSummary() {
  return {
    isPremium: false,
    planTag: 'Free Trial',
    packageName: 'Free Trial',
    packageDescription: 'Perfect for casual study and initial assessment.',
    daysRemaining: 0,
    daysTotal: 0,
    nextBillingLabel: '—',
  };
}
