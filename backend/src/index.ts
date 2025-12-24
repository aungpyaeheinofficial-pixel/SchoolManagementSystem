import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './env.js';
import { authRouter } from './routes/auth.js';
import { syncRouter } from './routes/sync.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '5mb' }));

const origins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: origins.length ? origins : true,
    credentials: true,
  })
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/sync', syncRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(env.PORT, () => {
  console.log(`Backend listening on :${env.PORT}`);
});


