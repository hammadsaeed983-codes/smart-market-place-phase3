import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey12345';
const JWT_EXPIRES = '8h';

// Admin credentials
const ADMIN_EMAIL = 'admin@marketx.com';
const ADMIN_PASSWORD_PLAIN = 'admin123';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD_PLAIN, 10);

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  if (email !== ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = jwt.sign(
    { email: ADMIN_EMAIL, role: 'admin' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  res.json({
    message: 'Login successful.',
    token,
    admin: { email: ADMIN_EMAIL, role: 'admin' }
  });
});

router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

export default router;
