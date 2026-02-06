import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import testRoutes from './routes/testRoutes';
import revenueRoutes from './routes/revenueRoutes';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import database
import pool from './config/database';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan('combined')); // Logging
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for data.json, TimeOut.csv, etc.)
app.use('/public', express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/revenue', revenueRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🔄 Received shutdown signal. Closing gracefully...');
  
  try {
    await pool.end();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('🚀 LRIDS Backend Server Started');
  console.log('=================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: Connected`);
  console.log('=================================\n');
});

export default app;