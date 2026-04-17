const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'VIRTUAL-LAB Backend is running' });
});

const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Vite frontend
    methods: ["GET", "POST"]
  }
});

// Listen for incoming connections
// Listen for incoming connections
io.on('connection', (socket) => {
  console.log(`🟢 New user connected: ${socket.id}`);

  // Listen for the join-room event from the React frontend
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`👤 User ${socket.id} joined room: ${roomId}`);
    
    // Optional: Let the room know someone new arrived
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});