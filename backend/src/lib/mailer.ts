import nodemailer, { type Transporter } from 'nodemailer';

// Outgoing BarBuddy mail (daily review questions). SMTP settings come from
// backend/.env — the password is never stored in the repository:
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587
//   SMTP_USER=noreply.barbuddysystem.ph@gmail.com  SMTP_PASS=<Gmail app password>
//   MAIL_FROM="BarBuddy <noreply.barbuddysystem.ph@gmail.com>"
//   APP_URL=http://localhost:5173   (link target for "Start Answering")

const LOGO_URL = 'https://cjpdbuitmrqamrfhhbki.supabase.co/storage/v1/object/public/brand/barbuddy-logo-email.png';

// Links in emails use APP_URL, else the first FRONTEND_ORIGIN address
export const appUrl = () =>
  (process.env.APP_URL || (process.env.FRONTEND_ORIGIN || '').split(',')[0].trim() || 'http://localhost:5173').replace(/\/+$/, '');

export const mailConfigured = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

let transport: Transporter | null = null;

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

export function dailyQuestionsEmail(input: { name: string; packages: string; questionCount: number; link: string }) {
  const name = escapeHtml(input.name || 'Reviewee');
  const packages = escapeHtml(input.packages);
  const link = escapeHtml(input.link);
  const plural = input.questionCount === 1 ? 'question' : 'questions';

  const html = `
<div style="background:#f0ece4;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f1f3c;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5dfd3;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:3px solid #c9a84c;">
      <img src="${LOGO_URL}" width="180" alt="BarBuddy" style="display:block;width:180px;max-width:100%;height:auto;border:0;margin:0 0 12px;">
      <div style="font-size:18px;font-weight:bold;color:#0f1f3c;">BarBuddy Review Partner</div>
      <div style="font-size:12px;color:#6b7280;letter-spacing:0.4px;">Philippine Bar Examination Preparation</div>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold;">Hello, ${name}</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#374151;">
        Your daily review questions are ready. Consistent practice is the foundation of bar exam success&mdash;answer today's set to keep your momentum going.
      </p>
      <p style="margin:0 0 6px;font-size:14px;color:#374151;">Included package/s: <strong style="color:#0f1f3c;">${packages}</strong></p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;">You have <strong style="color:#0f1f3c;">${input.questionCount} ${plural}</strong> to answer in today's session.</p>
      <a href="${link}" style="display:inline-block;background:#0f1f3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">Start Answering &rarr;</a>
      <div style="margin:28px 0 0;border:1.5px solid #c9a84c;background:#fbf7ec;border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.6;color:#374151;">
        <strong style="color:#0f1f3c;">Reminder:</strong> Write your answer first before clicking the link to view the suggested answers and AI feedback. These will only appear after you submit. Avoid relying entirely on AI, and be sure to verify the information yourself.
      </div>
    </div>
  </div>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;color:#6b7280;">
    BarBuddy &middot; Your study partner for the Philippine Bar<br>
    You receive this email because you have an active BarBuddy review package.
  </p>
</div>`;

  const text = [
    'BarBuddy Review Partner — Philippine Bar Examination Preparation',
    '',
    `Hello, ${input.name || 'Reviewee'}`,
    "Your daily review questions are ready. Consistent practice is the foundation of bar exam success—answer today's set to keep your momentum going.",
    '',
    `Included package/s: ${input.packages}`,
    `You have ${input.questionCount} ${plural} to answer in today's session.`,
    '',
    `Start Answering: ${input.link}`,
    '',
    'Reminder: Write your answer first before clicking the link to view the suggested answers and AI feedback. These will only appear after you submit. Avoid relying entirely on AI, and be sure to verify the information yourself.',
  ].join('\n');

  return { subject: "Your BarBuddy daily review questions are ready", html, text };
}

