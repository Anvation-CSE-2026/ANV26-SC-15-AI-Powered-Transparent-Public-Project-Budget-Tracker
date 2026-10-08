import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { ArrowLeft, Info, IndianRupee, Calendar, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrencyINR, formatDate, formatPercentage } from '../../utils/formatters';
import { calculateCivicSightRisk, calculateBudgetDeviation } from '../../utils/calculations';

export const CitizenProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const normalRisk = calculateCivicSightRisk(10.0, 9.2, 82, 80, 0, 0);
  const normalDev = calculateBudgetDeviation(10.0, 9.2);

  const problemRisk = calculateCivicSightRisk(8.0, 10.1, 58, 75, 45, 3);
  const problemDev = calculateBudgetDeviation(8.0, 10.1);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            Public Projects &amp; Budget Transparency
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Explore approved budgets, contractor spending, milestone timelines, and project risk indicators
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
            Full project management (Project Manager budgeting, contractor milestone updates, and audit trail records) will be activated in <strong>Phase 6: Complete Project Management</strong>.
          </p>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project 1: City Road Improvement */}
        <Card className="border-emerald-200/80">
          <CardHeader className="bg-emerald-50/40">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>City Road Improvement &amp; Resurfacing</CardTitle>
                <Badge variant="success" size="sm" dot>ON TRACK</Badge>
              </div>
              <CardDescription>Public Works Department &bull; Ward 12</CardDescription>
            </div>
            <Badge variant="success" size="sm">{normalRisk.level} ({normalRisk.score}/4)</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Approved Budget:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  {formatCurrencyINR(10.0)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Actual Spending:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  {formatCurrencyINR(9.2)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Progress</span>
                <span className="text-slate-900">82%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Budget Deviation:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                {formatPercentage(normalDev)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Planned Completion:</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate('2026-12-15')}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Civic Evaluation: Project operates within allocated municipal budget.</span>
            </div>
          </CardContent>
        </Card>

        {/* Project 2: Urban Drainage Upgrade */}
        <Card className="border-rose-200/80">
          <CardHeader className="bg-rose-50/40">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Urban Drainage &amp; Flood Mitigation</CardTitle>
                <Badge variant="danger" size="sm" dot>AT RISK</Badge>
              </div>
              <CardDescription>Stormwater Drainage Dept &bull; Ward 8</CardDescription>
            </div>
            <Badge variant="danger" size="sm">{problemRisk.level} ({problemRisk.score}/4)</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Approved Budget:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  {formatCurrencyINR(8.0)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
                <span className="text-slate-500">Actual Spending:</span>
                <p className="font-bold text-rose-600 text-sm mt-0.5 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  {formatCurrencyINR(10.1)}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500">Progress</span>
                <span className="text-rose-600 font-bold">58%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '58%' }} />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Budget Deviation:</span>
              <span className="font-semibold text-rose-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {formatPercentage(problemDev)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500">Milestone Delay:</span>
              <span className="font-semibold text-rose-600">45 Days</span>
            </div>

            <div className="p-3 rounded-lg bg-rose-50 text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>CivicSight Risk Indicator: Requires High Attention due to spending deviation and milestone delay.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CitizenProjectsPage;
