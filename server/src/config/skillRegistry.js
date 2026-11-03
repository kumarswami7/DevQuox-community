/**
 * Centralized Developer Skills Registry for DevConnect (Devquox)
 * Maps canonical skill IDs, display names, categories, aliases,
 * official brand colors, and multi-provider icon definitions:
 * - Provider 1 (Primary): Devicon (Vector SVG via jsDelivr CDN)
 * - Provider 2 (Secondary): Simple Icons (Official Brand Logos via simpleicons CDN)
 * - Provider 3 (Fallback): Iconify (Open-source iconography API)
 *
 * All providers are 100% free and require NO API keys.
 */

export const SKILL_CATEGORIES = [
  'Languages',
  'Frontend development',
  'Backend development',
  'Database',
  'DevOps and cloud',
  'Tools & Version Control',
  'UI/UX design',
  'Mobile development',
  'Quality assurance and testing',
  'General',
];

export const CANONICAL_SKILLS = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Core Languages
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'Languages',
    aliases: ['js', 'ecmascript', 'es6', 'es2020', 'vanilla js'],
    iconProvider: 'devicon',
    iconName: 'javascript',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/javascript/F7DF1E',
    iconifyUrl: 'https://api.iconify.design/logos/javascript.svg',
    color: '#F7DF1E',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    category: 'Languages',
    aliases: ['ts', 'typescriptlang'],
    iconProvider: 'devicon',
    iconName: 'typescript',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/typescript/3178C6',
    iconifyUrl: 'https://api.iconify.design/logos/typescript-icon.svg',
    color: '#3178C6',
  },
  {
    id: 'python',
    name: 'Python',
    category: 'Languages',
    aliases: ['py', 'python3', 'python2'],
    iconProvider: 'devicon',
    iconName: 'python',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/python/3776AB',
    iconifyUrl: 'https://api.iconify.design/logos/python.svg',
    color: '#3776AB',
  },
  {
    id: 'java',
    name: 'Java',
    category: 'Languages',
    aliases: ['openjdk', 'jdk', 'jre'],
    iconProvider: 'devicon',
    iconName: 'java',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/openjdk/ED8B00',
    iconifyUrl: 'https://api.iconify.design/logos/java.svg',
    color: '#ED8B00',
  },
  {
    id: 'c',
    name: 'C',
    category: 'Languages',
    aliases: ['c lang', 'clang', 'ansi c'],
    iconProvider: 'devicon',
    iconName: 'c',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/c/c-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/c/A8B9CC',
    iconifyUrl: 'https://api.iconify.design/logos/c.svg',
    color: '#A8B9CC',
  },
  {
    id: 'cpp',
    name: 'C++',
    category: 'Languages',
    aliases: ['cplusplus', 'c plus plus', 'cpp17', 'cpp20'],
    iconProvider: 'devicon',
    iconName: 'cplusplus',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/cplusplus/00599C',
    iconifyUrl: 'https://api.iconify.design/logos/c-plusplus.svg',
    color: '#00599C',
  },
  {
    id: 'csharp',
    name: 'C#',
    category: 'Languages',
    aliases: ['c-sharp', 'c sharp', 'csharp', 'dotnet c#'],
    iconProvider: 'devicon',
    iconName: 'csharp',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/csharp/239120',
    iconifyUrl: 'https://api.iconify.design/logos/c-sharp.svg',
    color: '#239120',
  },
  {
    id: 'php',
    name: 'PHP',
    category: 'Languages',
    aliases: ['php7', 'php8'],
    iconProvider: 'devicon',
    iconName: 'php',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/php/777BB4',
    iconifyUrl: 'https://api.iconify.design/logos/php.svg',
    color: '#777BB4',
  },
  {
    id: 'go',
    name: 'Go',
    category: 'Languages',
    aliases: ['golang', 'go-lang'],
    iconProvider: 'devicon',
    iconName: 'go',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original-wordmark.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/go/00ADD8',
    iconifyUrl: 'https://api.iconify.design/logos/gopher.svg',
    color: '#00ADD8',
  },
  {
    id: 'rust',
    name: 'Rust',
    category: 'Languages',
    aliases: ['rustlang', 'rust-lang'],
    iconProvider: 'devicon',
    iconName: 'rust',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/rust/000000',
    iconifyUrl: 'https://api.iconify.design/logos/rust.svg',
    color: '#000000',
  },
  {
    id: 'ruby',
    name: 'Ruby',
    category: 'Languages',
    aliases: ['ruby-lang', 'mri'],
    iconProvider: 'devicon',
    iconName: 'ruby',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/ruby/CC342D',
    iconifyUrl: 'https://api.iconify.design/logos/ruby.svg',
    color: '#CC342D',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Web Frontend Technologies
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'html5',
    name: 'HTML5',
    category: 'Frontend development',
    aliases: ['html', 'xhtml'],
    iconProvider: 'devicon',
    iconName: 'html5',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/html5/E34F26',
    iconifyUrl: 'https://api.iconify.design/logos/html-5.svg',
    color: '#E34F26',
  },
  {
    id: 'css3',
    name: 'CSS3',
    category: 'Frontend development',
    aliases: ['css', 'cascading style sheets'],
    iconProvider: 'devicon',
    iconName: 'css3',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/css3/1572B6',
    iconifyUrl: 'https://api.iconify.design/logos/css-3.svg',
    color: '#1572B6',
  },
  {
    id: 'react',
    name: 'React',
    category: 'Frontend development',
    aliases: ['reactjs', 'react.js', 'react native'],
    iconProvider: 'devicon',
    iconName: 'react',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/react/61DAFB',
    iconifyUrl: 'https://api.iconify.design/logos/react.svg',
    color: '#61DAFB',
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'Frontend development',
    aliases: ['angularjs', 'angular.io', 'angular 2+'],
    iconProvider: 'devicon',
    iconName: 'angularjs',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/angularjs/angularjs-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/angular/DD0031',
    iconifyUrl: 'https://api.iconify.design/logos/angular-icon.svg',
    color: '#DD0031',
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'Frontend development',
    aliases: ['vue', 'vuejs', 'vue3'],
    iconProvider: 'devicon',
    iconName: 'vuejs',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vuejs/vuejs-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/vuedotjs/4FC08D',
    iconifyUrl: 'https://api.iconify.design/logos/vue.svg',
    color: '#4FC08D',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'Frontend development',
    aliases: ['next', 'nextjs', 'next.js app router'],
    iconProvider: 'devicon',
    iconName: 'nextjs',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/nextdotjs/000000',
    iconifyUrl: 'https://api.iconify.design/logos/nextjs-icon.svg',
    color: '#000000',
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    category: 'Frontend development',
    aliases: ['tailwind', 'tailwindcss'],
    iconProvider: 'devicon',
    iconName: 'tailwindcss',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/tailwindcss/06B6D4',
    iconifyUrl: 'https://api.iconify.design/logos/tailwindcss-icon.svg',
    color: '#06B6D4',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Backend & Runtimes
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'Backend development',
    aliases: ['node', 'nodejs'],
    iconProvider: 'devicon',
    iconName: 'nodejs',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/nodedotjs/5FA04E',
    iconifyUrl: 'https://api.iconify.design/logos/nodejs-icon.svg',
    color: '#5FA04E',
  },
  {
    id: 'express',
    name: 'Express.js',
    category: 'Backend development',
    aliases: ['express', 'expressjs'],
    iconProvider: 'devicon',
    iconName: 'express',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/express/000000',
    iconifyUrl: 'https://api.iconify.design/simple-icons/express.svg',
    color: '#000000',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Databases
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Database',
    aliases: ['mongo', 'mongodb atlas', 'mongoose'],
    iconProvider: 'devicon',
    iconName: 'mongodb',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/mongodb/47A248',
    iconifyUrl: 'https://api.iconify.design/logos/mongodb-icon.svg',
    color: '#47A248',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'Database',
    aliases: ['mysql db', 'oracle mysql'],
    iconProvider: 'devicon',
    iconName: 'mysql',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/mysql/4479A1',
    iconifyUrl: 'https://api.iconify.design/logos/mysql.svg',
    color: '#4479A1',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'Database',
    aliases: ['postgres', 'pgsql', 'psql'],
    iconProvider: 'devicon',
    iconName: 'postgresql',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/postgresql/4169E1',
    iconifyUrl: 'https://api.iconify.design/logos/postgresql.svg',
    color: '#4169E1',
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'Database',
    aliases: ['redis db', 'redis cache', 'valkey'],
    iconProvider: 'devicon',
    iconName: 'redis',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/redis/redis-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/redis/DC382D',
    iconifyUrl: 'https://api.iconify.design/logos/redis.svg',
    color: '#DC382D',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Version Control & DevOps Tools
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'git',
    name: 'Git',
    category: 'Tools & Version Control',
    aliases: ['vcs git', 'git scm'],
    iconProvider: 'devicon',
    iconName: 'git',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/git/F05032',
    iconifyUrl: 'https://api.iconify.design/logos/git-icon.svg',
    color: '#F05032',
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Tools & Version Control',
    aliases: ['github actions', 'gh'],
    iconProvider: 'devicon',
    iconName: 'github',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/github/181717',
    iconifyUrl: 'https://api.iconify.design/logos/github-icon.svg',
    color: '#181717',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    category: 'Tools & Version Control',
    aliases: ['gitlab ci', 'gitlab ci/cd'],
    iconProvider: 'devicon',
    iconName: 'gitlab',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/gitlab/gitlab-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/gitlab/FC6D26',
    iconifyUrl: 'https://api.iconify.design/logos/gitlab.svg',
    color: '#FC6D26',
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'DevOps and cloud',
    aliases: ['docker compose', 'dockerfile', 'containerization'],
    iconProvider: 'devicon',
    iconName: 'docker',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/docker/2496ED',
    iconifyUrl: 'https://api.iconify.design/logos/docker-icon.svg',
    color: '#2496ED',
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'DevOps and cloud',
    aliases: ['k8s', 'kube', 'kubectl'],
    iconProvider: 'devicon',
    iconName: 'kubernetes',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kubernetes/kubernetes-plain.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/kubernetes/326CE5',
    iconifyUrl: 'https://api.iconify.design/logos/kubernetes.svg',
    color: '#326CE5',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Cloud Platforms & OS
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'aws',
    name: 'AWS',
    category: 'DevOps and cloud',
    aliases: ['amazon web services', 'amazon aws', 'ec2', 's3', 'lambda'],
    iconProvider: 'devicon',
    iconName: 'amazonwebservices',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/amazonwebservices/FF9900',
    iconifyUrl: 'https://api.iconify.design/logos/aws.svg',
    color: '#FF9900',
  },
  {
    id: 'azure',
    name: 'Azure',
    category: 'DevOps and cloud',
    aliases: ['microsoft azure', 'azure devops', 'ms azure'],
    iconProvider: 'devicon',
    iconName: 'azure',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/azure/azure-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/microsoftazure/0078D4',
    iconifyUrl: 'https://api.iconify.design/logos/azure-icon.svg',
    color: '#0078D4',
  },
  {
    id: 'googlecloud',
    name: 'Google Cloud',
    category: 'DevOps and cloud',
    aliases: ['gcp', 'google cloud platform', 'google cloud'],
    iconProvider: 'devicon',
    iconName: 'googlecloud',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/googlecloud/googlecloud-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/googlecloud/4285F4',
    iconifyUrl: 'https://api.iconify.design/logos/google-cloud.svg',
    color: '#4285F4',
  },
  {
    id: 'firebase',
    name: 'Firebase',
    category: 'DevOps and cloud',
    aliases: ['firestore', 'firebase auth', 'google firebase'],
    iconProvider: 'devicon',
    iconName: 'firebase',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-plain.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/firebase/FFCA28',
    iconifyUrl: 'https://api.iconify.design/logos/firebase.svg',
    color: '#FFCA28',
  },
  {
    id: 'linux',
    name: 'Linux',
    category: 'DevOps and cloud',
    aliases: ['ubuntu', 'debian', 'gnu linux', 'bash'],
    iconProvider: 'devicon',
    iconName: 'linux',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/linux/FCC624',
    iconifyUrl: 'https://api.iconify.design/logos/linux-tux.svg',
    color: '#FCC624',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Design Tools
  // ─────────────────────────────────────────────────────────────────────────────
  {
    id: 'figma',
    name: 'Figma',
    category: 'UI/UX design',
    aliases: ['figma design', 'figjam'],
    iconProvider: 'devicon',
    iconName: 'figma',
    iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg',
    fallbackUrl: 'https://cdn.simpleicons.org/figma/F24E1E',
    iconifyUrl: 'https://api.iconify.design/logos/figma.svg',
    color: '#F24E1E',
  },
];

