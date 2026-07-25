import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import config from './config';
import authRoutes from './routes/auth';
import leadRoutes from './routes/leads';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'DigitalHeroes API',
    version: '1.0.0',
    docs: 'See README.md for API documentation',
    endpoints: {
      health: '/api/health',
      auth: { register: 'POST /api/auth/register', login: 'POST /api/auth/login', me: 'GET /api/auth/me', users: 'GET /api/auth/users' },
      leads: { public: 'POST /api/leads/public', list: 'GET /api/leads', get: 'GET /api/leads/:id', create: 'POST /api/leads', update: 'PATCH /api/leads/:id', notes: 'POST /api/leads/:id/notes', delete: 'DELETE /api/leads/:id' },
    },
    frontend: process.env.FRONTEND_URL || null,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
  });
}

export default app;