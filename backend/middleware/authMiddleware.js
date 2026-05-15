import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes that require authentication
export const protect = async (req, res, next) => {
  let token;

  // Read the JWT from the httpOnly cookie
  token = req.cookies.token;

  if (token) {
    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by ID from the token payload and attach it to the request object
      // We exclude the password field for security
      req.user = await User.findById(decoded.userId).select('-password');
      
      if (!req.user) {
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};