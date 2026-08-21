const express = require('express');
const router = express.Router();
const slugify = require('slugify');
const prisma = require('../lib/prisma');
const { requireAdmin } = require('../middleware/auth');
const { getServerSession } = require('../lib/auth');

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const { published, limit = '12' } = req.query;
    const session = await getServerSession(req);
    const isAdmin = session?.user?.role === 'ADMIN';

    const where = {};
    if (published === 'true') {
      where.published = true;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Create blog post
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, image, category, readTime } = req.body;

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
        image: image || '',
        category: category || 'Agriculture',
        readTime: parseInt(readTime) || 3,
        authorId: req.session.user.id,
        published: true,
      },
    });

    res.status(201).json({ post });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Get single blog post
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

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
router.put('/:slug', requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content, excerpt, image, category, readTime, published } = req.body;

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const updated = await prisma.blogPost.update({
      where: { id: existingPost.id },
      data: {
        title: title || existingPost.title,
        content: content || existingPost.content,
        excerpt: excerpt || existingPost.excerpt,
        image: image !== undefined ? image : existingPost.image,
        category: category || existingPost.category,
        readTime: readTime || existingPost.readTime,
        published: published !== undefined ? published : existingPost.published,
      },
    });

    res.json({ post: updated });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete blog post
router.delete('/:slug', requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    await prisma.blogPost.delete({
      where: { id: existingPost.id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

module.exports = router;