export function invitationEmail(input: { name: string; role: string; link: string }) {
  const name = escapeHtml(input.name || 'there');
  const role = escapeHtml(input.role);
  const link = escapeHtml(input.link);

  const html = `
<div style="background:#f0ece4;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f1f3c;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5dfd3;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:3px solid #c9a84c;">
      <img src="${LOGO_URL}" width="180" alt="BarBuddy" style="display:block;width:180px;max-width:100%;height:auto;border:0;margin:0 0 12px;">
      <div style="font-size:18px;font-weight:bold;color:#0f1f3c;">You're invited to BarBuddy</div>
      <div style="font-size:12px;color:#6b7280;letter-spacing:0.4px;">Philippine Bar Examination Preparation</div>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold;">Hello, ${name}</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#374151;">
        You have been invited to join BarBuddy as a <strong style="color:#0f1f3c;">${role}</strong>.
        Create your account to get started. Register with this same email address so your invitation is applied.
      </p>
      <a href="${link}" style="display:inline-block;background:#0f1f3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">Register Now &rarr;</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">If you weren't expecting this invitation, you can ignore this email.</p>
    </div>
  </div>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;color:#6b7280;">BarBuddy &middot; Your study partner for the Philippine Bar</p>
</div>`;

  const text = [
    "You're invited to BarBuddy",
    '',
    `Hello, ${input.name || 'there'}`,
    `You have been invited to join BarBuddy as a ${input.role}. Register with this same email address so your invitation is applied.`,
    '',
    `Register: ${input.link}`,
  ].join('\n');

  return { subject: "You're invited to BarBuddy", html, text };
}

export async function sendMail(
  to: string,
  message: { subject: string; html: string; text: string; replyTo?: string; attachments?: { filename: string; content: Buffer; contentType: string }[] }
) {
  if (!mailConfigured()) {
    return { sent: false, reason: 'Email is not configured (add SMTP_USER and SMTP_PASS to backend/.env).' };
  }
  const from = process.env.MAIL_FROM || `BarBuddy <${process.env.SMTP_USER}>`;
  await getTransport().sendMail({ from, to, ...message });
  return { sent: true as const };
}

// Shared BarBuddy email frame (logo header, white card, footer)
function emailFrame(title: string, body: string) {
  return `
<div style="background:#f0ece4;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0f1f3c;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5dfd3;border-radius:12px;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:3px solid #c9a84c;">
      <img src="${LOGO_URL}" width="180" alt="BarBuddy" style="display:block;width:180px;max-width:100%;height:auto;border:0;margin:0 0 12px;">
      <div style="font-size:18px;font-weight:bold;color:#0f1f3c;">${title}</div>
      <div style="font-size:12px;color:#6b7280;letter-spacing:0.4px;">Philippine Bar Examination Preparation</div>
    </div>
    <div style="padding:28px 32px;">${body}</div>
  </div>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:11px;color:#6b7280;">BarBuddy &middot; Your study partner for the Philippine Bar</p>
</div>`;
}

// Where Contact Support / Report a Problem messages go
export const supportAddress = () => process.env.SUPPORT_EMAIL || process.env.SMTP_USER || '';

// Settings → Contact Support / Report a Problem, sent to the BarBuddy team
export function supportEmail(input: { kind: 'contact' | 'problem'; category: string; subject: string; message: string; from: string; email: string; role: string }) {
  const label = input.kind === 'problem' ? 'Problem report' : 'Support request';
  const rows: [string, string][] = [
    ['From', `${input.from} (${input.email})`],
    ['Role', input.role],
    ['Category', input.category],
    ...(input.subject ? ([['Subject', input.subject]] as [string, string][]) : []),
  ];
  const html = emailFrame(
    label,
    `<table style="font-size:14px;line-height:1.6;border-collapse:collapse;margin:0 0 16px;">${rows
      .map(([k, v]) => `<tr><td style="padding:2px 16px 2px 0;color:#6b7280;vertical-align:top;">${k}</td><td style="padding:2px 0;">${escapeHtml(v)}</td></tr>`)
      .join('')}</table>
    <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;border-top:1px solid #e5dfd3;padding-top:16px;">${escapeHtml(input.message)}</div>
    <p style="margin:20px 0 0;font-size:12px;color:#6b7280;">Reply to this email to answer ${escapeHtml(input.from)} directly.</p>`
  );
  const text = [`${label}`, ...rows.map(([k, v]) => `${k}: ${v}`), '', input.message].join('\n');
  return { subject: `[BarBuddy ${label}] ${input.subject || input.category}`, html, text };
}

