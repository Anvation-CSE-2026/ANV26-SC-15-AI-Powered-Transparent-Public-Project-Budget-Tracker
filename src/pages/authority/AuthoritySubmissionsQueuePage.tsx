import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllSubmissionsForAuthority } from '../../api/contractorService';
import type { ContractorSubmission } from '../../types/contractor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Calendar,
  Building2,
  User,
  HardHat,
} from 'lucide-react';

export const AuthoritySubmissionsQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContractorSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'changes_requested' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllSubmissionsForAuthority();
      setSubmissions(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    getAllSubmissionsForAuthority()
      .then((res) => {
        if (isMounted) {
          setSubmissions(res);
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

  const pendingCount = submissions.filter(
    (s) => s.status === 'Submitted' || s.status === 'Under Review'
  ).length;
  const approvedCount = submissions.filter((s) => s.status === 'Approved').length;
  const changesRequestedCount = submissions.filter((s) => s.status === 'Changes Requested').length;
  const rejectedCount = submissions.filter((s) => s.status === 'Rejected').length;

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      searchQuery === '' ||
      sub.submissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.contractorName && sub.contractorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sub.title.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'pending') {
      matchesStatus = sub.status === 'Submitted' || sub.status === 'Under Review';
    } else if (statusFilter === 'approved') {
      matchesStatus = sub.status === 'Approved';
    } else if (statusFilter === 'changes_requested') {
      matchesStatus = sub.status === 'Changes Requested';
    } else if (statusFilter === 'rejected') {
      matchesStatus = sub.status === 'Rejected';
    }

    const matchesType = typeFilter === 'all' || sub.type.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'under review':
        return <Badge variant="warning" size="sm">Under Review</Badge>;
      case 'approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'changes requested':
        return (
          <Badge variant="warning" size="sm" className="bg-amber-100 text-amber-900 border-amber-300">
            Changes Requested
          </Badge>
        );
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
              Authority Review Queue
            </Badge>
            <span className="text-xs text-slate-300">Stage-Gate Inspection &amp; Approval</span>
          </div>
          <h1 className="text-2xl font-bold font-heading">Contractor Worksite Submissions</h1>
          <p className="text-xs text-slate-300">
            Review contractor progress claims, verify site evidence photos, and authorize official public project updates.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSubmissions}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs self-start sm:self-center"
        >
          Refresh Queue
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Review</span>
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">{pendingCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Approved</span>
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-1">{approvedCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('changes_requested')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'changes_requested'
              ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-amber-800 font-semibold">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Changes Requested</span>
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">{changesRequestedCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'rejected'
              ? 'bg-rose-500/10 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Rejected</span>
          </div>
          <p className="text-2xl font-bold text-rose-950 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Input
            placeholder="Search by SUB-YYYY-XXXXX, project, contractor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'changes_requested' | 'rejected')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="all">All ({submissions.length})</option>
              <option value="pending">Pending Review ({pendingCount})</option>
              <option value="approved">Approved ({approvedCount})</option>
              <option value="changes_requested">Changes Requested ({changesRequestedCount})</option>
              <option value="rejected">Rejected ({rejectedCount})</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Category:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Progress Update">Progress Update</option>
              <option value="Milestone Update">Milestone Update</option>
              <option value="Delay Report">Delay Report</option>
              <option value="Issue Report">Issue Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Card */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-600" />
              Submissions Queue ({filteredSubmissions.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Contractor claims requiring stage-gate review before official project progress changes.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading submission queue...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Submissions Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No submissions match your active filter criteria.'
                  : 'All contractor submissions have been processed and cleared.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const isPending = sub.status === 'Submitted' || sub.status === 'Under Review';

                return (
                  <div
                    key={sub.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isPending
                        ? 'border-amber-300/80 bg-amber-50/20 hover:bg-amber-50/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {sub.submissionNumber}
                        </span>
                        {getStatusBadge(sub.status)}
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {sub.type}
                        </span>
                        {sub.progress !== undefined && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Claim: {sub.progress}% (Current: {sub.currentProgress}%)
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {sub.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {sub.description}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          Project: <strong className="text-slate-700">{sub.projectName}</strong>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Contractor: <strong className="text-slate-700">{sub.contractorName || 'Contractor'}</strong>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {sub.attachments && sub.attachments.length > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="text-blue-600 font-semibold">
                              {sub.attachments.length} verification file{sub.attachments.length === 1 ? '' : 's'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto flex justify-end">
                      <Button
                        variant={isPending ? 'primary' : 'outline'}
                        size="sm"
                        className={`text-xs w-full md:w-auto ${
                          isPending ? 'bg-blue-600 hover:bg-blue-500 text-white' : ''
                        }`}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/dashboard/project-manager/submissions/${sub.id}`)}
                      >
                        {isPending ? 'Review & Verify' : 'View Decision'}
                      </Button>
                    </div>
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
