const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// register (simplified)
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      `INSERT INTO booking.users (name, email, phone, role_id) 
       VALUES ($1,$2,$3, (SELECT id FROM booking.roles WHERE name='customer' LIMIT 1))
       RETURNING id, name, email`,
      [name, email, phone]
    );
    // Note: you should store hashed password somewhere (add column) or use external auth. Schema provided doesn't have password field - adapt as needed.
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Could not create user' });
  }
});

// login - NOTE: if you don't have password column in DB you must add one or delegate to external auth
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  // This example assumes you have a password column called "password_hash" in users table.
  const { rows } = await pool.query('SELECT id, email, password_hash FROM booking.users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

module.exports = router;
