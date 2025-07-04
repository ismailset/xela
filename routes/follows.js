const express = require('express');
const { db } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Follow/unfollow a user
router.post('/toggle', authenticateToken, (req, res) => {
  const { userId: targetUserId } = req.body;
  const currentUserId = req.user.id;

  if (!targetUserId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (targetUserId == currentUserId) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  // Check if target user exists
  db.get(
    'SELECT id, username FROM users WHERE id = ?',
    [targetUserId],
    (err, targetUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if already following
      db.get(
        'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, targetUserId],
        (err, existingFollow) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingFollow) {
            // Unfollow
            db.run(
              'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
              [currentUserId, targetUserId],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to unfollow user' });
                }

                // Get updated follower count
                db.get(
                  'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
                  [targetUserId],
                  (err, result) => {
                    if (err) {
                      return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                      message: 'User unfollowed successfully',
                      isFollowing: false,
                      followersCount: result.count
                    });
                  }
                );
              }
            );
          } else {
            // Follow
            db.run(
              'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
              [currentUserId, targetUserId],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: 'Failed to follow user' });
                }

                // Create notification for target user
                db.run(
                  'INSERT INTO notifications (user_id, from_user_id, type, message) VALUES (?, ?, ?, ?)',
                  [targetUserId, currentUserId, 'follow', `${req.user.username} started following you`],
                  (err) => {
                    if (err) {
                      console.error('Failed to create notification:', err);
                    }
                  }
                );

                // Get updated follower count
                db.get(
                  'SELECT COUNT(*) as count FROM follows WHERE following_id = ?',
                  [targetUserId],
                  (err, result) => {
                    if (err) {
                      return res.status(500).json({ error: 'Database error' });
                    }

                    res.json({
                      message: 'User followed successfully',
                      isFollowing: true,
                      followersCount: result.count
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

// Get follow suggestions (users not followed)
router.get('/suggestions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  db.all(
    `SELECT 
      u.id,
      u.username,
      u.full_name,
      u.avatar,
      u.verified,
      (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count
     FROM users u
     WHERE u.id != ? 
     AND u.id NOT IN (
       SELECT following_id FROM follows WHERE follower_id = ?
     )
     ORDER BY followers_count DESC, RANDOM()
     LIMIT ?`,
    [userId, userId, limit],
    (err, suggestions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedSuggestions = suggestions.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        avatar: user.avatar,
        verified: user.verified,
        followersCount: user.followers_count
      }));

      res.json({ suggestions: formattedSuggestions });
    }
  );
});

// Check if user is following another user
router.get('/check/:userId', authenticateToken, (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user.id;

  db.get(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
    [currentUserId, targetUserId],
    (err, follow) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ isFollowing: !!follow });
    }
  );
});

// Get mutual followers
router.get('/mutual/:userId', authenticateToken, (req, res) => {
  const { userId: targetUserId } = req.params;
  const currentUserId = req.user.id;

  db.all(
    `SELECT 
      u.id,
      u.username,
      u.full_name,
      u.avatar,
      u.verified
     FROM users u
     WHERE u.id IN (
       SELECT f1.following_id 
       FROM follows f1
       WHERE f1.follower_id = ?
       AND f1.following_id IN (
         SELECT f2.following_id 
         FROM follows f2 
         WHERE f2.follower_id = ?
       )
     )
     LIMIT 10`,
    [currentUserId, targetUserId],
    (err, mutualFollows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const formattedMutualFollows = mutualFollows.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        avatar: user.avatar,
        verified: user.verified
      }));

      res.json({ mutualFollows: formattedMutualFollows });
    }
  );
});

// Get follower/following counts for user
router.get('/counts/:userId', (req, res) => {
  const { userId } = req.params;

  db.get(
    `SELECT 
      (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count`,
    [userId, userId],
    (err, counts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        followersCount: counts.followers_count,
        followingCount: counts.following_count
      });
    }
  );
});

module.exports = router;