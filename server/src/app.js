import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import fs from 'fs';

import { env } from './config/env.js';
import { getDatabaseStatus } from './config/db.js';

// Middleware
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route Handlers
import { authRouter } from './routes/authRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { profileRouter } from './routes/profileRoutes.js';
import { projectRouter } from './routes/projectRoutes.js';
import { applicationRouter } from './routes/applicationRoutes.js';
import { communityRouter, moderationRouter } from './routes/communityRoutes.js';
import { chatRouter } from './routes/chatRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';
import { taskRouter } from './routes/taskRoutes.js';
import { milestoneRouter } from './routes/milestoneRoutes.js';
import {
  discoveryRouter,
  portfolioRouter,
  skillsRouter,
  bookmarksRouter,
  savedSearchesRouter,
  followRouter,
} from './routes/discoveryRoutes.js';
import { contractRouter } from './routes/contractRoutes.js';
import { financialMilestoneRouter } from './routes/financialMilestoneRoutes.js';
import { paymentRouter } from './routes/paymentRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { commentRouter } from './routes/commentRoutes.js';
import { analyticsRouter } from './routes/analyticsRoutes.js';
import { universityRouter } from './routes/universityRoutes.js';
import { collegeRouter } from './routes/collegeRoutes.js';
import { companyRouter } from './routes/companyRoutes.js';

export const createApp = () => {
  const app = express();

  // 1. Basic Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // 2. Development Request Logger
  if (process.env.NODE_ENV !== 'test') {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        if (!req.originalUrl.includes('/health')) {
          console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
        }
      });
      next();
    });
  }

  // 3. CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile, curl, Postman) or matching client
        if (!origin) return callback(null, true);
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
  app.options('*', cors());

  // 4. Parsers & Static Files (with sensible request limits)
  app.use(cookieParser());
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, res, buf) => {
        if (req.originalUrl && req.originalUrl.includes('webhook')) {
          req.rawBody = buf;
        }
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  // Only serve static uploads when the directory exists (Vercel's /var/task is read-only)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }

  // 5. Health Check Endpoints (/api/health and /api/v1/health)
  const healthHandler = (req, res) => {
    const dbStatus = getDatabaseStatus();
    const isDbConnected = dbStatus.status === 'connected';

    res.status(200).json({
      success: true,
      status: isDbConnected ? 'ok' : 'degraded',
      service: 'devconnect-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus.status,
      },
    });
  };

  app.get('/api/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: '🚀 DevConnect MERN Backend API is active and running',
      health: '/api/health',
    });
  });

  // 6. API Endpoints (supports root /auth, /api/auth, and /api/v1/auth)
  app.use('/auth', authRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/v1/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/profiles', profileRouter);
  app.use('/api/v1/profiles', profileRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/v1/profile', profileRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/v1/projects', projectRouter);
  app.use('/api/applications', applicationRouter);
  app.use('/api/v1/applications', applicationRouter);
  app.use('/api/communities', communityRouter);
  app.use('/api/v1/communities', communityRouter);
  app.use('/api/community', communityRouter);
  app.use('/api/v1/community', communityRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/v1/moderation', moderationRouter);
  app.use('/api/chats', chatRouter);
  app.use('/api/v1/chats', chatRouter);
  app.use('/api/v1/chat', chatRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/v1/notifications', notificationRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/v1/upload', uploadRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/v1/tasks', taskRouter);
  app.use('/api/milestones', milestoneRouter);
  app.use('/api/v1/milestones', milestoneRouter);
  app.use('/api/saved-searches', savedSearchesRouter);
  app.use('/api/v1/saved-searches', savedSearchesRouter);
  app.use('/api/discovery/saved-searches', savedSearchesRouter);
  app.use('/api/v1/discovery/saved-searches', savedSearchesRouter);
  app.use('/api/discovery', discoveryRouter);
  app.use('/api/v1/discovery', discoveryRouter);
  app.use('/api/developers', discoveryRouter);
  app.use('/api/v1/developers', discoveryRouter);
  app.use('/api/portfolios', portfolioRouter);
  app.use('/api/v1/portfolios', portfolioRouter);
  app.use('/api/skills', skillsRouter);
  app.use('/api/v1/skills', skillsRouter);
  app.use('/api/bookmarks', bookmarksRouter);
  app.use('/api/v1/bookmarks', bookmarksRouter);
  app.use('/api/follow', followRouter);
  app.use('/api/v1/follow', followRouter);
  app.use('/api/contracts', contractRouter);
  app.use('/api/v1/contracts', contractRouter);
  app.use('/api/financial-milestones', financialMilestoneRouter);
  app.use('/api/v1/financial-milestones', financialMilestoneRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/v1/payments', paymentRouter);
  app.use('/api/v1/webhooks/payments', paymentRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/comments', commentRouter);
  app.use('/api/v1/comments', commentRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/universities', universityRouter);
  app.use('/api/v1/universities', universityRouter);
  app.use('/api/colleges', collegeRouter);
  app.use('/api/v1/colleges', collegeRouter);
  app.use('/api/companies', companyRouter);
  app.use('/api/v1/companies', companyRouter);

  // 7. 404 & Centralized Error Handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
export default app;