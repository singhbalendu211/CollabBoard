import Room from '../models/Room.js';
import Board from '../models/Board.js';
import User from '../models/User.js';

// @desc    Create a new collaborative room
// @route   POST /api/rooms
// @access  Private
export const createRoom = async (req, res) => {
  const { roomName } = req.body;

  if (!roomName) {
    return res.status(400).json({ message: 'Room name is required' });
  }

  try {
    // Create the room with the current user as owner
    const room = await Room.create({
      roomName,
      participants: [
        {
          user: req.user._id,
          role: 'owner', // Creator is always the owner
        },
      ],
    });

    // Create a corresponding board for this new room
    await Board.create({
      room: room._id,
      strokes: [], // Initially empty
    });

    // Populate user data before responding
    await room.populate('participants.user', 'email');
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating room', error: error.message });
  }
};

// @desc    Join an existing room
// @route   PUT /api/rooms/:roomId/join
// @access  Private
export const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is already in the room
    const alreadyParticipant = room.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (alreadyParticipant) {
      return res.status(200).json({ message: 'Already in room', room });
    }

    // Add user as editor (default role for new participants)
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.roomId,
      {
        $push: {
          participants: {
            user: req.user._id,
            role: 'editor', // Default role for joining users
          },
        },
      },
      { new: true }
    ).populate('participants.user', 'email');

    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: 'Server error joining room', error: error.message });
  }
};

// @desc    Get all rooms for the currently logged-in user
// @route   GET /api/rooms
// @access  Private
export const getUserRooms = async (req, res) => {
  try {
    // Find rooms where the participants array includes the current user's ID
    const rooms = await Room.find({ 'participants.user': req.user._id })
      .populate('participants.user', 'email')
      .sort({ createdAt: -1 }); // Show newest rooms first
      
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching rooms', error: error.message });
  }
};

// @desc    Get the current state of a board
// @route   GET /api/rooms/:roomId/board
// @access  Private
export const getBoardState = async (req, res) => {
  try {
    const board = await Board.findOne({ room: req.params.roomId });
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found for this room' });
    }
    
    res.status(200).json(board);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching board state', error: error.message });
  }
};

// @desc    Save the state of a board
// @route   PUT /api/rooms/:roomId/board
// @access  Private
export const saveBoardState = async (req, res) => {
  const { objects } = req.body;

  try {
    // Find the board by room ID and update its objects
    // 'upsert: true' will create a new board if one doesn't exist for the room
    const board = await Board.findOneAndUpdate(
      { room: req.params.roomId },
      { objects },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: 'Board state saved successfully', board });
  } catch (error) {
    res.status(500).json({ message: 'Server error saving board state', error: error.message });
  }
};


// @desc    Rename a room
// @route   PUT /api/rooms/:roomId
// @access  Private
export const renameRoom = async (req, res) => {
  const { newRoomName } = req.body;
  if (!newRoomName) {
    return res.status(400).json({ message: 'New room name is required' });
  }
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.roomId,
      { roomName: newRoomName },
      { new: true } // Return the updated document
    );
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: 'Server error renaming room' });
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:roomId
// @access  Private
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Also delete the associated board to keep the database clean
    await Board.deleteOne({ room: room._id });
    await room.deleteOne();

    res.status(200).json({ message: 'Room and associated board deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting room' });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id; // From the 'protect' middleware

    // Use MongoDB's $pull operator to remove the user from the participants array
    const room = await Room.findByIdAndUpdate(
      roomId,
      { $pull: { 'participants': { user: userId } } },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({ message: 'You have left the room.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error leaving room' });
  }
};

// @desc    Fetch a dynamic image for a room based on keywords
// @route   GET /api/rooms/:roomId/image
// @access  Public
export const getRoomImage = async (req, res) => {
  try {
    const { keywords } = req.query;
    const query = keywords || 'workspace collaboration';

    console.log(`[Image API] Room: ${req.params.roomId}, Query: "${query}"`);

    // Validate API key exists
    if (!process.env.UNSPLASH_API_KEY) {
      console.error('[Image API] UNSPLASH_API_KEY not set in environment');
      const defaultImageUrl =
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop';
      return res.status(200).json({ imageUrl: defaultImageUrl });
    }

    // Call Unsplash API
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&client_id=${process.env.UNSPLASH_API_KEY}&per_page=1&orientation=landscape`;

    console.log(`[Image API] Calling Unsplash with URL: ${unsplashUrl.substring(0, 80)}...`);

    const response = await fetch(unsplashUrl);
    const data = await response.json();

    console.log(`[Image API] Unsplash response status: ${response.status}, results: ${data.results?.length || 0}`);

    if (data.results && data.results.length > 0) {
      const imageUrl = data.results[0].urls.regular;
      console.log(`[Image API] SUCCESS: Got image for "${query}"`);
      return res.status(200).json({ imageUrl });
    }

    // Fallback to default image if no results
    console.log(`[Image API] No results from Unsplash for "${query}", using default`);
    const defaultImageUrl =
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop';
    res.status(200).json({ imageUrl: defaultImageUrl });
  } catch (error) {
    console.error('[Image API] Error fetching room image:', error);
    // Return default image on error instead of failing
    res.status(200).json({
      imageUrl:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    });
  }
};

// @desc    Get all users in a room with their roles
// @route   GET /api/rooms/:roomId/users
// @access  Private
export const getRoomUsers = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId).populate('participants.user', 'email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is in the room
    const userInRoom = room.participants.some(
      (p) => p.user._id.toString() === req.user._id.toString()
    );

    if (!userInRoom) {
      return res.status(403).json({ message: 'You are not a participant in this room' });
    }

    // Build response with user emails and roles
    const users = room.participants.map((participant) => ({
      userId: participant.user._id,
      email: participant.user.email,
      role: participant.role,
    }));

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching room users', error: error.message });
  }
};

// @desc    Change a user's role in a room (owner only)
// @route   PATCH /api/rooms/:roomId/role
// @access  Private
export const changeUserRole = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { targetUserId, newRole } = req.body;

    // Validate role
    if (!['owner', 'editor', 'viewer'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role. Must be owner, editor, or viewer' });
    }

    // Find room
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if requester is the owner
    const requester = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );

    if (!requester || requester.role !== 'owner') {
      return res.status(403).json({ message: 'Only room owner can change roles' });
    }

    // Find target user
    const targetParticipant = room.participants.find(
      (p) => p.user.toString() === targetUserId
    );

    if (!targetParticipant) {
      return res.status(404).json({ message: 'User not found in this room' });
    }

    // Prevent changing owner role
    if (targetParticipant.role === 'owner') {
      return res.status(400).json({ message: 'Cannot change the owner\'s role' });
    }

    // Prevent setting someone else as owner
    if (newRole === 'owner') {
      return res.status(400).json({ message: 'Can only have one owner per room' });
    }

    // Update the role
    targetParticipant.role = newRole;
    await room.save();

    res.status(200).json({ message: 'User role updated successfully', room });
  } catch (error) {
    res.status(500).json({ message: 'Server error changing user role', error: error.message });
  }
}