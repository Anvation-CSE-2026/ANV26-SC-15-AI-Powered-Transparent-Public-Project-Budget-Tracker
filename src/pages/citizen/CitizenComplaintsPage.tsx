import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  AlertCircle,
  PlusCircle,
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Star,
  RefreshCw,
} from 'lucide-react';
import { getCitizenComplaints } from '../../api/complaintService';
import type { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/complaint';
import { formatDate } from '../../utils/formatters';

export const CitizenComplaintsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  const userId = currentUser?.uid || userProfile?.uid || '';

  const handleManualRefresh = () => {
    setLoading(true);
    getCitizenComplaints(userId, {
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      searchQuery,
      sortBy,
    }).then((data) => {
      setComplaints(data);
      setLoading(false);
    }).catch((err) => {
      console.warn('[CivicSight] Error loading citizen complaints:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    let ignore = false;
    getCitizenComplaints(userId, {
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      searchQuery,
      sortBy,
    }).then((data) => {
      if (!ignore) {
        setComplaints(data);
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('[CivicSight] Error loading citizen complaints:', err);
      if (!ignore) setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [userId, statusFilter, categoryFilter, priorityFilter, searchQuery, sortBy]);

  // Derived metrics
  const metrics = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter(
      (c) => c.status === 'submitted' || c.status === 'under_review' || c.status === 'awaiting_info'
    ).length;
    const inProgress = complaints.filter(
      (c) => c.status === 'assigned' || c.status === 'in_progress' || c.status === 'escalated'
    ).length;
    const resolved = complaints.filter(
      (c) => c.status === 'resolved' || c.status === 'closed'
    ).length;

    return { total, pending, inProgress, resolved };
  }, [complaints]);

  // Status Badge Mapper
  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="neutral" size="sm" dot>Submitted</Badge>;
      case 'under_review':
        return <Badge variant="warning" size="sm" dot>Under Review</Badge>;
      case 'assigned':
        return <Badge variant="info" size="sm" dot>Assigned</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="sm" dot>In Progress</Badge>;
      case 'awaiting_info':
        return <Badge variant="warning" size="sm" dot>Awaiting Info</Badge>;
      case 'escalated':
        return <Badge variant="danger" size="sm" dot>Escalated</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm" dot>Resolved</Badge>;
      case 'closed':
        return <Badge variant="success" size="sm">Case Closed</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const getPriorityBadgeVariant = (priority: ComplaintPriority): BadgeVariant => {
    switch (priority) {
      case 'emergency':
        return 'emergency';
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            My Registered Grievances &amp; Issues
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Track official municipal response, field officer updates, SLA timers, and resolution proof.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
            onClick={() => navigate('/dashboard/citizen/complaints/new')}
          >
            Submit New Complaint
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Grievances</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Reported by you</p>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
          <h4 className="text-2xl font-bold text-amber-600 mt-1">{metrics.pending}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Awaiting verification</p>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Active / In Progress</p>
          <h4 className="text-2xl font-bold text-blue-600 mt-1">{metrics.inProgress}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Dispatched to field teams</p>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Resolved &amp; Closed</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.resolved}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">With verification proof</p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by title, tracking #, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'Roads', label: 'Roads & Potholes' },
                { value: 'Drainage', label: 'Stormwater & Drainage' },
                { value: 'Garbage', label: 'Garbage & Sanitation' },
                { value: 'Street Lights', label: 'Street Lighting' },
                { value: 'Water', label: 'Water Supply' },
                { value: 'Traffic', label: 'Traffic & Mobility' },
                { value: 'Parks', label: 'Parks & Greenery' },
                { value: 'Other', label: 'Other Civic Issues' },
              ]}
            />

            {/* Priority Filter */}
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'emergency', label: 'Emergency' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />

            {/* Sort */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
              options={[
                { value: 'latest', label: 'Sort: Newest First' },
                { value: 'oldest', label: 'Sort: Oldest First' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Grievances Registry ({complaints.length})</CardTitle>
            <CardDescription>Click any complaint to see live officer timeline and resolution proof</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton className="h-24" />
              <LoadingSkeleton className="h-24" />
              <LoadingSkeleton className="h-24" />
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No complaints found matching your criteria"
              description="Notice road damage, street lighting outages, or sanitation issues? Report them directly to municipal authorities."
              icon={<AlertCircle className="w-10 h-10 text-slate-400" />}
              actionLabel="Report a Civic Issue"
              onAction={() => navigate('/dashboard/citizen/complaints/new')}
              className="py-12"
            />
          ) : (
            <div className="space-y-3.5">
              {complaints.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/dashboard/citizen/complaints/${item.id}`)}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column: Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {item.complaintNumber}
                      </span>
                      {getStatusBadge(item.status)}
                      <Badge variant={getPriorityBadgeVariant(item.priority)} size="sm">
                        {item.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="neutral" size="sm">
                        {item.category}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location?.address}</span>
                      </span>

                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(item.createdAt)}</span>
                      </span>

                      {item.departmentName && (
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{item.departmentName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: SLA / Resolution Pill & Action */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {/* SLA or Resolution Badge */}
                    {item.status === 'resolved' ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Resolved (Awaiting Your Review)</span>
                      </div>
                    ) : item.status === 'closed' ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Closed ({item.feedback?.rating || 5}★)</span>
                      </div>
                    ) : item.sla ? (
                      <div
                        className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                          item.sla.status === 'breached'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.sla.status === 'approaching'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {item.sla.status === 'breached'
                            ? `SLA Overdue (${Math.abs(item.sla.hoursRemaining || 0)}h)`
                            : `${item.sla.hoursRemaining || 0}h remaining`}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Verification queue</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span>View Progress</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenComplaintsPage;
