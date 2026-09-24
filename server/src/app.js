import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import errorHandler from './middleware/error.js';

import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: false }));
app.use(express.json({ limit: '5mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get('/api/health', (_req, res) =>
  res.json({ success: true, data: 'ok', message: 'MarketLink API running' })
);

app.use('/api/auth', authRoutes);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, error: 'Route not found' })
);

app.use(errorHandler);

export default app;