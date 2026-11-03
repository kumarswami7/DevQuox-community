import mongoose from 'mongoose';
import {
  College,
  normalizeCollegeName,
  resolveDomain,
  resolveFaviconUrl,
  extractInitials,
  resolveLogoHierarchy,
  isValidWebUrl,
} from '../models/College.js';
import { env } from '../config/env.js';

const ROR_API_BASE = 'https://api.ror.org/organizations';
const API_NINJAS_BASE = 'https://api.api-ninjas.com/v1/university';
const EXTERNAL_TIMEOUT_MS = 3500;

/**
 * Maps ROR organization types to internal institutionType enum
 */
const mapRorTypeToInstitutionType = (rorTypes = [], name = '') => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('engineering') || lowerName.includes('technology') || lowerName.includes('polytechnic')) {
    return 'engineering';
  }
  if (lowerName.includes('medical') || lowerName.includes('hospital') || lowerName.includes('health') || lowerName.includes('medicine')) {
    return 'medical';
  }
  if (lowerName.includes('arts') || lowerName.includes('science') || lowerName.includes('humanities')) {
    return 'arts_science';
  }

  const typesLower = (Array.isArray(rorTypes) ? rorTypes : [rorTypes]).map((t) => String(t).toLowerCase());
  if (typesLower.includes('education')) {
    return lowerName.includes('university') ? 'university' : 'college';
  }
  if (typesLower.includes('facility') || typesLower.includes('funder')) {
    return 'research_institute';
  }
  return 'college';
};

/**
 * Safe external fetch from ROR API with timeout
 */
export const fetchFromRor = async (query, countryCode = '') => {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

    let url = `${ROR_API_BASE}?query=${encodeURIComponent(query.trim())}`;
    if (countryCode && countryCode.trim().length === 2) {
      url += `&filter=country.country_code:${encodeURIComponent(countryCode.trim().toUpperCase())}`;
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'DevConnect-Community-Platform/2.0 (education-directory)',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    const items = data.items || [];

    return items.map((item) => {
      const addresses = item.addresses && item.addresses[0] ? item.addresses[0] : {};
      const links = item.links && item.links.length > 0 ? item.links[0] : '';
      const domain = resolveDomain(links);

      return {
        name: item.name,
        aliases: item.aliases || item.acronyms || [],
        country: item.country?.country_name || '',
        countryCode: item.country?.country_code || '',
        state: addresses.state || '',
        city: addresses.city || '',
        website: links || '',
        domain,
        rorId: item.id || '',
        institutionType: mapRorTypeToInstitutionType(item.types, item.name),
        source: 'ror',
        verificationStatus: 'verified',
        isManuallyAdded: false,
      };
    });
  } catch (error) {
    // Gracefully swallow network aborts / timeouts in sandboxed or offline scenarios
    return [];
  }
};

/**
 * Safe external fetch from API Ninjas with timeout
 * Strictly backend only; uses key from environment config
 */
export const fetchFromApiNinjas = async (name, country = '') => {
  const apiKey = env.API_NINJAS_KEY;
  if (!apiKey || !name || typeof name !== 'string' || name.trim().length < 2) return [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_TIMEOUT_MS);

    let url = `${API_NINJAS_BASE}?name=${encodeURIComponent(name.trim())}`;
    if (country) {
      url += `&country=${encodeURIComponent(country.trim())}`;
    }

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const website = item.website || '';
      const domain = resolveDomain(website);

      return {
        name: item.name,
        aliases: [],
        country: item.country || country || '',
        countryCode: item.country_code || '',
        state: item.state_province || item.state || '',
        city: item.city || '',
        website,
        domain,
        institutionType: (item.name || '').toLowerCase().includes('university') ? 'university' : 'college',
        source: 'api_ninjas',
        verificationStatus: 'verified',
        isManuallyAdded: false,
      };
    });
  } catch (error) {
    return [];
  }
};

/**
 * Searches colleges in MongoDB with multi-parameter filtering,
 * then gracefully enriches with live ROR / API Ninjas results if available.
 */
