import React, { useState } from 'react';
import {
  FolderGit2,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Textarea } from '../components/common/Textarea';
import { Modal } from '../components/common/Modal';
import { Toast } from '../components/common/Toast';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from '../components/common/Table';
import { LoadingSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { calculateCivicSightRisk, calculateBudgetDeviation } from '../utils/calculations';
import { formatCurrencyINR, formatPercentage } from '../utils/formatters';

export const DesignSystemShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<string | null>('welcome');
  const [demoLoading, setDemoLoading] = useState(false);

  // Live Deterministic CivicSight Risk Indicator Calculation Test
  // Benchmark 1: Normal Project (City Road Improvement)
  const normalRisk = calculateCivicSightRisk(10.0, 9.2, 82, 80, 0, 0);
  const normalDev = calculateBudgetDeviation(10.0, 9.2);

  // Benchmark 2: Problematic Project (Urban Drainage Upgrade)
  const problemRisk = calculateCivicSightRisk(8.0, 10.1, 58, 75, 45, 3);
  const problemDev = calculateBudgetDeviation(8.0, 10.1);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Platform Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Phase 1 Verified Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-heading">
            CivicSight — Smart City Design System & Architecture
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
            “See the Project. Understand the Data. Make Your Voice Count.”
          </p>
          <p className="mt-1 text-xs text-slate-400">
            A production-grade, accessible foundation connecting Citizens, Project Managers, and Contractors in one transparent Smart City platform.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {activeToast === 'welcome' && (
        <Toast
          type="info"
          title="Phase 1 Foundation Initialized"
          message="Tailwind CSS, Lucide Icons, Recharts, Leaflet, and atomic UI tokens have been successfully configured and verified."
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* SECTION 1: SMART CITY KEY METRICS (StatCards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Smart City Core Metrics & KPI Cards
            </h2>
            <p className="text-xs text-slate-500">
              High-visibility status widgets designed for desktop, tablet, and mobile views.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Public Projects"
            value="42"
            subtitle="Active across 12 Municipal Wards"
            icon={<FolderGit2 className="w-5 h-5" />}
            trend={{ value: "+4 this month", isPositive: true }}
            variant="default"
          />
          <StatCard
            title="Budget Transparency"
            value="₹148.5 Cr"
            subtitle="Total Approved Municipal Allocations"
            icon={<IndianRupee className="w-5 h-5" />}
            trend={{ value: "94.2% on budget", isPositive: true }}
            variant="success"
          />
          <StatCard
            title="Citizen Complaints"
            value="184"
            subtitle="142 Resolved within SLA"
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={{ value: "86% resolution rate", isPositive: true }}
            variant="warning"
          />
          <StatCard
            title="CivicSight Risk Index"
            value="3 Projects"
            subtitle="Flagged for Project Manager review"
            icon={<Clock className="w-5 h-5" />}
            trend={{ value: "Attention Required", isPositive: false }}
            variant="danger"
          />
        </div>
      </section>

      {/* SECTION 2: CIVICSIGHT DETERMINISTIC RISK ENGINE VERIFICATION */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            CivicSight Deterministic Risk Indicator Engine
          </h2>
          <p className="text-xs text-slate-500">
            Real-time verification of Section 16 &amp; 17 mathematical rules using neutral civic terminology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Normal Project Card */}
          <Card className="border-emerald-200/80 bg-gradient-to-b from-emerald-50/20 to-white">
            <CardHeader className="bg-emerald-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-emerald-950">City Road Improvement</CardTitle>
                  <Badge variant="success" size="sm" dot>ON TRACK</Badge>
                </div>
                <CardDescription>Normal Reference Benchmark</CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  Risk Score: {normalRisk.score}/4 ({normalRisk.level})
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-500">Approved Budget:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrencyINR(10.0)}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-500">Actual Spending:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrencyINR(9.2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Budget Deviation:</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {formatPercentage(normalDev)} (Within Threshold)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Milestone Delay:</span>
                <span className="font-semibold text-slate-700">0 Days</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Unresolved Complaints:</span>
                <span className="font-semibold text-slate-700">0 (Total: 1)</span>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Civic Evaluation: Normal Operation
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  Project metrics are within acceptable parameters with no scheduling or budgetary anomalies.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Problematic Project Card */}
          <Card className="border-rose-200/80 bg-gradient-to-b from-rose-50/20 to-white">
            <CardHeader className="bg-rose-50/50">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-rose-950">Urban Drainage Upgrade</CardTitle>
                  <Badge variant="danger" size="sm" dot>AT RISK</Badge>
                </div>
                <CardDescription>Problematic Reference Benchmark</CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-full">
                  Risk Score: {problemRisk.score}/4 ({problemRisk.level})
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-500">Approved Budget:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrencyINR(8.0)}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-500">Actual Spending:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrencyINR(10.1)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Budget Deviation:</span>
                <span className="font-semibold text-rose-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {formatPercentage(problemDev)} (Triggered &gt;= 15%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Milestone Delay:</span>
                <span className="font-semibold text-rose-600">45 Days (Triggered &gt;= 30 days)</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-t border-slate-100">
                <span className="text-slate-500">Unresolved Complaints:</span>
                <span className="font-semibold text-rose-600">3 (Triggered &gt;= 3)</span>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  CivicSight Risk Indicator: Requires High Attention
                </p>
                <p className="mt-1 text-[11px] text-rose-800">
                  “This project requires attention because spending is significantly above the approved budget, the construction milestone is delayed by 45 days, and multiple citizen issues remain unresolved.”
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SECTION 3: ATOMIC UI COMPONENTS & FORM CONTROLS */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Design Tokens &amp; Atomic UI Elements
          </h2>
          <p className="text-xs text-slate-500">
            Standardized, accessible controls for forms, buttons, badges, tables, and dialogs.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Component Showcase</CardTitle>
            <CardDescription>Explore button states, modal triggers, and form inputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buttons Showcase */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Buttons &amp; Actions
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="success">Resolve Issue</Button>
                <Button variant="danger">Escalate Alert</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button
                  variant="primary"
                  isLoading={demoLoading}
                  onClick={() => {
                    setDemoLoading(true);
                    setTimeout(() => setDemoLoading(false), 1500);
                  }}
                >
                  {demoLoading ? 'Processing...' : 'Click for Loading State'}
                </Button>
                <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                  Launch Test Modal
                </Button>
              </div>
            </div>

            {/* Badges Showcase */}
            <div>
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Status Badges &amp; SLA Indicators
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="success" dot>Normal</Badge>
                <Badge variant="warning" dot>Requires Attention</Badge>
                <Badge variant="danger" dot>High Attention</Badge>
                <Badge variant="emergency" dot>Emergency (24h SLA)</Badge>
                <Badge variant="info">In Progress</Badge>
                <Badge variant="neutral">Under Review</Badge>
              </div>
            </div>

            {/* Forms Showcase */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Form Inputs &amp; Controls
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Citizen Username / Email"
                  placeholder="e.g. rajesh.patel@city.gov"
                  helperText="Registered credential for role routing"
                />
                <Select
                  label="Complaint Category"
                  options={[
                    { value: 'Roads', label: 'Roads & Potholes' },
                    { value: 'Drainage', label: 'Urban Drainage' },
                    { value: 'Street Lights', label: 'Street Lighting' },
                    { value: 'Garbage', label: 'Waste & Sanitation' },
                  ]}
                />
                <Input
                  label="Ward / Area Location"
                  placeholder="Ward 14, Central Sector"
                  required
                />
              </div>
              <div className="mt-4">
                <Textarea
                  label="Issue Description"
                  placeholder="Provide precise details, landmark, and severity..."
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* SECTION 4: DATA TABLE SHOWCASE */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Public Projects Transparency Table
          </h2>
          <p className="text-xs text-slate-500">
            Responsive tabular representation with hover states, status pills, and budget formatting.
          </p>
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Project Name</TableHeaderCell>
              <TableHeaderCell>Department</TableHeaderCell>
              <TableHeaderCell>Approved Budget</TableHeaderCell>
              <TableHeaderCell>Actual Spending</TableHeaderCell>
              <TableHeaderCell>Progress</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Risk Indicator</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                City Road Improvement
              </TableCell>
              <TableCell>Public Works Dept</TableCell>
              <TableCell>₹10.00 Cr</TableCell>
              <TableCell>₹9.20 Cr</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '82%' }} />
                  </div>
                  <span className="text-xs font-semibold">82%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="success" size="sm" dot>ON TRACK</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="success" size="sm">Normal (0/4)</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Details
                </Button>
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-semibold text-slate-900">
                Urban Drainage Upgrade
              </TableCell>
              <TableCell>Stormwater Drainage</TableCell>
              <TableCell>₹8.00 Cr</TableCell>
              <TableCell className="text-rose-600 font-semibold">₹10.10 Cr</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-slate-200 rounded-full h-1.5">
                    <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '58%' }} />
                  </div>
                  <span className="text-xs font-semibold">58%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="danger" size="sm" dot>AT RISK</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="danger" size="sm">High Attention (4/4)</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Details
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* SECTION 5: SKELETONS, EMPTY & ERROR STATES */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading">
            Feedback, Loading &amp; Empty State Patterns
          </h2>
          <p className="text-xs text-slate-500">
            Graceful handling of asynchronous operations and blank slate states.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Shimmer Skeletons */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Loading Shimmer Skeletons</p>
            <CardSkeleton />
            <div className="mt-3 space-y-2">
              <LoadingSkeleton count={2} className="h-3 w-full" />
            </div>
          </div>

          {/* Empty State */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Empty State Pattern</p>
            <EmptyState
              title="No Pending Approvals"
              description="All contractor milestone submissions have been reviewed by the Project Manager."
              actionLabel="Refresh Feed"
              onAction={() => setActiveToast('welcome')}
            />
          </div>

          {/* Error State */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Error State Pattern</p>
            <ErrorState
              title="Failed to Load Geo-Coordinates"
              message="Network timeout while querying municipal map tiles."
              onRetry={() => {}}
            />
          </div>
        </div>
      </section>

      {/* Demonstration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="CivicSight Architecture Verification"
        description="Phase 1 Foundation and Design Tokens"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              Acknowledge
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              This modal demonstrates the accessible focus trap, backdrop blur, Escape listener, and responsive layout tokens that will power complaint registration, project creation, and contractor submissions.
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-800">Framework Verification Checklist:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li>React 19 &amp; Vite 8 bundle compatibility</li>
              <li>Tailwind CSS v4 utility classes</li>
              <li>Lucide Icons system</li>
              <li>Recharts &amp; Leaflet dependencies prepared</li>
              <li>Zero-dependency fallback calculation engine</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
