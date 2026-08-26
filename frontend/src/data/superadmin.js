// ---------------------------------------------------------------------------
// SUPER ADMIN PORTAL DATA
//
// Same split as the rest of the app: platform-wide aggregate numbers are
// zeroed (nobody's using the platform yet), while the tables/lists ship
// with a small set of DUMMY rows so the layouts can be reviewed end-to-end.
// BACKEND TODO markers show exactly what each piece should become.
// ---------------------------------------------------------------------------

// GET /api/admin/profile — used by the topbar's account menu.
// BACKEND TODO: pull from Cognito super-admin profile.
export function getZeroedAdminProfile() {
  return {
    name: 'Super Admin',
    email: 'admin@barbuddy.ai',
  };
}

// GET /api/admin/dashboard-summary
export function getZeroedDashboardSummary() {
  return {
    totalReviewees: 0,
    totalRevieweesTrendLabel: 'No data yet',
    monthlyRevenue: 0,
    monthlyRevenueTrendLabel: 'No data yet',
    aiApiUsage: 0,
    aiApiUsageTrendLabel: 'No data yet',
    systemHealth: 0,
    systemHealthLabel: '—',
  };
}

// GET /api/admin/revenue-vs-ai-ops — zeroed monthly series until real
// billing + token-usage data exists.
export const REVENUE_VS_AI_OPS = [
  { month: 'Jan', revenue: 0, aiCost: 0 },
  { month: 'Feb', revenue: 0, aiCost: 0 },
  { month: 'Mar', revenue: 0, aiCost: 0 },
  { month: 'Apr', revenue: 0, aiCost: 0 },
  { month: 'May', revenue: 0, aiCost: 0 },
  { month: 'Jun', revenue: 0, aiCost: 0 },
];

// GET /api/admin/infrastructure-pulse — these are live infra metrics, not
// reviewee data, so they'd normally come from a monitoring service (e.g.
// CloudWatch) rather than the app database. Zeroed here since nothing is
// deployed yet.
export function getZeroedInfrastructurePulse() {
  return {
    aiInferenceLatencyLabel: '—',
    aiInferenceLoadPercent: 0,
    dbIoLoadPercent: 0,
    dbIoLabel: '—',
    serverCpuPercent: 0,
    region: 'ap-southeast-1', // static — this is a config value, not usage data
    dbStatus: '—',
  };
}

// AI Model Orchestration — these are configuration defaults, not aggregate
// data, so sensible non-zero defaults are fine here.
// BACKEND TODO: GET/PATCH /api/admin/ai-config
export function getDefaultAiConfig() {
  return {
    availableModels: ['Gemini Flash 3.5'],
    selectedModel: 'Gemini Flash 3.5',
    temperature: 0.7,
    strictAlacEnforcement: true,
    version: 'v4.2-stable',
  };
}

// ---------------------------------------------------------------------------
// DUMMY system audit logs — used for both the Dashboard preview (first 5)
// and the full System Log Auditing page.
//
// NOTE: role assignments below are copied verbatim from the mockup (some
// look mismatched, e.g. system_cron -> Lawyer) — this is placeholder/demo
// content, not meaningful business logic.
//
// BACKEND TODO: replace with GET /api/admin/system-logs
// ---------------------------------------------------------------------------
export const TOTAL_SYSTEM_LOGS = 14208;

export const DUMMY_SYSTEM_LOGS = [
  { id: 'LOG-8842', description: 'User attempted to bypass ALAC structure validation on Syllabus ID: 492.', performedBy: 'admin_miguel', role: 'Super Admin', timestamp: '2024-05-24 14:22:15' },
  { id: 'LOG-8841', description: 'Revoked production key ending in ...4X9A due to inactivity.', performedBy: 'system_cron', role: 'Lawyer', timestamp: '2024-05-24 14:00:01' },
  { id: 'LOG-8840', description: 'Subscription ID: 1042 failed 3rd retry attempt. Account downgraded.', performedBy: 'lawyer_cruz', role: 'Reviewee', timestamp: '2024-05-24 13:45:10' },
  { id: 'LOG-8839', description: 'Revoked production key ending in ...4X9A due to inactivity.', performedBy: 'sec_manager_val', role: 'Super Admin', timestamp: '2024-05-24 12:15:33' },
  { id: 'LOG-8838', description: 'Subscription ID: 1042 failed 3rd retry attempt. Account downgraded.', performedBy: 'billing_bot', role: 'Lawyer', timestamp: '2024-05-24 11:55:00' },
  { id: 'LOG-8837', description: 'Scheduled downtime for regional server upgrades on ap-southeast-1.', performedBy: 'ops_team_alpha', role: 'Reviewee', timestamp: '2024-05-24 10:30:00' },
  { id: 'LOG-8836', description: 'Promoted user ID: 5521 from Junior Counsel to Senior Auditor.', performedBy: 'admin_miguel', role: 'Reviewee', timestamp: '2024-05-24 09:12:45' },
];

