const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Saathi Voice API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      users: '/api/users',
      roles: '/api/roles',
      conversation: {
        voice: '/api/conversation/voice (POST)',
        text: '/api/conversation/text (POST)',
        history: '/api/conversation/history/:userId (GET)',
        memory: '/api/conversation/memory/:userId (GET)'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'File upload error',
      details: err.message 
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connection verified');

    app.listen(PORT, () => {
      console.log('');
      console.log('🎙️  Saathi Voice Backend Started');
      console.log('================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Base URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log('');
      console.log('Available endpoints:');
      console.log('  POST /api/users - Create user');
      console.log('  POST /api/users/select-role - Select conversation role');
      console.log('  GET  /api/roles - Get available roles');
      console.log('  POST /api/conversation/voice - Voice input (audio file)');
      console.log('  POST /api/conversation/text - Text input');
      console.log('  GET  /api/conversation/history/:userId - Get chat history');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  process.exit(0);
});

startServer();

module.exports = app;
