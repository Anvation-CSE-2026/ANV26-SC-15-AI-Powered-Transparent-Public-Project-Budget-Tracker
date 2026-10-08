import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getContractorSubmissionsList } from '../../api/contractorService';
import type { ContractorSubmission } from '../../types/contractor';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  Clock,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  FolderOpen,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const ContractorSubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const { userProfile } = useAuth();
  const [submissions, setSubmissions] = useState<ContractorSubmission[]>([]);
  const [loading, setLoading] = useState(Boolean(userProfile?.uid));

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState('all');

  const loadSubmissions = useCallback(async () => {
    if (!userProfile?.uid) return;
    try {
      setLoading(true);
      const res = await getContractorSubmissionsList(userProfile.uid);
      setSubmissions(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    let isMounted = true;
    if (!userProfile?.uid) return;

    getContractorSubmissionsList(userProfile.uid)
      .then((res) => {
        if (isMounted) {
          setSubmissions(res);
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

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      searchQuery === '' ||
      sub.submissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      sub.status.toLowerCase().replace(/\s+/g, '_') === statusFilter.toLowerCase().replace(/\s+/g, '_');

    const matchesType =
      typeFilter === 'all' || sub.type.toLowerCase() === typeFilter.toLowerCase();

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30">
              Audit &amp; Work Tracking
            </Badge>
            <span className="text-xs text-amber-200">Municipal Verification Stream</span>
          </div>
          <h1 className="text-2xl font-bold font-heading">Contractor Work Submissions</h1>
          <p className="text-xs text-slate-300">
            Lifecycle tracking of all progress reports, milestone claims, and site evidence submitted to project managers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSubmissions}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs self-start sm:self-center"
        >
          Refresh
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-72">
          <Input
            placeholder="Search by SUB-YYYY-XXXXX or project..."
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="all">All Statuses ({submissions.length})</option>
              <option value="submitted">Under Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Type:</span>
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

      {/* Submissions List */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Submission Records ({filteredSubmissions.length})
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Updates remain pending until reviewed and approved by municipal authorities.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading submissions...</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Submissions Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No submissions match the selected filters.'
                  : 'You have not submitted any updates yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => navigate(`/dashboard/contractor/submissions/${sub.id}`)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-2.5 cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {sub.submissionNumber}
                      </span>
                      {getStatusBadge(sub.status)}
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sub.type}
                      </span>
                      {sub.progress !== undefined && (
                        <span className="text-[11px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                          Claimed: {sub.progress}%
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {sub.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                      {sub.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-sm">
                      Project: <strong className="text-slate-800">{sub.projectName}</strong>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {sub.attachments && sub.attachments.length > 0 && (
                        <span className="text-blue-600 font-semibold">
                          {sub.attachments.length} photo{sub.attachments.length === 1 ? '' : 's'} attached
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                    </div>
                  </div>

                  {/* Review feedback if rejected or changes requested */}
                  {sub.review?.remarks && (
                    <div className={`p-2.5 rounded-lg border text-xs ${
                      sub.status === 'Changes Requested'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : sub.status === 'Rejected'
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}>
                      <p className="font-semibold flex items-center gap-1">
                        {sub.status === 'Changes Requested' && <RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                        {sub.status === 'Rejected' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        PM Remarks ({sub.review.reviewerName || 'Project Manager'}):
                      </p>
                      <p className="mt-0.5 leading-relaxed">{sub.review.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
