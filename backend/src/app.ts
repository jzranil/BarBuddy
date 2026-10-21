
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { registrationRoutes } from './routes/registration';
import { loginRoutes } from './routes/login';
import { userRoutes } from './routes/user';
import { questionRoutes } from './routes/questions';
import { syllabusRoutes } from './routes/syllabi';
import { assessmentRoutes } from './routes/assessments';
import { verificationRoutes } from './routes/verification';
import { revieweeRoutes } from './routes/reviewee';
import { lawyerRoutes } from './routes/lawyer';
import { achievementRoutes } from './routes/achievements';
import { announcementRoutes } from './routes/announcements';
import { adminRoutes } from './routes/admin';
import { paymentRoutes } from './routes/payments';

export const app = new Hono().basePath('/api');

app.use('*', cors({
  origin: process.env.FRONTEND_ORIGIN ||
    'http://localhost:5173',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Unexpected errors: log them and answer in JSON so the frontend shows a
// server error instead of a generic failure
app.onError((err, c) => {
  console.error(`[${c.req.method} ${c.req.path}]`, err);
  return c.json({ message: 'Something went wrong on the BarBuddy server. Please try again.' }, 500);
});

app.route('/registrations', registrationRoutes);
app.route('/login', loginRoutes);
app.route('/', userRoutes);
app.route('/questions', questionRoutes);
app.route('/syllabi', syllabusRoutes);
app.route('/assessments', assessmentRoutes);
app.route('/verification', verificationRoutes);
app.route('/reviewee', revieweeRoutes);
app.route('/lawyer', lawyerRoutes);
app.route('/achievements', achievementRoutes);
app.route('/announcements', announcementRoutes);
app.route('/admin', adminRoutes);
app.route('/payments', paymentRoutes);
