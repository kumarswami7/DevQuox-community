import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  College,
  normalizeCollegeName,
  extractInitials,
  resolveDomain,
  resolveFaviconUrl,
  resolveLogoHierarchy,
  isValidWebUrl,
} from '../../src/models/College.js';
import { INITIAL_COLLEGES_DATA } from '../../src/database/seedColleges.js';
import * as collegeService from '../../src/services/collegeService.js';

describe('Worldwide College & University Directory Unit Tests', () => {
  // 1. Normalization & Sanitization
  test('normalizeCollegeName handles special characters, casing and extra whitespaces', () => {
    assert.equal(
      normalizeCollegeName('  Indian Institute of Technology, Bombay!  '),
      'indian institute of technology bombay'
    );
    assert.equal(
      normalizeCollegeName("St. Stephen's College - Delhi"),
      'st stephens college - delhi'
    );
    assert.equal(normalizeCollegeName('MASSACHUSETTS INSTITUTE OF TECHNOLOGY'), 'massachusetts institute of technology');
    assert.equal(normalizeCollegeName(''), '');
    assert.equal(normalizeCollegeName(null), '');
  });

  // 2. Acronym and Initials Extraction
  test('extractInitials generates concise uppercase acronyms omitting common stop words', () => {
    assert.equal(extractInitials('Massachusetts Institute of Technology'), 'MIT');
    assert.equal(extractInitials('Indian Institute of Technology Bombay'), 'IITB');
    assert.equal(extractInitials('All India Institute of Medical Sciences'), 'AIIMS');
    assert.equal(extractInitials('Stanford University'), 'SU');
    assert.equal(extractInitials('Oxford'), 'OXF');
    assert.equal(extractInitials(''), '');
  });

  // 3. Domain Resolution & Validation
  test('resolveDomain strips protocols, www, subpaths, and ports correctly', () => {
    assert.equal(resolveDomain('https://www.iitb.ac.in/en/academics'), 'iitb.ac.in');
    assert.equal(resolveDomain('http://stanford.edu/'), 'stanford.edu');
    assert.equal(resolveDomain('ox.ac.uk'), 'ox.ac.uk');
    assert.equal(resolveDomain(''), '');
  });

  test('isValidWebUrl accurately validates legitimate website URLs', () => {
    assert.equal(isValidWebUrl('https://www.ox.ac.uk'), true);
    assert.equal(isValidWebUrl('http://mit.edu'), true);
    assert.equal(isValidWebUrl('iisc.ac.in'), true);
    assert.equal(isValidWebUrl('not a url'), false);
    assert.equal(isValidWebUrl(''), false);
    assert.equal(isValidWebUrl(null), false);
  });

  // 4. Logo Fallback Hierarchy
  test('resolveLogoHierarchy correctly adheres to 4-tier fallback hierarchy', () => {
    // Tier 1: Official Logo
    const tier1 = resolveLogoHierarchy({
      logoUrl: 'https://images.sample.org/official_logo.png',
      domain: 'sample.org',
      name: 'Sample College',
    });
    assert.equal(tier1.logoSource, 'official');
    assert.equal(tier1.logoUrl, 'https://images.sample.org/official_logo.png');

    // Tier 2: Website Favicon
    const tier2 = resolveLogoHierarchy({
      logoUrl: '',
      domain: 'iitb.ac.in',
      name: 'IIT Bombay',
      initials: 'IITB',
    });
    assert.equal(tier2.logoSource, 'favicon');
    assert.equal(tier2.logoUrl, 'https://www.google.com/s2/favicons?domain=iitb.ac.in&sz=128');

    // Tier 3: Initials
    const tier3 = resolveLogoHierarchy({
      logoUrl: '',
      domain: '',
      name: 'Autonomous Rural College',
      initials: 'ARC',
    });
    assert.equal(tier3.logoSource, 'initials');
    assert.equal(tier3.logoUrl, '');

    // Tier 4: Placeholder
    const tier4 = resolveLogoHierarchy({
      logoUrl: '',
      domain: '',
      name: '',
      initials: '',
    });
    assert.equal(tier4.logoSource, 'placeholder');
  });

  // 5. Schema Validation & Required Fields
  test('College schema requires name and country', () => {
    const invalidCollege = new College({});
    const err = invalidCollege.validateSync();
    assert.ok(err);
    assert.ok(err.errors.name);
    assert.ok(err.errors.country);
  });

  test('College schema validates allowed institutionType enum values', () => {
    const validCollege = new College({
      name: 'All India Institute of Medical Sciences',
      country: 'India',
      institutionType: 'medical',
    });
    assert.equal(validCollege.validateSync(), undefined);

    const invalidType = new College({
      name: 'Invalid Institute',
      country: 'India',
      institutionType: 'astrology',
    });
    const err = invalidType.validateSync();
    assert.ok(err);
    assert.ok(err.errors.institutionType);
  });

  test('College schema validates verificationStatus enum values', () => {
    const college = new College({
      name: 'National Law School of India University',
      country: 'India',
      verificationStatus: 'verified',
    });
    assert.equal(college.validateSync(), undefined);

    const invalidStatus = new College({
      name: 'Test College',
      country: 'India',
      verificationStatus: 'unknown_status',
    });
    const err = invalidStatus.validateSync();
    assert.ok(err);
    assert.ok(err.errors.verificationStatus);
  });

  // 6. Seed Data Integrity
  test('INITIAL_COLLEGES_DATA provides comprehensive coverage of engineering, medical, arts, and universities', () => {
    assert.ok(INITIAL_COLLEGES_DATA.length >= 25);

    const types = new Set(INITIAL_COLLEGES_DATA.map((c) => c.institutionType));
    assert.ok(types.has('engineering'));
    assert.ok(types.has('medical'));
    assert.ok(types.has('university'));
    assert.ok(types.has('arts_science'));
    assert.ok(types.has('research_institute'));

    const countries = new Set(INITIAL_COLLEGES_DATA.map((c) => c.country));
    assert.ok(countries.has('India'));
    assert.ok(countries.has('United States'));
    assert.ok(countries.has('United Kingdom'));
    assert.ok(countries.has('Canada'));
    assert.ok(countries.has('Australia'));
    assert.ok(countries.has('Singapore'));
  });

  // 7. Manual College Creation Logic & Validation
  test('createManualCollege validates required fields and rejects empty input', async () => {
    await assert.rejects(
      async () => {
        await collegeService.createManualCollege({ name: '', country: 'India' });
      },
      { message: /College or institution name is required/ }
    );

    await assert.rejects(
      async () => {
        await collegeService.createManualCollege({ name: 'Valid College', country: '' });
      },
      { message: /Country is required/ }
    );

    await assert.rejects(
      async () => {
        await collegeService.createManualCollege({
          name: 'Valid College',
          country: 'India',
          website: 'not a valid url here',
        });
      },
      { message: /Website must be a valid URL/ }
    );
  });

  // 8. External API Failure & Timeout Resilience
  test('fetchFromRor handles network failures and timeouts without throwing exceptions', async () => {
    const results = await collegeService.fetchFromRor('NonExistentInstitution123456789XYZ');
    assert.ok(Array.isArray(results));
  });

  test('fetchFromApiNinjas handles network failures and timeouts gracefully', async () => {
    const results = await collegeService.fetchFromApiNinjas('NonExistentInstitution123456789XYZ', 'India');
    assert.ok(Array.isArray(results));
  });

  // 9. Integration & Compatibility
  test('getCollegeById safely handles invalid and non-existent ObjectIds', async () => {
    const invalidRes = await collegeService.getCollegeById('invalid-id-format');
    assert.equal(invalidRes, null);

    const nonExistent = await collegeService.getCollegeById('507f1f77bcf86cd799439011');
    assert.equal(nonExistent, null);
  });

  test('verifyCollege validates ID and allowed status transitions', async () => {
    await assert.rejects(
      async () => {
        await collegeService.verifyCollege('invalid-id', 'verified');
      },
      { message: /Invalid college ID/ }
    );

    await assert.rejects(
      async () => {
        await collegeService.verifyCollege('507f1f77bcf86cd799439011', 'invalid_status');
      },
      { message: /Status must be one of/ }
    );
  });

  test('User and Profile models seamlessly support college references and backward compatibility', async () => {
    const { User } = await import('../../src/models/User.js');
    const { Profile } = await import('../../src/models/Profile.js');

    // Existing user profile compatibility (no college specified)
    const legacyUser = new User({
      name: 'Legacy Developer',
      username: 'legacy_dev_101',
      email: 'legacy@devquox.com',
      password: 'password123',
    });
    assert.equal(legacyUser.validateSync(), undefined);
    assert.equal(legacyUser.college, null);

    // Profile with college education record
    const profile = new Profile({
      user: legacyUser._id,
      title: 'Full Stack Engineer',
      education: [
        {
          institution: 'Indian Institute of Technology Bombay',
          degree: 'B.Tech in Computer Science',
          collegeCity: 'Mumbai',
          collegeCountry: 'India',
          collegeInitials: 'IITB',
          isVerifiedCollege: true,
        },
      ],
    });
    assert.equal(profile.validateSync(), undefined);
    assert.equal(profile.education[0].collegeCity, 'Mumbai');
    assert.equal(profile.education[0].isVerifiedCollege, true);
  });
});
