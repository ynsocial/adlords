import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { AppError } from '../utils/errors';

export const configureSecurityMiddleware = (app: Express): void => {
  // Basic security headers
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    handler: (req, res) => {
      throw new AppError('Too many requests, please try again later', 429);
    },
  });
  app.use('/api', limiter);

  // API specific rate limits
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 failed attempts per hour
    message: 'Too many failed login attempts, please try again later',
    handler: (req, res) => {
      throw new AppError('Too many failed login attempts, please try again later', 429);
    },
  });
  app.use('/api/auth/login', authLimiter);

  // Prevent parameter pollution
  app.use(hpp());

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https:; font-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    );
    next();
  });
};

// CSRF Protection middleware
export const csrfProtection = (req: any, res: any, next: any) => {
  const token = req.headers['x-csrf-token'];
  if (!token) {
    throw new AppError('CSRF token missing', 403);
  }
  // Verify token here
  next();
};
