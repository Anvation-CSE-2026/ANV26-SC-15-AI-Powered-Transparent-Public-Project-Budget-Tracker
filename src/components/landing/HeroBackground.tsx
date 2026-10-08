import React from 'react';

interface HeroBackgroundProps {
  children: React.ReactNode;
}

export const HeroBackground: React.FC<HeroBackgroundProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-slate-900">
      {/* Background Smart City Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url('/images/smart-city-bg.jpg')`,
        }}
      />

      {/* Atmospheric Cinematic Gradients & Lighting Overlays */}
      {/* 1. Subtle warm daylight glow at top-center */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200/25 via-transparent to-slate-950/70 pointer-events-none" />

      {/* 2. Soft horizontal vignette for contrast and depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 via-transparent to-slate-900/30 pointer-events-none" />

      {/* 3. Bottom sweep tint for text readability */}
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

      {/* 4. Elegant curved bottom swoosh overlay (Smart City wave) */}
      <div className="absolute bottom-0 right-0 w-full max-w-2xl h-36 pointer-events-none opacity-40 hidden sm:block">
        <svg
          viewBox="0 0 500 150"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path
            d="M0,150 C150,90 350,140 500,40 L500,150 L0,150 Z"
            fill="url(#waveGradient)"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between">
        {children}
      </div>
    </div>
  );
};
