import mongoose from 'mongoose';

// A sub-schema for individual drawing objects
const objectSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['pencil', 'eraser', 'line', 'rectangle'],
    required: true,
  },
  color: {
    type: String,
    default: '#000000',
  },
  strokeWidth: {
    type: Number,
    default: 2,
  },
  // The path consists of an array of coordinates
  path: [{
    x: Number,
    y: Number,
  }],
}, {
  _id: false, // Don't create a separate _id for each object
});

const boardSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true, // Index for faster board lookups by room
  },
  objects: [objectSchema],
}, {
  timestamps: true,
});

export default mongoose.model('Board', boardSchema);