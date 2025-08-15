const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collabboard', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// HTTP Server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 mins
    skipMiddlewares: true,
  },
});

// In-memory room state map
const roomStates = new Map();

// Initialize memory with DB state
const initializeRoomStates = async () => {
  try {
    const rooms = await Room.find({});
    rooms.forEach(room => {
      roomStates.set(room.roomId, {
        code: room.code || '',
        language: room.language || 'javascript',
        participants: [],
      });
    });
    console.log(`Initialized ${rooms.length} room states from DB`);
  } catch (err) {
    console.error('Room init error:', err.message);
  }
};

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`⚡ New user connected: ${socket.id}`);
  let currentRoomId = null;
  let codeUpdateTimeout = null;

  //  Updated handler to accept currentCode from frontend
  socket.on('join_room', async ({ roomId, username, isAdmin, currentCode }) => {
    currentRoomId = roomId;

    if (!roomStates.has(roomId)) {
      const dbRoom = await Room.findOne({ roomId });
      if (dbRoom) {
        roomStates.set(roomId, {
          code: dbRoom.code || '',
          language: dbRoom.language || 'javascript',
          participants: [],
        });
      } else {
        await Room.create({ roomId, code: currentCode || '', language: 'javascript', participants: [] });
        roomStates.set(roomId, {
          code: currentCode || '',
          language: 'javascript',
          participants: [],
        });
      }
    }

    const roomState = roomStates.get(roomId);
    const participant = {
      username,
      socketId: socket.id,
      isAdmin: !!isAdmin,
      joinedAt: new Date(),
    };

    // Update in-memory
    roomState.participants.push(participant);

    // DB update
    await Room.updateOne(
      { roomId },
      { $addToSet: { participants: participant }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );

    // Join room and sync code/language
    socket.join(roomId);
    socket.emit('load-initial-code', roomState.code);
    // socket.emit('room_state', {
    //   code: roomState.code,
    //   language: roomState.language,
    //   participants: [...roomState.participants],
    // });

    io.to(roomId).emit('room_state', {
      code: roomState.code,
      language: roomState.language,
      participants: roomState.participants,
    });


    io.to(roomId).emit('participant_joined', participant);
    console.log(`${username} joined ${roomId}`);
  });

  socket.on('CODE_CHANGE', async ({ roomId, code, senderName, revision }) => {
    if (!roomStates.has(roomId)) return;
    const roomState = roomStates.get(roomId);

    roomState.code = code;

    // Broadcast updated code using CODE_CHANGE event
    socket.to(roomId).emit('CODE_CHANGE', { code, senderName, revision });

    clearTimeout(codeUpdateTimeout);
    codeUpdateTimeout = setTimeout(async () => {
      try {
        await Room.updateOne({ roomId }, { $set: { code, updatedAt: new Date() } });
        console.log(`Code saved for room ${roomId}`);
      } catch (err) {
        console.error('Error saving code to DB:', err.message);
      }
    }, 1500);
  });

  socket.on('chat_message', (message) => {
    io.to(message.roomId).emit('chat_message', message);
  });

  socket.on('language_change', async ({ roomId, language, senderName }) => {
    if (!roomStates.has(roomId)) return;

    roomStates.get(roomId).language = language;

    await Room.updateOne({ roomId }, { $set: { language, updatedAt: new Date() } });

    io.to(roomId).emit('language_changed', {
      language,
      senderName,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', async () => {
    if (!currentRoomId) return;
    const roomState = roomStates.get(currentRoomId);

    if (roomState) {
      roomState.participants = roomState.participants.filter(p => p.socketId !== socket.id);
      await Room.updateOne(
        { roomId: currentRoomId },
        { $pull: { participants: { socketId: socket.id } } }
      );
      io.to(currentRoomId).emit('participant_left', { socketId: socket.id });
    }
  });

  socket.on('error', (err) => {
    console.error(`Socket error (${socket.id}):`, err);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    await initializeRoomStates();
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err.message);
    process.exit(1);
  }
};

startServer();

process.on('unhandledRejection', err => {
  console.error('Unhandled rejection:', err.message);
});

process.on('uncaughtException', err => {
  console.error('Uncaught exception:', err.message);
});

