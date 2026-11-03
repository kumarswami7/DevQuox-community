export const BADGE_GRADIENTS = [
  'from-blue-600 to-indigo-700 text-white',
  'from-emerald-600 to-teal-700 text-white',
  'from-violet-600 to-purple-800 text-white',
  'from-rose-600 to-red-700 text-white',
  'from-amber-600 to-orange-700 text-white',
  'from-cyan-600 to-blue-800 text-white',
];

export const getGradientForString = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BADGE_GRADIENTS[Math.abs(hash) % BADGE_GRADIENTS.length];
};

// Known tech and enterprise domain map for instant automatic logo matching
export const KNOWN_COMPANY_DOMAINS = {
  google: 'google.com',
  deloitte: 'deloitte.com',
  microsoft: 'microsoft.com',
  amazon: 'amazon.com',
  aws: 'amazon.com',
  apple: 'apple.com',
  meta: 'meta.com',
  facebook: 'meta.com',
  netflix: 'netflix.com',
  stripe: 'stripe.com',
  tcs: 'tcs.com',
  'tata consultancy services': 'tcs.com',
  infosys: 'infosys.com',
  wipro: 'wipro.com',
  razorpay: 'razorpay.com',
  accenture: 'accenture.com',
  cognizant: 'cognizant.com',
  capgemini: 'capgemini.com',
  ibm: 'ibm.com',
  oracle: 'oracle.com',
  salesforce: 'salesforce.com',
  adobe: 'adobe.com',
  uber: 'uber.com',
  airbnb: 'airbnb.com',
  spotify: 'spotify.com',
  swiggy: 'swiggy.com',
  zomato: 'zomato.com',
  flipkart: 'flipkart.com',
  paytm: 'paytm.com',
  phonepe: 'phonepe.com',
  cred: 'cred.club',
  zerodha: 'zerodha.com',
  intel: 'intel.com',
  nvidia: 'nvidia.com',
  cisco: 'cisco.com',
  paypal: 'paypal.com',
};

export const resolveDomainFromName = (name = '') => {
  const normalized = (name || '').trim().toLowerCase();
  if (KNOWN_COMPANY_DOMAINS[normalized]) return KNOWN_COMPANY_DOMAINS[normalized];
  if (normalized.includes('.') && !normalized.includes(' ')) return normalized;
  // If clean single token without spaces
  const single = normalized.replace(/[^a-z0-9]/g, '');
  if (single && single.length >= 3 && single.length <= 24) {
    return `${single}.com`;
  }
  return '';
};

