import React from 'react';

export interface CivicSightLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  subtitle?: string;
  variant?: 'dark' | 'light';
  orientation?: 'horizontal' | 'vertical';
  showText?: boolean;
  className?: string;
}

export const CivicSightLogo: React.FC<CivicSightLogoProps> = ({
  size = 'md',
  subtitle,
  variant = 'dark',
  orientation = 'horizontal',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base',
  };

  const isLight = variant === 'light';
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex ${
        isVertical ? 'flex-col items-center text-center' : 'items-center text-left'
      } gap-3 ${className}`}
    >
      {/* Smart City Emblem Icon */}
      <div className={`relative shrink-0 ${iconSizes[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          <defs>
            <linearGradient id="towerGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="towerGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0f766e" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="glowRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Left Tower */}
          <path
            d="M17 40V24L25 18V40H17Z"
            fill="url(#towerGrad1)"
            opacity="0.9"
          />
          {/* Windows Left Tower */}
          <rect x="19" y="25" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />
          <rect x="22" y="23" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />
          <rect x="19" y="31" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />
          <rect x="22" y="29" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />

          {/* Center Tall Tower */}
          <path
            d="M27 40V12L37 7V40H27Z"
            fill="url(#towerGrad2)"
          />
          {/* Center Tower Spire & Windows */}
          <rect x="29.5" y="15" width="2" height="3" rx="0.5" fill="white" opacity="0.9" />
          <rect x="33" y="13" width="2" height="3" rx="0.5" fill="white" opacity="0.9" />
          <rect x="29.5" y="21" width="2" height="3" rx="0.5" fill="white" opacity="0.9" />
          <rect x="33" y="19" width="2" height="3" rx="0.5" fill="white" opacity="0.9" />
          <rect x="29.5" y="27" width="2" height="3" rx="0.5" fill="white" opacity="0.9" />
          <rect x="33" y="25" width="2" height="3" rx="0.5" fill="white" opacity="0.9" />

          {/* Right Tower */}
          <path
            d="M39 40V20L47 25V40H39Z"
            fill="url(#towerGrad1)"
            opacity="0.95"
          />
          {/* Windows Right Tower */}
          <rect x="41" y="25" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />
          <rect x="44" y="27" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />
          <rect x="41" y="31" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />
          <rect x="44" y="33" width="2" height="3" rx="0.5" fill="white" opacity="0.8" />

          {/* Base Protective Civic Swoop / Shield Leaf */}
          <path
            d="M8 38C13 47 25 56 36 55C47 54 55 45 56 38C52 46 43 51 34 50C22 49 13 43 8 38Z"
            fill="url(#shieldGrad)"
          />
          {/* Accent Leaf Swoop Overlay */}
          <path
            d="M11 41C16 50 28 54 39 52C47 50 52 44 54 39C49 46 41 49 33 48C23 47 16 43 11 41Z"
            fill="#38bdf8"
            opacity="0.8"
          />

          {/* Connected Smart Node Pulse */}
          <circle cx="14" cy="38" r="2.5" fill="#10b981" />
          <circle cx="14" cy="38" r="4.5" stroke="#34d399" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className={isVertical ? 'flex flex-col items-center' : 'flex flex-col'}>
          <div
            className={`font-black tracking-tight font-heading leading-tight ${titleSizes[size]} ${
              isLight ? 'text-white' : 'text-slate-900'
            }`}
          >
            <span>Civic</span>
            <span className="text-blue-600">Sight</span>
          </div>
          {subtitle && (
            <p
              className={`font-medium tracking-normal mt-0.5 ${subtitleSizes[size]} ${
                isLight ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
