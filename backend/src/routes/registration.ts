import { Hono } from 'hono';
import { supabase } from '../lib/supabase';

export const registrationRoutes = new Hono();

registrationRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { firstName, lastName, email, contactNumber, password } = body;

    const { data, error } = await supabase
      .from('bb_users_tbl')
      .insert([
        {
          user_fname: firstName,
          user_lname: lastName,
          user_email: email,
          user_contact: contactNumber,
          user_password: password,
          user_progress: 0,
          user_attempts: 0,
          user_is_active: true,
          is_archived: false,
        },
      ])
      .select();

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ message: 'User registered successfully', user: data[0] }, 201);
  } catch (err: any) {
    return c.json({ error: err.message || 'Server error' }, 500);
  }
});