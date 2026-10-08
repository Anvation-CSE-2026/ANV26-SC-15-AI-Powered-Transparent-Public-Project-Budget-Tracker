import React from 'react';

export const HeroMessage: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col items-start select-none pointer-events-none animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="space-y-0.5">
        <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-slate-900/90 tracking-tight leading-tight italic font-serif drop-shadow-xs">
          Cleaner, Safer,
        </h2>
        <h2 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-slate-900/90 tracking-tight leading-tight italic font-serif drop-shadow-xs">
          Greener, Smarter
        </h2>

        <div className="pt-1.5 flex flex-col items-start">
          <span className="text-2xl xl:text-3xl 2xl:text-4xl font-black text-slate-800 tracking-tight not-italic font-sans">
            Together.
          </span>
          {/* Elegant curved teal/green brush stroke accent line */}
          <svg
            className="w-32 xl:w-40 h-3 text-teal-600 mt-1"
            viewBox="0 0 160 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 10C45 3 115 3 156 10"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
