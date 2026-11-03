import mongoose from 'mongoose';
import { Company, resolveCompanyDomain, resolveCompanyFavicon, extractCompanyInitials } from '../models/Company.js';
import * as jobiworkService from '../services/jobiworkService.js';

/**
 * GET /api/companies/search or GET /api/companies
 * Search worldwide companies with filters and pagination
 */
export const searchCompanies = async (req, res, next) => {
  try {
    const { q, query, name, country, industry, city, status, hiring, page = 1, limit = 20 } = req.query;

    const searchTerm = q || query || name || '';
    const isHiring = hiring === 'true' || hiring === true;

    const results = await jobiworkService.searchCompanies({
      q: searchTerm,
      country,
      industry,
      city,
      status,
      hiring: isHiring,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: results.companies.length,
      total: results.total,
      page: results.page,
      limit: results.limit,
      totalPages: results.totalPages,
      data: results.companies,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/companies/lookup
 * Resolve single company by domain, registration number, or name
 */
export const lookupCompany = async (req, res, next) => {
  try {
    const { domain, name, registration, country, id } = req.query;

    if (!domain && !name && !registration && !id) {
      return res.status(400).json({
        success: false,
        message: 'At least one lookup parameter (domain, name, registration, or id) is required',
      });
    }

    const company = await jobiworkService.lookupCompany({ domain, name, registration, country, id });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found with the provided identifier',
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/companies/:id
 * Retrieve company details by MongoDB ObjectId or Jobiwork ID
 */
export const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let company = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      company = await Company.findById(id).lean();
    }
    if (!company) {
      company = await Company.findOne({ jobiworkId: id }).lean();
    }

    if (!company) {
      // Try resolving live from Jobiwork
      company = await jobiworkService.lookupCompany({ id });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/companies/:id/enrich
 * Refresh / enrich company record directly from Jobiwork API
 */
export const enrichCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let company = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      company = await Company.findById(id);
    } else {
      company = await Company.findOne({ jobiworkId: id });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company record not found',
      });
    }

    const enrichItems = [];
    if (company.domain) enrichItems.push({ domain: company.domain });
    else if (company.registrationNumber) enrichItems.push({ registration: company.registrationNumber });
    else enrichItems.push({ name: company.name });

    const result = await jobiworkService.enrichCompany(enrichItems);
    const updated = result.results && result.results[0] ? result.results[0] : company;

    return res.status(200).json({
      success: true,
      message: 'Company metadata enriched successfully from Jobiwork',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/companies/:id/logo
 * Proxies company logo from Jobiwork safely without exposing API key
 */
export const getCompanyLogo = async (req, res, next) => {
  try {
    const { id } = req.params;

    let jobiworkId = id;
    let domain = '';

    if (mongoose.Types.ObjectId.isValid(id)) {
      const company = await Company.findById(id).lean();
      if (company) {
        jobiworkId = company.jobiworkId || '';
        domain = company.domain || '';
      }
    }

    if (jobiworkId && jobiworkId.startsWith('JW-')) {
      const logoData = await jobiworkService.fetchCompanyLogoStream(jobiworkId);
      if (logoData) {
        res.setHeader('Content-Type', logoData.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h
        return res.send(logoData.buffer);
      }
    }

    // Fallback: Redirect to Google Favicon 128px if domain available
    if (domain) {
      return res.redirect(resolveCompanyFavicon(domain));
    }

    return res.status(404).json({ success: false, message: 'Logo not available' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/companies/industries
 * Returns list of unique industries with counts
 */
export const getIndustries = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, data: [] });
    }

    const industries = await Company.aggregate([
      { $match: { industry: { $ne: '' } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 30 },
    ]);

    return res.status(200).json({
      success: true,
      data: industries.map((i) => ({ industry: i._id, count: i.count })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/companies/countries
 * Returns list of unique countries with counts
 */
export const getCountries = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, data: [] });
    }

    const countries = await Company.aggregate([
      { $match: { country: { $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 30 },
    ]);

    return res.status(200).json({
      success: true,
      data: countries.map((c) => ({ country: c._id, count: c.count })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/companies
 * Create manual / user-suggested company
 */
export const createCompany = async (req, res, next) => {
  try {
    const { name, website, country, state, city, industry, description, registrationNumber } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required',
      });
    }

    const domain = resolveCompanyDomain(website || '');
    const normalized = normalizeCompanyName(name);

    // Duplicate check
    const existing = await Company.findOne({
      $or: [
        ...(domain ? [{ domain }] : []),
        ...(registrationNumber ? [{ registrationNumber }] : []),
        { normalizedName: normalized, country: country || 'India' },
      ],
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Company already registered',
        data: existing,
      });
    }

    const created = await Company.create({
      name: name.trim(),
      normalizedName: normalized,
      website: website || (domain ? `https://${domain}` : ''),
      domain,
      country: country || 'India',
      state: state || '',
      city: city || '',
      industry: industry || 'Technology & Software',
      description: description || '',
      registrationNumber: registrationNumber || '',
      logoUrl: domain ? resolveCompanyFavicon(domain) : '',
      logoSource: domain ? 'favicon' : 'initials',
      initials: extractCompanyInitials(name),
      source: 'manual',
      verificationStatus: 'unverified',
      createdBy: req.user ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Company submitted successfully (pending verification)',
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/companies/:id/verify
 * Administrator verification workflow
 */
export const verifyCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'verified' } = req.body;

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only platform administrators can verify companies',
      });
    }

    const updated = await Company.findByIdAndUpdate(
      id,
      { verificationStatus: status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Company status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