// GET /api/admin/system-logs-summary
export function getZeroedSystemLogsSummary() {
  return {
    totalEvents24h: 0,
    systemFailures: 0,
    successRate: 0,
    activeAdminSessions: 0,
  };
}

// ---------------------------------------------------------------------------
// DUMMY users for the Platform Access Control List. Only 3 roles exist:
// Super Admin, Lawyer, Reviewee.
// BACKEND TODO: replace with GET /api/admin/users
// ---------------------------------------------------------------------------
export const DUMMY_USERS = [
  { id: 'USR-8291', name: 'Marcus Aurelius', email: 'm.aurelius@gmail.com', role: 'Super Admin', joinedDate: 'March 24, 2023', lastActivity: '2 mins ago', status: 'Active' },
  { id: 'USR-7402', name: 'Elena Rodriguez', email: 'elenrodri@gmail.com', role: 'Lawyer', joinedDate: 'January 24, 2025', lastActivity: '45 mins ago', status: 'Pending' },
  { id: 'USR-3921', name: 'David Chen', email: 'david.chen@gmail.com', role: 'Reviewee', joinedDate: 'January 24, 2022', lastActivity: '1 hour ago', status: 'Inactive' },
  { id: 'USR-1104', name: 'Sarah Jenkins', email: 's.jenkins@gmail.com', role: 'Super Admin', joinedDate: 'March 24, 2023', lastActivity: '3 days ago', status: 'Inactive' },
  { id: 'USR-5582', name: 'Robert Thorne', email: 'r.thorne@gmail.com', role: 'Lawyer', joinedDate: 'January 24, 2025', lastActivity: '12 mins ago', status: 'Active' },
  { id: 'USR-9921', name: 'Juliana Smith', email: 'j.smith@gmail.com', role: 'Reviewee', joinedDate: 'January 24, 2022', lastActivity: '1 month ago', status: 'Suspended' },
];

// Only 3 roles exist platform-wide.
export const AVAILABLE_ROLES = ['Super Admin', 'Lawyer', 'Reviewee'];

export const TOTAL_USERS = 1284; // matches "Showing 6 of 1,284 users" footer

// GET /api/admin/user-control-summary
export function getZeroedUserControlSummary() {
  return {
    totalUsers: 0,
    adminsCount: 0,
    lockedAccounts: 0,
    avgSessionLabel: '—',
  };
}

// ---------------------------------------------------------------------------
// DUMMY payment/transaction data for the Payment Management page.
// BACKEND TODO: replace with GET /api/admin/transactions (PayMongo webhook
// events synced into your own ledger table).
// ---------------------------------------------------------------------------
export const TOTAL_TRANSACTIONS = 9025; // arbitrary — matches the highest dummy TXN id

export const DUMMY_TRANSACTIONS = [
  { id: 'TXN-9021', customer: 'atty_miguel@barbuddy.com', plan: 'Package 1', amount: 124820, status: 'Success' },
  { id: 'TXN-9022', customer: 'legal_team_x@corp.ph', plan: 'Package 2', amount: 25000, status: 'Success' },
  { id: 'TXN-9023', customer: 'bar_prep_99@gmail.com', plan: 'Package 3', amount: 5800, status: 'Warning' },
  { id: 'TXN-9024', customer: 'law_firm_global@hq.com', plan: 'Package 4', amount: 850000, status: 'Success' },
  { id: 'TXN-9025', customer: 'indiv_user_22@up.edu.ph', plan: 'Package 5', amount: 1200, status: 'Failed' },
];

// Full detail for the right-hand "Transaction Record" panel — only TXN-9021
// has complete demo content; every other transaction shows a lightweight
// placeholder instead of fabricated payment data.
// BACKEND TODO: replace with GET /api/admin/transactions/{id}
export const TRANSACTION_DETAILS = {
  'TXN-9021': {
    dateLabel: 'Oct 24, 2024 • 14:22',
    statusLabel: 'Payment Success',
    statusDetail: 'Authorized via Visa •••• 4242',
    customer: 'atty_miguel',
    planType: 'Enterprise Annual',
    invoiceNo: 'INV-2024-001',
    paymentId: 'PI_3P92J...82K',
  },
};

// GET /api/admin/payment-summary
export function getZeroedPaymentSummary() {
  return {
    totalRevenueMtd: 0,
    revenueTrendLabel: 'No data yet',
    pendingInvoicesCount: 0,
    pendingInvoicesValueLabel: '—',
    failedTransactions: 0,
    failedTransactionsTrendLabel: 'No data yet',
    activeSubscriptions: 0,
    activeSubscriptionsTrendLabel: 'No data yet',
  };
}
