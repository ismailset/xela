const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { db } = require('../models/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get user profile
router.get('/:username', optionalAuth, (req, res) => {
  const { username } = req.params;
  const currentUserId = req.user ? req.user.id : null;

  // Get user info
  db.get(
    'SELECT id, username, email, full_name, bio, avatar, verified, private FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get follower and following counts
      db.get(
        `SELECT 
          (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
          (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count`,
        [user.id, user.id, user.id],
        (err, counts) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // Check if current user follows this user
          if (currentUserId) {
            db.get(
              'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
              [currentUserId, user.id],
              (err, followRow) => {
                if (err) {
                  return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                  user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.full_name,
                    bio: user.bio,
                    avatar: user.avatar,
                    verified: user.verified,
                    private: user.private,
                    followersCount: counts.followers_count,
                    followingCount: counts.following_count,
                    postsCount: counts.posts_count,
                    isFollowing: !!followRow,
                    isOwnProfile: currentUserId === user.id
                  }
                });
              }
            );
          } else {
            res.json({
              user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                bio: user.bio,
                avatar: user.avatar,
                verified: user.verified,
                private: user.private,
                followersCount: counts.followers_count,
                followingCount: counts.following_count,
                postsCount: counts.posts_count,
                isFollowing: false,
                isOwnProfile: false
              }
            });
          }
        }
      );
    }
  );
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, bio, private } = req.body;
    const userId = req.user.id;
    let avatarPath = null;

    // Process avatar upload if provided
    if (req.file) {
      const resizedImagePath = `./uploads/avatars/resized-${req.file.filename}`;
      
      await sharp(req.file.path)
        .resize(300, 300)
        .jpeg({ quality: 80 })
        .toFile(resizedImagePath);

      // Delete original file and use resized version
      fs.unlinkSync(req.file.path);
      avatarPath = path.basename(resizedImagePath);
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (fullName !== undefined) {
      updates.push('full_name = ?');
      values.push(fullName);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }
    if (private !== undefined) {
      updates.push('private = ?');
      values.push(private === 'true' ? 1 : 0);
    }
    if (avatarPath) {
      updates.push('avatar = ?');
      values.push(avatarPath);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    if (updates.length === 1) { // Only timestamp update
      return res.status(400).json({ error: 'No fields to update' });
    }

    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update profile' });
        }

        // Return updated user data
        db.get(
          'SELECT id, username, email, full_name, bio, avatar, verified, private FROM users WHERE id = ?',
          [userId],
          (err, user) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              message: 'Profile updated successfully',
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                bio: user.bio,
                avatar: user.avatar,
                verified: user.verified,
                private: user.private
              }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search/:query', optionalAuth, (req, res) => {
  const { query } = req.params;
  const currentUserId = req.user ? req.user.id : null;

  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const searchTerm = `%${query}%`;
  
  db.all(
    'SELECT id, username, full_name, avatar, verified FROM users WHERE username LIKE ? OR full_name LIKE ? LIMIT 20',
    [searchTerm, searchTerm],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // If user is logged in, check follow status for each user
      if (currentUserId) {
        const userIds = users.map(user => user.id);
        if (userIds.length === 0) {
          return res.json({ users: [] });
        }

        const placeholders = userIds.map(() => '?').join(',');
        db.all(
          `SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (${placeholders})`,
          [currentUserId, ...userIds],
          (err, follows) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }

            const followingIds = new Set(follows.map(f => f.following_id));
            const usersWithFollowStatus = users.map(user => ({
              ...user,
              isFollowing: followingIds.has(user.id),
              isOwnProfile: user.id === currentUserId
            }));

            res.json({ users: usersWithFollowStatus });
          }
        );
      } else {
        const usersWithFollowStatus = users.map(user => ({
          ...user,
          isFollowing: false,
          isOwnProfile: false
        }));
        res.json({ users: usersWithFollowStatus });
      }
    }
  );
});

// Get user's followers
router.get('/:username/followers', optionalAuth, (req, res) => {
  const { username } = req.params;

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

      // Get followers
      db.all(
        `SELECT u.id, u.username, u.full_name, u.avatar, u.verified, f.created_at
         FROM follows f
         JOIN users u ON f.follower_id = u.id
         WHERE f.following_id = ?
         ORDER BY f.created_at DESC`,
        [user.id],
        (err, followers) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ followers });
        }
      );
    }
  );
});

// Get user's following
router.get('/:username/following', optionalAuth, (req, res) => {
  const { username } = req.params;

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

      // Get following
      db.all(
        `SELECT u.id, u.username, u.full_name, u.avatar, u.verified, f.created_at
         FROM follows f
         JOIN users u ON f.following_id = u.id
         WHERE f.follower_id = ?
         ORDER BY f.created_at DESC`,
        [user.id],
        (err, following) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ following });
        }
      );
    }
  );
});

module.exports = router;