import dotenv from 'dotenv';
dotenv.config();

export default {
  port: parseInt(process.env.PORT || '3001'),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/digitalheroes',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key',
  jwtExpiresIn: '7d' as const,
};