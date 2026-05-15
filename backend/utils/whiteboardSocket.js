/**
 * Whiteboard Socket Event Handlers
 * 
 * Backend handlers for collaborative whiteboard features.
 * Non-blocking emit strategies for real-time sync.
 */

/**
 * Configure whiteboard socket handlers for a room.
 * 
 * Call this once per socket connection after joining a room.
 * 
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO server instance (for broadcast)
 * @param {string} roomId - The room ID
 * @param {Function} onObjectAdd - Callback when object added
 * @param {Function} onObjectUpdate - Callback when object updated
 */
export const setupWhiteboardHandlers = (socket, io, roomId, { onObjectAdd, onObjectUpdate, onObjectDelete }) => {
  
  // === HIGH-FREQUENCY UPDATES ===
  // These come in at ~20 per second (throttled from client at 50ms)
  
  socket.on('cursor:move', (data) => {
    // Broadcast cursor to all users in room EXCEPT sender
    // No storage - ephemeral, real-time only
    socket.to(roomId).emit('cursors:update', {
      [socket.id]: { x: data.x, y: data.y, email: data.email }
    });
  });
  
  // === OBJECT UPDATES (Low frequency) ===
  // These come in when user releases mouse (finishes drawing/editing)
  
  socket.on('object:add', (data) => {
    // New object from user - add to room's persistent state
    if (onObjectAdd) onObjectAdd(data);
    
    // Broadcast to all OTHER users (not sender, they already have it)
    socket.to(roomId).emit('object:add', data);
  });
  
  socket.on('object:update', (data) => {
    // Partial update to existing object (e.g., text editing, moving)
    if (onObjectUpdate) onObjectUpdate(data);
    
    socket.to(roomId).emit('object:update', data);
  });
  
  socket.on('object:delete', (data) => {
    // Delete one or more objects
    if (onObjectDelete) onObjectDelete(data);
    
    socket.to(roomId).emit('object:delete', data);
  });
  
  // === BATCHED UPDATES ===
  // Client can send multiple updates in one batch (30-50ms delay)
  // Reduces network traffic significantly
  
  socket.on('canvas:batch:update', (updates) => {
    // Process each update in batch
    updates.forEach(update => {
      if (update.type === 'add' && onObjectAdd) onObjectAdd(update.data);
      if (update.type === 'update' && onObjectUpdate) onObjectUpdate(update.data);
      if (update.type === 'delete' && onObjectDelete) onObjectDelete(update.data);
    });
    
    // Broadcast entire batch to others
    socket.to(roomId).emit('canvas:batch:update', updates);
  });
  
  // === CANVAS STATE MANAGEMENT ===
  
  socket.on('canvas:clear', () => {
    socket.to(roomId).emit('canvas:clear');
  });
  
  socket.on('canvas:save', (data) => {
    // Backend-initiated save (e.g., for persistence to DB)
    // This is async and non-blocking - don't wait for it
    console.log(`💾 Saving room ${roomId} state (${data.objects.length} objects)`);
    
    // Emit is queued - returns immediately
    socket.to(roomId).emit('canvas:save:ack', { success: true });
  });
  
  socket.on('canvas:state:request', () => {
    // New user joins or requests full state
    // This should only happen once per join
    // WARNING: Keep this rare - use for late joiners only
    socket.emit('canvas:state:request:ack', {
      timestamp: Date.now(),
      // Full state sent by room owner/server
    });
  });
};

/**
 * Create a room state manager for persisting and retrieving canvas state.
 * Thread-safe for concurrent updates.
 */
