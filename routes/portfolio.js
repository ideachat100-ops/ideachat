const express = require('express');
const router = express.Router();
const multer = require('multer');
const Portfolio = require('../models/Portfolio');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP allowed'));
    }
  }
});

// POST - Upload portfolio item
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image uploaded'
      });
    }

    const { title, category, description, link } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title and category are required'
      });
    }

    const portfolio = new Portfolio({
      title,
      category,
      image: req.file.buffer,
      imageType: req.file.mimetype,
      imageSize: req.file.size,
      description,
      link,
      uploadedBy: 'admin',
      isPublic: true
    });

    await portfolio.save();

    res.status(201).json({
      success: true,
      message: 'Portfolio item uploaded successfully',
      data: {
        id: portfolio._id,
        title: portfolio.title,
        category: portfolio.category
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET - Get all public portfolio items
router.get('/', async (req, res) => {
  try {
    const portfolios = await Portfolio.find({ isPublic: true })
      .select('-image')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: portfolios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET - Get portfolio item with image (for viewing)
router.get('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findById(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio item not found'
      });
    }

    if (!portfolio.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'This item is not public'
      });
    }

    res.set('Content-Type', portfolio.imageType);
    res.send(portfolio.image);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE - Delete portfolio item (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const portfolio = await Portfolio.findByIdAndDelete(req.params.id);

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        error: 'Portfolio item not found'
      });
    }

    res.json({
      success: true,
      message: 'Portfolio item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
