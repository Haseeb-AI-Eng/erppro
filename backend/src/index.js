require('dotenv').config();

// Configure DNS for MongoDB SRV resolution
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const taskRoutes = require('./routes/tasks');
const payrollRoutes = require('./routes/payroll');
const notificationRoutes = require('./routes/notifications');
const organizationRoutes = require('./routes/organizations');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');
const leaveRoutes = require('./routes/leaves');
const analyticsRoutes = require('./routes/analytics');

const { authenticateToken } = require('./middleware/auth');
const { setupSocketHandlers } = require('./services/socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://192.168.100.34:3000',
      'http://192.168.100.8:3000',
      'https://5000-iswlvljncqrn44jaj3ong-ceb3d2bb.us2.manus.computer'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://192.168.100.34:3000',
      'http://192.168.100.8:3000',
      'https://5000-iswlvljncqrn44jaj3ong-ceb3d2bb.us2.manus.computer'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  const originalJson = res.json;
  res.json = function(data) {
    console.log(`[${new Date().toISOString()}] Response: ${req.method} ${req.path} - Status: ${res.statusCode}`);
    return originalJson.call(this, data);
  };
  next();
});

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

app.set('io', io);
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/payroll', authenticateToken, payrollRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/organizations', authenticateToken, organizationRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/ai', authenticateToken, aiRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/leaves', authenticateToken, leaveRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Global error handler — catches anything routes miss
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR on ${req.method} ${req.path}:`);
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode,
  });
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

setupSocketHandlers(io);

mongoose.connect(process.env.MONGODB_URI, { 
  dbName: process.env.MONGODB_DB_NAME,
  serverSelectionTimeoutMS: 5000
})
  .then(async () => {
    console.log('MongoDB connected');
    const { seedSuperAdmin } = require('./utils/seed');
    await seedSuperAdmin();
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });