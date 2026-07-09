const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    default: 'image/jpeg'
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: String,
    default: 'anonymous'
  },
  category: {
    type: String,
    default: 'general'
  },
  description: String,
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);
