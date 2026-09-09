import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import milkRoutes from './routes/milkRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware setup
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GDairy Backend API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// API 404 handler for unhandled /api routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`
  });
});

// Serve Frontend Static Assets in Production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const indexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(indexPath)) {
  app.use(express.static(frontendDistPath));

  // SPA routing fallback (serves index.html for React Router frontend pages)
  app.get('*', (req, res) => {
    res.sendFile(indexPath);
  });
} else {
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>GDairy API Server</title></head>
        <body style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center; color: #1e293b;">
          <h2>🐄 GDairy Backend API Server</h2>
          <p>API is running smoothly. Frontend build status: <em>Building or not found at frontend/dist</em>.</p>
        </body>
      </html>
    `);
  });
}

// Centralized error handler
app.use(errorHandler);

export default app;