/**
 * Normalizes a raw skill name: trims, removes extra whitespace, lowers
 */
export const normalizeSkillKey = (name = '') => {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9#+.]+/gi, '');
};

/**
 * Lookup table for instant O(1) canonical matching by id, name, and alias
 */
const SKILL_LOOKUP_MAP = new Map();

CANONICAL_SKILLS.forEach((skill) => {
  SKILL_LOOKUP_MAP.set(normalizeSkillKey(skill.id), skill);
  SKILL_LOOKUP_MAP.set(normalizeSkillKey(skill.name), skill);
  if (Array.isArray(skill.aliases)) {
    skill.aliases.forEach((alias) => {
      SKILL_LOOKUP_MAP.set(normalizeSkillKey(alias), skill);
    });
  }
});

/**
 * Find skill in registry by name, slug, or alias
 */
export const findSkillByNameOrAlias = (input = '') => {
  if (!input || typeof input !== 'string') return null;
  const key = normalizeSkillKey(input);
  return SKILL_LOOKUP_MAP.get(key) || null;
};

/**
 * Resolve icon metadata for any skill name (canonical or custom)
 */
export const resolveSkillIcon = (skillName = '') => {
  const canonical = findSkillByNameOrAlias(skillName);
  if (canonical) {
    return {
      found: true,
      id: canonical.id,
      name: canonical.name,
      category: canonical.category,
      provider: canonical.iconProvider,
      iconUrl: canonical.iconUrl,
      fallbackUrl: canonical.fallbackUrl,
      iconifyUrl: canonical.iconifyUrl,
      color: canonical.color,
    };
  }

  // Fallback for custom skills
  const clean = String(skillName || '').trim();
  const slug = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  return {
    found: false,
    id: slug || 'custom',
    name: clean,
    category: 'General',
    provider: 'simpleicons',
    iconUrl: `https://cdn.simpleicons.org/${slug}`,
    fallbackUrl: `https://api.iconify.design/logos/${slug}.svg`,
    iconifyUrl: `https://api.iconify.design/simple-icons/${slug}.svg`,
    color: '#64748b',
  };
};

/**
 * Search skills in canonical registry with ranking
 */
export const searchCanonicalSkills = (query = '', limit = 10) => {
  if (!query || !query.trim()) {
    return CANONICAL_SKILLS.slice(0, limit);
  }

  const qLower = query.trim().toLowerCase();
  const qKey = normalizeSkillKey(query);

  const matched = CANONICAL_SKILLS.filter((skill) => {
    if (skill.name.toLowerCase().includes(qLower)) return true;
    if (skill.id.toLowerCase().includes(qLower)) return true;
    if (skill.category.toLowerCase().includes(qLower)) return true;
    return skill.aliases.some((a) => a.toLowerCase().includes(qLower) || normalizeSkillKey(a) === qKey);
  });

  // Rank exact starts higher
  matched.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(qLower);
    const bStarts = b.name.toLowerCase().startsWith(qLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.name.localeCompare(b.name);
  });

  return matched.slice(0, limit);
};

export default {
  SKILL_CATEGORIES,
  CANONICAL_SKILLS,
  findSkillByNameOrAlias,
  resolveSkillIcon,
  searchCanonicalSkills,
  normalizeSkillKey,
};

