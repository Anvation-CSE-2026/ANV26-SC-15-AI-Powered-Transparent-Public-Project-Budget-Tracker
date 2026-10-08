import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Plus,
  Search,
  IndianRupee,
  FolderGit2,
  Building,
  RefreshCw,
  ExternalLink,
  Edit,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatCurrencyINR, formatDate, formatPercentage } from '../../utils/formatters';
import { getProjects } from '../../api/projectService';
import type { Project, ProjectCategory } from '../../types/project';

const CATEGORIES: Array<'All' | ProjectCategory> = [
  'All',
  'Roads & Transport',
  'Drainage',
  'Water Supply',
  'Waste Management',
  'Street Lighting',
  'Public Buildings',
  'Parks & Public Spaces',
  'Traffic Infrastructure',
  'Sanitation',
  'Digital Infrastructure',
  'Environment',
];

const STATUSES = ['All', 'Upcoming', 'Ongoing', 'Delayed', 'Completed', 'At Risk'];

export const AuthorityProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('All');

  const fetchAuthorityProjects = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjects({ isAuthority: true });
      setProjects(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getProjects({ isAuthority: true })
      .then((data) => {
        if (isMounted) {
          setProjects(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && p.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (visibilityFilter === 'Public' && !p.isPublic) return false;
    if (visibilityFilter === 'Private' && p.isPublic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.projectNumber.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.contractorName && p.contractorName.toLowerCase().includes(q)) ||
        (p.location.ward && p.location.ward.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Aggregate metrics
  const totalBudget = projects.reduce((acc, p) => acc + (p.approvedBudget || 0), 0);
  const totalActual = projects.reduce((acc, p) => acc + (p.actualSpending || 0), 0);
  const ongoingCount = projects.filter((p) => p.status.toLowerCase() === 'ongoing').length;
  const delayedCount = projects.filter((p) => p.status.toLowerCase() === 'delayed').length;
  const atRiskCount = projects.filter((p) => p.status.toLowerCase() === 'at risk').length;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return <Badge variant="success" size="sm" dot>Completed</Badge>;
    if (s === 'ongoing') return <Badge variant="primary" size="sm" dot>Ongoing</Badge>;
    if (s === 'delayed') return <Badge variant="danger" size="sm" dot>Delayed</Badge>;
    if (s === 'at risk') return <Badge variant="warning" size="sm" dot>At Risk</Badge>;
    return <Badge variant="neutral" size="sm">Upcoming</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/project-manager')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Command Center</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-heading">
              Projects Management &amp; Budget Control
            </h1>
            <Badge variant="warning" size="sm">Authority Console</Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Sanction capital projects, monitor milestone completion rates, inspect contractor budget variances, and administer civic transparency releases.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuthorityProjects}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/dashboard/project-manager/projects/new')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 text-white"
          >
            Sanction New Project
          </Button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-500 font-medium">Total Sanctioned</p>
            <p className="text-xl font-bold text-slate-900">{projects.length}</p>
            <p className="text-[11px] text-slate-400">All capital works</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-500 font-medium">Active Works</p>
            <p className="text-xl font-bold text-blue-600">{ongoingCount}</p>
            <p className="text-[11px] text-slate-400">In physical progress</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-500 font-medium">Schedule Delayed</p>
            <p className="text-xl font-bold text-amber-600">{delayedCount}</p>
            <p className="text-[11px] text-amber-700">Past target delivery</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-500 font-medium">At Risk / Anomaly</p>
            <p className="text-xl font-bold text-red-600">{atRiskCount}</p>
            <p className="text-[11px] text-red-700">Deviation &gt; 15%</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-slate-500 font-medium">Approved Budget</p>
            <p className="text-xl font-bold text-emerald-700">
              {formatCurrencyINR(totalBudget)}
            </p>
            <p className="text-[11px] text-slate-400">Spent: {formatCurrencyINR(totalActual)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Toolbar */}
      <Card className="border-slate-200/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by project number (PRJ-YYYY-XXXXX), name, contractor, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="w-full md:w-52">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-36">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>
                ))}
              </select>
            </div>

            <div className="w-full md:w-36">
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="All">All Visibility</option>
                <option value="Public">Public Only</option>
                <option value="Private">Internal Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Showing {filteredProjects.length} of {projects.length} municipal projects</span>
            {(categoryFilter !== 'All' || statusFilter !== 'All' || visibilityFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setVisibilityFilter('All');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Table / Management List */}
      {loading ? (
        <div className="text-center py-20 space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading municipal project portfolio...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-slate-200">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No projects match the specified query filters. You can sanction a new capital work anytime.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard/project-manager/projects/new')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Sanction New Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => {
            const isOverBudget = project.actualSpending > project.approvedBudget;
            return (
              <Card
                key={project.id}
                className="border-slate-200 hover:border-blue-300 transition-all duration-150"
              >
                <div className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Column: Identifiers & Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        {project.projectNumber}
                      </span>
                      {getStatusBadge(project.status)}
                      {project.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Eye className="w-3 h-3" /> Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <EyeOff className="w-3 h-3" /> Internal Draft
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        Sanctioned {formatDate(project.startDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {project.department}
                      </span>
                      <span>&bull;</span>
                      <span>Ward: {project.location.ward || 'Central'}</span>
                      {project.contractorName && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-700 font-medium">
                            Contractor: {project.contractorName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Budgets & Progress */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto text-xs shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 min-w-28">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Approved</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3 text-slate-400" />
                        {formatCurrencyINR(project.approvedBudget)}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 min-w-28">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Spent</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3 text-slate-400" />
                        {formatCurrencyINR(project.actualSpending)}
                      </p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 min-w-28">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Deviation</span>
                      <p
                        className={`font-bold text-sm mt-0.5 ${
                          isOverBudget ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatPercentage(project.budgetDeviation)}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}/edit`)}
                      leftIcon={<Edit className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Edit
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}`)}
                      rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      className="bg-blue-600 hover:bg-blue-500 shadow-xs text-xs"
                    >
                      Manage Console
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AuthorityProjectsPage;
