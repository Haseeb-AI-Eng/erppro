require('dotenv').config();
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
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Security & parsing middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

setupSocketHandlers(io);

mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME })
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