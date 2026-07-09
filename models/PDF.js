const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
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
    default: 'application/pdf'
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: String,
    default: 'anonymous'
  },
  title: String,
  category: {
    type: String,
    default: 'general'
  },
  tags: [String],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PDF', pdfSchema);
