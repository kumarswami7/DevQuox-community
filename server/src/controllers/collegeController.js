import mongoose from 'mongoose';
import * as collegeService from '../services/collegeService.js';

/**
 * GET /api/colleges/search
 * Searches worldwide colleges & universities with filters and pagination
 */
export const searchColleges = async (req, res, next) => {
  try {
    const {
      q,
      query,
      name,
      country,
      state,
      city,
      institutionType,
      type,
      verificationStatus,
      page,
      limit,
    } = req.query;

    const searchTerm = q || query || name || '';
    const selectedType = institutionType || type || '';

    const results = await collegeService.searchColleges({
      query: searchTerm,
      country,
      state,
      city,
      institutionType: selectedType,
      verificationStatus,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: results.colleges.length,
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
      data: results.colleges,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/colleges/countries
 * Returns supported countries, university counts, and top cities
 */
export const getCountries = async (req, res, next) => {
  try {
    const countries = await collegeService.getCollegeCountries();
    return res.status(200).json({
      success: true,
      count: countries.length,
      data: countries,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/colleges/lookup
 * Resolve institution using external ROR ID or official domain
 */
export const lookupCollege = async (req, res, next) => {
  try {
    const { rorId, domain } = req.query;
    if (!rorId && !domain) {
      return res.status(400).json({
        success: false,
        message: 'Either rorId or domain query parameter is required for lookup',
      });
    }

    const college = await collegeService.lookupCollege({ rorId, domain });
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found with provided identifier',
      });
    }

    return res.status(200).json({
      success: true,
      data: college,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/colleges/:id
 * Retrieve single college details by ObjectId
 */
export const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid college ID format',
      });
    }

    const college = await collegeService.getCollegeById(id);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: college,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/colleges
 * Allows authenticated user to submit a missing college
 */
export const createManualCollege = async (req, res, next) => {
  try {
    const { name, country, state, city, website, institutionType, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'College name is required',
      });
    }

    if (!country || !country.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Country is required',
      });
    }

    const userId = req.user ? req.user._id : null;
    const { college, alreadyExists } = await collegeService.createManualCollege(
      {
        name,
        country,
        state,
        city,
        website,
        institutionType,
        address,
      },
      userId
    );

    return res.status(alreadyExists ? 200 : 201).json({
      success: true,
      message: alreadyExists
        ? 'College already registered in database'
        : 'College added successfully (pending administrator verification)',
      data: college,
    });
  } catch (err) {
    if (err.message && (err.message.includes('required') || err.message.includes('valid URL'))) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

/**
 * POST /api/colleges/:id/verify
 * Administrator approval / rejection workflow
 */
export const verifyCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'verified' } = req.body;

    // Strict Admin authorization check
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only platform administrators are authorized to verify institutions',
      });
    }

    const updated = await collegeService.verifyCollege(id, status);
    return res.status(200).json({
      success: true,
      message: `Institution verification status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    if (err.message && (err.message.includes('Invalid') || err.message.includes('Status must be'))) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    if (err.message === 'College not found') {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    next(err);
  }
};

