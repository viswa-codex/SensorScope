import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { robotSimulator } from './simulator/robotSimulator.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Dynamic CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or mobile requests with no origin, or if origin is in whitelist
    if (!origin || allowedOrigins.includes(origin) || (!isProduction && origin.includes('localhost'))) {
      return callback(null, true);
    }
    // Allow vercel and render preview subdomains in production
    if (origin.endsWith('.vercel.app') || origin.endsWith('.onrender.com')) {
      return callback(null, true);
    }
    callback(null, true); // Permissive in demo environments
  },
  credentials: true
}));

app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SensorScope Backend',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Telemetry, Rules, Incidents & Simulator Routes
app.use('/api', apiRoutes);

// In Production, serve static assets from client/dist (single-service monorepo deployment)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Fallback all non-API GET routes to client/dist/index.html (SPA routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development when client/dist isn't built yet, provide friendly message
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>SensorScope Telemetry Service</title></head>
          <body style="font-family:sans-serif; background:#020617; color:#f8fafc; padding:2rem;">
            <h2>SensorScope Telemetry Backend Online</h2>
            <p>API endpoints available at <a href="/api/health" style="color:#22d3ee;">/api/health</a></p>
            <p>Run Vite client in dev mode (<code>npm run dev:client</code>) or build client (<code>npm run build</code>) for production serving.</p>
          </body>
        </html>
      `);
    }
  });
});

// Start Server & Simulator
const server = app.listen(PORT, () => {
  console.log(`[SensorScope Server] Listening on port ${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
  // Automatically start robot simulator ticker
  robotSimulator.start();
});

export default app;
export { server };