export const searchColleges = async ({
  query = '',
  country = '',
  state = '',
  city = '',
  institutionType = '',
  verificationStatus = '',
  page = 1,
  limit = 20,
} = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - safeLimit > 0 ? safePage - 1 : 0) * safeLimit;

  // 1. Build Filter Query for MongoDB
  const mongoFilter = {};

  if (query && typeof query === 'string' && query.trim()) {
    const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(cleanQ, 'i');
    mongoFilter.$or = [
      { name: regex },
      { normalizedName: regex },
      { aliases: regex },
      { city: regex },
      { state: regex },
      { domain: regex },
    ];
  }

  if (country && typeof country === 'string' && country.trim()) {
    const cleanCountry = country.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    mongoFilter.$or = mongoFilter.$or
      ? [{ $and: [{ $or: mongoFilter.$or }, { country: new RegExp(`^${cleanCountry}$`, 'i') }] }]
      : [{ country: new RegExp(`^${cleanCountry}$`, 'i') }, { countryCode: cleanCountry.toUpperCase() }];
  }

  if (state && typeof state === 'string' && state.trim()) {
    mongoFilter.state = new RegExp(state.trim(), 'i');
  }

  if (city && typeof city === 'string' && city.trim()) {
    mongoFilter.city = new RegExp(city.trim(), 'i');
  }

  if (institutionType && typeof institutionType === 'string' && institutionType.trim()) {
    mongoFilter.institutionType = institutionType.trim().toLowerCase();
  }

  if (verificationStatus && typeof verificationStatus === 'string' && verificationStatus.trim()) {
    mongoFilter.verificationStatus = verificationStatus.trim().toLowerCase();
  } else {
    // By default, exclude rejected records
    mongoFilter.verificationStatus = { $ne: 'rejected' };
  }

  // 2. Fetch local records from MongoDB
  const [localColleges, localTotal] = await Promise.all([
    College.find(mongoFilter)
      .sort({ verificationStatus: 1, name: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    College.countDocuments(mongoFilter),
  ]);

  // 3. If local result is sparse and a query was supplied, attempt live external augmentation (ROR API & API Ninjas)
  if (query && query.trim().length >= 3 && localTotal < 5) {
    try {
      const [rorResults, ninjasResults] = await Promise.all([
        fetchFromRor(query, country && country.length === 2 ? country : ''),
        fetchFromApiNinjas(query, country),
      ]);

      const combinedExternal = [...rorResults, ...ninjasResults];

      for (const item of combinedExternal) {
        if (!item.name || !item.country) continue;

        const normalized = normalizeCollegeName(item.name);
        const existing = await College.findOne({
          $or: [
            { normalizedName: normalized, country: item.country },
            ...(item.rorId ? [{ rorId: item.rorId }] : []),
          ],
        });

        if (!existing) {
          const logoResolved = resolveLogoHierarchy({
            domain: item.domain,
            name: item.name,
            initials: extractInitials(item.name),
          });

          await College.create({
            ...item,
            normalizedName: normalized,
            logoUrl: logoResolved.logoUrl,
            logoSource: logoResolved.logoSource,
            initials: extractInitials(item.name),
          });
        }
      }

      // Re-query MongoDB once after upserting
      const [refreshedColleges, refreshedTotal] = await Promise.all([
        College.find(mongoFilter)
          .sort({ verificationStatus: 1, name: 1 })
          .skip(skip)
          .limit(safeLimit)
          .lean(),
        College.countDocuments(mongoFilter),
      ]);

      return {
        colleges: refreshedColleges,
        total: refreshedTotal,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(refreshedTotal / safeLimit) || 1,
      };
    } catch {
      // Return local results if external enrichment fails
    }
  }

  return {
    colleges: localColleges,
    total: localTotal,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(localTotal / safeLimit) || 1,
  };
};

/**
 * Retrieves a single college by MongoDB ObjectId
 */
export const getCollegeById = async (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }
  if (mongoose.connection.readyState !== 1) {
    return null;
  }
  return College.findById(id).lean();
};

/**
 * Look up institution by ROR ID or Domain
 */
