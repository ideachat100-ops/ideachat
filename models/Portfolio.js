const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['graphic-design', 'logo', 'social-media', 'web-design', 'brand-identity', 'flyers', 'business-cards'],
    required: true
  },
  image: {
    type: Buffer,
    required: true
  },
  imageType: {
    type: String,
    default: 'image/jpeg'
  },
  imageSize: Number,
  description: String,
  link: String,
  uploadedBy: {
    type: String,
    default: 'admin'
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
