const express = require('express');
const { db } = require('../models/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Add comment to post
router.post('/', authenticateToken, (req, res) => {
  const { postId, content } = req.body;
  const userId = req.user.id;

  if (!postId || !content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Post ID and content are required' });
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

      // Insert comment
      db.run(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, userId, content.trim()],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to add comment' });
          }

          // Get the created comment with user info
          db.get(
            `SELECT 
              c.*,
              u.username,
              u.full_name,
              u.avatar,
              u.verified
             FROM comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ?`,
            [this.lastID],
            (err, comment) => {
              if (err) {
                return res.status(500).json({ error: 'Failed to retrieve comment' });
              }

              // Create notification for post owner
              if (post.user_id !== userId) {
                db.run(
                  'INSERT INTO notifications (user_id, from_user_id, type, post_id, message) VALUES (?, ?, ?, ?, ?)',
                  [post.user_id, userId, 'comment', postId, `${req.user.username} commented on your post`],
                  (err) => {
                    if (err) {
                      console.error('Failed to create notification:', err);
                    }
                  }
                );
              }

              res.status(201).json({
                message: 'Comment added successfully',
                comment: {
                  id: comment.id,
                  postId: comment.post_id,
                  userId: comment.user_id,
                  username: comment.username,
                  fullName: comment.full_name,
                  avatar: comment.avatar,
                  verified: comment.verified,
                  content: comment.content,
                  createdAt: comment.created_at
                }
              });
            }
          );
        }
      );
    }
  );
});

// Get comments for a post
router.get('/post/:postId', optionalAuth, (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  db.all(
    `SELECT 
      c.*,
      u.username,
      u.full_name,
      u.avatar,
      u.verified
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at ASC
     LIMIT ? OFFSET ?`,
    [postId, limit, offset],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedComments = comments.map(comment => ({
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        username: comment.username,
        fullName: comment.full_name,
        avatar: comment.avatar,
        verified: comment.verified,
        content: comment.content,
        createdAt: comment.created_at
      }));

      res.json({ comments: formattedComments });
    }
  );
});

// Delete comment
router.delete('/:commentId', authenticateToken, (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  // Check if comment exists and belongs to user
  db.get(
    'SELECT * FROM comments WHERE id = ? AND user_id = ?',
    [commentId, userId],
    (err, comment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }

      // Delete comment
      db.run(
        'DELETE FROM comments WHERE id = ?',
        [commentId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete comment' });
          }

          res.json({ message: 'Comment deleted successfully' });
        }
      );
    }
  );
});

// Get comment count for a post
router.get('/count/:postId', (req, res) => {
  const { postId } = req.params;

  db.get(
    'SELECT COUNT(*) as count FROM comments WHERE post_id = ?',
    [postId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ count: result.count });
    }
  );
});

module.exports = router;