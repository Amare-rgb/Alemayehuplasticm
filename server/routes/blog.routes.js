// routes/blog.routes.js
const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');
const { getServerSession } = require('../lib/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for blog media (images and videos)
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/blog');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `blog-${uniqueSuffix}${ext}`);
  }
});

const mediaFileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg', 'image/svg+xml'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const uploadMedia = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: mediaFileFilter
});

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const { published, limit = '12', page = '1' } = req.query;
    const session = await getServerSession(req);

    const where = {};
    if (published === 'true') {
      where.published = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          author: {
            select: { 
              id: true,
              name: true, 
              email: true,
              avatar: true
            }
          }
        }
      }),
      prisma.blogPost.count({ where })
    ]);

    res.json({
      posts,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Upload blog media (image or video)
router.post('/upload', requireAdmin, uploadMedia.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file uploaded' });
    }

    const mediaUrl = `/uploads/blog/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    
    res.json({
      success: true,
      mediaUrl,
      mediaType,
      message: 'Media uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Create blog post
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, image, video, category, readTime, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 150),
        image: image || video || '',
        category: category || 'Agriculture',
        readTime: parseInt(readTime) || 3,
        authorId: req.session.user.id,
        published: published !== undefined ? published : true,
      },
      include: {
        author: {
          select: { name: true, email: true, avatar: true }
        }
      }
    });

    res.status(201).json({ 
      success: true,
      post,
      message: 'Blog post created successfully'
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// ✅ FIXED: Get single blog post - supports both ID and slug
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by id first
    let post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: { 
            id: true,
            name: true, 
            email: true,
            avatar: true
          }
        }
      }
    });

    // If not found by id, try by slug
    if (!post) {
      post = await prisma.blogPost.findUnique({
        where: { slug: id },
        include: {
          author: {
            select: { 
              id: true,
              name: true, 
              email: true,
              avatar: true
            }
          }
        }
      });
    }

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Increment views
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    });

    res.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Update blog post
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, image, video, category, readTime, published } = req.body;

    // Try to find by id first
    let existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    // If not found by id, try by slug
    if (!existingPost) {
      existingPost = await prisma.blogPost.findUnique({
        where: { slug: id }
      });
    }

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (image !== undefined) updateData.image = image;
    if (video !== undefined) updateData.image = video;
    if (category) updateData.category = category;
    if (readTime) updateData.readTime = parseInt(readTime);
    if (published !== undefined) updateData.published = published;

    const updated = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: updateData,
      include: {
        author: {
          select: { name: true, email: true, avatar: true }
        }
      }
    });

    res.json({ 
      success: true,
      post: updated,
      message: 'Blog post updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by id first
    let existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    // If not found by id, try by slug
    if (!existingPost) {
      existingPost = await prisma.blogPost.findUnique({
        where: { slug: id }
      });
    }

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    // Delete associated media file if exists
    if (existingPost.image) {
      const mediaPath = path.join(__dirname, '..', existingPost.image);
      if (fs.existsSync(mediaPath)) {
        try {
          fs.unlinkSync(mediaPath);
          console.log('🗑️ Deleted media file:', mediaPath);
        } catch (unlinkError) {
          console.warn('⚠️ Could not delete media file:', unlinkError.message);
        }
      }
    }

    await prisma.blogPost.delete({
      where: { id: existingPost.id }
    });

    res.json({ 
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

module.exports = router;