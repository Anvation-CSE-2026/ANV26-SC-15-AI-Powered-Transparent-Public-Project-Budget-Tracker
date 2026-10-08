import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CivicAIChat } from '../../components/ai/CivicAIChat';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export const CitizenAIPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard/citizen')}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Citizen Portal</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-white">
                CivicSight AI Assistant
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[11px] font-semibold text-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-300" />
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Ask questions about municipal projects, understand capital budgets and delay causes,
              and receive verified guidance on filing complaints and participating in polls.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Public Transparency Mode</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <CivicAIChat mode="citizen" />
    </div>
  );
};

export default CitizenAIPage;
