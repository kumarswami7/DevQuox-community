import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  Company,
  normalizeCompanyName,
  extractCompanyInitials,
  resolveCompanyDomain,
  resolveCompanyFavicon,
} from '../../src/models/Company.js';
import * as jobiworkService from '../../src/services/jobiworkService.js';
import { INITIAL_COMPANIES_DATA } from '../../src/database/seedCompanies.js';

describe('Jobiwork Company Data API & Model Unit Tests', () => {
  // 1. Normalization & Sanitization
  test('normalizeCompanyName cleans casing, special characters, and excessive whitespace', () => {
    assert.equal(
      normalizeCompanyName('  Tata Consultancy Services Limited!  '),
      'tata consultancy services limited'
    );
    assert.equal(normalizeCompanyName('GOOGLE INDIA PVT. LTD.'), 'google india pvt ltd');
    assert.equal(normalizeCompanyName('Microsoft Corporation'), 'microsoft corporation');
    assert.equal(normalizeCompanyName(''), '');
    assert.equal(normalizeCompanyName(null), '');
  });

  // 2. Acronym and Initials Extraction
  test('extractCompanyInitials generates standard 2-4 letter uppercase initials omitting stop words', () => {
    assert.equal(extractCompanyInitials('Tata Consultancy Services Limited'), 'TCS');
    assert.equal(extractCompanyInitials('Infosys Technologies Private Limited'), 'IT');
    assert.equal(extractCompanyInitials('Razorpay Software Private Limited'), 'RS');
    assert.equal(extractCompanyInitials('Google India'), 'GI');
    assert.equal(extractCompanyInitials('Wipro'), 'WIP');
    assert.equal(extractCompanyInitials(''), '');
    assert.equal(extractCompanyInitials(null), '');
  });

  // 3. Domain Resolution & Favicon Generation
  test('resolveCompanyDomain extracts domain from various URL formats', () => {
    assert.equal(resolveCompanyDomain('https://www.tcs.com/careers'), 'tcs.com');
    assert.equal(resolveCompanyDomain('http://razorpay.com/'), 'razorpay.com');
    assert.equal(resolveCompanyDomain('infosys.com'), 'infosys.com');
    assert.equal(resolveCompanyDomain(''), '');
  });

  test('resolveCompanyFavicon returns 128px Google Favicon URL', () => {
    assert.equal(
      resolveCompanyFavicon('tcs.com'),
      'https://www.google.com/s2/favicons?domain=tcs.com&sz=128'
    );
    assert.equal(resolveCompanyFavicon(''), '');
  });

  // 4. Schema Validations
  test('Company schema requires name', () => {
    const invalidCompany = new Company({});
    const err = invalidCompany.validateSync();
    assert.ok(err);
    assert.ok(err.errors.name);
  });

  test('Company schema validates allowed logoSource, source, and verificationStatus enums', () => {
    const valid = new Company({
      name: 'Valid Tech Ltd',
      logoSource: 'jobiwork',
      source: 'jobiwork',
      verificationStatus: 'verified',
    });
    assert.equal(valid.validateSync(), undefined);

    const invalid = new Company({
      name: 'Invalid Tech Ltd',
      logoSource: 'unsupported_source',
    });
    const err = invalid.validateSync();
    assert.ok(err);
    assert.ok(err.errors.logoSource);
  });

  // 5. Raw Jobiwork Data Mapping
  test('mapJobiworkToCompanyFields correctly maps Jobiwork payload to schema shape', () => {
    const rawJobiwork = {
      company: {
        id: 'JW-000020',
        name: 'Tata Consultancy Services',
        legal_name: 'TATA CONSULTANCY SERVICES LIMITED',
        status: 'Active',
        website: { domain: 'tcs.com' },
        industry: { group: 'Technology & IT', sector: 'IT Services' },
        location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
        registry: { name: 'MCA', number: 'L22210MH1995PLC084781' },
        size: { band: 'Very large', employees_estimate: 600000 },
        hiring: { open_jobs: 1420, employer_verified: true },
        listing: { listed: true, tickers: ['BSE:TCS', 'NSE:TCS'] },
        jobiwork_url: 'https://jobiwork.com/company/tata-consultancy-services',
        logo: { available: true, url: 'https://api.jobiwork.com/rpc/logo_api?id=JW-000020' },
      },
    };

    const mapped = jobiworkService.mapJobiworkToCompanyFields(rawJobiwork);
    assert.ok(mapped);
    assert.equal(mapped.name, 'Tata Consultancy Services');
    assert.equal(mapped.normalizedName, 'tata consultancy services');
    assert.equal(mapped.legalName, 'TATA CONSULTANCY SERVICES LIMITED');
    assert.equal(mapped.domain, 'tcs.com');
    assert.equal(mapped.city, 'Mumbai');
    assert.equal(mapped.state, 'Maharashtra');
    assert.equal(mapped.country, 'India');
    assert.equal(mapped.registrationNumber, 'L22210MH1995PLC084781');
    assert.equal(mapped.registryName, 'MCA');
    assert.equal(mapped.employeesEstimate, 600000);
    assert.equal(mapped.hiring.openJobs, 1420);
    assert.equal(mapped.hiring.isHiring, true);
    assert.equal(mapped.jobiworkId, 'JW-000020');
    assert.equal(mapped.source, 'jobiwork');
    assert.equal(mapped.verificationStatus, 'verified');
    assert.equal(mapped.logoSource, 'jobiwork');
  });

  // 6. Seed Data Integrity
  test('INITIAL_COMPANIES_DATA provides top enterprise, tech, and fintech companies', () => {
    assert.ok(INITIAL_COMPANIES_DATA.length >= 6);

    const names = new Set(INITIAL_COMPANIES_DATA.map((c) => c.name));
    assert.ok(names.has('Tata Consultancy Services'));
    assert.ok(names.has('Infosys'));
    assert.ok(names.has('Wipro'));
    assert.ok(names.has('Razorpay'));
    assert.ok(names.has('Google India'));
  });

  // 7. Error Handling & Reliability
  test('lookupCompany safely handles empty parameters without crashing', async () => {
    const res = await jobiworkService.lookupCompany({});
    assert.equal(res, null);
  });

  test('searchCompanies returns consistent structure with empty query', async () => {
    const res = await jobiworkService.searchCompanies({ q: '' });
    assert.ok(Array.isArray(res.companies));
    assert.ok(typeof res.total === 'number');
    assert.ok(typeof res.page === 'number');
  });
});

