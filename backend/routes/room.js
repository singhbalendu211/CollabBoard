import express from 'express';
import {
  createRoom,
  joinRoom,
  getUserRooms,
  getBoardState,
  saveBoardState,
  renameRoom, 
  deleteRoom, 
  leaveRoom,
  getRoomImage,
  getRoomUsers,
  changeUserRole,

} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRoomRole } from '../middleware/rbacMiddleware.js';

const router = express.Router();

// Unprotected endpoints (before protect middleware)
router.post('/:roomId/save', saveBoardState);
router.get('/:roomId/image', getRoomImage); // Public image endpoint

// All routes in this file are protected and require a valid token
router.use(protect);

// Routes for creating a room and getting all of a user's rooms
router.route('/')
  .post(createRoom)
  .get(getUserRooms);

// Route for a user to join a room
router.route('/:roomId/join')
  .put(joinRoom);

// Routes for getting and saving the board state for a specific room
// Any participant can view (read-only access)
router.route('/:roomId/board')
  .get(requireRoomRole(['owner', 'editor', 'viewer']), getBoardState)
  .put(requireRoomRole(['owner', 'editor']), saveBoardState);

// Rename - owner only
router.route('/:roomId')
  .put(requireRoomRole(['owner']), renameRoom)
  .delete(requireRoomRole(['owner']), deleteRoom);

// Leave room - all participants
router.route('/:roomId/leave').put(leaveRoom);

// Get room users with roles - all participants can view
router.route('/:roomId/users')
  .get(requireRoomRole(['owner', 'editor', 'viewer']), getRoomUsers);

// Change user role - owner only
router.route('/:roomId/role')
  .patch(requireRoomRole(['owner']), changeUserRole);

export default router;