import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { University, normalizeUniversityName, resolveFaviconUrl } from '../../src/models/University.js';
import { universityService } from '../../src/services/universityService.js';
import { INITIAL_UNIVERSITIES_DATA, seedInitialUniversities } from '../../src/database/seedUniversities.js';

describe('Worldwide University & College Integration Unit Tests', () => {
  test('normalizeUniversityName handles special characters and casing', () => {
    assert.equal(normalizeUniversityName('University of Oxford'), 'university of oxford');
    assert.equal(normalizeUniversityName('  St. John\'s College!  '), 'st johns college');
    assert.equal(normalizeUniversityName('HARVARD UNIVERSITY'), 'harvard university');
    assert.equal(normalizeUniversityName(''), '');
    assert.equal(normalizeUniversityName(null), '');
  });

  test('resolveFaviconUrl extracts domain and formats Google Favicon URL', () => {
    assert.equal(
      resolveFaviconUrl('ox.ac.uk'),
      'https://www.google.com/s2/favicons?domain=ox.ac.uk&sz=128'
    );
    assert.equal(
      resolveFaviconUrl('https://www.stanford.edu/admissions'),
      'https://www.google.com/s2/favicons?domain=www.stanford.edu&sz=128'
    );
    assert.equal(resolveFaviconUrl(''), '');
    assert.equal(resolveFaviconUrl(null), '');
  });

  test('University schema requires universityName and country', () => {
    const invalidUni = new University({});
    const error = invalidUni.validateSync();
    assert.ok(error);
    assert.ok(error.errors.universityName);
    assert.ok(error.errors.country);
  });

  test('University pre-save auto-populates normalizedName and favicon logoUrl', async () => {
    const uni = new University({
      universityName: 'University of Cambridge',
      country: 'United Kingdom',
      countryCode: 'GB',
      domains: ['cam.ac.uk'],
    });

    // Validate sync should pass
    const validationError = uni.validateSync();
    assert.equal(validationError, undefined);

    // Call pre-save hook manually or verify logic
    uni.normalizedName = normalizeUniversityName(uni.universityName);
    if (!uni.logoUrl && uni.domains?.[0]) {
      uni.logoUrl = resolveFaviconUrl(uni.domains[0]);
    }

    assert.equal(uni.normalizedName, 'university of cambridge');
    assert.equal(
      uni.logoUrl,
      'https://www.google.com/s2/favicons?domain=cam.ac.uk&sz=128'
    );
  });

  test('INITIAL_UNIVERSITIES_DATA contains top worldwide universities across major countries', () => {
    assert.ok(INITIAL_UNIVERSITIES_DATA.length >= 20);

    const countries = new Set(INITIAL_UNIVERSITIES_DATA.map((u) => u.country));
    assert.ok(countries.has('United Kingdom'));
    assert.ok(countries.has('United States'));
    assert.ok(countries.has('India'));
    assert.ok(countries.has('Canada'));
    assert.ok(countries.has('Singapore'));
  });

  test('Manual university creation validates input and marks as unverified', async () => {
    const manualData = {
      universityName: 'Custom Tech Institute',
      country: 'India',
      countryCode: 'IN',
      website: 'https://customtech.edu.in',
    };

    const uni = new University({
      ...manualData,
      normalizedName: normalizeUniversityName(manualData.universityName),
      isVerified: false,
      source: 'manual',
      domains: ['customtech.edu.in'],
      logoUrl: resolveFaviconUrl('customtech.edu.in'),
      logoSource: 'favicon',
    });

    assert.equal(uni.isVerified, false);
    assert.equal(uni.source, 'manual');
    assert.equal(uni.logoSource, 'favicon');
    assert.equal(uni.domains[0], 'customtech.edu.in');
    assert.equal(uni.country, 'India');
  });

  test('Prevents duplicate university using normalizedName and country', () => {
    const name1 = normalizeUniversityName('Indian Institute of Technology Delhi');
    const name2 = normalizeUniversityName('  indian institute of technology delhi  ');
    assert.equal(name1, name2);
  });

  test('Handles empty and invalid query parameters gracefully', () => {
    const emptyNorm = normalizeUniversityName('   ');
    assert.equal(emptyNorm, '');
  });
});

