const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/health', (req, res) => {
  res.json({ status: 'VIRTUAL-LAB Backend is running' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

const activeRooms = {};

io.on('connection', (socket) => {
  console.log(`🟢 New user connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!activeRooms[roomId]) {
      activeRooms[roomId] = { host: socket.id, guests: [] };
      socket.emit('role-assigned', { role: 'host', roomId });
      console.log(`👑 User ${socket.id} is HOST of room: ${roomId}`);
    } else {
      activeRooms[roomId].guests.push(socket.id);
      socket.emit('role-assigned', { role: 'guest', roomId });
      console.log(`👤 User ${socket.id} joined as GUEST in room: ${roomId}`);
    }
    socket.roomId = roomId; 
  });

  socket.on('physics-sync', (physicsState) => {
    if (activeRooms[socket.roomId] && activeRooms[socket.roomId].host === socket.id) {
      socket.to(socket.roomId).emit('sync-update', physicsState);
    }
  });

  socket.on('spawn-shape', (shapeData) => {
    if (socket.roomId) {
      io.to(socket.roomId).emit('shape-spawned', shapeData);
    }
  });
  // Relay new constraints (springs/joints) to everyone in the room
  socket.on('spawn-constraint', (constraintData) => {
    if (socket.roomId) {
      io.to(socket.roomId).emit('constraint-spawned', constraintData);
    }
  });
  // Host commands a global workspace reset
  socket.on('clear-canvas', () => {
    if (socket.roomId && activeRooms[socket.roomId]) {
      // Security check: Only the Host is allowed to clear the canvas
      if (activeRooms[socket.roomId].host === socket.id) {
        io.to(socket.roomId).emit('canvas-cleared');
        console.log(`🧹 Room ${socket.roomId} cleared by Host.`);
      }
    }
  });
  // Relay environment changes (Gravity, Time) to everyone in the room
  socket.on('update-environment', (envData) => {
    if (socket.roomId && activeRooms[socket.roomId]) {
      if (activeRooms[socket.roomId].host === socket.id) {
        // Broadcast the change to everyone in the room
        socket.to(socket.roomId).emit('environment-updated', envData);
      }
    }
  });

  // --- NEW GUEST DRAG MECHANICS ---
  socket.on('guest-grab', (data) => {
    if (socket.roomId && activeRooms[socket.roomId]) {
      io.to(activeRooms[socket.roomId].host).emit('host-apply-guest-grab', data);
    }
  });

  socket.on('guest-drag', (dragData) => {
    if (socket.roomId && activeRooms[socket.roomId]) {
      io.to(activeRooms[socket.roomId].host).emit('host-apply-guest-drag', dragData);
    }
  });

  socket.on('guest-drop', (data) => {
    if (socket.roomId && activeRooms[socket.roomId]) {
      io.to(activeRooms[socket.roomId].host).emit('host-apply-guest-drop', data);
    }
  });
  // --------------------------------

  socket.on('request-initial-state', () => {
    const room = activeRooms[socket.roomId];
    if (room && room.host) {
      io.to(room.host).emit('provide-initial-state', socket.id);
    }
  });

 // Host replies with the full snapshot, relay it to the specific Guest
  socket.on('initial-state-response', (data) => {
    io.to(data.targetId).emit('sync-initial-state', {
      bodies: data.bodies,
      constraints: data.constraints // <-- Added this!
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
    const roomId = socket.roomId;
    if (roomId && activeRooms[roomId]) {
      const room = activeRooms[roomId];
      if (room.host === socket.id) {
        if (room.guests.length > 0) {
          const newHost = room.guests.shift();
          room.host = newHost;
          io.to(newHost).emit('role-assigned', { role: 'host', roomId });
        } else {
          delete activeRooms[roomId];
        }
      } else {
        room.guests = room.guests.filter(id => id !== socket.id);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});