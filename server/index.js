import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import authRoutes from './routes/auth.js';
import meetmeRoutes from './routes/meetmes.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3016;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log('[SERVER] ========================================');
  console.log('[SERVER] Incoming request');
  console.log('[SERVER] Method:', req.method);
  console.log('[SERVER] Path:', req.path);
  console.log('[SERVER] URL:', req.url);
  console.log('[SERVER] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[SERVER] Body:', JSON.stringify(req.body, null, 2));
  next();
});

// API Routes (must come before static file serving)
app.use('/api/auth', authRoutes);
app.use('/api/meetmes', meetmeRoutes);
app.use('/api/admin', adminRoutes);

// Deployment status endpoint for verification
app.get('/api/deployment-status', (req, res) => {
  try {
    const timestampPath = path.join(__dirname, '.deployment-timestamp');
    const timestamp = readFileSync(timestampPath, 'utf8').trim();
    res.json({ timestamp, status: 'ok' });
  } catch (error) {
    res.json({ timestamp: 'unknown', status: 'ok' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from public directory (React build)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback to index.html for React Router (SPA routing)
// This must be last, after all other routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

