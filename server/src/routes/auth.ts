import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()) throw new AppError(400, 'Name is required');
    if (!email?.trim()) throw new AppError(400, 'Email is required');
    if (!password?.trim()) throw new AppError(400, 'Password is required');
    if (password.length < 6) throw new AppError(400, 'Password must be at least 6 characters');

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) throw new AppError(409, 'An account with this email already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashed, role: 'member' });
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim()) throw new AppError(400, 'Email is required');
    if (!password?.trim()) throw new AppError(400, 'Password is required');

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new AppError(401, 'No account found with this email');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError(401, 'Incorrect password');

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
});

router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ user: { id: req.user!._id, name: req.user!.name, email: req.user!.email, role: req.user!.role } });
});

router.get('/users', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}, 'name email role');
    res.json({ users });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;