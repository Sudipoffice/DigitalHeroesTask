import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import config from '../config';
import { AuthRequest } from '../middleware/auth';
import { AppError, handleError } from '../utils/errors';

export const register = async (req: Request, res: Response) => {
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
    const { status, body } = handleError(error);
    res.status(status).json(body);
  }
};

export const login = async (req: Request, res: Response) => {
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
    const { status, body } = handleError(error);
    res.status(status).json(body);
  }
};

export const getMe = (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) throw new AppError(401, 'Not authenticated');
    res.json({ user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
  } catch (error) {
    const { status, body } = handleError(error);
    res.status(status).json(body);
  }
};

export const listUsers = async (_req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}, 'name email role');
    res.json({ users });
  } catch (error) {
    const { status, body } = handleError(error);
    res.status(status).json(body);
  }
};
