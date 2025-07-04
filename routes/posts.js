const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../models/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for post image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `post-${uniqueId}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create new post
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { caption, location } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Process and resize image
    const processedImagePath = `./uploads/posts/processed-${req.file.filename}`;
    
    await sharp(req.file.path)
      .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(processedImagePath);

    // Delete original file and use processed version
    fs.unlinkSync(req.file.path);
    const imageUrl = path.basename(processedImagePath);

    // Insert post into database
    db.run(
      'INSERT INTO posts (user_id, caption, image_url, location) VALUES (?, ?, ?, ?)',
      [userId, caption || '', imageUrl, location || ''],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create post' });
        }

        // Get the created post with user info
        db.get(
          `SELECT 
            p.*,
            u.username,
            u.full_name,
            u.avatar,
            u.verified,
            0 as likes_count,
            0 as comments_count,
            0 as is_liked
           FROM posts p
           JOIN users u ON p.user_id = u.id
           WHERE p.id = ?`,
          [this.lastID],
          (err, post) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to retrieve post' });
            }

            res.status(201).json({
              message: 'Post created successfully',
              post: {
                id: post.id,
                userId: post.user_id,
                username: post.username,
                fullName: post.full_name,
                avatar: post.avatar,
                verified: post.verified,
                caption: post.caption,
                imageUrl: post.image_url,
                location: post.location,
                createdAt: post.created_at,
                likesCount: post.likes_count,
                commentsCount: post.comments_count,
                isLiked: post.is_liked
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get feed posts (from followed users)
router.get('/feed', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT 
      p.*,
      u.username,
      u.full_name,
      u.avatar,
      u.verified,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ?) as is_liked
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id IN (
       SELECT following_id FROM follows WHERE follower_id = ?
       UNION
       SELECT ?
     )
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, userId, limit, offset],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedPosts = posts.map(post => ({
        id: post.id,
        userId: post.user_id,
        username: post.username,
        fullName: post.full_name,
        avatar: post.avatar,
        verified: post.verified,
        caption: post.caption,
        imageUrl: post.image_url,
        location: post.location,
        createdAt: post.created_at,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        isLiked: post.is_liked > 0
      }));

      res.json({ posts: formattedPosts });
    }
  );
});

// Get explore posts (random posts from all users)
router.get('/explore', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const likesQuery = userId ? 
    `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${userId}) as is_liked` :
    '0 as is_liked';

  db.all(
    `SELECT 
      p.*,
      u.username,
      u.full_name,
      u.avatar,
      u.verified,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
      ${likesQuery}
     FROM posts p
     JOIN users u ON p.user_id = u.id
     ORDER BY RANDOM()
     LIMIT ? OFFSET ?`,
    [limit, offset],
    (err, posts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedPosts = posts.map(post => ({
        id: post.id,
        userId: post.user_id,
        username: post.username,
        fullName: post.full_name,
        avatar: post.avatar,
        verified: post.verified,
        caption: post.caption,
        imageUrl: post.image_url,
        location: post.location,
        createdAt: post.created_at,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        isLiked: post.is_liked > 0
      }));

      res.json({ posts: formattedPosts });
    }
  );
});

// Get user's posts
router.get('/user/:username', optionalAuth, (req, res) => {
  const { username } = req.params;
  const userId = req.user ? req.user.id : null;

  // First get the user ID
  db.get(
    'SELECT id FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const likesQuery = userId ? 
        `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${userId}) as is_liked` :
        '0 as is_liked';

      db.all(
        `SELECT 
          p.*,
          u.username,
          u.full_name,
          u.avatar,
          u.verified,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
          ${likesQuery}
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = ?
         ORDER BY p.created_at DESC`,
        [user.id],
        (err, posts) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          const formattedPosts = posts.map(post => ({
            id: post.id,
            userId: post.user_id,
            username: post.username,
            fullName: post.full_name,
            avatar: post.avatar,
            verified: post.verified,
            caption: post.caption,
            imageUrl: post.image_url,
            location: post.location,
            createdAt: post.created_at,
            likesCount: post.likes_count,
            commentsCount: post.comments_count,
            isLiked: post.is_liked > 0
          }));

          res.json({ posts: formattedPosts });
        }
      );
    }
  );
});

// Get single post
router.get('/:postId', optionalAuth, (req, res) => {
  const { postId } = req.params;
  const userId = req.user ? req.user.id : null;

  const likesQuery = userId ? 
    `(SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = ${userId}) as is_liked` :
    '0 as is_liked';

  db.get(
    `SELECT 
      p.*,
      u.username,
      u.full_name,
      u.avatar,
      u.verified,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
      ${likesQuery}
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({
        post: {
          id: post.id,
          userId: post.user_id,
          username: post.username,
          fullName: post.full_name,
          avatar: post.avatar,
          verified: post.verified,
          caption: post.caption,
          imageUrl: post.image_url,
          location: post.location,
          createdAt: post.created_at,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          isLiked: post.is_liked > 0
        }
      });
    }
  );
});

// Delete post
router.delete('/:postId', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  // Check if post belongs to user
  db.get(
    'SELECT * FROM posts WHERE id = ? AND user_id = ?',
    [postId, userId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Post not found or unauthorized' });
      }

      // Delete post from database
      db.run(
        'DELETE FROM posts WHERE id = ?',
        [postId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete post' });
          }

          // Delete image file
          const imagePath = `./uploads/posts/${post.image_url}`;
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }

          res.json({ message: 'Post deleted successfully' });
        }
      );
    }
  );
});

module.exports = router;