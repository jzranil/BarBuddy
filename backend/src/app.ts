
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { registrationRoutes } from './routes/registration';
import { loginRoutes } from './routes/login';
import { userRoutes } from './routes/user';
import { questionRoutes } from './routes/questions';

export const app = new Hono().basePath('/api');

app.use('*', cors({
  origin: process.env.FRONTEND_ORIGIN ||
    'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.route('/registrations', registrationRoutes);
app.route('/login', loginRoutes);
app.route('/', userRoutes);
app.route('/questions', questionRoutes);
