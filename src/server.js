require('dotenv').config();
const express = require('express');
const appConfigService = require('./services/appConfigService');
const parameterStoreService = require('./services/parameterStoreService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
const itemsRoutes = require('./routes/items');
const configRoutes = require('./routes/config');

app.use('/api/items', itemsRoutes);
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      appConfig: 'connected',
      parameterStore: 'connected'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AWS App Config & Parameter Store CRUD API',
    version: '1.0.0',
    endpoints: {
      items: {
        getAll: 'GET /api/items',
        getOne: 'GET /api/items/:id',
        create: 'POST /api/items',
        update: 'PUT /api/items/:id',
        delete: 'DELETE /api/items/:id'
      },
      config: {
        appConfig: 'GET /api/config/appconfig',
        featureFlags: 'GET /api/config/feature-flags',
        checkFlag: 'GET /api/config/feature-flags/:name',
        getParameter: 'GET /api/config/parameter-store/:name',
        getAllParameters: 'GET /api/config/parameter-store',
        refresh: 'POST /api/config/refresh',
        clearCache: 'DELETE /api/config/cache'
      },
      health: 'GET /health'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// Initialize services and start server
async function startServer() {
  try {
    console.log('🚀 Starting application...\n');
    
    // Initialize App Config
    await appConfigService.initialize();
    
    // Test Parameter Store connection (optional)
    console.log('\n📦 Testing Parameter Store connection...');
    try {
      const testParams = await parameterStoreService.getParametersByPath();
      console.log(`✅ Parameter Store connected. Found ${Object.keys(testParams).length} parameters\n`);
    } catch (error) {
      console.warn('⚠️  Parameter Store connection test failed (this is OK if you have no parameters set up yet)\n');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`🌐 API Documentation: http://localhost:${PORT}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
