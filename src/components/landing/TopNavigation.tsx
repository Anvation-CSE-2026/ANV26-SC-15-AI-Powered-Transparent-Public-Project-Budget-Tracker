import React, { useState } from 'react';
import { CivicSightLogo } from '../brand/CivicSightLogo';
import { Modal } from '../common/Modal';
import { AlertCircle, Vote, HardHat, Sparkles } from 'lucide-react';

export const TopNavigation: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'report' | 'engage' | 'build' | 'tomorrow' | null>(null);

  return (
    <>
      <header className="relative z-20 w-full px-6 lg:px-12 py-5 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center">
          <CivicSightLogo
            size="md"
            subtitle="Smarter Cities • Happier Citizens"
            variant="dark"
            orientation="horizontal"
          />
        </div>

        {/* Minimalist Top Right Navigation */}
        <nav
          aria-label="CivicSight Core Pillars"
          className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-medium text-slate-800/90 tracking-wide"
        >
          <button
            type="button"
            onClick={() => setActiveModal('report')}
            className="hover:text-blue-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/40 backdrop-blur-xs"
          >
            Report
          </button>
          <span className="text-slate-400 select-none">&bull;</span>

          <button
            type="button"
            onClick={() => setActiveModal('engage')}
            className="hover:text-blue-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/40 backdrop-blur-xs"
          >
            Engage
          </button>
          <span className="text-slate-400 select-none">&bull;</span>

          <button
            type="button"
            onClick={() => setActiveModal('build')}
            className="hover:text-blue-600 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/40 backdrop-blur-xs"
          >
            Build
          </button>
          <span className="text-slate-400 select-none">&bull;</span>

          <button
            type="button"
            onClick={() => setActiveModal('tomorrow')}
            className="hover:text-teal-700 transition-colors font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-white/40 backdrop-blur-xs"
          >
            A Better Tomorrow
          </button>
        </nav>
      </header>

      {/* Info Modals for Pillar Links */}
      <Modal
        isOpen={activeModal === 'report'}
        onClose={() => setActiveModal(null)}
        title="Civic Issue Reporting"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Direct Citizen Problem Reporting</h4>
          <p>
            Spot a pothole, broken streetlight, or illegal waste dumping? CivicSight enables citizens to submit verified complaints with GPS geotagging, site photo proof, and real-time SLA tracking from municipal authorities.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'engage'}
        onClose={() => setActiveModal(null)}
        title="Citizen Engagement &amp; Voting"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Vote className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Participatory Governance</h4>
          <p>
            Democracy doesn&apos;t end on election day. Propose municipal improvements, debate urban policies, and cast verified votes on city budget allocations and public poll initiatives.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'build'}
        onClose={() => setActiveModal(null)}
        title="Public Works Transparency"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <HardHat className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">End-to-End Infrastructure Accountability</h4>
          <p>
            Track capital projects from tender to handover. Inspect contractor claims, verified stage-gate progress, budget deviations, and milestone delivery dates with complete public transparency.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'tomorrow'}
        onClose={() => setActiveModal(null)}
        title="CivicSight Vision"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">AI-Powered Smart City Governance</h4>
          <p>
            “See the Project. Understand the Data. Make Your Voice Count.” CivicSight brings artificial intelligence, automated risk scoring, and real-time civic transparency together for a cleaner, greener, smarter tomorrow.
          </p>
        </div>
      </Modal>
    </>
  );
};
