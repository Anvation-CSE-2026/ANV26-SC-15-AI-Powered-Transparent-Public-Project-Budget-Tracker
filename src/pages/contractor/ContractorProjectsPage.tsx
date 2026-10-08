import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAssignedProjects } from '../../api/contractorService';
import type { Project } from '../../types/project';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  HardHat,
  Search,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  FolderOpen,
  TrendingUp,
} from 'lucide-react';

export const ContractorProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(Boolean(userProfile?.uid));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadProjects = useCallback(async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const res = await getAssignedProjects(userProfile.uid);
      setProjects(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    let isMounted = true;
    if (!userProfile?.uid) return;

    getAssignedProjects(userProfile.uid)
      .then((res) => {
        if (isMounted) {
          setProjects(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
              Contractor Charter
            </Badge>
            <span className="text-xs text-amber-200">Municipal Assigned Works</span>
          </div>
          <h1 className="text-2xl font-bold font-heading">Assigned Capital Projects</h1>
          <p className="text-xs text-slate-300">
            All public works charters officially assigned to your company by project managers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadProjects}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs self-start sm:self-center"
        >
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Input
            placeholder="Search by project number or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="all">All Statuses ({projects.length})</option>
            <option value="ongoing">Ongoing</option>
            <option value="delayed">Delayed</option>
            <option value="at risk">At Risk</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600" />
              Assigned Projects ({filteredProjects.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Only projects strictly assigned to your contractor account are displayed.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading assigned projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Assigned Projects Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No assigned projects match the search and filter criteria.'
                  : 'You have not been assigned any public works projects yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => {
                const completion = project.progress || 0;
                const isCompleted = project.status.toLowerCase() === 'completed';

                return (
                  <div
                    key={project.id}
                    className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {project.projectNumber}
                          </span>
                          <Badge variant="info" size="sm">{project.status}</Badge>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {project.department}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {project.category}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900">
                          {project.name}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-slate-200 text-slate-700"
                          onClick={() => navigate(`/dashboard/contractor/projects/${project.id}`)}
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>

                        {!isCompleted ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs bg-amber-600 hover:bg-amber-500 text-white"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => navigate(`/dashboard/contractor/projects/${project.id}/submit`)}
                          >
                            Submit Update
                          </Button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                            Approved Physical Progress
                          </span>
                          <span className="font-bold text-slate-900">{completion}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 self-center">
                        <span>
                          Supervising PM: <strong className="text-slate-800">{project.projectManagerName}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Target: {new Date(project.plannedCompletionDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {project.delayDays > 0 && (
                      <div className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Project timeline is currently delayed by {project.delayDays} days.</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
