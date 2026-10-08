import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../hooks/useAuth';
import {
  getAuthorityRiskEngineData,
  flagProjectForRiskAudit,
  type AuthorityRiskEngineData,
} from '../../api/riskEngineService';
import type { DetailedProjectRisk } from '../../types/analytics';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  Calendar,
  FileCheck2,
  DollarSign,
  Activity,
  Layers,
  MapPin,
  ExternalLink,
  Info,
  Check,
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

export const AuthorityRiskEnginePage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [data, setData] = useState<AuthorityRiskEngineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'Normal' | 'Attention' | 'High Attention'>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'deviation' | 'delay' | 'gap'>('score');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Audit Modal state
  const [selectedAuditProject, setSelectedAuditProject] = useState<DetailedProjectRisk | null>(null);
  const [auditNote, setAuditNote] = useState('');
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);
  const [auditSuccessMessage, setAuditSuccessMessage] = useState<string | null>(null);

  const handleRecalibrate = () => {
    setLoading(true);
    setError(null);
    getAuthorityRiskEngineData()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error('[RiskEngine] Failed to load data:', err);
        setError('Failed to load risk engine telemetry. Please verify municipal service connectivity.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    getAuthorityRiskEngineData()
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[RiskEngine] Failed to load data:', err);
          setError('Failed to load risk engine telemetry. Please verify municipal service connectivity.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    if (!data) return [];

    let list = [...data.evaluatedProjects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.projectName.toLowerCase().includes(q) ||
          p.projectNumber.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          (p.contractorName && p.contractorName.toLowerCase().includes(q)) ||
          p.ward.toLowerCase().includes(q)
      );
    }

    if (selectedRiskFilter !== 'all') {
      list = list.filter((p) => p.riskLevel === selectedRiskFilter);
    }

    if (selectedDeptFilter !== 'all') {
      list = list.filter((p) => p.department === selectedDeptFilter);
    }

    if (selectedWardFilter !== 'all') {
      list = list.filter((p) => p.ward === selectedWardFilter);
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === 'score') {
        valA = a.totalScore;
        valB = b.totalScore;
      } else if (sortBy === 'deviation') {
        valA = a.budgetDeviationPercentage;
        valB = b.budgetDeviationPercentage;
      } else if (sortBy === 'delay') {
        valA = a.delayDays;
        valB = b.delayDays;
      } else if (sortBy === 'gap') {
        valA = a.progressGap;
        valB = b.progressGap;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [data, searchQuery, selectedRiskFilter, selectedDeptFilter, selectedWardFilter, sortBy, sortOrder]);

  // Unique departments & wards for filters
  const departments = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.evaluatedProjects.map((p) => p.department))).sort();
  }, [data]);

  const wards = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.evaluatedProjects.map((p) => p.ward))).sort();
  }, [data]);

  // Recharts Data: Risk Level Distribution Donut
  const riskDistributionData = useMemo(() => {
    if (!data) return [];
    const metrics = data.summaryMetrics;
    return [
      { name: 'Normal', value: metrics.normalProjectsCount, color: '#10B981' },
      { name: 'Attention', value: metrics.attentionProjectsCount, color: '#F59E0B' },
      { name: 'High Attention', value: metrics.highAttentionProjectsCount, color: '#F43F5E' },
    ].filter((item) => item.value > 0);
  }, [data]);

  // Handle Log Audit
  const handleLogAudit = async () => {
    if (!selectedAuditProject || !userProfile || !auditNote.trim()) return;
    setIsSubmittingAudit(true);
    setAuditSuccessMessage(null);
    try {
      await flagProjectForRiskAudit(selectedAuditProject.projectId, auditNote.trim(), userProfile);
      setAuditSuccessMessage('Official municipal risk audit flag recorded and logged to project activities.');
      setAuditNote('');
      setTimeout(() => {
        setAuditSuccessMessage(null);
      }, 4000);
    } catch (err) {
      console.error('[RiskEngine] Failed to flag audit:', err);
      alert('Failed to log municipal audit note. Please try again.');
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
        <p className="text-sm font-medium text-slate-600">Running CivicSight Risk Telemetry &amp; Anomaly Engine...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Telemetry Evaluation Error</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{error || 'Unknown telemetry failure.'}</p>
            <Button variant="primary" onClick={handleRecalibrate} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Retry Calibration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summaryMetrics, departmentAnalytics, wardHeatmap } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 lg:p-8 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-500/10 via-amber-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              CivicSight Risk Engine v2.4 • Multi-Factor Telemetry
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
              Municipal Risk &amp; Anomaly Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Automated multi-factor governance heuristics evaluating cost deviations, schedule slippage,
              S-curve progress variance, citizen grievance density, and contractor milestone bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalibrate}
              className="bg-slate-800/80 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Recalibrate Engine
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/dashboard/project-manager/projects')}
              className="bg-blue-600 hover:bg-blue-500 text-xs"
              leftIcon={<Layers className="w-3.5 h-3.5" />}
            >
              Projects Registry
            </Button>
          </div>
        </div>
      </div>

      {/* Executive KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Monitored</span>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              ₹{summaryMetrics.totalSanctionedBudgetCr.toFixed(1)} <span className="text-xs font-normal text-slate-500">Cr</span>
            </div>
            <p className="text-[11px] text-slate-500">{summaryMetrics.totalProjects} active projects</p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/30 shadow-xs hover:border-rose-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-rose-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Budget At Risk</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-700">
              ₹{summaryMetrics.budgetAtRiskCr.toFixed(1)} <span className="text-xs font-normal text-rose-600">Cr</span>
            </div>
            <p className="text-[11px] text-rose-600 font-medium">
              {summaryMetrics.highAttentionProjectsCount} high-attention projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30 shadow-xs hover:border-amber-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-amber-700">
              <span className="text-[11px] font-bold uppercase tracking-wider">Flagged Ratio</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-800">
              {summaryMetrics.flaggedProjectsRatio}%
            </div>
            <p className="text-[11px] text-amber-700">
              {summaryMetrics.attentionProjectsCount + summaryMetrics.highAttentionProjectsCount} of {summaryMetrics.totalProjects} flagged
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg Delay</span>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {summaryMetrics.averageScheduleDelayDays} <span className="text-xs font-normal text-slate-500">days</span>
            </div>
            <p className="text-[11px] text-slate-500">Past target milestone</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Avg S-Gap</span>
              <TrendingDown className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {summaryMetrics.averageProgressGap}%
            </div>
            <p className="text-[11px] text-slate-500">Expected vs actual lag</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Top Risk Dept</span>
              <Building2 className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-sm font-black text-slate-900 truncate" title={summaryMetrics.highestRiskDepartment}>
              {summaryMetrics.highestRiskDepartment}
            </div>
            <p className="text-[11px] text-slate-500">Highest risk density</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Risk Level Distribution (Donut) */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-600" />
                Portfolio Risk Classification
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {summaryMetrics.totalProjects} Projects Evaluated
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Categorized via composite 0–5.0 multi-factor civic risk score
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56 w-full flex items-center justify-center">
              {riskDistributionData.length === 0 ? (
                <p className="text-xs text-slate-400">No project risk data available</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {riskDistributionData.map((entry, index) => (
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
                      formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
                <span className="text-xs font-bold block">{summaryMetrics.normalProjectsCount}</span>
                <span className="text-[10px] text-emerald-600">Normal (0-1.4)</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-800">
                <span className="text-xs font-bold block">{summaryMetrics.attentionProjectsCount}</span>
                <span className="text-[10px] text-amber-600">Attention (1.5-2.9)</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-800">
                <span className="text-xs font-bold block">{summaryMetrics.highAttentionProjectsCount}</span>
                <span className="text-[10px] text-rose-600">High Attn (3.0-5.0)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Department Capital Allocation vs Actual Spending (BarChart) */}
        <Card className="border-slate-200 shadow-xs lg:col-span-2">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Department Budget Allocation vs Expenditure
              </span>
              <span className="text-xs text-slate-500 font-normal">Amounts in ₹ Crores</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Comparison between sanctioned capital outlay and actual disbursements across municipal departments
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              {departmentAnalytics.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No department financial data available
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
                      formatter={(val, name) => [
                        `₹${Number(val).toFixed(2)} Cr`,
                        name === 'approvedBudgetCr' ? 'Approved Budget' : 'Actual Spending',
                      ]}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: '10px' }}
                      formatter={(val) => (
                        <span className="text-xs text-slate-600">
                          {val === 'approvedBudgetCr' ? 'Sanctioned Budget' : 'Actual Spent'}
                        </span>
                      )}
                    />
                    <Bar dataKey="approvedBudgetCr" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actualSpendingCr" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ward Risk Heatmap Table & Visualization */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" />
                Ward Risk &amp; Anomaly Index
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Composite territorial risk scores combining high-attention capital works, citizen grievances, and emergency incidents
              </CardDescription>
            </div>
            <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
              {wardHeatmap.length} Municipal Wards Tracked
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {wardHeatmap.slice(0, 8).map((ward) => {
              const riskColor =
                ward.riskIndex >= 50
                  ? 'border-rose-200 bg-rose-50/40 text-rose-900'
                  : ward.riskIndex >= 25
                  ? 'border-amber-200 bg-amber-50/40 text-amber-900'
                  : 'border-emerald-200 bg-emerald-50/40 text-emerald-900';

              const barColor =
                ward.riskIndex >= 50 ? 'bg-rose-500' : ward.riskIndex >= 25 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={ward.ward} className={`p-3.5 rounded-xl border ${riskColor} flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{ward.ward}</span>
                    <span className="text-xs font-black">Index: {ward.riskIndex}/100</span>
                  </div>

                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 my-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all`}
                      style={{ width: `${ward.riskIndex}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block">Projects</span>
                      <span className="font-semibold text-slate-800">{ward.totalProjects}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">High Risk</span>
                      <span className="font-bold text-rose-600">{ward.highRiskProjects}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Grievances</span>
                      <span className="font-semibold text-slate-800">{ward.totalComplaints}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project Risk Triage & Audit Registry */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                Project Risk Triage &amp; Governance Audit Registry
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Detailed multi-factor analysis, factor breakdown, and official municipal intervention recommendations
              </CardDescription>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedRiskFilter('all')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  selectedRiskFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({data.evaluatedProjects.length})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('High Attention')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  selectedRiskFilter === 'High Attention'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                High Attention ({summaryMetrics.highAttentionProjectsCount})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('Attention')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  selectedRiskFilter === 'Attention'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Attention ({summaryMetrics.attentionProjectsCount})
              </button>
              <button
                onClick={() => setSelectedRiskFilter('Normal')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  selectedRiskFilter === 'Normal'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Normal ({summaryMetrics.normalProjectsCount})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Controls Bar: Search & Select Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by project name, ID, contractor, ward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <div className="relative">
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
            </div>

            <div>
              <div className="relative">
                <select
                  value={selectedWardFilter}
                  onChange={(e) => setSelectedWardFilter(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Wards</option>
                  {wards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'deviation' | 'delay' | 'gap')}
                className="w-full text-xs rounded-xl border border-slate-200 py-2.5 px-3 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Sort: Risk Score</option>
                <option value="deviation">Sort: Budget Overrun %</option>
                <option value="delay">Sort: Delay Days</option>
                <option value="gap">Sort: S-Curve Gap %</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title={`Toggle sort order (current: ${sortOrder.toUpperCase()})`}
                aria-label="Toggle sort order"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Projects Table */}
          <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Project / Identifier</th>
                    <th className="py-3 px-3">Dept &amp; Ward</th>
                    <th className="py-3 px-3">Financials (₹ Cr)</th>
                    <th className="py-3 px-3">S-Curve / Progress</th>
                    <th className="py-3 px-3">Timeline</th>
                    <th className="py-3 px-3">Grievances</th>
                    <th className="py-3 px-3 text-center">Score / Level</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Filter className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No projects match your search or filter parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((proj) => {
                      const isHighRisk = proj.riskLevel === 'High Attention';
                      const isAttention = proj.riskLevel === 'Attention';

                      const rowBg = isHighRisk
                        ? 'hover:bg-rose-50/30'
                        : isAttention
                        ? 'hover:bg-amber-50/30'
                        : 'hover:bg-slate-50/60';

                      return (
                        <tr key={proj.projectId} className={`transition-colors ${rowBg}`}>
                          {/* Project info */}
                          <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                {proj.projectNumber}
                              </span>
                            </div>
                            <div className="font-semibold text-slate-900 line-clamp-1 mt-0.5" title={proj.projectName}>
                              {proj.projectName}
                            </div>
                            {proj.contractorName && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                <span>Eng: {proj.contractorName}</span>
                              </div>
                            )}
                          </td>

                          {/* Dept & Ward */}
                          <td className="py-3.5 px-3">
                            <div className="font-medium text-slate-800">{proj.department}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {proj.ward}
                            </div>
                          </td>

                          {/* Financials */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-800">
                              ₹{proj.actualSpending.toFixed(2)} / ₹{proj.approvedBudget.toFixed(2)}
                            </div>
                            <div
                              className={`text-[11px] font-bold ${
                                proj.budgetDeviationPercentage >= 15
                                  ? 'text-rose-600'
                                  : proj.budgetDeviationPercentage >= 10
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {proj.budgetDeviationPercentage > 0 ? `+${proj.budgetDeviationPercentage.toFixed(1)}%` : `${proj.budgetDeviationPercentage.toFixed(1)}%`} variance
                            </div>
                          </td>

                          {/* S-Curve / Progress */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{proj.progress}%</span>
                              <span className="text-[10px] text-slate-400">exp {proj.expectedProgress}%</span>
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  proj.progressGap >= 15 ? 'bg-rose-500' : 'bg-blue-600'
                                }`}
                                style={{ width: `${proj.progress}%` }}
                              />
                            </div>
                            {proj.progressGap > 0 && (
                              <span className="text-[10px] font-medium text-rose-600 block mt-0.5">
                                -{proj.progressGap}% gap
                              </span>
                            )}
                          </td>

                          {/* Timeline */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div
                              className={`font-semibold ${
                                proj.delayDays >= 30
                                  ? 'text-rose-600'
                                  : proj.delayDays > 0
                                  ? 'text-amber-600'
                                  : 'text-slate-700'
                              }`}
                            >
                              {proj.delayDays > 0 ? `+${proj.delayDays}d delay` : 'On track'}
                            </div>
                          </td>

                          {/* Grievances */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span
                              className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                                proj.unresolvedComplaintsCount >= 3
                                  ? 'bg-rose-100 text-rose-800'
                                  : proj.unresolvedComplaintsCount > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {proj.unresolvedComplaintsCount} open
                            </span>
                          </td>

                          {/* Score / Level */}
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="font-black text-slate-900 text-xs">
                              {proj.totalScore.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">/ 5.0</span>
                            </div>
                            <div className="mt-1">
                              {proj.riskLevel === 'High Attention' ? (
                                <Badge variant="danger" size="sm" dot>
                                  High Attention
                                </Badge>
                              ) : proj.riskLevel === 'Attention' ? (
                                <Badge variant="warning" size="sm" dot>
                                  Attention
                                </Badge>
                              ) : (
                                <Badge variant="success" size="sm" dot>
                                  Normal
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                                onClick={() => setSelectedAuditProject(proj)}
                              >
                                Audit Breakdown
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="Open Project Detail"
                                onClick={() => navigate(`/dashboard/project-manager/projects/${proj.projectId}`)}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </div>
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

      {/* Risk Audit Breakdown Modal */}
      {selectedAuditProject && (
        <Modal
          isOpen={Boolean(selectedAuditProject)}
          onClose={() => {
            setSelectedAuditProject(null);
            setAuditSuccessMessage(null);
          }}
          title={`CivicSight Risk Audit: ${selectedAuditProject.projectNumber}`}
          description={selectedAuditProject.projectName}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500">
                Evaluation timestamp: {new Date(selectedAuditProject.evaluatedAt).toLocaleString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedAuditProject(null);
                  setAuditSuccessMessage(null);
                }}
              >
                Close Audit Inspection
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Header telemetry summary */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {selectedAuditProject.department} • {selectedAuditProject.ward}
                  </span>
                  {selectedAuditProject.contractorName && (
                    <span className="text-xs text-indigo-300">({selectedAuditProject.contractorName})</span>
                  )}
                </div>
                <h4 className="text-base font-bold text-white mt-1">{selectedAuditProject.projectName}</h4>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Composite Score</div>
                  <div className="text-2xl font-black text-white">{selectedAuditProject.totalScore.toFixed(1)} / 5.0</div>
                </div>
                <div>
                  {selectedAuditProject.riskLevel === 'High Attention' ? (
                    <span className="px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-400" /> High Attention
                    </span>
                  ) : selectedAuditProject.riskLevel === 'Attention' ? (
                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Attention
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Normal
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Evaluated Factors Breakdown */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Evaluated Governance Dimensions ({selectedAuditProject.factors.length})
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedAuditProject.factors.map((factor) => {
                  const isTriggered = factor.triggered;
                  const cardBg = isTriggered
                    ? factor.severity === 'critical'
                      ? 'border-rose-300 bg-rose-50/60'
                      : factor.severity === 'high'
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-yellow-200 bg-yellow-50/40'
                    : 'border-slate-200 bg-slate-50/40';

                  const badgeColor =
                    factor.severity === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : factor.severity === 'high'
                      ? 'bg-amber-100 text-amber-800'
                      : factor.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-emerald-100 text-emerald-800';

                  return (
                    <div key={factor.id} className={`p-3 rounded-xl border ${cardBg} space-y-1.5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{factor.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                          +{factor.scoreContribution.toFixed(1)} pts
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center justify-between">
                        <span>Threshold: <strong className="text-slate-700">{factor.threshold}</strong></span>
                        <span>Recorded: <strong className="text-slate-900">{factor.actualValue}</strong></span>
                      </div>
                      <p className="text-[11px] text-slate-600 border-t border-slate-200/60 pt-1 leading-snug">
                        {factor.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Root-cause anomalies detected */}
            {selectedAuditProject.reasons.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Identified Municipal Anomalies ({selectedAuditProject.reasons.length})
                </h5>
                <ul className="space-y-1 text-xs text-rose-800">
                  {selectedAuditProject.reasons.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Municipal Interventions */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Actionable Governance Interventions
              </h5>
              <ul className="space-y-1.5 text-xs text-blue-900">
                {selectedAuditProject.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Official Municipal Audit Flag Form */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                Issue Official Municipal Audit Notice
              </h5>
              <p className="text-xs text-slate-600">
                Record an official risk audit log entry for this project. The audit notice will be permanently appended to the project activity ledger.
              </p>

              {auditSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {auditSuccessMessage}
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={auditNote}
                  onChange={(e) => setAuditNote(e.target.value)}
                  placeholder="Enter audit directives (e.g. Dispatched structural verification team, requested contractor cost justification within 7 days...)"
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!auditNote.trim() || isSubmittingAudit}
                  onClick={handleLogAudit}
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs"
                  leftIcon={<ShieldAlert className="w-3.5 h-3.5" />}
                >
                  {isSubmittingAudit ? 'Logging Audit Flag...' : 'Log Municipal Risk Audit Flag'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default AuthorityRiskEnginePage;