export const lookupCollege = async ({ rorId, domain }) => {
  const query = {};
  if (rorId) query.rorId = rorId.trim();
  if (domain) query.domain = resolveDomain(domain);

  if (Object.keys(query).length === 0) return null;

  let college = await College.findOne({ $or: Object.entries(query).map(([k, v]) => ({ [k]: v })) }).lean();
  if (college) return college;

  // If not found in Mongo and ROR ID is provided, fetch directly from ROR API
  if (rorId) {
    try {
      const cleanRor = rorId.replace(/^https?:\/\/ror\.org\//, '').trim();
      const res = await fetch(`${ROR_API_BASE}/${cleanRor}`, {
        signal: AbortSignal.timeout(EXTERNAL_TIMEOUT_MS),
      });

      if (res.ok) {
        const item = await res.json();
        const addresses = item.addresses && item.addresses[0] ? item.addresses[0] : {};
        const links = item.links && item.links.length > 0 ? item.links[0] : '';
        const itemDomain = resolveDomain(links);

        const newDoc = await College.create({
          name: item.name,
          normalizedName: normalizeCollegeName(item.name),
          aliases: item.aliases || item.acronyms || [],
          country: item.country?.country_name || 'Global',
          countryCode: item.country?.country_code || '',
          state: addresses.state || '',
          city: addresses.city || '',
          website: links,
          domain: itemDomain,
          rorId: item.id,
          institutionType: mapRorTypeToInstitutionType(item.types, item.name),
          source: 'ror',
          verificationStatus: 'verified',
        });
        return newDoc.toObject();
      }
    } catch {
      // Fallback
    }
  }

  return null;
};

/**
 * Returns distinct list of countries with college count and top cities
 */
export const getCollegeCountries = async () => {
  const stats = await College.aggregate([
    { $match: { verificationStatus: { $ne: 'rejected' } } },
    {
      $group: {
        _id: '$country',
        count: { $sum: 1 },
        countryCode: { $first: '$countryCode' },
        cities: { $addToSet: '$city' },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);

  return stats.map((s) => ({
    country: s._id,
    countryCode: s.countryCode,
    count: s.count,
    cities: (s.cities || []).filter(Boolean).slice(0, 15),
  }));
};

/**
 * Allows authenticated users to suggest / add a missing college
 */
export const createManualCollege = async (data, userId = null) => {
  const { name, country, state = '', city = '', website = '', institutionType = 'college', address = '' } = data;

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('College or institution name is required');
  }

  if (!country || typeof country !== 'string' || !country.trim()) {
    throw new Error('Country is required');
  }

  if (website && !isValidWebUrl(website)) {
    throw new Error('Website must be a valid URL (e.g. https://www.college.edu)');
  }

  const normalized = normalizeCollegeName(name);
  const existing = await College.findOne({
    normalizedName: normalized,
    country: new RegExp(`^${country.trim()}$`, 'i'),
  });

  if (existing) {
    return { college: existing, alreadyExists: true };
  }

  const domain = resolveDomain(website);
  const initials = extractInitials(name);
  const logoResolved = resolveLogoHierarchy({
    domain,
    name,
    initials,
  });

  const created = await College.create({
    name: name.trim(),
    normalizedName: normalized,
    country: country.trim(),
    state: state ? state.trim() : '',
    city: city ? city.trim() : '',
    address: address ? address.trim() : '',
    website: website ? website.trim() : '',
    domain,
    logoUrl: logoResolved.logoUrl,
    logoSource: logoResolved.logoSource,
    initials,
    institutionType: institutionType || 'college',
    source: 'manual',
    verificationStatus: 'unverified',
    isManuallyAdded: true,
    createdBy: userId,
  });

  return { college: created, alreadyExists: false };
};

/**
 * Administrator review & verification of a college
 */
export const verifyCollege = async (id, status = 'verified') => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid college ID');
  }

  const allowedStatuses = ['verified', 'unverified', 'rejected'];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Status must be one of: ${allowedStatuses.join(', ')}`);
  }

  const college = await College.findByIdAndUpdate(
    id,
    { verificationStatus: status },
    { new: true, runValidators: true }
  );

  if (!college) {
    throw new Error('College not found');
  }

  return college;
};
