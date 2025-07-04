const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const followRoutes = require('./routes/follows');

// Import database
const { initDatabase } = require('./models/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/follows', followRoutes);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their room for notifications
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Handle new post notifications
  socket.on('new_post', (postData) => {
    socket.broadcast.emit('post_created', postData);
  });

  // Handle like notifications
  socket.on('like_post', (data) => {
    io.to(`user_${data.postUserId}`).emit('post_liked', data);
  });

  // Handle comment notifications
  socket.on('new_comment', (data) => {
    io.to(`user_${data.postUserId}`).emit('post_commented', data);
  });

  // Handle follow notifications
  socket.on('new_follow', (data) => {
    io.to(`user_${data.followedUserId}`).emit('new_follower', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize database and start server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Instagram Clone Backend running on port ${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
});