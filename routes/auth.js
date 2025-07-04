const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../models/database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (row) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        db.run(
          'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, fullName || ''],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create user' });
            }

            // Get the created user
            db.get(
              'SELECT id, username, email, full_name, bio, avatar FROM users WHERE id = ?',
              [this.lastID],
              (err, user) => {
                if (err) {
                  return res.status(500).json({ error: 'Failed to retrieve user' });
                }

                const token = generateToken(user);
                res.status(201).json({
                  message: 'User created successfully',
                  token,
                  user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    bio: user.bio,
                    avatar: user.avatar
                  }
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login user
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username or email
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({
          message: 'Login successful',
          token,
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
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify token and get current user
router.get('/me', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, username, email, full_name, bio, avatar, verified, private FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
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
});

// Check username availability
router.get('/check-username/:username', (req, res) => {
  const { username } = req.params;
  
  db.get(
    'SELECT id FROM users WHERE username = ?',
    [username],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ available: !row });
    }
  );
});

module.exports = router;