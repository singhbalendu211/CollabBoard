import Room from '../models/Room.js';

/**
 * RBAC Middleware - Check if user has required role in room
 * 
 * Usage:
 *   router.delete('/:roomId', protect, requireRoomRole(['owner']), deleteRoom);
 *   router.put('/:roomId', protect, requireRoomRole(['owner', 'editor']), updateRoom);
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g., ['owner', 'editor'])
 * @returns {Function} Middleware function
 */
export const requireRoomRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { roomId } = req.params;
      const userId = req.user._id; // Set by 'protect' middleware

      // Find room and get user's role
      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }

      // Find user's participant entry
      const participant = room.participants.find(
        (p) => p.user.toString() === userId.toString()
      );

      if (!participant) {
        return res.status(403).json({ message: 'You are not a participant in this room' });
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(participant.role)) {
        return res.status(403).json({
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });
      }

      // Store role in request for use in route handlers
      req.roomRole = participant.role;
      req.room = room;

      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      res.status(500).json({ message: 'Server error checking room access' });
    }
  };
};

/**
 * Check user role in Socket.io context
 * 
 * Usage in Socket.io handler:
 *   const userRole = await getUserRoleInRoom(userId, roomId);
 *   if (userRole && ['owner', 'editor'].includes(userRole)) {
 *     // Allow draw action
 *   }
 * 
 * @param {string} userId - User ID
 * @param {string} roomId - Room ID
 * @returns {Promise<string|null>} Role name or null if not found
 */
export const getUserRoleInRoom = async (userId, roomId) => {
  try {
    const room = await Room.findById(roomId);

    if (!room) {
      return null;
    }

    const participant = room.participants.find(
      (p) => p.user.toString() === userId.toString()
    );

    return participant ? participant.role : null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Get all users in a room with their roles
 * 
 * @param {string} roomId - Room ID
 * @returns {Promise<Array>} Array of user objects with roles
 */
export const getRoomParticipantsWithRoles = async (roomId) => {
  try {
    const room = await Room.findById(roomId).populate('participants.user', 'email');

    if (!room) {
      return [];
    }

    return room.participants.map((p) => ({
      userId: p.user._id,
      email: p.user.email,
      role: p.role,
    }));
  } catch (error) {
    console.error('Error getting room participants:', error);
    return [];
  }
};