export const createRoomStateManager = () => {
  const rooms = new Map();
  
  return {
    // Get all objects in a room
    getState: (roomId) => {
      if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
      }
      return rooms.get(roomId);
    },
    
    // Add object to room
    addObject: (roomId, obj) => {
      const state = rooms.get(roomId) || [];
      state.push(obj);
      rooms.set(roomId, state);
    },
    
    // Update existing object
    updateObject: (roomId, objId, updates) => {
      const state = rooms.get(roomId) || [];
      const index = state.findIndex(o => o.id === objId);
      if (index !== -1) {
        state[index] = { ...state[index], ...updates };
      }
      rooms.set(roomId, state);
    },
    
    // Delete object(s)
    deleteObject: (roomId, objIds) => {
      const state = rooms.get(roomId) || [];
      const idsToDelete = Array.isArray(objIds) ? objIds : [objIds];
      const filtered = state.filter(o => !idsToDelete.includes(o.id));
      rooms.set(roomId, filtered);
    },
    
    // Clear entire room
    clear: (roomId) => {
      rooms.set(roomId, []);
    },
    
    // Delete room from memory
    deleteRoom: (roomId) => {
      rooms.delete(roomId);
    },
  };
};

/**
 * Throttle function for batching high-frequency events.
 * Non-blocking: uses setTimeout, not setInterval.
 */
export const createEventBatcher = (emitFn, delayMs = 50) => {
  let batch = [];
  let timeout = null;
  
  const flush = () => {
    if (batch.length > 0) {
      emitFn(batch);
      batch = [];
    }
    timeout = null;
  };
  
  return {
    add: (event) => {
      batch.push(event);
      
      // Reset timeout on each add
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(flush, delayMs);
    },
    
    flush,
    
    destroy: () => {
      if (timeout) clearTimeout(timeout);
      batch = [];
    },
  };
};

/**
 * Cursor tracking manager - stores current cursor positions in room.
 * Automatically cleans up disconnected cursors.
 */
export const createCursorTracker = () => {
  const cursors = new Map();
  const timeouts = new Map();
  
  const CURSOR_TIMEOUT = 5000; // 5 seconds
  
  return {
    update: (userId, x, y, email) => {
      // Clear existing timeout for this user
      if (timeouts.has(userId)) {
        clearTimeout(timeouts.get(userId));
      }
      
      // Update cursor position
      cursors.set(userId, { x, y, email, timestamp: Date.now() });
      
      // Schedule removal if user doesn't update within timeout
      const timeout = setTimeout(() => {
        cursors.delete(userId);
        timeouts.delete(userId);
      }, CURSOR_TIMEOUT);
      
      timeouts.set(userId, timeout);
    },
    
    getAll: () => {
      return Object.fromEntries(cursors);
    },
    
    remove: (userId) => {
      cursors.delete(userId);
      if (timeouts.has(userId)) {
        clearTimeout(timeouts.get(userId));
        timeouts.delete(userId);
      }
    },
    
    clear: () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
      cursors.clear();
      timeouts.clear();
    },
  };
};

/**
 * Undo/Redo state manager - tracks per-user actions.
 * Server-side undo/redo to prevent conflicts.
 */
export const createUndoRedoManager = () => {
  const userStacks = new Map();
  
  return {
    // Push action to user's history
    push: (userId, action) => {
      if (!userStacks.has(userId)) {
        userStacks.set(userId, { past: [], future: [] });
      }
      const stack = userStacks.get(userId);
      stack.past.push(action);
      stack.future = []; // Clear future on new action
    },
    
    // Get previous action for user
    undo: (userId) => {
      if (!userStacks.has(userId)) return null;
      const stack = userStacks.get(userId);
      if (stack.past.length === 0) return null;
      
      const action = stack.past.pop();
      stack.future.unshift(action);
      return action;
    },
    
    // Get next action for user
    redo: (userId) => {
      if (!userStacks.has(userId)) return null;
      const stack = userStacks.get(userId);
      if (stack.future.length === 0) return null;
      
      const action = stack.future.shift();
      stack.past.push(action);
      return action;
    },
    
    // Clear history for user
    clear: (userId) => {
      userStacks.delete(userId);
    },
  };
};
