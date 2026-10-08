import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl shadow-md p-2.5 text-xs select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 text-slate-700 font-bold text-[11px] uppercase tracking-wider cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          Map Legend
        </span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="pt-2 mt-1.5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-1 gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-xs shrink-0" />
            <span className="text-slate-700 font-medium">Public Projects</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-xs shrink-0 animate-pulse" />
            <span className="text-slate-700 font-medium">Emergency Issues</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 border border-white shadow-xs shrink-0" />
            <span className="text-slate-700 font-medium">High Priority</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white shadow-xs shrink-0" />
            <span className="text-slate-700 font-medium">Normal / Active</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs shrink-0" />
            <span className="text-slate-700 font-medium">Resolved Issues</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-300 border border-white shrink-0" />
            <span className="text-slate-700 font-medium">Your GPS Location</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
