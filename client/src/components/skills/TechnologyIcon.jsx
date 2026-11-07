import React, { useState, useEffect } from 'react';
import { resolveSkillIcon } from '../../constants/skillRegistry';
import { Code2, Terminal, Database, Cloud, Wrench, Layers } from 'lucide-react';

// In-memory cache for failed image URLs to skip repeatedly failing network queries
const failedUrlCache = new Set();
// In-memory cache for successfully loaded image URLs
const loadedUrlCache = new Set();

const SIZES = {
  xs: 'w-3.5 h-3.5 min-w-[14px]',
  sm: 'w-4 h-4 min-w-[16px]',
  md: 'w-5 h-5 min-w-[20px]',
  lg: 'w-6 h-6 min-w-[24px]',
  xl: 'w-8 h-8 min-w-[32px]',
};

const CATEGORY_FALLBACK_ICONS = {
  Languages: Code2,
  'Frontend development': Layers,
  'Backend development': Terminal,
  Database: Database,
  'DevOps and cloud': Cloud,
  'Tools & Version Control': Wrench,
  'UI/UX design': Layers,
};

/**
 * TechnologyIcon Component
 * Multi-provider SVG tech icon resolver:
 * Tier 1: Devicon CDN (Official vector SVGs)
 * Tier 2: Simple Icons CDN (Official brand SVGs)
 * Tier 3: Iconify CDN (Open-source iconography)
 * Tier 4: Accessible deterministic brand avatar badge with official brand color
 */
export const TechnologyIcon = ({
  name = '',
  size = 'sm',
  className = '',
  showBackground = false,
  showTooltip = true,
}) => {
  const meta = resolveSkillIcon(name);
  const sizeClass = SIZES[size] || SIZES.sm;

  // Determine current active provider attempt
  // 0: Primary (Devicon), 1: Secondary (Simple Icons), 2: Tertiary (Iconify), 3: Vector Fallback
  const [providerIndex, setProviderIndex] = useState(0);

  useEffect(() => {
    // Reset attempt whenever name changes
    setProviderIndex(0);
  }, [name]);

  // Only attempt external image candidates if this is a canonical, verified skill
  // or has an explicit verified custom URL (skip unverified simpleicons/iconify guesses to avoid 404 network errors)
  const isAutoGuessedUrl = (url) =>
    typeof url === 'string' &&
    (url.includes('simpleicons.org') || url.includes('iconify.design')) &&
    !meta.found;

  const candidates = (meta.found
    ? [meta.iconUrl, meta.fallbackUrl, meta.iconifyUrl]
    : [meta.iconUrl, meta.fallbackUrl, meta.iconifyUrl].filter((url) => url && !isAutoGuessedUrl(url))
  ).filter(Boolean);

  const currentSrc = candidates[providerIndex];

  const handleImageError = () => {
    if (currentSrc) failedUrlCache.add(currentSrc);
    // Advance to next provider candidate
    setProviderIndex((prev) => prev + 1);
  };

  const handleImageLoad = () => {
    if (currentSrc) loadedUrlCache.add(currentSrc);
  };

  // If candidate is exhausted or known to fail
  const hasValidImage = currentSrc && !failedUrlCache.has(currentSrc) && providerIndex < candidates.length;

  if (hasValidImage) {
    const imgEl = (
      <img
        src={currentSrc}
        alt={`${meta.name || name} technology icon`}
        aria-label={`${meta.name || name} icon`}
        className={`${sizeClass} object-contain shrink-0 transition-transform pointer-events-none select-none ${className}`}
        loading="lazy"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    );

    if (showBackground) {
      return (
        <span
          className="inline-flex items-center justify-center p-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0"
          title={showTooltip ? (meta.name || name) : undefined}
        >
          {imgEl}
        </span>
      );
    }

    return imgEl;
  }

  // Tier 4: Fallback Vector Badge with Official Brand Color and Clean Initials
  const rawClean = (meta.name || name || '').trim();
  const initials = rawClean
    ? rawClean
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join('')
        .slice(0, 3)
        .toUpperCase()
    : 'DEV';

  const FallbackIcon = CATEGORY_FALLBACK_ICONS[meta.category] || Code2;

  return (
    <span
      role="img"
      aria-label={`${meta.name || name} icon`}
      title={showTooltip ? (meta.name || name) : undefined}
      style={{
        backgroundColor: `${meta.color}15`,
        borderColor: `${meta.color}40`,
        color: meta.color || '#dc2626',
      }}
      className={`inline-flex items-center justify-center font-black tracking-tight rounded-md border select-none shrink-0 ${sizeClass} ${className}`}
    >
      {initials.length >= 1 ? (
        <span style={{ fontSize: size === 'xs' ? '8px' : size === 'sm' ? '9px' : '11px' }}>
          {initials}
        </span>
      ) : (
        <FallbackIcon className="w-full h-full p-0.5" />
      )}
    </span>
  );
};

export default TechnologyIcon;

