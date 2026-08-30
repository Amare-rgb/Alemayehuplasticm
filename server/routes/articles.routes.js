// routes/articles.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ============================================
// MULTER CONFIGURATION FOR PDF UPLOADS
// ============================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Created PDF uploads directory:', uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `article-${timestamp}-${random}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId || decoded.id }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/articles
 * Create a new article/note with optional PDF upload
 */
router.post('/', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  try {
    const { title, author, summary, content, note, status, tags } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    if (!author || !author.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Author name is required'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    // ✅ FIXED: PDF is OPTIONAL - handle both cases
    let pdfData = {};
    if (req.file) {
      pdfData = {
        pdfUrl: `/uploads/pdfs/${req.file.filename}`,
        pdfFileName: req.file.originalname,
        pdfFileSize: req.file.size,
      };
    } else {
      // ✅ If no PDF, set as null (or empty string based on your preference)
      pdfData = {
        pdfUrl: null,
        pdfFileName: null,
        pdfFileSize: null,
      };
    }

    // Create article/note in database
    const article = await prisma.article.create({
      data: {
        title: title.trim(),
        author: author.trim(),
        summary: summary ? summary.trim() : '',
        content: content.trim(),
        note: note ? note.trim() : '',
        status: status ? status.toUpperCase() : 'PUBLISHED',
        createdBy: req.user.id,
        publishedAt: new Date(),
        tags: tags ? JSON.parse(tags) : [],
        // ✅ Spread the PDF data (optional fields)
        ...pdfData
      }
    });

    res.status(201).json({
      success: true,
      message: 'Note saved successfully',
      data: article
    });

  } catch (error) {
    console.error('Error creating note:', error);
    // If there's an error and file was uploaded, delete it
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create note',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/articles
 * Get all articles with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let where = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.article.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/articles/:id
 * Get a single article by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id }
    });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    // Increment view count
    await prisma.article.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } }
    });

    res.status(200).json({
      success: true,
      data: article
    });

  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/articles/:id
 * Update an article with optional PDF
 */
router.put('/:id', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  try {
    const { title, author, summary, content, note, status, tags } = req.body;
    const articleId = req.params.id;

    // Find existing article
    const existingArticle = await prisma.article.findUnique({
      where: { id: articleId }
    });

    if (!existingArticle) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    // Prepare update data
    const updateData = {
      title: title ? title.trim() : existingArticle.title,
      author: author ? author.trim() : existingArticle.author,
      summary: summary ? summary.trim() : existingArticle.summary,
      content: content ? content.trim() : existingArticle.content,
      note: note !== undefined ? note.trim() : existingArticle.note,
      status: status ? status.toUpperCase() : existingArticle.status,
      updatedAt: new Date(),
      tags: tags ? JSON.parse(tags) : existingArticle.tags
    };

    // ✅ Handle PDF update if new file is uploaded (optional)
    if (req.file) {
      // Delete old PDF file if exists
      if (existingArticle.pdfUrl) {
        const oldFilePath = path.join(__dirname, '../', existingArticle.pdfUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (unlinkError) {
            console.error('Error deleting old PDF:', unlinkError);
          }
        }
      }
      
      updateData.pdfUrl = `/uploads/pdfs/${req.file.filename}`;
      updateData.pdfFileName = req.file.originalname;
      updateData.pdfFileSize = req.file.size;
    }
    // ✅ If no new PDF, keep existing PDF data (don't change it)

    // Update article
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedArticle
    });

  } catch (error) {
    console.error('Error updating note:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update note',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: req.params.id }
    });
    
    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    // Delete associated PDF file if exists
    if (article.pdfUrl) {
      const filePath = path.join(__dirname, '../', article.pdfUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkError) {
          console.error('Error deleting PDF file:', unlinkError);
        }
      }
    }

    // Delete article from database
    await prisma.article.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete note',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/articles/:id/status
 * Update article status (publish/draft/archive)
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const statusUpper = status.toUpperCase();
    if (!validStatuses.includes(statusUpper)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const article = await prisma.article.update({
      where: { id: req.params.id },
      data: { 
        status: statusUpper, 
        updatedAt: new Date() 
      }
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Article status updated to ${statusUpper}`,
      data: article
    });

  } catch (error) {
    console.error('Error updating article status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update article status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/articles/stats/summary
 * Get article statistics
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const [total, published, draft, archived] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.article.count({ where: { status: 'DRAFT' } }),
      prisma.article.count({ where: { status: 'ARCHIVED' } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        stats: {
          published,
          draft,
          archived
        }
      }
    });

  } catch (error) {
    console.error('Error fetching article stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch article statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/articles/search/query
 * Search articles by title, author, or content
 */
router.get('/search/query', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const articles = await prisma.article.findMany({
      where: {
        AND: [
          {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { author: { contains: q, mode: 'insensitive' } },
              { summary: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } }
            ]
          },
          { status: 'PUBLISHED' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: articles
    });

  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search articles',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;