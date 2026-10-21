import { createHash, randomBytes } from 'node:crypto';
import { supabaseAdmin } from './supabase';
import { appUrl, cancelConfirmationEmail, mailConfigured, sendMail, subscriptionCancelledEmail } from './mailer';
import { logEvent } from './logs';
import { loadSubscription } from './packages';
import { closePayment, type PaymentRow } from './payments';

// Subscription cancellation, confirmed by email. The request emails a link
// with a one-time token (only its SHA-256 is stored in bb_hash_tokens_tbl);
// the subscription ends when the reviewee confirms on that page.
export const CANCEL_LINK_MINUTES = 30;
// hash_link is UNIQUE in bb_hash_tokens_tbl, so each row is labelled
// "subscription_cancel:<token hash>" and looked up by that prefix
const PURPOSE = 'subscription_cancel';
const ofPurpose = `${PURPOSE}:%`;
const RESEND_SECONDS = 60;

export class CancelError extends Error {
  constructor(message: string, public status: 400 | 404 | 409 | 410 | 429 | 503 = 400) {
    super(message);
  }
}

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// j***n@gmail.com
export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const shown = local.length <= 2 ? local[0] : `${local[0]}***${local[local.length - 1]}`;
  return `${shown}@${domain}`;
}

async function loadUser(userId: string) {
  const { data } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_id, user_fname, user_email')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function requestCancellation(userId: string) {
  const subscription = await loadSubscription(userId);
  if (!subscription?.active) throw new CancelError('You have no active package to cancel.', 409);
  if (!mailConfigured()) throw new CancelError('Email is not set up on the server, so cancellation cannot be confirmed yet.', 503);

  const user = await loadUser(userId);
  if (!user?.user_email) throw new CancelError('Your account has no email address.', 400);

  const { data: recent } = await supabaseAdmin
    .from('bb_hash_tokens_tbl')
    .select('created_at')
    .eq('user_id', userId)
    .like('hash_link', ofPurpose)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent && Date.now() - Date.parse(recent.created_at) < RESEND_SECONDS * 1000) {
    throw new CancelError('A confirmation email was just sent. Please wait a minute before asking again.', 429);
  }

  // Every emailed link works until it expires (confirming one uses up the
  // rest), so opening an older email still works. Drop expired ones here.
  await supabaseAdmin
    .from('bb_hash_tokens_tbl')
    .delete()
    .eq('user_id', userId)
    .like('hash_link', ofPurpose)
    .lt('hash_expiry', new Date().toISOString());

  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + CANCEL_LINK_MINUTES * 60_000).toISOString();
  const tokenHash = hashToken(token);
  const { error } = await supabaseAdmin.from('bb_hash_tokens_tbl').insert({
    user_id: userId,
    hash_link: `${PURPOSE}:${tokenHash}`,
    hash_token: tokenHash,
    hash_expiry: expiresAt,
  });
  if (error) throw error;

  const link = `${appUrl()}/cancel-subscription?token=${token}`;
  const result = await sendMail(
    user.user_email,
    cancelConfirmationEmail({
      name: user.user_fname || '',
      packageName: `${subscription.name}: ${subscription.tagline}`,
      expiresOn: subscription.expiresOn,
      link,
      minutes: CANCEL_LINK_MINUTES,
    })
  );
  if (!result.sent) throw new CancelError(result.reason || 'Could not send the confirmation email.', 503);

  await logEvent(userId, 'subscription', `Requested cancellation of ${subscription.name}; confirmation emailed.`);
  return { email: maskEmail(user.user_email), expiresAt };
}

async function loadToken(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new CancelError('This cancellation link is not valid.', 404);
  const { data } = await supabaseAdmin
    .from('bb_hash_tokens_tbl')
    .select('id, user_id, hash_expiry')
    .like('hash_link', ofPurpose)
    .eq('hash_token', hashToken(token))
    .maybeSingle();
  if (!data) throw new CancelError('This cancellation link is not valid or was already used.', 404);
  if (!data.hash_expiry || Date.parse(data.hash_expiry) < Date.now()) {
    await supabaseAdmin.from('bb_hash_tokens_tbl').delete().eq('id', data.id);
    throw new CancelError('This cancellation link has expired. Request a new one from your Subscription page.', 410);
  }
  return data;
}

// What the confirmation page shows before the reviewee confirms
export async function previewCancellation(token: string) {
  const row = await loadToken(token);
  const [subscription, user] = await Promise.all([loadSubscription(row.user_id), loadUser(row.user_id)]);
  return {
    reviewee: user?.user_fname || 'Reviewee',
    active: Boolean(subscription?.active),
    package: subscription ? { name: subscription.name, tagline: subscription.tagline, subjects: subscription.subjects, expiresOn: subscription.expiresOn, daysLeft: subscription.daysLeft } : null,
    expiresAt: row.hash_expiry,
  };
}

export async function confirmCancellation(token: string) {
  const row = await loadToken(token);
  // One use: claim the token before acting on it
  const { data: claimed } = await supabaseAdmin.from('bb_hash_tokens_tbl').delete().eq('id', row.id).select('id');
  if (!claimed?.length) throw new CancelError('This cancellation link was already used.', 404);
  await supabaseAdmin.from('bb_hash_tokens_tbl').delete().eq('user_id', row.user_id).like('hash_link', ofPurpose);

  const subscription = await loadSubscription(row.user_id);
  if (!subscription?.active) throw new CancelError('There is no active package to cancel.', 409);

  const { error } = await supabaseAdmin
    .from('bb_users_tbl')
    .update({
      subscription_id: null,
      subscription_started_at: null,
      user_subscription_expiry: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', row.user_id);
  if (error) throw error;

  // Close any open payment link so it cannot re-activate a package
  const { data: pending } = await supabaseAdmin
    .from('bb_payments_tbl')
    .select('payment_id, user_id, payment_reference, payment_status, paymongo_checkout_id')
    .eq('user_id', row.user_id)
    .eq('payment_status', 'pending');
  for (const p of (pending as unknown as PaymentRow[]) || []) await closePayment(p, 'cancelled');

  const packageName = `${subscription.name}: ${subscription.tagline}`;
  await logEvent(row.user_id, 'subscription', `Cancelled ${subscription.name} (${subscription.daysLeft} days left) after email confirmation.`);

  const user = await loadUser(row.user_id);
  if (user?.user_email) {
    try {
      await sendMail(user.user_email, subscriptionCancelledEmail({ name: user.user_fname || '', packageName, link: `${appUrl()}/subscription` }));
    } catch (err: any) {
      console.error('Cancellation email failed:', err?.message || err);
    }
  }
  return { packageName };
}
