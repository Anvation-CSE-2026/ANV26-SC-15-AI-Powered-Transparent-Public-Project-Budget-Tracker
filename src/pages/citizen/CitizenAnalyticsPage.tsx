import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  getCitizenTransparencyData,
  type CitizenTransparencyData,
} from '../../api/riskEngineService';
import type { Project } from '../../types/project';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Building2,
  DollarSign,
  MapPin,
  Search,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  FolderGit2,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const CitizenAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<CitizenTransparencyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    getCitizenTransparencyData()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('[CitizenAnalytics] Error loading data:', err);
        setError('Failed to load public transparency metrics.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    getCitizenTransparencyData()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[CitizenAnalytics] Error loading data:', err);
          setError('Failed to load public transparency metrics.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered public projects
  const filteredProjects = useMemo(() => {
    if (!data) return [];
    let list = [...data.projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.projectNumber.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          (p.location?.ward && p.location.ward.toLowerCase().includes(q))
      );
    }

    if (selectedDeptFilter !== 'all') {
      list = list.filter((p) => p.department === selectedDeptFilter);
    }

    if (selectedStatusFilter !== 'all') {
      list = list.filter((p) => p.status.toLowerCase() === selectedStatusFilter.toLowerCase());
    }

    return list;
  }, [data, searchQuery, selectedDeptFilter, selectedStatusFilter]);

  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.projects.map((p) => p.department))).sort();
  }, [data]);

  // Project Status Breakdown Donut
  const projectStatusData = useMemo(() => {
    if (!data) return [];
    const completed = data.projects.filter((p) => p.status.toLowerCase() === 'completed').length;
    const ongoing = data.projects.filter((p) => p.status.toLowerCase() === 'ongoing').length;
    const delayed = data.projects.filter((p) => p.status.toLowerCase() === 'delayed').length;

    return [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'Ongoing', value: ongoing, color: '#3B82F6' },
      { name: 'Delayed', value: delayed, color: '#F43F5E' },
    ].filter((item) => item.value > 0);
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="text-sm font-medium text-slate-600">Loading CivicSight Public Transparency Metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Unable to Load Transparency Data</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error || 'Unknown error occurred.'}</p>
            <Button variant="primary" onClick={handleRefresh} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { transparencyMetrics, departmentAnalytics } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 lg:p-8 shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-emerald-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              CivicSight Open Governance • Citizen Transparency Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Public Infrastructure &amp; Capital Transparency
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Verify where municipal tax funds are invested, monitor physical milestone delivery in your ward,
              and inspect real-time civic grievance resolution performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="bg-blue-950/80 border-blue-700 text-blue-200 hover:bg-blue-800 hover:text-white text-xs"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard/citizen/projects')}
              className="bg-blue-600 hover:bg-blue-500 text-xs"
              leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}
            >
              Explore All Projects
            </Button>
          </div>
        </div>
      </div>

      {/* Public KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Investment</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              ₹{transparencyMetrics.totalPublicInvestmentCr.toFixed(1)} <span className="text-xs font-normal text-slate-500">Cr</span>
            </div>
            <p className="text-[11px] text-slate-500">Sanctioned public works</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">
              {transparencyMetrics.totalCompletedProjects}
            </div>
            <p className="text-[11px] text-slate-500">Delivered worksites</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Works</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-indigo-700">
              {transparencyMetrics.totalOngoingProjects}
            </div>
            <p className="text-[11px] text-slate-500">Currently in execution</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">On-Time Rate</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xl font-black text-teal-700">
              {transparencyMetrics.onTimeCompletionRate}%
            </div>
            <p className="text-[11px] text-slate-500">Milestone schedule fidelity</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Grievances Solved</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-blue-700">
              {transparencyMetrics.grievanceResolutionRate}%
            </div>
            <p className="text-[11px] text-slate-500">{transparencyMetrics.totalResolvedGrievances} resolved issues</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Wards</span>
              <MapPin className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {transparencyMetrics.activeWardsCount}
            </div>
            <p className="text-[11px] text-slate-500">Jurisdictional coverage</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Project Execution Status (Donut) */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Worksite Execution Status
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {data.projects.length} Public Projects
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Breakdown of public works by delivery stage
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 w-full flex items-center justify-center">
              {projectStatusData.length === 0 ? (
                <p className="text-xs text-slate-400">No project status data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} Projects`, name]}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-xs text-slate-700">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Public Budget by Department (BarChart) */}
        <Card className="border-slate-200 shadow-xs lg:col-span-2">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Capital Allocation by Civic Sector
              </span>
              <span className="text-xs text-slate-500 font-normal">Amounts in ₹ Crores</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Municipal public funds allocated across development departments
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 w-full">
              {departmentAnalytics.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No department allocation data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={departmentAnalytics}
                    margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                  >
                    <XAxis
                      dataKey="department"
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748B' }}
                      unit=" Cr"
                    />
                    <Tooltip
                      formatter={(val) => [`₹${Number(val).toFixed(2)} Cr`, 'Approved Allocation']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="approvedBudgetCr" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Public Projects Transparency Registry */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-blue-600" />
                Transparent Public Works Directory
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Track sanctioned expenditure, milestone completion progress, and project accountability
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/citizen/complaints/new')}
                className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
              >
                Report Worksite Issue
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Input
                placeholder="Search public projects by name, ID, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Project Name &amp; Code</th>
                    <th className="py-3 px-3">Sector &amp; Ward</th>
                    <th className="py-3 px-3">Public Investment</th>
                    <th className="py-3 px-3">Completion Progress</th>
                    <th className="py-3 px-3 text-center">Execution Status</th>
                    <th className="py-3 px-3 text-center">Accountability</th>
                    <th className="py-3 px-4 text-right">View Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No public projects match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p: Project) => {
                      const isDelayed = p.status?.toLowerCase() === 'delayed' || (p.delayDays || 0) > 15;
                      const isCompleted = p.status?.toLowerCase() === 'completed';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                              {p.projectNumber}
                            </span>
                            <div className="font-semibold text-slate-900 line-clamp-1 mt-0.5" title={p.name}>
                              {p.name}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-medium text-slate-800">{p.department}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {p.location?.ward || 'General'}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              ₹{p.approvedBudget.toFixed(2)} Cr
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Spent: ₹{p.actualSpending.toFixed(2)} Cr
                            </div>
                          </td>

                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{p.progress}%</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isCompleted ? 'bg-emerald-500' : isDelayed ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${p.progress}%` }}
                              />
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {isCompleted ? (
                              <Badge variant="success" size="sm">
                                Completed
                              </Badge>
                            ) : isDelayed ? (
                              <Badge variant="warning" size="sm">
                                Delayed
                              </Badge>
                            ) : (
                              <Badge variant="primary" size="sm">
                                Ongoing
                              </Badge>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {isCompleted ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                Verified
                              </span>
                            ) : isDelayed ? (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                Under Review
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                On Track
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                              rightIcon={<ExternalLink className="w-3 h-3" />}
                              onClick={() => navigate(`/dashboard/citizen/projects/${p.id}`)}
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default CitizenAnalyticsPage;
