import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import templateRoutes from './routes/templates.js';
import generateRoutes from './routes/generate.js';
import aiRoutes from './routes/ai.js';
import deployRoutes from './routes/deploy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── CORS ──────────────────────────────────────────────────────────────────────
// In production the frontend is served by this same Express process,
// so CORS is only needed for local dev or external frontends.
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

app.use(cors({
  origin: IS_PROD ? true : allowedOrigins,   // In prod: same-origin requests, so allow all
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/templates', templateRoutes);
app.use('/api', generateRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/deploy', deployRoutes);

app.get('/health', (req, res) => res.json({
  status: 'ok', version: '2.1.0',
  env: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}));

// ── Serve built React frontend in production ──────────────────────────────────
// When NODE_ENV=production, Express serves the Vite build from /client/dist.
// This lets the whole app run as a single Render web service.
if (IS_PROD) {
  const distPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(distPath));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SiteForge v2.1 — ${IS_PROD ? 'PRODUCTION' : 'DEV'} — http://localhost:${PORT}`);
});
