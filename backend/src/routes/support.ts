import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';
import { sendMail, supportAddress, supportEmail } from '../lib/mailer';

// Settings → Help & Support: Contact Support and Report a Problem. Each
// message is emailed to the BarBuddy team (SUPPORT_EMAIL, else the SMTP
// account) with Reply-To set to the user, and recorded in the system logs.
export const supportRoutes = new Hono();

const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

// POST /api/support — { kind: 'contact' | 'problem', category, subject?, message,
//                       screenshot?: { name, type, data (base64) } }
supportRoutes.post('/', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ message: 'Invalid JSON.' }, 400);

  const kind = body.kind === 'problem' ? 'problem' : 'contact';
  const category = clean(body.category, 100) || 'General';
  const subject = clean(body.subject, 150);
  const message = clean(body.message, 5000);
  if (kind === 'contact' && subject.length < 3) return c.json({ message: 'Add a short subject.' }, 400);
  if (message.length < 10) return c.json({ message: 'Describe your request in at least 10 characters.' }, 400);

  let attachments: { filename: string; content: Buffer; contentType: string }[] | undefined;
  if (body.screenshot?.data) {
    const type = String(body.screenshot.type || '');
    const content = Buffer.from(String(body.screenshot.data), 'base64');
    if (!IMAGE_TYPES.includes(type)) return c.json({ message: 'The screenshot must be a PNG, JPG, GIF or WebP image.' }, 400);
    if (content.length > MAX_SCREENSHOT_BYTES) return c.json({ message: 'The screenshot must be 2 MB or smaller.' }, 413);
    attachments = [{ filename: clean(body.screenshot.name, 100) || 'screenshot', content, contentType: type }];
  }

  const { data: user } = await supabaseAdmin.from('bb_users_tbl').select('user_email').eq('user_id', auth.profile.user_id).maybeSingle();
  const email = user?.user_email || '';
  const to = supportAddress();
  if (!to) return c.json({ message: 'Support email is not set up yet. Please try again later.' }, 503);

  try {
    const sent = await sendMail(to, {
      ...supportEmail({ kind, category, subject, message, from: auth.profile.full_name || 'BarBuddy user', email, role: auth.profile.role }),
      ...(email ? { replyTo: email } : {}),
      attachments,
    });
    if (!sent.sent) return c.json({ message: 'Support email is not set up yet. Please try again later.' }, 503);
  } catch (error: any) {
    console.error('Support email error:', error?.message || error);
    return c.json({ message: 'Your message could not be sent. Please try again.' }, 502);
  }

  await logEvent(
    auth.profile.user_id,
    'support',
    `${kind === 'problem' ? 'Reported a problem' : 'Contacted support'} (${category})${subject ? `: "${subject}"` : ''}.`
  );
  return c.json({ message: 'Sent.' });
});
