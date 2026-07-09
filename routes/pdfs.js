const express = require('express');
const router = express.Router();
const multer = require('multer');
const PDF = require('../models/PDF');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// POST - Upload PDF
router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { uploadedBy = 'anonymous', title, category = 'general', tags } = req.body;

    const pdf = new PDF({
      filename: `${Date.now()}-${req.file.originalname}`,
      originalName: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedBy,
      title: title || req.file.originalname,
      category,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    });

    await pdf.save();

    res.status(201).json({
      success: true,
      message: 'PDF uploaded successfully',
      data: {
        id: pdf._id,
        filename: pdf.filename,
        title: pdf.title,
        size: pdf.size,
        uploadedBy: pdf.uploadedBy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading PDF',
      error: error.message
    });
  }
});

// GET - List all PDFs (without data)
router.get('/', async (req, res) => {
  try {
    const { category, uploadedBy, isPublic } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (uploadedBy) filter.uploadedBy = uploadedBy;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';

    const pdfs = await PDF.find(filter)
      .select('-data')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'PDFs retrieved successfully',
      data: pdfs,
      count: pdfs.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving PDFs',
      error: error.message
    });
  }
});

// GET - Download single PDF
router.get('/:id', async (req, res) => {
  try {
    const pdf = await PDF.findById(req.params.id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    res.set('Content-Type', pdf.contentType);
    res.set('Content-Disposition', `attachment; filename="${pdf.originalName}"`);
    res.send(pdf.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving PDF',
      error: error.message
    });
  }
});

// PATCH - Update PDF metadata
router.patch('/:id', async (req, res) => {
  try {
    const { title, category, tags, isPublic } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags.split(',').map(t => t.trim());
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const pdf = await PDF.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    res.json({
      success: true,
      message: 'PDF updated successfully',
      data: pdf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating PDF',
      error: error.message
    });
  }
});

// DELETE - Delete PDF
router.delete('/:id', async (req, res) => {
  try {
    const pdf = await PDF.findByIdAndDelete(req.params.id);

    if (!pdf) {
      return res.status(404).json({
        success: false,
        message: 'PDF not found'
      });
    }

    res.json({
      success: true,
      message: 'PDF deleted successfully',
      data: pdf
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting PDF',
      error: error.message
    });
  }
});

module.exports = router;
