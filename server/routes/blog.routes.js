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

// Video platform regex patterns
const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
const VIMEO_ID_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/i;
const DAILYMOTION_ID_REGEX = /dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/i;
const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m3u8'];

const getKnownPlatformEmbedUrl = (url) => {
  if (!url) return null;

  const yt = url.match(YOUTUBE_ID_REGEX);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  const vm = url.match(VIMEO_ID_REGEX);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;

  const dm = url.match(DAILYMOTION_ID_REGEX);
  if (dm) return `https://www.dailymotion.com/embed/video/${dm[1]}`;

  return null;
};

const isVideoUrl = (url) => {
  if (!url) return false;
  
  url = url.trim();
  
  if (getKnownPlatformEmbedUrl(url)) return true;
  
  const lowerUrl = url.toLowerCase();
  if (DIRECT_VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext))) {
    return true;
  }
  
  const videoPatterns = [
    'youtube.com/watch',
    'youtu.be/',
    'vimeo.com/',
    'dailymotion.com/',
    '/video/',
    'stream',
    'watch?v=',
    'v=',
    'embed/',
    'shorts/',
    'live/'
  ];
  
  return videoPatterns.some(pattern => lowerUrl.includes(pattern));
};

const normalizeVideoUrl = (url) => {
  if (!url) return null;
  
  url = url.trim();
  
  if (url.includes('youtube.com/embed/') || 
      url.includes('player.vimeo.com/') || 
      url.includes('dailymotion.com/embed/')) {
    return url;
  }
  
  const platformEmbed = getKnownPlatformEmbedUrl(url);
  if (platformEmbed) return platformEmbed;
  
  const lowerUrl = url.toLowerCase();
  if (DIRECT_VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext))) {
    return url;
  }
  
  return url;
};

const formatPost = (post) => {
  console.log('📹 Formatting post:', {
    id: post.id,
    title: post.title,
    image: post.image,
    video: post.video
  });

  const hasVideoField = !!post.video;
  const imageIsVideo = post.image ? isVideoUrl(post.image) : false;
  const isVideo = hasVideoField || imageIsVideo;
  
  let media = null;
  let mediaType = null;
  
  if (hasVideoField) {
    media = normalizeVideoUrl(post.video);
    mediaType = 'video';
  } else if (imageIsVideo) {
    media = normalizeVideoUrl(post.image);
    mediaType = 'video';
  } else if (post.image) {
    media = post.image;
    mediaType = 'image';
  }
  
  return {
    ...post,
    media,
    mediaType,
    isVideo
  };
};

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const { published, limit = '12', page = '1', search } = req.query;
    const session = await getServerSession(req);

    const where = {};
    if (published === 'true') {
      where.published = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
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

    const formattedPosts = posts.map(formatPost);

    res.json({
      posts: formattedPosts,
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
      message: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// ✅ FIXED: Create blog post - properly handles video URLs from internet
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, image, video, category, readTime, published } = req.body;

    console.log('📥 RECEIVED DATA:');
    console.log('  Title:', title);
    console.log('  Image:', image);
    console.log('  Video:', video);

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

    let finalVideoUrl = null;
    let finalImageUrl = null;

    // ✅ CRITICAL: Process video URL from internet
    if (video && video.trim() !== '') {
      console.log('🎬 Processing video URL from internet:', video);
      const normalized = normalizeVideoUrl(video.trim());
      if (normalized) {
        finalVideoUrl = normalized;
        console.log('✅ Normalized video URL:', finalVideoUrl);
      } else {
        finalVideoUrl = video.trim();
        console.log('⚠️ Using original video URL:', finalVideoUrl);
      }
    }

    // Process image
    if (image && image.trim() !== '') {
      if (isVideoUrl(image.trim())) {
        console.log('🎬 Image field contains video URL:', image);
        if (!finalVideoUrl) {
          finalVideoUrl = normalizeVideoUrl(image.trim());
        }
      } else {
        finalImageUrl = image.trim();
        console.log('🖼️ Image URL:', finalImageUrl);
      }
    }

    console.log('📦 FINAL DATA TO SAVE:');
    console.log('  Image:', finalImageUrl);
    console.log('  Video:', finalVideoUrl);

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 150),
        image: finalImageUrl,
        video: finalVideoUrl,
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

    console.log('✅ POST CREATED WITH VIDEO:', post.video);

    res.status(201).json({
      success: true,
      post: formatPost(post),
      message: 'Blog post created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating blog post:', error);
    res.status(500).json({ 
      error: 'Failed to create blog post',
      details: error.message 
    });
  }
});

// Get single blog post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

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

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } }
    });

    res.json({
      post: formatPost(post)
    });
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

    let existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

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
    if (category) updateData.category = category;
    if (readTime) updateData.readTime = parseInt(readTime);
    if (published !== undefined) updateData.published = published;

    let finalVideoUrl = existingPost.video;
    let finalImageUrl = existingPost.image;

    if (video !== undefined) {
      if (video && video.trim() !== '') {
        const normalized = normalizeVideoUrl(video.trim());
        finalVideoUrl = normalized || video.trim();
      } else {
        finalVideoUrl = null;
      }
    }

    if (image !== undefined) {
      if (image && image.trim() !== '') {
        if (isVideoUrl(image.trim())) {
          if (!finalVideoUrl) {
            finalVideoUrl = normalizeVideoUrl(image.trim());
          }
          finalImageUrl = null;
        } else {
          finalImageUrl = image.trim();
        }
      } else {
        finalImageUrl = null;
      }
    }

    updateData.video = finalVideoUrl;
    updateData.image = finalImageUrl;

    console.log('🔄 Updating post video:', finalVideoUrl);

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
      post: formatPost(updated),
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

    let existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      existingPost = await prisma.blogPost.findUnique({
        where: { slug: id }
      });
    }

    if (!existingPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    if (existingPost.image && existingPost.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', existingPost.image);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (unlinkError) {
          console.warn('⚠️ Could not delete image file:', unlinkError.message);
        }
      }
    }

    if (existingPost.video && existingPost.video.startsWith('/uploads/')) {
      const videoPath = path.join(__dirname, '..', existingPost.video);
      if (fs.existsSync(videoPath)) {
        try {
          fs.unlinkSync(videoPath);
        } catch (unlinkError) {
          console.warn('⚠️ Could not delete video file:', unlinkError.message);
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