import { Hono } from 'hono';
import { supabaseAdmin } from '../lib/supabase';
import { requireUser } from '../lib/auth';
import { logEvent } from '../lib/logs';

export const userRoutes = new Hono();

const NAME_PATTERN = /^[\p{L}][\p{L} .'-]{1,49}$/u;
const PH_MOBILE_PATTERN = /^(09|\+639)\d{9}$/;

// Profile of the logged-in user (Authorization: Bearer <Supabase access token>)
userRoutes.get('/user/profile', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const { data: userData } = await supabaseAdmin
    .from('bb_users_tbl')
    .select('user_fname, user_lname, user_name, user_email, user_contact, user_address, user_birthdate, created_at')
    .eq('user_id', auth.profile.user_id)
    .single();

  const fullName = `${userData?.user_fname || ''} ${userData?.user_lname || ''}`.trim();

  return c.json({
    name: fullName || userData?.user_name || 'User',
    firstName: userData?.user_fname || '',
    lastName: userData?.user_lname || '',
    email: userData?.user_email || '',
    contactNumber: userData?.user_contact || '',
    address: userData?.user_address || '',
    birthdate: userData?.user_birthdate || '',
    memberSince: userData?.created_at,
    role: auth.profile.role,
  });
});

// Account management (paper Table 3.1): update own account information
userRoutes.patch('/user/profile', async (c) => {
  const auth = await requireUser(c);
  if (auth.response) return auth.response;

  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Invalid JSON.' }, 400);

  const firstName = String(body.firstName ?? '').trim().replace(/\s+/g, ' ');
  const lastName = String(body.lastName ?? '').trim().replace(/\s+/g, ' ');
  const contact = String(body.contactNumber ?? '').replace(/[\s()-]/g, '');
  const address = String(body.address ?? '').trim();
  const birthdate = String(body.birthdate ?? '').trim();

  if (!NAME_PATTERN.test(firstName)) return c.json({ error: 'Enter a valid first name (2-50 letters).' }, 400);
  if (!NAME_PATTERN.test(lastName)) return c.json({ error: 'Enter a valid last name (2-50 letters).' }, 400);
  if (contact && !PH_MOBILE_PATTERN.test(contact)) return c.json({ error: 'Enter a valid PH mobile number (09XXXXXXXXX or +639XXXXXXXXX).' }, 400);
  if (address.length > 200) return c.json({ error: 'Address must be 200 characters or fewer.' }, 400);
  if (birthdate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate) || Number.isNaN(Date.parse(birthdate)) || new Date(birthdate) > new Date())) {
    return c.json({ error: 'Enter a valid birthdate.' }, 400);
  }

  const { error } = await supabaseAdmin
    .from('bb_users_tbl')
    .update({
      user_fname: firstName,
      user_lname: lastName,
      user_contact: contact || null,
      user_address: address || null,
      user_birthdate: birthdate || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', auth.profile.user_id);

  if (error) return c.json({ error: 'Unable to update your profile.' }, 500);

  await logEvent(auth.profile.user_id, 'account', 'Updated profile information.');
  return c.json({ message: 'Profile updated.' });
});
