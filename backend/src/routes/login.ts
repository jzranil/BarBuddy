import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

export const loginRoutes = new Hono();

loginRoutes.post('/', async (c) => {
  try {
    const { email, password } = await c.req.json();

    console.log('Login attempt:', { email, password });

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const { data: user, error } = await supabase
      .from('bb_users_tbl')
      .select('*')
      .eq('user_email', email)
      .single();

    if (error || !user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const now = new Date();

    if (user.user_locked_until && new Date(user.user_locked_until) > now) {
      const remainingMs = new Date(user.user_locked_until).getTime() - now.getTime();
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      return c.json(
        {
          error: `Account is locked. Try again in ${remainingSeconds} second(s).`,
        },
        429
      );
    }

    if (user.user_password !== password) {
      const newAttempts = (user.user_attempts || 0) + 1;
      let lockoutUntil: string | null = null;
      let lockoutMinutes = 0;

      if (newAttempts % 3 === 0) {
        lockoutMinutes = newAttempts / 3;
        lockoutUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000).toISOString();
      }

      await supabase
        .from('bb_users_tbl')
        .update({
          user_attempts: newAttempts,
          user_lockout_end: lockoutUntil,
        })
        .eq('user_email', email);

      if (lockoutUntil) {
        return c.json(
          {
            error: `Too many failed attempts. Locked out for ${lockoutMinutes} minute(s).`,
          },
          429
        );
      }

      const attemptsRemaining = 3 - (newAttempts % 3);
      return c.json(
        {
          error: `Invalid password. ${attemptsRemaining} attempt(s) remaining before lockout.`,
        },
        401
      );
    }

    await supabase
      .from('bb_users_tbl')
      .update({
        user_attempts: 0,
        user_locked_until: null,
      })
      .eq('user_email', email);

    return c.json({ message: 'Login successful', user }, 200);
  } catch (err: any) {
    return c.json({ error: err.message || 'Server error' }, 500);
  }
});