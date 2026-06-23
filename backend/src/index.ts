import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import mandateRouter from './routes/mandates';
import profileRouter from './routes/profile';
import messagesRouter from './routes/messages';
import introsRouter from './routes/intros';
import notificationsRouter from './routes/notifications';
import leaderboardRouter from './routes/leaderboard';
import kycRouter from './routes/kyc';
import adminRouter from './routes/admin';
import billingRouter from './routes/billing';
import reputationRouter from './routes/reputation';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/mandates', mandateRouter);
app.use('/api/profile', profileRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/intros', introsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/kyc', kycRouter);
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);
app.use('/api/reputation', reputationRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend auth service listening on http://localhost:${port}`);
});
