import React from 'react';

export const DevquoxLogo = ({ size = 'md', showText = true, variant = 'standard', className = '' }) => {
  const sizeMap = {
    sm: { img: 'h-8 w-auto max-w-[36px]', text: 'text-base', sub: 'text-[9px]', full: 'h-8 w-auto' },
    md: { img: 'h-9 w-auto max-w-[42px]', text: 'text-lg', sub: 'text-[10px]', full: 'h-10 w-auto' },
    lg: { img: 'h-12 w-auto max-w-[56px]', text: 'text-2xl', sub: 'text-xs', full: 'h-14 w-auto' },
  };

  const current = sizeMap[size] || sizeMap.md;

  if (variant === 'full') {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src="/devquox-full.png"
          alt="Devquox"
          className={`${current.full} object-contain transition-transform duration-200 hover:scale-105`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative group flex items-center justify-center">
        <img
          src="/devquox-icon.png"
          alt="Devquox Icon"
          className={`${current.img} object-contain transition-transform duration-200 group-hover:scale-105`}
        />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight leading-none text-slate-900 ${current.text}`}>
            Dev<span className="bg-gradient-to-r from-red-600 via-rose-600 to-red-500 bg-clip-text text-transparent">quox</span>
          </span>
          <span className={`font-semibold text-slate-400 tracking-wider uppercase mt-0.5 ${current.sub}`}>
            Developer & Client Platform
          </span>
        </div>
      )}
    </div>
  );
};

export default DevquoxLogo;