export function cancelConfirmationEmail(input: { name: string; packageName: string; expiresOn: string | null; link: string; minutes: number }) {
  const name = escapeHtml(input.name || 'Reviewee');
  const pkg = escapeHtml(input.packageName);
  const link = escapeHtml(input.link);

  const html = emailFrame('Confirm your subscription cancellation', `
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold;">Hello, ${name}</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#374151;">
        We received a request to cancel your <strong style="color:#0f1f3c;">${pkg}</strong> subscription${input.expiresOn ? ` (active until ${escapeHtml(input.expiresOn)})` : ''}.
        Once you confirm, your package ends right away and your daily questions stop.
      </p>
      <a href="${link}" style="display:inline-block;background:#c0392b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">Review and Confirm Cancellation &rarr;</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">This link expires in ${input.minutes} minutes. If you didn't ask to cancel, ignore this email and your subscription stays active.</p>`);

  const text = [
    'Confirm your subscription cancellation',
    '',
    `Hello, ${input.name || 'Reviewee'}`,
    `We received a request to cancel your ${input.packageName} subscription. Once you confirm, your package ends right away and your daily questions stop.`,
    '',
    `Review and confirm: ${input.link}`,
    `This link expires in ${input.minutes} minutes. If you didn't ask to cancel, ignore this email.`,
  ].join('\n');

  return { subject: 'Confirm your BarBuddy subscription cancellation', html, text };
}

