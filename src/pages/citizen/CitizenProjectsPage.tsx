import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Search,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Filter,
  RefreshCw,
  FolderGit2,
  Building,
  Flag,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
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

const STATUS_OPTIONS = ['All', 'Ongoing', 'Upcoming', 'Delayed', 'Completed', 'At Risk'];

export const CitizenProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedWard, setSelectedWard] = useState<string>('All');

  const fetchPublicProjects = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProjects({ isAuthority: false });
      setProjects(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getProjects({ isAuthority: false })
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

  // Compute unique wards from loaded projects
  const uniqueWards = Array.from(
    new Set(projects.map((p) => p.location.ward).filter(Boolean))
  ) as string[];

  // Filtered projects
  const filteredProjects = projects.filter((project) => {
    if (selectedCategory !== 'All' && project.category !== selectedCategory) {
      return false;
    }
    if (selectedStatus !== 'All' && project.status.toLowerCase() !== selectedStatus.toLowerCase()) {
      return false;
    }
    if (selectedWard !== 'All' && project.location.ward !== selectedWard) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        project.name.toLowerCase().includes(q) ||
        project.projectNumber.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        project.department.toLowerCase().includes(q) ||
        (project.location.address && project.location.address.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Aggregate metrics
  const totalBudget = projects.reduce((acc, p) => acc + (p.approvedBudget || 0), 0);
  const onTrackCount = projects.filter(
    (p) => p.status.toLowerCase() === 'ongoing' || p.status.toLowerCase() === 'completed'
  ).length;
  const delayedOrRiskCount = projects.filter(
    (p) => p.status.toLowerCase() === 'delayed' || p.status.toLowerCase() === 'at risk'
  ).length;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return <Badge variant="success" size="sm" dot>Completed</Badge>;
    if (s === 'ongoing') return <Badge variant="primary" size="sm" dot>Ongoing</Badge>;
    if (s === 'delayed') return <Badge variant="danger" size="sm" dot>Delayed</Badge>;
    if (s === 'at risk') return <Badge variant="warning" size="sm" dot>At Risk</Badge>;
    return <Badge variant="neutral" size="sm">Upcoming</Badge>;
  };

  const getRiskBadge = (riskLabel: string, score: number) => {
    if (riskLabel === 'Normal') {
      return (
        <Badge variant="success" size="sm" className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Normal (0-1/4)
        </Badge>
      );
    }
    if (riskLabel === 'Attention') {
      return (
        <Badge variant="warning" size="sm" className="flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          Attention ({score}/4)
        </Badge>
      );
    }
    return (
      <Badge variant="danger" size="sm" className="flex items-center gap-1">
        <ShieldAlert className="w-3 h-3" />
        High Attention ({score}/4)
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold font-heading">
              Public Projects &amp; Budget Transparency
            </h1>
            <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
              Live Verified
            </Badge>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Explore approved municipal allocations, verified contractor spending, milestone completion timelines, and transparent civic risk indicators.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchPublicProjects}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 shrink-0"
        >
          Refresh Data
        </Button>
      </div>

      {/* Aggregate Transparency Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Public Projects</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{projects.length}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Across all wards</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Sanctioned Budget</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">
                {formatCurrencyINR(totalBudget)}
              </p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Approved municipal fund</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <IndianRupee className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">On Schedule / Completed</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{onTrackCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Standard progress rate</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Requires Attention</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{delayedOrRiskCount}</p>
              <p className="text-[11px] text-amber-700 mt-0.5">Deviation or timeline delay</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Controls */}
      <Card className="border-slate-200/80">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by project name, ID (e.g. PRJ-2026-00101), ward, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="w-full md:w-56">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <div className="w-full md:w-40">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Statuses' : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Select */}
            {uniqueWards.length > 0 && (
              <div className="w-full md:w-40">
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="All">All Wards</option>
                  {uniqueWards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              Showing {filteredProjects.length} of {projects.length} verified public projects
            </span>
            {(selectedCategory !== 'All' || selectedStatus !== 'All' || selectedWard !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedStatus('All');
                  setSelectedWard('All');
                  setSearchQuery('');
                }}
                className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading verified municipal projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-slate-200">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Projects Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No public projects match the current search filters. Try broadening your search or resetting category filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedWard('All');
                setSearchQuery('');
              }}
            >
              Clear All Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            const isOverBudget = project.actualSpending > project.approvedBudget;
            return (
              <Card
                key={project.id}
                className="border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="bg-slate-50/60 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {project.projectNumber}
                        </span>
                        {getStatusBadge(project.status)}
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900 pt-1 line-clamp-1">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          {project.department}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Flag className="w-3 h-3 text-slate-400" />
                          {project.location.ward || 'Municipal Zone'}
                        </span>
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Financial Figures */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-slate-500 text-[11px]">Approved Allocation</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                          {formatCurrencyINR(project.approvedBudget)}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                        <span className="text-slate-500 text-[11px]">Actual Expenditure</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                          <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                          {formatCurrencyINR(project.actualSpending)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Milestone Progress</span>
                        <span className="text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            project.progress >= 100
                              ? 'bg-emerald-500'
                              : project.status.toLowerCase() === 'delayed'
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Deviation & Risk Stats */}
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Budget Deviation:</span>
                        <span
                          className={`font-semibold flex items-center gap-1 ${
                            isOverBudget ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {isOverBudget ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5" />
                          )}
                          {formatPercentage(project.budgetDeviation)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Civic Risk Indicator:</span>
                        {getRiskBadge(project.riskLabel, project.riskScore)}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Target Completion:</span>
                        <span className="font-medium text-slate-700 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(project.plannedCompletionDate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 rounded-b-2xl">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 cursor-pointer text-xs"
                    onClick={() => navigate(`/dashboard/citizen/projects/${project.id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    View Transparency Details &amp; Milestones
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CitizenProjectsPage;
