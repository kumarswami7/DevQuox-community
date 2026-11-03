import { University, normalizeUniversityName, resolveFaviconUrl } from '../models/University.js';

export const INITIAL_UNIVERSITIES_DATA = [
  // United Kingdom
  {
    universityName: 'University of Oxford',
    country: 'United Kingdom',
    countryCode: 'GB',
    stateProvince: 'Oxfordshire',
    domains: ['ox.ac.uk'],
    websites: ['http://www.ox.ac.uk/'],
    isVerified: true,
  },
  {
    universityName: 'University of Cambridge',
    country: 'United Kingdom',
    countryCode: 'GB',
    stateProvince: 'Cambridgeshire',
    domains: ['cam.ac.uk'],
    websites: ['http://www.cam.ac.uk/'],
    isVerified: true,
  },
  {
    universityName: 'Imperial College London',
    country: 'United Kingdom',
    countryCode: 'GB',
    stateProvince: 'London',
    domains: ['imperial.ac.uk'],
    websites: ['http://www.imperial.ac.uk/'],
    isVerified: true,
  },
  {
    universityName: 'University College London',
    country: 'United Kingdom',
    countryCode: 'GB',
    stateProvince: 'London',
    domains: ['ucl.ac.uk'],
    websites: ['http://www.ucl.ac.uk/'],
    isVerified: true,
  },

  // United States
  {
    universityName: 'Harvard University',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'Massachusetts',
    domains: ['harvard.edu'],
    websites: ['http://www.harvard.edu/'],
    isVerified: true,
  },
  {
    universityName: 'Stanford University',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'California',
    domains: ['stanford.edu'],
    websites: ['http://www.stanford.edu/'],
    isVerified: true,
  },
  {
    universityName: 'Massachusetts Institute of Technology',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'Massachusetts',
    domains: ['mit.edu'],
    websites: ['http://www.mit.edu/'],
    isVerified: true,
  },
  {
    universityName: 'University of California, Berkeley',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'California',
    domains: ['berkeley.edu'],
    websites: ['http://www.berkeley.edu/'],
    isVerified: true,
  },
  {
    universityName: 'Carnegie Mellon University',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'Pennsylvania',
    domains: ['cmu.edu'],
    websites: ['http://www.cmu.edu/'],
    isVerified: true,
  },
  {
    universityName: 'Columbia University',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'New York',
    domains: ['columbia.edu'],
    websites: ['http://www.columbia.edu/'],
    isVerified: true,
  },
  {
    universityName: 'Princeton University',
    country: 'United States',
    countryCode: 'US',
    stateProvince: 'New Jersey',
    domains: ['princeton.edu'],
    websites: ['http://www.princeton.edu/'],
    isVerified: true,
  },

  // India
  {
    universityName: 'Rajiv Gandhi University of Knowledge Technologies, Ongole',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Andhra Pradesh',
    domains: ['rguktong.ac.in', 'rgukt.in'],
    websites: ['https://www.rguktong.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'Indian Institute of Technology Bombay',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Maharashtra',
    domains: ['iitb.ac.in'],
    websites: ['http://www.iitb.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'Indian Institute of Technology Delhi',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Delhi',
    domains: ['iitd.ac.in'],
    websites: ['http://www.iitd.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'Indian Institute of Technology Madras',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Tamil Nadu',
    domains: ['iitm.ac.in'],
    websites: ['http://www.iitm.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'Birla Institute of Technology and Science, Pilani',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Rajasthan',
    domains: ['bits-pilani.ac.in'],
    websites: ['http://www.bits-pilani.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'International Institute of Information Technology, Hyderabad',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Telangana',
    domains: ['iiit.ac.in'],
    websites: ['http://www.iiit.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'Indian Institute of Science',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Karnataka',
    domains: ['iisc.ac.in'],
    websites: ['http://www.iisc.ac.in/'],
    isVerified: true,
  },
  {
    universityName: 'Delhi University',
    country: 'India',
    countryCode: 'IN',
    stateProvince: 'Delhi',
    domains: ['du.ac.in'],
    websites: ['http://www.du.ac.in/'],
    isVerified: true,
  },

  // Canada
  {
    universityName: 'University of Toronto',
    country: 'Canada',
    countryCode: 'CA',
    stateProvince: 'Ontario',
    domains: ['utoronto.ca'],
    websites: ['http://www.utoronto.ca/'],
    isVerified: true,
  },
  {
    universityName: 'University of Waterloo',
    country: 'Canada',
    countryCode: 'CA',
    stateProvince: 'Ontario',
    domains: ['uwaterloo.ca'],
    websites: ['http://www.uwaterloo.ca/'],
    isVerified: true,
  },
  {
    universityName: 'University of British Columbia',
    country: 'Canada',
    countryCode: 'CA',
    stateProvince: 'British Columbia',
    domains: ['ubc.ca'],
    websites: ['http://www.ubc.ca/'],
    isVerified: true,
  },

  // Singapore
  {
    universityName: 'National University of Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    stateProvince: null,
    domains: ['nus.edu.sg'],
    websites: ['http://www.nus.edu.sg/'],
    isVerified: true,
  },
  {
    universityName: 'Nanyang Technological University',
    country: 'Singapore',
    countryCode: 'SG',
    stateProvince: null,
    domains: ['ntu.edu.sg'],
    websites: ['http://www.ntu.edu.sg/'],
    isVerified: true,
  },

  // Australia
  {
    universityName: 'University of Melbourne',
    country: 'Australia',
    countryCode: 'AU',
    stateProvince: 'Victoria',
    domains: ['unimelb.edu.au'],
    websites: ['http://www.unimelb.edu.au/'],
    isVerified: true,
  },
  {
    universityName: 'University of Sydney',
    country: 'Australia',
    countryCode: 'AU',
    stateProvince: 'New South Wales',
    domains: ['sydney.edu.au'],
    websites: ['http://www.sydney.edu.au/'],
    isVerified: true,
  },

  // Germany
  {
    universityName: 'Technical University of Munich',
    country: 'Germany',
    countryCode: 'DE',
    stateProvince: 'Bavaria',
    domains: ['tum.de'],
    websites: ['http://www.tum.de/'],
    isVerified: true,
  },
  {
    universityName: 'Ludwig Maximilian University of Munich',
    country: 'Germany',
    countryCode: 'DE',
    stateProvince: 'Bavaria',
    domains: ['uni-muenchen.de'],
    websites: ['http://www.uni-muenchen.de/'],
    isVerified: true,
  },
];

export const seedInitialUniversities = async () => {
  try {
    const count = await University.countDocuments();
    if (count > 0) return { seeded: 0, existing: count };

    const operations = INITIAL_UNIVERSITIES_DATA.map((u) => {
      const normalized = normalizeUniversityName(u.universityName);
      const domain = u.domains?.[0] || '';
      return {
        updateOne: {
          filter: { normalizedName: normalized, country: u.country },
          update: {
            $setOnInsert: {
              ...u,
              normalizedName: normalized,
              logoUrl: resolveFaviconUrl(domain),
              logoSource: 'favicon',
              source: 'hipo',
            },
          },
          upsert: true,
        },
      };
    });

    const result = await University.bulkWrite(operations);
    return {
      seeded: result.upsertedCount || operations.length,
      existing: count,
    };
  } catch (err) {
    console.warn('Initial universities seed non-critical warning:', err.message);
    return { seeded: 0, error: err.message };
  }
};

