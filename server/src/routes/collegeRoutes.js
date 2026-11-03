import express from 'express';
import * as collegeController from '../controllers/collegeController.js';
import { protect } from '../middleware/authMiddleware.js';

export const collegeRouter = express.Router();

// Public Discovery Endpoints
collegeRouter.get('/search', collegeController.searchColleges);
collegeRouter.get('/countries', collegeController.getCountries);
collegeRouter.get('/lookup', collegeController.lookupCollege);
collegeRouter.get('/:id', collegeController.getCollegeById);

// Authenticated User Submissions
collegeRouter.post('/', protect, collegeController.createManualCollege);

// Admin Verification Workflow
collegeRouter.post('/:id/verify', protect, collegeController.verifyCollege);

export default collegeRouter;

