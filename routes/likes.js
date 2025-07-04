const express = require('express');
const { db } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Like/unlike a post
router.post('/toggle', authenticateToken, (req, res) => {
  const { postId } = req.body;
  const userId = req.user.id;

  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  // Check if post exists
  db.get(
    'SELECT id, user_id FROM posts WHERE id = ?',
    [postId],
    (err, post) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      // Check if user already liked this post
      db.get(
        'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, userId],
        (err, existingLike) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingLike) {
            // Unlike the post
            db.run(
              'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
              [postId, userId],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to unlike post' });
                }

                // Get updated like count
                db.get(
                  'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
                  [postId],
                  (err, result) => {
                    if (err) {
                      return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                      message: 'Post unliked successfully',
                      isLiked: false,
                      likesCount: result.count
                    });
                  }
                );
              }
            );
          } else {
            // Like the post
            db.run(
              'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
              [postId, userId],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to like post' });
                }

                // Create notification for post owner
                if (post.user_id !== userId) {
                  db.run(
                    'INSERT INTO notifications (user_id, from_user_id, type, post_id, message) VALUES (?, ?, ?, ?, ?)',
                    [post.user_id, userId, 'like', postId, `${req.user.username} liked your post`],
                    (err) => {
                      if (err) {
                        console.error('Failed to create notification:', err);
                      }
                    }
                  );
                }

                // Get updated like count
                db.get(
                  'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
                  [postId],
                  (err, result) => {
                    if (err) {
                      return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                      message: 'Post liked successfully',
                      isLiked: true,
                      likesCount: result.count
                    });
                  }
                );
              }
            );
          }
        }
      );
    }
  );
});

// Get users who liked a post
router.get('/post/:postId', (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT 
      u.id,
      u.username,
      u.full_name,
      u.avatar,
      u.verified,
      l.created_at
     FROM likes l
     JOIN users u ON l.user_id = u.id
     WHERE l.post_id = ?
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [postId, limit, offset],
    (err, likes) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedLikes = likes.map(like => ({
        userId: like.id,
        username: like.username,
        fullName: like.full_name,
        avatar: like.avatar,
        verified: like.verified,
        likedAt: like.created_at
      }));

      res.json({ likes: formattedLikes });
    }
  );
});

// Get like count for a post
router.get('/count/:postId', (req, res) => {
  const { postId } = req.params;

  db.get(
    'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
    [postId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ count: result.count });
    }
  );
});

// Check if user liked a post
router.get('/check/:postId', authenticateToken, (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  db.get(
    'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
    [postId, userId],
    (err, like) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ isLiked: !!like });
    }
  );
});

module.exports = router;