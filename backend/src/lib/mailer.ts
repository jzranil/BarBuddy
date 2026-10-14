import nodemailer, { type Transporter } from 'nodemailer';

// Outgoing BarBuddy mail (daily review questions). SMTP settings come from
// backend/.env — the password is never stored in the repository:
//   SMTP_HOST=smtp.gmail.com  SMTP_PORT=587
//   SMTP_USER=noreply.barbuddysystem.ph@gmail.com  SMTP_PASS=<Gmail app password>
//   MAIL_FROM="BarBuddy <noreply.barbuddysystem.ph@gmail.com>"
//   APP_URL=http://localhost:5173   (link target for "Start Answering")

const LOGO_URL = 'https://cjpdbuitmrqamrfhhbki.supabase.co/storage/v1/object/public/brand/barbuddy-logo-email.png';

export const appUrl = () => (process.env.APP_URL || process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/+$/, '');

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

export async function sendMail(to: string, message: { subject: string; html: string; text: string }) {
  if (!mailConfigured()) {
    return { sent: false, reason: 'Email is not configured (add SMTP_USER and SMTP_PASS to backend/.env).' };
  }
  const from = process.env.MAIL_FROM || `BarBuddy <${process.env.SMTP_USER}>`;
  await getTransport().sendMail({ from, to, ...message });
  return { sent: true as const };
}
