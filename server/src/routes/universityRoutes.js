import express from 'express';
import { universityController } from '../controllers/universityController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

export const universityRouter = express.Router();

// Public routes
// GET /api/universities/search?q=Oxford&country=United%20Kingdom
universityRouter.get('/search', optionalAuth, universityController.search);

// GET /api/universities/countries
universityRouter.get('/countries', optionalAuth, universityController.getCountries);

// GET /api/universities/:id
universityRouter.get('/:id', optionalAuth, universityController.getById);

// Authenticated user routes
// POST /api/universities/manual
universityRouter.post('/manual', protect, universityController.createManual);

// Admin-only synchronization routes
// POST /api/universities/sync
universityRouter.post('/sync', protect, universityController.sync);

// Admin-only logo update
// PATCH /api/universities/:id/logo
universityRouter.patch('/:id/logo', protect, universityController.updateLogo);

export default universityRouter;

