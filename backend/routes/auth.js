import express from 'express';
import { signup, login, logout, getAuthStatus } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define authentication routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/status', protect, getAuthStatus); 


export default router;