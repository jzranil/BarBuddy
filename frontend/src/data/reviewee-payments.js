// ---------------------------------------------------------------------------
// REVIEWEE PAYMENT HISTORY DATA
//
// Same pattern as src/data/superadmin.js's DUMMY_TRANSACTIONS /
// TRANSACTION_DETAILS: a small set of DUMMY rows so the Payment History
// table and details modal can be reviewed end-to-end before a real billing
// backend exists. Status values reuse the exact same vocabulary as the
// Superadmin Payment Logs (Success / Warning / Failed) so StatusPill needs
// no changes and the two pages read as the same system.
//
// BACKEND TODO: replace with GET /api/reviewee/payment-history, scoped
// server-side to the authenticated reviewee only.
// ---------------------------------------------------------------------------

export const REVIEWEE_TRANSACTIONS = [
  {
    id: 'TXN-2026-0031',
    dateLabel: 'Aug 28, 2026',
    package: 'Package 3: Day 3',
    amount: 449,
    method: 'GCash',
    status: 'Success',
  },
  {
    id: 'TXN-2026-0022',
    dateLabel: 'Aug 14, 2026',
    package: 'Package 2: Day 2',
    amount: 399,
    method: 'Credit / Debit Card',
    status: 'Success',
  },
  {
    id: 'TXN-2026-0015',
    dateLabel: 'Jul 30, 2026',
    package: 'Package 1: Day 1',
    amount: 229,
    method: 'GCash',
    status: 'Failed',
  },
  {
    id: 'TXN-2026-0009',
    dateLabel: 'Jul 16, 2026',
    package: 'Package 4: All Subjects',
    amount: 1209,
    method: 'Maya',
    status: 'Warning',
  },
];

// Full detail shown in the Payment Details modal — only what a reviewee
// should be able to see about their own transaction (no internal
// processing/admin notes). BACKEND TODO: GET /api/reviewee/payment-history/{id}
export const REVIEWEE_TRANSACTION_DETAILS = {
  'TXN-2026-0031': {
    statusLabel: 'Payment Successful',
    statusDetail: 'Authorized via GCash',
    paymentReference: 'GC-7731-9902-4415',
  },
  'TXN-2026-0022': {
    statusLabel: 'Payment Successful',
    statusDetail: 'Authorized via Visa •••• 4821',
    paymentReference: 'PI_3Q71K...55M',
  },
  'TXN-2026-0015': {
    statusLabel: 'Payment Failed',
    statusDetail: 'Declined by GCash — insufficient balance',
    paymentReference: 'GC-7729-1180-0093',
  },
  'TXN-2026-0009': {
    statusLabel: 'Payment Pending',
    statusDetail: 'Awaiting confirmation from Maya',
    paymentReference: 'MY-2201-8847-1120',
  },
};
