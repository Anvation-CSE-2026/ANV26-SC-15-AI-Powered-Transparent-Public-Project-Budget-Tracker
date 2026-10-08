import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/common/Table';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Building2,
  Clock,
  Search,
  ArrowRight,
  RefreshCw,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { getAllComplaints } from '../../api/complaintService';
import { INITIAL_DEPARTMENTS } from '../../data/departmentsData';
import type { Complaint, ComplaintPriority, ComplaintStatus } from '../../types/complaint';
import { formatDate } from '../../utils/formatters';

export const AuthorityComplaintsQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [slaFilter, setSlaFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  const handleManualRefresh = () => {
    setLoading(true);
    getAllComplaints({
      status: statusFilter,
      priority: priorityFilter,
      departmentId: deptFilter,
      searchQuery,
      sortBy,
    }).then((data) => {
      setComplaints(data);
      setLoading(false);
    }).catch((err) => {
      console.warn('[CivicSight] Error loading complaints queue:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    let ignore = false;
    getAllComplaints({
      status: statusFilter,
      priority: priorityFilter,
      departmentId: deptFilter,
      searchQuery,
      sortBy,
    }).then((data) => {
      if (!ignore) {
        setComplaints(data);
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('[CivicSight] Error loading complaints queue:', err);
      if (!ignore) setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [statusFilter, deptFilter, priorityFilter, searchQuery, sortBy]);

  // Derived filtered list (e.g. for SLA filter on top of backend)
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (slaFilter !== 'all') {
        if (!c.sla || c.sla.status !== slaFilter) return false;
      }
      return true;
    });
  }, [complaints, slaFilter]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = complaints.length;
    const pendingReview = complaints.filter(
      (c) => c.status === 'submitted' || c.status === 'under_review'
    ).length;
    const inProgress = complaints.filter(
      (c) => c.status === 'assigned' || c.status === 'in_progress' || c.status === 'escalated'
    ).length;
    const emergencyCount = complaints.filter((c) => c.priority === 'emergency').length;
    const breachedSLA = complaints.filter((c) => c.sla?.status === 'breached').length;
    const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;

    return { total, pendingReview, inProgress, emergencyCount, breachedSLA, resolved };
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
        return <Badge variant="success" size="sm">Closed</Badge>;
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
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Authority Command Center Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
              Municipal Command Center
            </span>
            <span className="text-xs text-slate-300">City Grievance Dispatch &amp; SLA Management</span>
          </div>
          <h1 className="text-2xl font-bold font-heading">
            Citizen Grievance Queue &amp; Enforcement
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Review incoming citizen reports, assign responsible departments &amp; engineers, enforce SLAs, and verify completion proof.
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
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total City Issues</p>
          <h4 className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</h4>
        </div>
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Review</p>
          <h4 className="text-xl font-bold text-amber-600 mt-1">{metrics.pendingReview}</h4>
        </div>
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Active In-Progress</p>
          <h4 className="text-xl font-bold text-blue-600 mt-1">{metrics.inProgress}</h4>
        </div>
        <div className="p-3.5 bg-white border border-rose-200 bg-rose-50/20 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-500" />
            <span>Emergency Alert</span>
          </p>
          <h4 className="text-xl font-bold text-rose-600 mt-1">{metrics.emergencyCount}</h4>
        </div>
        <div className="p-3.5 bg-white border border-red-200 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 flex items-center gap-1">
            <Clock className="w-3 h-3 text-red-600" />
            <span>SLA Breached</span>
          </p>
          <h4 className="text-xl font-bold text-red-700 mt-1">{metrics.breachedSLA}</h4>
        </div>
        <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved / Closed</p>
          <h4 className="text-xl font-bold text-emerald-600 mt-1">{metrics.resolved}</h4>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search CMP #, citizen name, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Department Filter */}
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Departments' },
                ...INITIAL_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'submitted', label: 'Submitted (New)' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />

            {/* Priority Filter */}
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'emergency', label: 'Emergency Only' },
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
              ]}
            />

            {/* SLA Filter */}
            <Select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All SLA Statuses' },
                { value: 'breached', label: 'SLA Breached' },
                { value: 'approaching', label: 'Approaching SLA (<12h)' },
                { value: 'on_track', label: 'On Track' },
              ]}
            />

            {/* Sort Order */}
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

      {/* Complaints Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Grievances Dispatch Table ({filteredComplaints.length})</CardTitle>
            <CardDescription>Click any row to open the Authority Command and Assignment View</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <LoadingSkeleton className="h-16" />
              <LoadingSkeleton className="h-16" />
              <LoadingSkeleton className="h-16" />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No grievances matching current filters"
                description="Adjust filters or check back later for new citizen submissions."
                icon={<ShieldCheck className="w-10 h-10 text-slate-400" />}
                actionLabel="Reset All Filters"
                onAction={() => {
                  setStatusFilter('all');
                  setDeptFilter('all');
                  setPriorityFilter('all');
                  setSlaFilter('all');
                  setSearchQuery('');
                }}
              />
            </div>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Complaint &amp; Citizen</TableHeaderCell>
                  <TableHeaderCell>Issue &amp; Category</TableHeaderCell>
                  <TableHeaderCell>Priority</TableHeaderCell>
                  <TableHeaderCell>Assigned Department</TableHeaderCell>
                  <TableHeaderCell>SLA Timeline</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell className="text-right">Action</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredComplaints.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => navigate(`/dashboard/project-manager/complaints/${item.id}`)}
                    className="cursor-pointer hover:bg-blue-50/40 transition-colors"
                  >
                    {/* Complaint & Citizen */}
                    <TableCell>
                      <div>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.complaintNumber}
                        </span>
                        <p className="text-xs font-semibold text-slate-800 mt-1">{item.citizenName}</p>
                        <p className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
                      </div>
                    </TableCell>

                    {/* Issue & Category */}
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate" title={item.location.address}>
                          {item.location.address}
                        </p>
                        <Badge variant="neutral" size="sm" className="mt-1">
                          {item.category}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(item.priority)} size="sm">
                        {item.priority.toUpperCase()}
                      </Badge>
                    </TableCell>

                    {/* Assigned Department */}
                    <TableCell>
                      {item.departmentName ? (
                        <div className="text-xs">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                            {item.departmentName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.assignedOfficerName || 'Officer assigned'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Unassigned
                        </span>
                      )}
                    </TableCell>

                    {/* SLA Timeline */}
                    <TableCell>
                      {item.sla ? (
                        <div className="text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.sla.status === 'breached'
                                ? 'bg-rose-100 text-rose-700'
                                : item.sla.status === 'approaching'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {item.sla.status === 'breached'
                              ? `Breached by ${Math.abs(item.sla.hoursRemaining || 0)}h`
                              : `${item.sla.hoursRemaining || 0}h remaining`}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Target: {formatDate(item.sla.deadline)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">No SLA assigned</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(item.status)}</TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/project-manager/complaints/${item.id}`);
                        }}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthorityComplaintsQueuePage;
