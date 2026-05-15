import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    trim: true,
  },
  // Updated participants structure with roles
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      default: 'editor',
    },
  }],
}, {
  timestamps: true,
});

// Index for faster queries
roomSchema.index({ 'participants.user': 1 });

export default mongoose.model('Room', roomSchema);
