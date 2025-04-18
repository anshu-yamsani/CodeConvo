import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import app from './app.js';
import projectModel from './models/project.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://codeconvo.onrender.com',
    methods: ['GET', 'POST']
  }
});

// Socket.io middleware for auth and project validation
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error('Invalid projectId'));
    }

    const project = await projectModel.findById(projectId);
    if (!project) {
      return next(new Error('Project not found'));
    }

    socket.project = project;

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.user = decoded;

    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    next(error);
  }
});

// Socket.io event handling
io.on('connection', (socket) => {
  socket.roomId = socket.project._id.toString();
  console.log(`✅ User connected to room ${socket.roomId}`);

  socket.join(socket.roomId);

  socket.on('project-message', async (data) => {
    const message = data.message;
    const aiIsPresentInMessage = message.includes('@ai');

    // Broadcast user message
    socket.broadcast.to(socket.roomId).emit('project-message', data);

    // AI response if requested
    if (aiIsPresentInMessage) {
      try {
        const prompt = message.replace('@ai', '').trim();
        const result = await generateResult(prompt);

        io.to(socket.roomId).emit('project-message', {
          message: JSON.stringify({ text: result }),
          sender: {
            _id: 'ai',
            email: 'AI'
          }
        });
      } catch (err) {
        console.error('AI generation failed:', err.message);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected from room:', socket.roomId);
    socket.leave(socket.roomId);
  });
});

// ✅ MongoDB connection and server start
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1); // Exit app if DB connection fails
  });
