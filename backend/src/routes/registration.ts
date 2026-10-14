
import { Hono } from 'hono';

export const registrationRoutes = new Hono();

// Old registration method is disabled.
// New accounts are registered through Supabase Auth.
registrationRoutes.post('/', (c) => {
  return c.json(
    {
      error: 'Please register using Supabase Authentication.',
    },
    410
  );
});
