import mongoose from 'mongoose';
import { Company, normalizeCompanyName, resolveCompanyDomain, resolveCompanyFavicon, extractCompanyInitials } from '../models/Company.js';
import { env } from '../config/env.js';

const JOBIWORK_BASE_URL = 'https://api.jobiwork.com';
const TIMEOUT_MS = 5000;

// In-memory sliding rate limiter (60 req / min limit on Jobiwork Free tier)
const rateLimiter = {
  windowStart: Date.now(),
  requestCount: 0,
  maxPerMinute: 50, // safe buffer below 60
  canRequest() {
    const now = Date.now();
    if (now - this.windowStart > 60000) {
      this.windowStart = now;
      this.requestCount = 0;
    }
    if (this.requestCount >= this.maxPerMinute) {
      return false;
    }
    this.requestCount++;
    return true;
  },
};

// In-memory TTL cache for quick repeats (saves API credits)
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCache = (key, data) => {
  if (cache.size > 1000) cache.clear();
  cache.set(key, { time: Date.now(), data });
};

/**
 * Normalizes raw Jobiwork company payload into our schema shape
 */
export const mapJobiworkToCompanyFields = (item) => {
  if (!item || typeof item !== 'object') return null;

  const raw = item.company || item;
  const name = raw.name || raw.legal_name || 'Unnamed Company';
  const domain = resolveCompanyDomain(raw.website?.domain || raw.domain || raw.website || '');
  const website = domain ? `https://${domain}` : (typeof raw.website === 'string' ? raw.website : '');
  const location = raw.location || {};
  const registry = raw.registry || {};
  const hiring = raw.hiring || {};
  const listing = raw.listing || {};
  const size = raw.size || {};
  const industry = raw.industry || {};

  // Extract employees estimate
  let employeesEst = 0;
  if (typeof size.employees_estimate === 'number') {
    employeesEst = size.employees_estimate;
  }

  // Determine logo URL
  let logoUrl = '';
  let logoSource = 'favicon';
  if (raw.logo?.available && raw.logo?.url) {
    logoUrl = raw.logo.url;
    logoSource = 'jobiwork';
  } else if (domain) {
    logoUrl = resolveCompanyFavicon(domain);
    logoSource = 'favicon';
  } else {
    logoSource = 'initials';
  }

  return {
    name: name.trim(),
    normalizedName: normalizeCompanyName(name),
    legalName: (raw.legal_name || '').trim(),
    logoUrl,
    logoSource,
    initials: extractCompanyInitials(name),
    website,
    domain,
    country: location.country || 'India',
    state: location.state || '',
    city: location.city || '',
    address: location.address || '',
    industry: industry.sector || industry.group || raw.classification?.sector || 'Technology & Software',
    industryGroup: industry.group || raw.classification?.industry_group || '',
    registrationNumber: registry.number || registry.cin || registry.lei || '',
    registryName: registry.name || '',
    status: raw.status || 'Active',
    companySize: size.band || (employeesEst > 0 ? `${employeesEst.toLocaleString()} Employees` : ''),
    employeesEstimate: employeesEst,
    parentCompany: raw.parent_company || '',
    subsidiaries: raw.subsidiaries || [],
    hiring: {
      isHiring: Boolean(hiring.open_jobs > 0),
      openJobs: hiring.open_jobs || 0,
      employerVerified: Boolean(hiring.employer_verified),
    },
    listing: {
      isListed: Boolean(listing.listed),
      tickers: listing.tickers || [],
    },
    jobiworkId: raw.id || '',
    jobiworkUrl: raw.jobiwork_url || '',
    source: 'jobiwork',
    verificationStatus: 'verified',
    lastSyncAt: new Date(),
    rawJobiworkData: raw,
  };
};

/**
 * Checks Jobiwork API Account status and remaining quotas
 */
