import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CivicAIChat } from '../../components/ai/CivicAIChat';
import { ArrowLeft, Sparkles, ShieldAlert } from 'lucide-react';

export const AuthorityAIPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/dashboard/project-manager')}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white mb-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Command Center</span>
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-white">
                Municipal AI Intelligence Assistant
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[11px] font-semibold text-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Execute portfolio audits, inspect worksite S-curve gaps, analyze cost deviations,
              and receive multi-factor risk diagnostic breakdowns based on CivicSight Risk Engine v2.4.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Authority Telemetry Mode</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <CivicAIChat mode="project_manager" />
    </div>
  );
};

export default AuthorityAIPage;
