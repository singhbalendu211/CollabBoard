// --- Core Modules ---
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// --- Local Modules ---
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/room.js';
import Board from './models/Board.js';
import { createCursorTracker, createRoomStateManager } from './utils/whiteboardSocket.js';

// --- Initial Setup ---
dotenv.config();
connectDB(); // Connect to MongoDB

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// --- Socket.IO Server Setup ---
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// --- Middleware ---
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json()); 
app.use(cookieParser());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// --- Real-Time State Management ---
// Cursor tracker for live cursor presence
const cursorTrackers = new Map(); // Map<roomId, CursorTracker>

const getCursorTracker = (roomId) => {
  if (!cursorTrackers.has(roomId)) {
    cursorTrackers.set(roomId, createCursorTracker());
  }
  return cursorTrackers.get(roomId);
};

// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('joinRoom', async ({ roomId, user }) => {
    socket.join(roomId);
    console.log(`✅ User ${user?.email || 'anonymous'} (${socket.id}) joined room: ${roomId}`);

    try {
      // Load initial board state for this user
      let board = await Board.findOne({ room: roomId });
      if (!board) {
        board = await Board.create({ room: roomId, objects: [] });
      }
      socket.emit('room:load', board.objects);
    } catch (error) {
      console.error(`Error loading room ${roomId}:`, error);
      socket.emit('room:load', []);
    }
  });

  // === CHAT MESSAGES ===
  socket.on('chat:message', ({ roomId, messageData }) => {
    io.to(roomId).emit('chat:message', messageData);
  });

  // === DRAWING OPERATIONS ===
  
  socket.on('object:add', async ({ roomId, data }) => {
    try {
      // Persist to database asynchronously (non-blocking)
      Board.findOneAndUpdate(
        { room: roomId },
        { $push: { objects: data } },
        { upsert: true }
      ).catch(err => console.error('DB error:', err));
      
      // Broadcast immediately to others (not sender - they already have it)
      socket.to(roomId).emit('object:add', data);
    } catch (error) {
      console.error('Error adding object:', error);
    }
  });

  socket.on('object:update', async ({ roomId, data }) => {
    try {
      // Persist update asynchronously
      Board.updateOne(
        { room: roomId, 'objects.id': data.id },
        { $set: { 'objects.$': data } }
      ).catch(err => console.error('DB error:', err));
      
      // Broadcast to others
      socket.to(roomId).emit('object:update', data);
    } catch (error) {
      console.error('Error updating object:', error);
    }
  });

  socket.on('object:delete', async ({ roomId, data }) => {
    try {
      const idsToDelete = Array.isArray(data) ? data : [data];
      
      // Persist deletion asynchronously
      Board.updateOne(
        { room: roomId },
        { $pull: { objects: { id: { $in: idsToDelete } } } }
      ).catch(err => console.error('DB error:', err));
      
      // Broadcast to others
      socket.to(roomId).emit('object:delete', data);
    } catch (error) {
      console.error('Error deleting object:', error);
    }
  });

  // === CANVAS STATE MANAGEMENT ===
  
  socket.on('canvas:clear', async ({ roomId }) => {
    try {
      // Persist asynchronously
      Board.updateOne(
        { room: roomId },
        { $set: { objects: [] } }
      ).catch(err => console.error('DB error:', err));
      
      socket.to(roomId).emit('canvas:clear');
    } catch (error) {
      console.error('Error clearing canvas:', error);
    }
  });

  socket.on('canvas:save', async ({ roomId, objects }) => {
    try {
      // Async save - don't block socket
      Board.findOneAndUpdate(
        { room: roomId },
        { objects: objects },
        { upsert: true }
      ).catch(err => console.error('DB error:', err));
      
      console.log(`💾 Canvas auto-saved for room: ${roomId} (${objects.length} objects)`);
    } catch (error) {
      console.error(`Error auto-saving canvas for room ${roomId}:`, error);
    }
  });

  // === BATCHED UPDATES ===
  socket.on('canvas:batch:update', async ({ roomId, updates }) => {
    try {
      // Process batch asynchronously
      updates.forEach(update => {
        if (update.type === 'add') {
          Board.updateOne(
            { room: roomId },
            { $push: { objects: update.data } }
          ).catch(err => console.error('DB error:', err));
        }
        // Can add update/delete handling here
      });
      
      // Broadcast batch to others
      socket.to(roomId).emit('canvas:batch:update', updates);
    } catch (error) {
      console.error('Error processing batch update:', error);
    }
  });

  // === CURSOR PRESENCE (HIGH-FREQUENCY) ===
  
  socket.on('cursor:move', ({ roomId, x, y, email }) => {
    // Get or create tracker for this room
    const tracker = getCursorTracker(roomId);
    
    // Update cursor position (in-memory only, ephemeral)
    tracker.update(socket.id, x, y, email);
    
    // Broadcast all cursors in room to all users in room
    // This is broadcast-all because late arrivals need to know all cursors
    io.to(roomId).emit('cursors:update', tracker.getAll());
  });

  // === CLEANUP ON DISCONNECT ===
  
  socket.on('disconnecting', () => {
    console.log(`🔌 User disconnecting: ${socket.id}`);
    
    // Clean up cursor from all rooms this user was in
    socket.rooms.forEach(roomId => {
      if (roomId !== socket.id) { // Skip socket's own room
        const tracker = getCursorTracker(roomId);
        tracker.remove(socket.id);
        
        // Notify others in room that cursor is gone
        socket.to(roomId).emit('cursors:update', tracker.getAll());
      }
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔥 User disconnected: ${socket.id}`);
  });
});

// --- Global Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the full error to the console
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    // In development, you might want to send the stack trace
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// --- Start Server ---
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});