export const getApiAccountInfo = async () => {
  const apiKey = env.JOBIWORK_API_KEY;
  if (!apiKey) {
    return { configured: false, error: 'JOBIWORK_API_KEY not configured' };
  }

  try {
    const res = await fetch(`${JOBIWORK_BASE_URL}/rpc/api_account`, {
      method: 'GET',
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      return { configured: true, status: res.status, error: `Jobiwork returned ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return { configured: true, status: 200, ...data };
  } catch (err) {
    return { configured: true, error: err.message };
  }
};

/**
 * Single Company Lookup via Jobiwork API
 * Accepts: { domain, name, registration, country, id }
 */
export const lookupCompany = async ({ domain = '', name = '', registration = '', country = '', id = '' } = {}) => {
  const cleanDomain = resolveCompanyDomain(domain);
  const cacheKey = `lookup:${cleanDomain || name || registration || id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // 1. Check local MongoDB first to prevent duplicate API hits
  const mongoFilter = [];
  if (cleanDomain) mongoFilter.push({ domain: cleanDomain });
  if (id) mongoFilter.push({ jobiworkId: id });
  if (registration) mongoFilter.push({ registrationNumber: registration });
  if (name) mongoFilter.push({ normalizedName: normalizeCompanyName(name) });

  if (mongoFilter.length > 0 && mongoose.connection.readyState === 1) {
    const local = await Company.findOne({ $or: mongoFilter }).lean();
    if (local) {
      setCache(cacheKey, local);
      return local;
    }
  }

  // 2. Query Jobiwork API if rate limit allows
  const apiKey = env.JOBIWORK_API_KEY;
  if (!apiKey || !rateLimiter.canRequest()) {
    return null;
  }

  try {
    const payload = {};
    if (cleanDomain) payload.domain = cleanDomain;
    else if (registration) payload.registration = registration;
    else if (name) payload.name = name;
    else if (id) payload.id = id;
    if (country) payload.country = country;

    const res = await fetch(`${JOBIWORK_BASE_URL}/rpc/company_lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      console.warn(`[JobiworkService] lookup failed with status ${res.status}`);
      return null;
    }

    const json = await res.json();
    const mapped = mapJobiworkToCompanyFields(json);
    if (!mapped) return null;

    // 3. Upsert into MongoDB
    let saved = null;
    if (mongoose.connection.readyState === 1) {
      saved = await Company.findOneAndUpdate(
        {
          $or: [
            ...(mapped.domain ? [{ domain: mapped.domain }] : []),
            ...(mapped.jobiworkId ? [{ jobiworkId: mapped.jobiworkId }] : []),
            ...(mapped.registrationNumber ? [{ registrationNumber: mapped.registrationNumber }] : []),
            { normalizedName: mapped.normalizedName, country: mapped.country },
          ],
        },
        { $set: mapped },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
    } else {
      saved = mapped;
    }

    setCache(cacheKey, saved);
    return saved;
  } catch (err) {
    console.warn('[JobiworkService] lookup error:', err.message);
    return null;
  }
};

/**
 * Company Search via Jobiwork API + MongoDB
 */
export const searchCompanies = async ({
  q = '',
  country = '',
  industry = '',
  city = '',
  status = '',
  hiring = false,
  page = 1,
  limit = 20,
} = {}) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  // 1. Build MongoDB filter
  const mongoFilter = {};
  if (q && q.trim()) {
    const cleanQ = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(cleanQ, 'i');
    mongoFilter.$or = [
      { name: regex },
      { legalName: regex },
      { domain: regex },
      { industry: regex },
      { registrationNumber: regex },
    ];
  }
  if (country && country !== 'all') {
    mongoFilter.country = new RegExp(`^${country.trim()}$`, 'i');
  }
  if (industry && industry !== 'all') {
    mongoFilter.industry = new RegExp(industry.trim(), 'i');
  }
  if (city && city.trim()) {
    mongoFilter.city = new RegExp(city.trim(), 'i');
  }
  if (status && status !== 'all') {
    mongoFilter.status = new RegExp(`^${status.trim()}$`, 'i');
  }
  if (hiring) {
    mongoFilter['hiring.isHiring'] = true;
  }

  let localCompanies = [];
  let totalCount = 0;

  if (mongoose.connection.readyState === 1) {
    [localCompanies, totalCount] = await Promise.all([
      Company.find(mongoFilter).sort({ 'hiring.openJobs': -1, name: 1 }).skip(skip).limit(safeLimit).lean(),
      Company.countDocuments(mongoFilter),
    ]);
  }

  // 2. If results are few and search term provided, query Jobiwork live
  const apiKey = env.JOBIWORK_API_KEY;
  if (q && q.trim().length >= 2 && totalCount < 5 && apiKey && rateLimiter.canRequest()) {
    try {
      const searchPayload = {
        q: q.trim(),
        page: safePage,
        page_size: safeLimit,
      };
      if (country && country !== 'all') searchPayload.country = country;
      if (industry && industry !== 'all') searchPayload.industry = industry;
      if (city && city.trim()) searchPayload.city = city.trim();

      const res = await fetch(`${JOBIWORK_BASE_URL}/rpc/company_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(searchPayload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = data.companies || [];

        for (const item of incoming) {
          const mapped = mapJobiworkToCompanyFields(item);
          if (!mapped) continue;

          if (mongoose.connection.readyState === 1) {
            await Company.findOneAndUpdate(
              {
                $or: [
                  ...(mapped.domain ? [{ domain: mapped.domain }] : []),
                  ...(mapped.jobiworkId ? [{ jobiworkId: mapped.jobiworkId }] : []),
                  { normalizedName: mapped.normalizedName, country: mapped.country },
                ],
              },
              { $set: mapped },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          }
        }

        // Re-query MongoDB after upserting
        if (mongoose.connection.readyState === 1) {
          [localCompanies, totalCount] = await Promise.all([
            Company.find(mongoFilter).sort({ 'hiring.openJobs': -1, name: 1 }).skip(skip).limit(safeLimit).lean(),
            Company.countDocuments(mongoFilter),
          ]);
        }
      }
    } catch (err) {
      console.warn('[JobiworkService] search live enrichment notice:', err.message);
    }
  }

  return {
    companies: localCompanies,
    total: totalCount,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(totalCount / safeLimit) || 1,
  };
};

/**
 * Company Enrichment via Jobiwork API
 * Accepts list of items, e.g. [{ domain: 'tcs.com' }, { name: 'Infosys' }]
 */
export const enrichCompany = async (items = []) => {
  const apiKey = env.JOBIWORK_API_KEY;
  if (!apiKey || !Array.isArray(items) || items.length === 0) {
    return { matched: 0, total: 0, results: [] };
  }

  if (!rateLimiter.canRequest()) {
    throw new Error('Jobiwork rate limit exceeded. Please wait a minute.');
  }

  try {
    const res = await fetch(`${JOBIWORK_BASE_URL}/rpc/company_enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      throw new Error(`Jobiwork enrichment returned status ${res.status}`);
    }

    const data = await res.json();
    const enrichedResults = [];

    for (const result of data.results || []) {
      if (result.company) {
        const mapped = mapJobiworkToCompanyFields(result.company);
        if (mapped && mongoose.connection.readyState === 1) {
          const updated = await Company.findOneAndUpdate(
            {
              $or: [
                ...(mapped.domain ? [{ domain: mapped.domain }] : []),
                ...(mapped.jobiworkId ? [{ jobiworkId: mapped.jobiworkId }] : []),
                { normalizedName: mapped.normalizedName, country: mapped.country },
              ],
            },
            { $set: mapped },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          ).lean();
          enrichedResults.push(updated);
        } else if (mapped) {
          enrichedResults.push(mapped);
        }
      }
    }

    return {
      matched: enrichedResults.length,
      total: items.length,
      results: enrichedResults,
    };
  } catch (err) {
    console.warn('[JobiworkService] enrich error:', err.message);
    throw err;
  }
};

/**
 * Proxies company logo from Jobiwork using backend secret key
 */
export const fetchCompanyLogoStream = async (jobiworkId) => {
  const apiKey = env.JOBIWORK_API_KEY;
  if (!apiKey || !jobiworkId) return null;

  try {
    const res = await fetch(`${JOBIWORK_BASE_URL}/rpc/logo_api?id=${encodeURIComponent(jobiworkId)}`, {
      headers: { 'X-API-Key': apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) return null;
    return {
      contentType: res.headers.get('content-type') || 'image/png',
      buffer: Buffer.from(await res.arrayBuffer()),
    };
  } catch {
    return null;
  }
};

