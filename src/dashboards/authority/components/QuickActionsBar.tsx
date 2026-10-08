import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/common/Button';
import {
  Plus,
  FileText,
  Lightbulb,
  Vote,
  Building2,
  ExternalLink,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

export const QuickActionsBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 text-slate-700 font-semibold">
        <span className="w-2 h-2 rounded-full bg-blue-600" />
        <span>Quick Authority Actions:</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
        <Button
          variant="primary"
          size="sm"
          className="text-xs bg-blue-600 hover:bg-blue-500"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => navigate('/dashboard/project-manager/projects/new')}
        >
          Sanction Project
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          leftIcon={<FileText className="w-3.5 h-3.5 text-blue-600" />}
          onClick={() => navigate('/dashboard/project-manager/complaints')}
        >
          Grievances
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          leftIcon={<Lightbulb className="w-3.5 h-3.5 text-amber-500" />}
          onClick={() => navigate('/dashboard/project-manager/suggestions')}
        >
          Suggestions
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          leftIcon={<Vote className="w-3.5 h-3.5 text-indigo-600" />}
          onClick={() => navigate('/dashboard/project-manager/voting/new')}
        >
          Create Poll
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
          leftIcon={<ShieldAlert className="w-3.5 h-3.5 text-rose-600" />}
          onClick={() => navigate('/dashboard/project-manager/risk-engine')}
        >
          Risk Engine
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          leftIcon={<MapPin className="w-3.5 h-3.5 text-blue-600" />}
          onClick={() => navigate('/dashboard/project-manager/map')}
        >
          GIS Map
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          leftIcon={<Building2 className="w-3.5 h-3.5 text-amber-600" />}
          onClick={() => navigate('/dashboard/project-manager/submissions')}
        >
          Submissions
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-xs text-slate-700 border-slate-200 hover:bg-slate-50"
          leftIcon={<Building2 className="w-3.5 h-3.5 text-emerald-600" />}
          rightIcon={<ExternalLink className="w-3 h-3 text-slate-400" />}
          onClick={() => navigate('/dashboard/project-manager/projects')}
        >
          Projects Registry
        </Button>
      </div>
    </div>
  );
};
