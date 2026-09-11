import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registrationRoutes } from './routes/registration';
import { loginRoutes } from './routes/login';

export const app = new Hono().basePath('/api');

app.use('*', cors());

app.route('/registrations', registrationRoutes);
app.route('/login', loginRoutes);