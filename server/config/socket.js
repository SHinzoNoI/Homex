const Rider = require('../models/Rider');
let io;

function initSocket(server) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Customer joins their order room to get live updates
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
    });

    // Rider updates their location
    socket.on('rider:location', async ({ orderId, lat, lng, riderId }) => {
      // 1. Emit to the order room for real-time update
      io.to(`order:${orderId}`).emit('rider:location', { lat, lng, riderId, timestamp: Date.now() });

      // 2. Persist to DB if riderId is provided (for page refresh/initial load)
      if (riderId) {
        try {
          await Rider.findByIdAndUpdate(riderId, {
            'location.lat': lat,
            'location.lng': lng,
            'location.updatedAt': new Date()
          });
        } catch (err) { console.error('Failed to update rider location:', err); }
      }
    });

    // Rider joins their own room for order notifications
    socket.on('join:rider', (riderId) => {
      socket.join(`rider:${riderId}`);
    });

    socket.on('disconnect', () => { });
  });

  return io;
}

function getIO() {
  // On Vercel (serverless), Socket.io is not initialised — return null
  // so callers can safely guard: const io = getIO(); if (io) io.emit(...)
  if (!io) return null;
  return io;
}

module.exports = { initSocket, getIO };