// Sent by BarBuddy itself when a payment is confirmed (paper Figures 1.3 and
// 3.3, TC-SUBS-004), whatever PayMongo account processed it.
export function paymentReceiptEmail(input: {
  name: string;
  reference: string;
  paidAt: string;
  packageName: string;
  durationDays: number;
  validUntil: string;
  amount: number;
  method: string | null;
  payerName: string | null;
  providerId: string | null;
  link: string;
}) {
  const peso = `&#8369;${Number(input.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const pesoText = `PHP ${Number(input.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rows: [string, string][] = [
    ['Receipt No.', input.reference],
    ['Date Paid', input.paidAt],
    ['Package', `${input.packageName} (${input.durationDays} days)`],
    ['Active Until', input.validUntil],
    ['Payment Method', input.method || 'Online payment'],
    ...(input.payerName ? ([['Paid By', input.payerName]] as [string, string][]) : []),
    ...(input.providerId ? ([['Transaction ID', input.providerId]] as [string, string][]) : []),
  ];
  const table = rows
    .map(([label, value]) => `
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6b7280;width:42%;vertical-align:top;">${label}</td>
          <td style="padding:8px 0;font-size:13px;color:#0f1f3c;font-weight:bold;word-break:break-all;">${escapeHtml(value)}</td>
        </tr>`)
    .join('');

  const html = emailFrame('Payment receipt', `
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold;">Hello, ${escapeHtml(input.name || 'Reviewee')}</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">
        Thank you for your payment. Your <strong style="color:#0f1f3c;">${escapeHtml(input.packageName)}</strong> package is now active, and your daily review questions have started.
      </p>
      <div style="margin:0 0 20px;border:1.5px solid #c9a84c;background:#fbf7ec;border-radius:8px;padding:18px 16px;text-align:center;">
        <div style="font-size:12px;color:#6b7280;letter-spacing:0.4px;text-transform:uppercase;margin:0 0 6px;">Amount Paid</div>
        <div style="font-size:28px;font-weight:bold;color:#0f1f3c;">${peso}</div>
      </div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;border-top:1px solid #e5dfd3;border-bottom:1px solid #e5dfd3;">${table}
      </table>
      <a href="${escapeHtml(input.link)}" style="display:inline-block;background:#0f1f3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">View My Subscription &rarr;</a>
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">Keep this email as your official BarBuddy receipt. If you didn't make this payment, contact BarBuddy support right away.</p>`);

  const text = [
    'BarBuddy payment receipt',
    '',
    `Hello, ${input.name || 'Reviewee'}`,
    `Thank you for your payment. Your ${input.packageName} package is now active.`,
    '',
    `Amount Paid: ${pesoText}`,
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `View your subscription: ${input.link}`,
  ].join('\n');

  return { subject: `BarBuddy payment receipt ${input.reference}`, html, text };
}

// Codes Amazon Cognito sends (sign-up, password reset, ...). Cognito puts the
// real code where `code` is (its "{####}" placeholder), so it is not escaped.
export type CodeEmailKind = 'signup' | 'reset' | 'verify-email' | 'sign-in' | 'admin-invite';

const CODE_EMAILS: Record<CodeEmailKind, { subject: string; title: string; intro: string; label: string; expiry: string; ignore: string }> = {
  signup: {
    subject: 'Verify your BarBuddy account',
    title: 'Verify your email address',
    intro: 'Welcome to BarBuddy! Enter this verification code on the sign-up page to confirm your email and finish creating your account.',
    label: 'Your verification code',
    expiry: 'This code expires in 24 hours.',
    ignore: "If you didn't create a BarBuddy account, you can ignore this email.",
  },
  reset: {
    subject: 'Reset your BarBuddy password',
    title: 'Reset your password',
    intro: 'We received a request to reset the password for your BarBuddy account. Enter this code on the reset page, then choose a new password.',
    label: 'Your password reset code',
    expiry: 'This code expires in 1 hour.',
    ignore: "If you didn't ask to reset your password, ignore this email. Your password stays the same.",
  },
  'verify-email': {
    subject: 'Confirm your new BarBuddy email address',
    title: 'Confirm your email address',
    intro: 'Enter this code in BarBuddy to confirm this email address for your account.',
    label: 'Your confirmation code',
    expiry: 'This code expires in 24 hours.',
    ignore: "If you didn't change your BarBuddy email, contact support right away.",
  },
  'sign-in': {
    subject: 'Your BarBuddy sign-in code',
    title: 'Your sign-in code',
    intro: 'Enter this code to finish signing in to BarBuddy.',
    label: 'Your sign-in code',
    expiry: 'This code expires in a few minutes.',
    ignore: "If you didn't try to sign in, change your password right away.",
  },
  'admin-invite': {
    subject: 'Your BarBuddy account is ready',
    title: 'Your BarBuddy account is ready',
    intro: 'A BarBuddy administrator created an account for you. Sign in with the temporary password below, then choose your own password.',
    label: 'Your temporary password',
    expiry: 'This temporary password expires in 7 days.',
    ignore: "If you weren't expecting this account, you can ignore this email.",
  },
};

export function verificationCodeEmail(input: { kind: CodeEmailKind; name?: string; code: string; username?: string }) {
  const copy = CODE_EMAILS[input.kind];
  const name = escapeHtml(input.name || 'there');
  // The reviewee types the code on the page they are already on; only an
  // account an admin created needs a way in
  const button = input.kind === 'admin-invite'
    ? `<a href="${escapeHtml(`${appUrl()}/login`)}" style="display:inline-block;background:#0f1f3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">Sign in to BarBuddy &rarr;</a>`
    : '';
  const usernameLine = input.username
    ? `<p style="margin:0 0 14px;font-size:14px;color:#374151;">Username: <strong style="color:#0f1f3c;">${input.username}</strong></p>`
    : '';

  const html = emailFrame(copy.title, `
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold;">Hello, ${name}</p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#374151;">${copy.intro}</p>
      ${usernameLine}
      <div style="margin:0 0 20px;border:1.5px solid #c9a84c;background:#fbf7ec;border-radius:8px;padding:18px 16px;text-align:center;">
        <div style="font-size:12px;color:#6b7280;letter-spacing:0.4px;text-transform:uppercase;margin:0 0 8px;">${copy.label}</div>
        <div style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f1f3c;">${input.code}</div>
      </div>
      <p style="margin:0 0 ${button ? 24 : 18}px;font-size:13px;line-height:1.6;color:#374151;">${copy.expiry} For your security, never share this code with anyone. BarBuddy will never ask for it.</p>
      ${button}
      <p style="margin:${button ? 24 : 0}px 0 0;font-size:12px;line-height:1.6;color:#6b7280;">${copy.ignore}</p>`);

  return { subject: copy.subject, html };
}

export function subscriptionCancelledEmail(input: { name: string; packageName: string; link: string }) {
  const name = escapeHtml(input.name || 'Reviewee');
  const pkg = escapeHtml(input.packageName);
  const link = escapeHtml(input.link);

  const html = emailFrame('Your subscription has been cancelled', `
      <p style="margin:0 0 14px;font-size:16px;font-weight:bold;">Hello, ${name}</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#374151;">
        Your <strong style="color:#0f1f3c;">${pkg}</strong> subscription has been cancelled and your daily questions have stopped.
        Your assessment history and achievements are kept. You can choose a new package any time.
      </p>
      <a href="${link}" style="display:inline-block;background:#0f1f3c;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;">View Packages &rarr;</a>`);

  const text = [
    'Your subscription has been cancelled',
    '',
    `Hello, ${input.name || 'Reviewee'}`,
    `Your ${input.packageName} subscription has been cancelled and your daily questions have stopped. Your assessment history and achievements are kept.`,
    '',
    `View packages: ${input.link}`,
  ].join('\n');

  return { subject: 'Your BarBuddy subscription has been cancelled', html, text };
}
