import mongoose from 'mongoose';
import { universityService } from '../services/universityService.js';

export const universityController = {
  /**
   * GET /api/universities/search
   * Query params: q, country, page, limit
   */
  search: async (req, res, next) => {
    try {
      const { q, country, page, limit } = req.query;

      // Basic input sanitation & validation
      const safeQuery = typeof q === 'string' ? q.slice(0, 100) : '';
      const safeCountry = typeof country === 'string' ? country.slice(0, 100) : '';

      const results = await universityService.search({
        query: safeQuery,
        country: safeCountry,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      return res.status(200).json({
        success: true,
        count: results.universities.length,
        total: results.totalCount,
        page: results.page,
        limit: results.limit,
        totalPages: results.totalPages,
        data: results.universities,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/universities/countries
   * Returns distinct list of countries with counts
   */
  getCountries: async (req, res, next) => {
    try {
      const countries = await universityService.getCountries();
      return res.status(200).json({
        success: true,
        count: countries.length,
        data: countries,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/universities/:id
   */
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid university ID format',
        });
      }

      const university = await universityService.getById(id);
      if (!university) {
        return res.status(404).json({
          success: false,
          message: 'University not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: university,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/universities/manual
   * Allows authenticated users/admins to add an unverified university
   */
  createManual: async (req, res, next) => {
    try {
      const { universityName, country, countryCode, stateProvince, website, domains } = req.body;

      if (!universityName || !universityName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'University name is required',
        });
      }
      if (!country || !country.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Country is required',
        });
      }

      const university = await universityService.createManual({
        universityName,
        country,
        countryCode,
        stateProvince,
        website,
        domains,
      });

      return res.status(201).json({
        success: true,
        message: 'University added successfully (unverified)',
        data: university,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/universities/sync
   * Administrator-only synchronization from Hipo API
   */
  sync: async (req, res, next) => {
    try {
      // Permission check: only admin role allowed
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Admin credentials required for data synchronization',
        });
      }

      const { country, limit } = req.body;
      const syncResult = await universityService.sync({
        country: country || '',
        limit: limit ? parseInt(limit, 10) : 100,
      });

      return res.status(200).json({
        success: true,
        message: 'University dataset synchronization completed',
        data: syncResult,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/universities/:id/logo
   * Administrator-only logo update
   */
  updateLogo: async (req, res, next) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Admin credentials required',
        });
      }

      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid university ID format',
        });
      }

      const { logoUrl, logoSource, isVerified } = req.body;
      const updated = await universityService.updateLogo(id, {
        logoUrl,
        logoSource,
        isVerified,
      });

      return res.status(200).json({
        success: true,
        message: 'University logo updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};

export default universityController;

