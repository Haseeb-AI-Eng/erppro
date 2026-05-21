const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const connectedUsers = new Map();

const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.orgId = decoded.organizationId;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    connectedUsers.set(socket.userId, socket.id);
    if (socket.orgId) {
      socket.join(`org:${socket.orgId}`);
      await Employee.findByIdAndUpdate(socket.userId, { isOnline: true, lastSeen: new Date() });
      io.to(`org:${socket.orgId}`).emit('user_online', { userId: socket.userId });
    }

    socket.on('join_chat', (channelId) => socket.join(`chat:${channelId}`));

    socket.on('send_message', (data) => {
      io.to(`org:${socket.orgId}`).emit('new_message', data);
    });

    socket.on('typing', (data) => {
      socket.to(`chat:${data.channelId}`).emit('user_typing', { userId: socket.userId, ...data });
    });

    socket.on('disconnect', async () => {
      connectedUsers.delete(socket.userId);
      if (socket.orgId) {
        await Employee.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
        io.to(`org:${socket.orgId}`).emit('user_offline', { userId: socket.userId });
      }
    });
  });
};

const emitToOrg = (io, orgId, event, data) => {
  io.to(`org:${orgId}`).emit(event, data);
};

const emitToUser = (io, userId, event, data) => {
  const socketId = connectedUsers.get(userId?.toString());
  if (socketId) io.to(socketId).emit(event, data);
};

module.exports = { setupSocketHandlers, emitToOrg, emitToUser };
