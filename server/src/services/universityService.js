import { University, normalizeUniversityName, resolveFaviconUrl } from '../models/University.js';
import { seedInitialUniversities } from '../database/seedUniversities.js';

// Safe regex helper
const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const HIPO_API_BASE_URL = 'https://universities.hipolabs.com/search';

export const universityService = {
  /**
   * Search worldwide universities using MongoDB local cache with live Hipo API augmentation
   */
  search: async ({ query = '', country = '', page = 1, limit = 20 }) => {
    // Ensure initial baseline seeds exist
    await seedInitialUniversities();

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (parsedPage - 1) * parsedLimit;

    const trimmedQuery = (query || '').trim();
    const trimmedCountry = (country || '').trim();
    const normalizedQ = normalizeUniversityName(trimmedQuery);

    // Build MongoDB filter
    const filter = {};
    if (normalizedQ) {
      const qRegex = new RegExp(escapeRegex(normalizedQ), 'i');
      filter.$or = [
        { normalizedName: qRegex },
        { universityName: new RegExp(escapeRegex(trimmedQuery), 'i') },
        { domains: new RegExp(escapeRegex(trimmedQuery.toLowerCase()), 'i') },
      ];
    }

    if (trimmedCountry && trimmedCountry.toLowerCase() !== 'all' && trimmedCountry.toLowerCase() !== 'worldwide') {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { country: new RegExp(`^${escapeRegex(trimmedCountry)}$`, 'i') },
          { countryCode: trimmedCountry.toUpperCase() },
        ],
      });
    }

    // 1. Query local MongoDB cache
    let localResults = await University.find(filter)
      .sort({ isVerified: -1, universityName: 1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean();

    let totalCount = await University.countDocuments(filter);

    // 2. If results are fewer than desired limit and we have a specific query or country, augment via Hipo API
    const shouldFetchHipo = (trimmedQuery.length >= 2 || (trimmedCountry && trimmedCountry !== 'all')) && localResults.length < parsedLimit;

    if (shouldFetchHipo) {
      try {
        const params = new URLSearchParams();
        if (trimmedQuery) params.append('name', trimmedQuery);
        if (trimmedCountry && trimmedCountry.toLowerCase() !== 'all') {
          params.append('country', trimmedCountry);
        }

        const hipoUrl = `${HIPO_API_BASE_URL}?${params.toString()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(hipoUrl, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const hipoData = await response.json();
          if (Array.isArray(hipoData) && hipoData.length > 0) {
            // Transform & batch upsert into MongoDB
            const bulkOps = hipoData.slice(0, 40).map((item) => {
              const name = item.name || '';
              const normalized = normalizeUniversityName(name);
              const domain = item.domains?.[0] || '';
              const cName = item.country || '';
              const cCode = (item.alpha_two_code || '').toUpperCase();

              return {
                updateOne: {
                  filter: { normalizedName: normalized, country: cName },
                  update: {
                    $setOnInsert: {
                      universityName: name,
                      normalizedName: normalized,
                      country: cName,
                      countryCode: cCode,
                      stateProvince: item['state-province'] || null,
                      domains: item.domains || [],
                      websites: item.web_pages || [],
                      logoUrl: resolveFaviconUrl(domain),
                      logoSource: 'favicon',
                      isVerified: false,
                      source: 'hipo',
                    },
                  },
                  upsert: true,
                },
              };
            });

            if (bulkOps.length > 0) {
              await University.bulkWrite(bulkOps, { ordered: false }).catch(() => {});
              // Re-query local MongoDB to return consistent paginated records
              localResults = await University.find(filter)
                .sort({ isVerified: -1, universityName: 1 })
                .skip(skip)
                .limit(parsedLimit)
                .lean();
              totalCount = await University.countDocuments(filter);
            }
          }
        }
      } catch (externalErr) {
        // Graceful fallback: External API failure or sandbox network restriction must NEVER crash the request
        // We log and return the matching local database records
      }
    }

    return {
      universities: localResults,
      totalCount,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(totalCount / parsedLimit) || 1,
    };
  },

  /**
   * Retrieve a single university by its MongoDB ObjectId
   */
  getById: async (id) => {
    return University.findById(id).lean();
  },

  /**
   * Retrieve list of countries with university counts
   */
  getCountries: async () => {
    await seedInitialUniversities();

    const results = await University.aggregate([
      {
        $group: {
          _id: '$country',
          country: { $first: '$country' },
          countryCode: { $first: '$countryCode' },
          count: { $sum: 1 },
        },
      },
      { $sort: { country: 1 } },
    ]);

    return results.map((r) => ({
      country: r.country,
      countryCode: r.countryCode || '',
      count: r.count,
    }));
  },

  /**
   * User or Admin manual university registration (marked unverified by default)
   */
  createManual: async ({
    universityName,
    country,
    countryCode = '',
    stateProvince = null,
    website = '',
    domains = [],
  }) => {
    if (!universityName || !universityName.trim()) {
      throw new Error('University name is required.');
    }
    if (!country || !country.trim()) {
      throw new Error('Country is required.');
    }

    const trimmedName = universityName.trim();
    const trimmedCountry = country.trim();
    const normalized = normalizeUniversityName(trimmedName);

    // Extract domain from website if provided
    let extractedDomains = Array.isArray(domains) && domains.length > 0 ? [...domains] : [];
    if (website && extractedDomains.length === 0) {
      try {
        const parsed = new URL(website.startsWith('http') ? website : `https://${website}`);
        if (parsed.hostname) extractedDomains.push(parsed.hostname.replace(/^www\./, ''));
      } catch {
        // ignore malformed URL
      }
    }

    // Check if university already exists
    const existing = await University.findOne({
      normalizedName: normalized,
      country: new RegExp(`^${escapeRegex(trimmedCountry)}$`, 'i'),
    });

    if (existing) {
      return existing;
    }

    const primaryDomain = extractedDomains[0] || '';
    const logoUrl = primaryDomain ? resolveFaviconUrl(primaryDomain) : '';

    const newUniversity = new University({
      universityName: trimmedName,
      normalizedName: normalized,
      country: trimmedCountry,
      countryCode: (countryCode || '').toUpperCase(),
      stateProvince: stateProvince || null,
      domains: extractedDomains,
      websites: website ? [website] : [],
      logoUrl,
      logoSource: logoUrl ? 'favicon' : 'placeholder',
      isVerified: false,
      source: 'manual',
    });

    return newUniversity.save();
  },

  /**
   * Admin-only synchronization from Hipo API for a country
   */
  sync: async ({ country = '', limit = 100 }) => {
    const params = new URLSearchParams();
    if (country && country.trim() && country.toLowerCase() !== 'all') {
      params.append('country', country.trim());
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${HIPO_API_BASE_URL}?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Hipo API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Unexpected non-array response from Hipo API');
    }

    const itemsToProcess = data.slice(0, Math.min(limit, 500));
    let upsertedCount = 0;
    let modifiedCount = 0;

    const bulkOps = itemsToProcess.map((item) => {
      const name = item.name || '';
      const normalized = normalizeUniversityName(name);
      const domain = item.domains?.[0] || '';
      const cName = item.country || '';
      const cCode = (item.alpha_two_code || '').toUpperCase();

      return {
        updateOne: {
          filter: { normalizedName: normalized, country: cName },
          update: {
            $setOnInsert: {
              universityName: name,
              normalizedName: normalized,
              country: cName,
              countryCode: cCode,
              stateProvince: item['state-province'] || null,
              domains: item.domains || [],
              websites: item.web_pages || [],
              logoUrl: resolveFaviconUrl(domain),
              logoSource: 'favicon',
              isVerified: false,
              source: 'hipo',
            },
            // If already present, only update domain/website if empty
            $addToSet: {
              domains: { $each: item.domains || [] },
              websites: { $each: item.web_pages || [] },
            },
          },
          upsert: true,
        },
      };
    });

    if (bulkOps.length > 0) {
      const result = await University.bulkWrite(bulkOps, { ordered: false });
      upsertedCount = result.upsertedCount || 0;
      modifiedCount = result.modifiedCount || 0;
    }

    return {
      totalFetched: data.length,
      processed: itemsToProcess.length,
      upserted: upsertedCount,
      modified: modifiedCount,
      country: country || 'Worldwide',
    };
  },

  /**
   * Admin-only: Update logo URL, source, and verification status
   */
  updateLogo: async (id, { logoUrl, logoSource = 'official', isVerified = true }) => {
    const university = await University.findById(id);
    if (!university) {
      throw new Error('University not found');
    }

    if (logoUrl !== undefined) university.logoUrl = logoUrl.trim();
    if (logoSource !== undefined) university.logoSource = logoSource;
    if (isVerified !== undefined) university.isVerified = Boolean(isVerified);

    return university.save();
  },
};

export default universityService;

