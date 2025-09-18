import express from 'express';
import cors from 'cors';
import { config } from './config/environment';
import { initializeServices, shutdownServices } from './startup';

// Import routes
import documentRoutes from './routes/documents';
import searchRoutes from './routes/search';
import qaRoutes from './routes/qa';
import graphRoutes from './routes/graph';
import adminRoutes from './routes/admin';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(config.port, async () => {
  console.log(`🚀 Knowledge Engineering API running on port ${config.port}`);
  console.log(`📊 Health check: http://localhost:${config.port}/health`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
  
  // Initialize services
  const initialized = await initializeServices();
  if (!initialized) {
    console.error('❌ Failed to initialize services. Shutting down...');
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await shutdownServices();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await shutdownServices();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default app;