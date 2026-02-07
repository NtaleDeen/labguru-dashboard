import express, { Application } from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSocket } from './config/socket';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import metadataRoutes from './routes/metadata';
import revenueRoutes from './routes/revenue';
import receptionRoutes from './routes/reception';
import lridsRoutes from './routes/lrids';
import settingsRoutes from './routes/settings';
import adminRoutes from './routes/admin';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/lrids', lridsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io initialized`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;