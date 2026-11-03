import mongoose from 'mongoose';
import { Company, normalizeCompanyName, resolveCompanyDomain, resolveCompanyFavicon, extractCompanyInitials } from '../models/Company.js';

export const INITIAL_COMPANIES_DATA = [
  {
    name: 'Tata Consultancy Services',
    legalName: 'TATA CONSULTANCY SERVICES LIMITED',
    domain: 'tcs.com',
    website: 'https://www.tcs.com',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    industry: 'Technology & Software',
    industryGroup: 'IT Services & Consulting',
    registrationNumber: 'L22210MH1995PLC084781',
    registryName: 'MCA',
    status: 'Active',
    companySize: '500,000+ Employees',
    employeesEstimate: 600000,
    jobiworkId: 'JW-000020',
    hiring: { isHiring: true, openJobs: 1420, employerVerified: true },
    listing: { isListed: true, tickers: ['BSE:TCS', 'NSE:TCS'] },
    source: 'seed',
    verificationStatus: 'verified',
  },
  {
    name: 'Infosys',
    legalName: 'INFOSYS LIMITED',
    domain: 'infosys.com',
    website: 'https://www.infosys.com',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    industry: 'Technology & Software',
    industryGroup: 'IT Consulting & Enterprise Solutions',
    registrationNumber: 'L85110KA1981PLC013115',
    registryName: 'MCA',
    status: 'Active',
    companySize: '300,000+ Employees',
    employeesEstimate: 330000,
    jobiworkId: 'JW-000025',
    hiring: { isHiring: true, openJobs: 980, employerVerified: true },
    listing: { isListed: true, tickers: ['NSE:INFY', 'BSE:INFY', 'NYSE:INFY'] },
    source: 'seed',
    verificationStatus: 'verified',
  },
  {
    name: 'Wipro',
    legalName: 'WIPRO LIMITED',
    domain: 'wipro.com',
    website: 'https://www.wipro.com',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    industry: 'Technology & Software',
    industryGroup: 'Cloud & Digital Transformation',
    registrationNumber: 'L32102KA1945PLC020800',
    registryName: 'MCA',
    status: 'Active',
    companySize: '240,000+ Employees',
    employeesEstimate: 240000,
    jobiworkId: 'JW-000030',
    hiring: { isHiring: true, openJobs: 650, employerVerified: true },
    listing: { isListed: true, tickers: ['NSE:WIPRO', 'BSE:WIPRO'] },
    source: 'seed',
    verificationStatus: 'verified',
  },
  {
    name: 'Razorpay',
    legalName: 'RAZORPAY SOFTWARE PRIVATE LIMITED',
    domain: 'razorpay.com',
    website: 'https://razorpay.com',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    industry: 'FinTech & Payments',
    industryGroup: 'Financial Technology',
    registrationNumber: 'U72200KA2014PTC097368',
    registryName: 'MCA',
    status: 'Active',
    companySize: '2,500+ Employees',
    employeesEstimate: 2800,
    jobiworkId: 'JW-000150',
    hiring: { isHiring: true, openJobs: 85, employerVerified: true },
    listing: { isListed: false, tickers: [] },
    source: 'seed',
    verificationStatus: 'verified',
  },
  {
    name: 'Google India',
    legalName: 'GOOGLE INDIA PRIVATE LIMITED',
    domain: 'google.com',
    website: 'https://about.google',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    industry: 'Internet & AI',
    industryGroup: 'Cloud, Search & AI',
    registrationNumber: 'U72900KA2003PTC033028',
    registryName: 'MCA',
    status: 'Active',
    companySize: '10,000+ Employees',
    employeesEstimate: 12000,
    jobiworkId: 'JW-000050',
    hiring: { isHiring: true, openJobs: 320, employerVerified: true },
    listing: { isListed: true, tickers: ['NASDAQ:GOOGL'] },
    source: 'seed',
    verificationStatus: 'verified',
  },
  {
    name: 'Microsoft India',
    legalName: 'MICROSOFT CORPORATION (INDIA) PRIVATE LIMITED',
    domain: 'microsoft.com',
    website: 'https://www.microsoft.com',
    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    industry: 'Software & Cloud',
    industryGroup: 'Cloud Computing & Enterprise Software',
    registrationNumber: 'U72200TG1988PTC066755',
    registryName: 'MCA',
    status: 'Active',
    companySize: '18,000+ Employees',
    employeesEstimate: 18000,
    jobiworkId: 'JW-000060',
    hiring: { isHiring: true, openJobs: 410, employerVerified: true },
    listing: { isListed: true, tickers: ['NASDAQ:MSFT'] },
    source: 'seed',
    verificationStatus: 'verified',
  },
];

export const seedInitialCompanies = async () => {
  try {
    if (mongoose.connection.readyState !== 1) return { seeded: 0 };

    const count = await Company.countDocuments({ source: 'seed' });
    if (count >= INITIAL_COMPANIES_DATA.length) {
      return { seeded: 0, existing: count };
    }

    let seeded = 0;
    for (const item of INITIAL_COMPANIES_DATA) {
      const normalized = normalizeCompanyName(item.name);
      const existing = await Company.findOne({
        $or: [
          { domain: item.domain },
          { registrationNumber: item.registrationNumber },
          { normalizedName: normalized, country: item.country },
        ],
      });

      if (!existing) {
        await Company.create({
          ...item,
          normalizedName: normalized,
          logoUrl: resolveCompanyFavicon(item.domain),
          logoSource: 'favicon',
          initials: extractCompanyInitials(item.name),
        });
        seeded++;
      }
    }

    return { seeded, total: await Company.countDocuments() };
  } catch (err) {
    console.warn('[CompanySeeder] seed notice:', err.message);
    return { seeded: 0, error: err.message };
  }
};

