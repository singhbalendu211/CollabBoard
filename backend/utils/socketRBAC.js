import { getUserRoleInRoom } from '../middleware/rbacMiddleware.js';

/**
 * Wrap Socket.io handlers with role-based protection
 * 
 * Usage:
 *   socket.on('object:add', withRoomRole(['owner', 'editor'], async (data, userId, roomId) => {
 *     // Handle drawing
 *   }));
 * 
 * @param {string[]} allowedRoles - Array of allowed roles
 * @param {Function} handler - The actual handler function
 * @returns {Function} Protected handler
 */
export const withRoomRole = (allowedRoles, handler) => {
  return async (data, userId, roomId) => {
    try {
      const userRole = await getUserRoleInRoom(userId, roomId);

      if (!userRole) {
        console.warn(`[RBAC] User ${userId} is not in room ${roomId}`);
        return;
      }

      if (!allowedRoles.includes(userRole)) {
        console.warn(
          `[RBAC] User ${userId} (${userRole}) denied action. Required: ${allowedRoles.join(', ')}`
        );
        return;
      }

      // User has permission - execute handler
      await handler(data, userRole);
    } catch (error) {
      console.error('[RBAC] Error checking room role:', error);
    }
  };
};

/**
 * Setup Socket.io handlers with RBAC
 * 
 * This is a SAFE extension to whiteboardSocket.js that adds role checks
 * without breaking existing functionality
 * 
 * @param {Socket} socket - Socket.IO socket instance
 * @param {Object} io - Socket.IO server instance
 * @param {string} roomId - The room ID
 * @param {string} userId - The user ID
 * @param {Object} callbacks - Callback functions
 */
export const setupRBACWhiteboardHandlers = (
  socket,
  io,
  roomId,
  userId,
  {
    onObjectAdd,
    onObjectUpdate,
    onObjectDelete,
    onChatMessage,
  }
) => {
  // === DRAWING ACTIONS - owner and editor only ===

  socket.on('object:add', async (data) => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (!userRole || !['owner', 'editor'].includes(userRole)) {
      console.warn(`[Drawing] User ${userId} denied: insufficient role`);
      socket.emit('error', { message: 'Insufficient permissions to draw' });
      return;
    }

    // User can draw - proceed
    if (onObjectAdd) onObjectAdd(data);
    socket.to(roomId).emit('object:add', data);
  });

  socket.on('object:update', async (data) => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (!userRole || !['owner', 'editor'].includes(userRole)) {
      console.warn(`[Drawing] User ${userId} denied: insufficient role`);
      socket.emit('error', { message: 'Insufficient permissions to edit' });
      return;
    }

    if (onObjectUpdate) onObjectUpdate(data);
    socket.to(roomId).emit('object:update', data);
  });

  socket.on('object:delete', async (data) => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (!userRole || !['owner', 'editor'].includes(userRole)) {
      console.warn(`[Drawing] User ${userId} denied: insufficient role`);
      socket.emit('error', { message: 'Insufficient permissions to delete' });
      return;
    }

    if (onObjectDelete) onObjectDelete(data);
    socket.to(roomId).emit('object:delete', data);
  });

  // === BATCH UPDATES - owner and editor only ===

  socket.on('canvas:batch:update', async (updates) => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (!userRole || !['owner', 'editor'].includes(userRole)) {
      console.warn(`[Drawing] User ${userId} denied: insufficient role`);
      socket.emit('error', { message: 'Insufficient permissions for batch update' });
      return;
    }

    // Process each update in batch
    updates.forEach((update) => {
      if (update.type === 'add' && onObjectAdd) onObjectAdd(update.data);
      if (update.type === 'update' && onObjectUpdate) onObjectUpdate(update.data);
      if (update.type === 'delete' && onObjectDelete) onObjectDelete(update.data);
    });

    socket.to(roomId).emit('canvas:batch:update', updates);
  });

  // === CANVAS CLEAR - owner only ===

  socket.on('canvas:clear', async () => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (userRole !== 'owner') {
      console.warn(`[Canvas] User ${userId} denied clear: not owner`);
      socket.emit('error', { message: 'Only room owner can clear canvas' });
      return;
    }

    socket.to(roomId).emit('canvas:clear');
  });

  // === CHAT - all participants can message ===

  socket.on('chat:message', async (message) => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (!userRole) {
      console.warn(`[Chat] User ${userId} not in room`);
      socket.emit('error', { message: 'You are not in this room' });
      return;
    }

    // All roles (owner, editor, viewer) can chat
    if (onChatMessage) onChatMessage(message);
    socket.to(roomId).emit('chat:message', message);
  });

  // === CURSOR MOVEMENT - all participants ===

  socket.on('cursor:move', async (data) => {
    const userRole = await getUserRoleInRoom(userId, roomId);

    if (!userRole) {
      return; // Silent fail for cursor - not critical
    }

    socket.to(roomId).emit('cursors:update', {
      [socket.id]: { x: data.x, y: data.y, email: data.email },
    });
  });
};

/**
 * Check if user can perform action based on role
 * 
 * @param {string} role - User's role in room
 * @param {string} action - Action type (draw, chat, clear, manage)
 * @returns {boolean} Whether action is allowed
 */
export const canUserPerformAction = (role, action) => {
  const permissions = {
    owner: ['draw', 'edit', 'delete', 'chat', 'clear', 'manage'],
    editor: ['draw', 'edit', 'delete', 'chat'],
    viewer: ['chat', 'view'],
  };

  return permissions[role]?.includes(action) || false;
};
