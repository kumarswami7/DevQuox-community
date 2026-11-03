import express from 'express';
import * as companyController from '../controllers/companyController.js';
import { protect } from '../middleware/authMiddleware.js';

export const companyRouter = express.Router();

// Public Discovery Endpoints
companyRouter.get('/', companyController.searchCompanies);
companyRouter.get('/search', companyController.searchCompanies);
companyRouter.get('/lookup', companyController.lookupCompany);
companyRouter.get('/industries', companyController.getIndustries);
companyRouter.get('/countries', companyController.getCountries);
companyRouter.get('/:id/logo', companyController.getCompanyLogo);
companyRouter.get('/:id', companyController.getCompanyById);

// Authenticated Endpoints
companyRouter.post('/', protect, companyController.createCompany);
companyRouter.post('/:id/enrich', protect, companyController.enrichCompanyById);

// Admin-Only Verification Endpoint
companyRouter.post('/:id/verify', protect, companyController.verifyCompany);

export default companyRouter;

