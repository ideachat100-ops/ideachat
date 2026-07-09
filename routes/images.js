const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../models/Image');

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

// POST - Upload image
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { uploadedBy = 'anonymous', category = 'general', description, tags } = req.body;

    const image = new Image({
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedBy,
      category,
      description,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    await image.save();

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: image._id,
        filename: image.filename,
        size: image.size,
        uploadedBy: image.uploadedBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// GET - List all images (without data)
router.get('/', async (req, res) => {
  try {
    const { category, uploadedBy, isPublic } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (uploadedBy) filter.uploadedBy = uploadedBy;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';

    const images = await Image.find(filter)
      .select('-data')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Images retrieved successfully',
      data: images,
      count: images.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving images',
      error: error.message
    });
  }
});

// GET - Download single image
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.set('Content-Type', image.contentType);
    res.set('Content-Disposition', `attachment; filename="${image.originalName}"`);
    res.send(image.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving image',
      error: error.message
    });
  }
});

// PATCH - Update image metadata
router.patch('/:id', async (req, res) => {
  try {
    const { category, description, tags, isPublic } = req.body;
    const updateData = {};

    if (category) updateData.category = category;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags.split(',').map(t => t.trim());
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const image = await Image.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      message: 'Image updated successfully',
      data: image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating image',
      error: error.message
    });
  }
});

// DELETE - Delete image
router.delete('/:id', async (req, res) => {
  try {
    const image = await Image.findByIdAndDelete(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: image
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
});

module.exports = router;
