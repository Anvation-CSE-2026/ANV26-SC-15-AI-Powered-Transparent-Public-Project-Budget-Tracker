import React from 'react';
import { MessageSquareWarning, Lightbulb, Users, TrendingUp } from 'lucide-react';

interface FeatureItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const features: FeatureItem[] = [
  {
    title: 'Report Issues',
    subtitle: 'Make your city better',
    icon: <MessageSquareWarning className="w-5 h-5 text-teal-300" />,
  },
  {
    title: 'Share Ideas',
    subtitle: 'Your ideas matter',
    icon: <Lightbulb className="w-5 h-5 text-teal-300" />,
  },
  {
    title: 'Participate',
    subtitle: 'Shape the future',
    icon: <Users className="w-5 h-5 text-teal-300" />,
  },
  {
    title: 'Track Progress',
    subtitle: 'See real progress',
    icon: <TrendingUp className="w-5 h-5 text-teal-300" />,
  },
];

export const FeatureHighlights: React.FC = () => {
  return (
    <div className="relative z-20 w-full overflow-hidden">
      {/* Sleek curved bottom accent bar with glass effect */}
      <div className="bg-gradient-to-r from-slate-950/85 via-blue-950/80 to-slate-900/60 backdrop-blur-md border-t border-cyan-500/20 px-6 lg:px-12 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 w-full md:w-auto">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 group transition-transform duration-200 hover:translate-y-[-2px]"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 transition-colors">
                  {feature.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-wide truncate">
                    {feature.title}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Micro Security & Civic Transparency Tag */}
          <div className="hidden xl:flex items-center gap-2 text-[11px] text-cyan-200/80 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Smart City Municipal Network &bull; 100% Transparent Governance</span>
          </div>
        </div>
      </div>
    </div>
  );
};
