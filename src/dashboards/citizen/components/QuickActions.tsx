import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  FileText,
  Lightbulb,
  Vote,
  FolderGit2,
  MapPin,
  ArrowRight,
} from 'lucide-react';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Report an Issue',
      description: 'Submit potholes, water leaks, or garbage complaints with photo and location.',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-rose-50 text-rose-600 hover:border-rose-300',
      iconBg: 'bg-rose-100 text-rose-600',
      path: '/dashboard/citizen/complaints',
      badge: 'High Priority',
    },
    {
      title: 'View My Complaints',
      description: 'Track ongoing review status, SLA deadlines, and resolution updates.',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-600',
      path: '/dashboard/citizen/complaints',
    },
    {
      title: 'Submit Suggestion',
      description: 'Propose civic improvements for parks, transport, or ward amenities.',
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'bg-amber-50 text-amber-600 hover:border-amber-300',
      iconBg: 'bg-amber-100 text-amber-600',
      path: '/dashboard/citizen/suggestions',
    },
    {
      title: 'Vote on Projects',
      description: 'Participate in active citizen polls to prioritize public works funding.',
      icon: <Vote className="w-5 h-5" />,
      color: 'bg-indigo-50 text-indigo-600 hover:border-indigo-300',
      iconBg: 'bg-indigo-100 text-indigo-600',
      path: '/dashboard/citizen/voting',
      badge: '2 Open Polls',
    },
    {
      title: 'Explore Projects',
      description: 'View transparent budgets, progress metrics, and contractor timelines.',
      icon: <FolderGit2 className="w-5 h-5" />,
      color: 'bg-emerald-50 text-emerald-600 hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-600',
      path: '/dashboard/citizen/projects',
    },
    {
      title: 'View City Map',
      description: 'Inspect interactive GIS map with project locations and nearby civic issues.',
      icon: <MapPin className="w-5 h-5" />,
      color: 'bg-sky-50 text-sky-600 hover:border-sky-300',
      iconBg: 'bg-sky-100 text-sky-600',
      path: '/dashboard/citizen/map',
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-heading">
            Citizen Quick Actions
          </h2>
          <p className="text-xs text-slate-500">
            Immediate access to essential civic workflows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {actions.map((act) => (
          <div
            key={act.title}
            onClick={() => navigate(act.path)}
            className={`group p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between ${act.color}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${act.iconBg}`}>
                  {act.icon}
                </div>
                {act.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {act.badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors font-heading">
                {act.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {act.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700 group-hover:text-blue-600">
              <span>Open Module</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
