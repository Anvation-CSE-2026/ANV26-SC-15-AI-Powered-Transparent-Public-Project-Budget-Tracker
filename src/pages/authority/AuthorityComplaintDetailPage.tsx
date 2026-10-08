import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  UploadCloud,
  FileCheck2,
  Lock,
  ExternalLink,
  Eye,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  getComplaintById,
  getComplaintUpdates,
  assignDepartmentAndOfficer,
  updateComplaintStatus,
  addInternalNote,
  resolveComplaint,
} from '../../api/complaintService';
import { INITIAL_DEPARTMENTS, MUNICIPAL_OFFICERS } from '../../data/departmentsData';
import type {
  Complaint,
  ComplaintUpdate,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintSeverity,
} from '../../types/complaint';
import { formatDate } from '../../utils/formatters';

export const AuthorityComplaintDetailPage: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Command Tab
  const [activeTab, setActiveTab] = useState<'assign' | 'status' | 'internal' | 'resolve'>('assign');

  // Form State: Department & Officer Assignment
  const [selectedDeptId, setSelectedDeptId] = useState(INITIAL_DEPARTMENTS[0].id);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assignedPriority, setAssignedPriority] = useState<ComplaintPriority>('medium');
  const [assignedSeverity, setAssignedSeverity] = useState<ComplaintSeverity>('moderate');
  const [slaHours, setSlaHours] = useState<number>(INITIAL_DEPARTMENTS[0].slaHoursDefault);
  const [assigning, setAssigning] = useState(false);

  // Form State: Status Update
  const [nextStatus, setNextStatus] = useState<ComplaintStatus>('in_progress');
  const [statusMessage, setStatusMessage] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Form State: Internal Note
  const [internalNoteText, setInternalNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Form State: Resolution & Proof
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<{ name: string; url: string }[]>([]);
  const [resolving, setResolving] = useState(false);

  // Feedback & Message Banners
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Timeline view filter (all vs public only)
  const [showInternalInTimeline, setShowInternalInTimeline] = useState(true);

  // Lightbox
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const dept = INITIAL_DEPARTMENTS.find((d) => d.id === deptId);
    if (dept) {
      setSlaHours(dept.slaHoursDefault);
      const officer = MUNICIPAL_OFFICERS.find((o) => o.departmentId === dept.id);
      if (officer) {
        setSelectedOfficerId(officer.id);
      }
    }
  };

  const refreshDetails = async () => {
    if (!complaintId) return;
    try {
      const [cData, uData] = await Promise.all([
        getComplaintById(complaintId),
        getComplaintUpdates(complaintId, 'project_manager'),
      ]);
      setComplaint(cData);
      setUpdates(uData);
    } catch (err) {
      console.warn('[CivicSight] Error refreshing details:', err);
    }
  };

  useEffect(() => {
    if (!complaintId) return;
    let ignore = false;

    Promise.all([
      getComplaintById(complaintId),
      getComplaintUpdates(complaintId, 'project_manager'),
    ])
      .then(([cData, uData]) => {
        if (!ignore) {
          setComplaint(cData);
          setUpdates(uData);
          setLoading(false);

          if (cData) {
            setAssignedPriority(cData.priority);
            setAssignedSeverity(cData.severity);
            if (cData.departmentId) {
              setSelectedDeptId(cData.departmentId);
              const dept = INITIAL_DEPARTMENTS.find((d) => d.id === cData.departmentId);
              if (dept && !cData.sla) {
                setSlaHours(dept.slaHoursDefault);
              }
            }
            if (cData.assignedOfficerId) {
              setSelectedOfficerId(cData.assignedOfficerId);
            }
          }
        }
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading complaint command view:', err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [complaintId]);

  // Officers filtered for selected department
  const filteredOfficers = MUNICIPAL_OFFICERS.filter((o) => o.departmentId === selectedDeptId);

  const getAuthorityUser = () => {
    return (
      userProfile || {
        uid: currentUser?.uid || 'authority_officer',
        email: currentUser?.email || 'officer@city.gov.in',
        username: currentUser?.displayName || 'Executive Engineer',
        displayName: currentUser?.displayName || 'Executive Engineer',
        role: 'project_manager' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      }
    );
  };

  // Action 1: Assign Department & Officer
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId || !complaint) return;

    const dept = INITIAL_DEPARTMENTS.find((d) => d.id === selectedDeptId);
    const officer = MUNICIPAL_OFFICERS.find((o) => o.id === selectedOfficerId);

    if (!dept || !officer) {
      setActionError('Please select a valid department and officer.');
      return;
    }

    setAssigning(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await assignDepartmentAndOfficer(
        complaintId,
        dept.id,
        dept.name,
        officer.id,
        officer.name,
        assignedPriority,
        assignedSeverity,
        slaHours,
        getAuthorityUser()
      );

      setActionSuccess(`Assigned to ${dept.name} (${officer.name}) with ${slaHours}h SLA.`);
      await refreshDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign department';
      setActionError(msg);
    } finally {
      setAssigning(false);
    }
  };

  // Action 2: Update Status
  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId || !statusMessage.trim()) {
      setActionError('Please provide a message explaining this status update.');
      return;
    }

    setUpdatingStatus(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await updateComplaintStatus(complaintId, nextStatus, statusMessage.trim(), getAuthorityUser());
      setActionSuccess(`Status updated to ${nextStatus.toUpperCase()}.`);
      setStatusMessage('');
      await refreshDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update status';
      setActionError(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Action 3: Add Internal Note
  const handleInternalNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId || !internalNoteText.trim()) {
      setActionError('Please enter note contents.');
      return;
    }

    setAddingNote(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addInternalNote(complaintId, internalNoteText.trim(), getAuthorityUser());
      setActionSuccess('Internal memo saved. Strictly hidden from citizen view.');
      setInternalNoteText('');
      const refreshedUpdates = await getComplaintUpdates(complaintId, 'project_manager');
      setUpdates(refreshedUpdates);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record note';
      setActionError(msg);
    } finally {
      setAddingNote(false);
    }
  };

  // Proof files picker
  const handleProofFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setProofFiles((prev) => [...prev, ...filesArr].slice(0, 5));
      const previews = filesArr.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
      }));
      setProofPreviews((prev) => [...prev, ...previews].slice(0, 5));
    }
  };

  // Action 4: Resolve Complaint
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId || !resolutionSummary.trim()) {
      setActionError('Please provide a comprehensive summary of the work completed.');
      return;
    }

    setResolving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await resolveComplaint(complaintId, resolutionSummary.trim(), proofFiles, getAuthorityUser());
      setActionSuccess('Grievance marked RESOLVED. Citizen has been notified to verify and submit rating.');
      setResolutionSummary('');
      setProofFiles([]);
      setProofPreviews([]);
      await refreshDetails();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve grievance';
      setActionError(msg);
    } finally {
      setResolving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton className="h-64" />
            <LoadingSkeleton className="h-48" />
          </div>
          <div>
            <LoadingSkeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested complaint document could not be located in the municipal database.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/project-manager/complaints')}>
          Return to Queue
        </Button>
      </div>
    );
  }

  const timelineUpdatesToDisplay = showInternalInTimeline
    ? updates
    : updates.filter((u) => !u.isInternal);

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <button
          onClick={() => navigate('/dashboard/project-manager/complaints')}
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaints Queue</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/80 px-3 py-1 rounded-md border border-amber-700/50">
                {complaint.complaintNumber}
              </span>
              {getStatusBadge(complaint.status)}
              <Badge variant={getPriorityBadgeVariant(complaint.priority)} size="sm">
                {complaint.priority.toUpperCase()}
              </Badge>
              <Badge variant="neutral" size="sm">
                {complaint.category}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-heading text-white pt-1">
              {complaint.title}
            </h1>
            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2 pt-0.5">
              <span>Citizen: <strong>{complaint.citizenName}</strong> ({complaint.citizenEmail})</span>
              <span>&bull;</span>
              <span>Reported: {formatDate(complaint.createdAt)}</span>
            </p>
          </div>

          {/* Live SLA Widget */}
          {complaint.sla ? (
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 p-4 rounded-xl shrink-0 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">SLA Compliance</span>
              <div className="flex items-center gap-1.5 mt-1 justify-end">
                <Clock className="w-4 h-4 text-amber-300" />
                <span
                  className={`text-sm font-bold ${
                    complaint.sla.status === 'breached'
                      ? 'text-rose-300'
                      : complaint.sla.status === 'approaching'
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                  }`}
                >
                  {complaint.sla.status === 'breached'
                    ? `Breached by ${Math.abs(complaint.sla.hoursRemaining || 0)}h`
                    : `${complaint.sla.hoursRemaining || 0}h remaining`}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Target: {formatDate(complaint.sla.deadline)}
              </p>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-right">
              <span className="text-xs font-bold text-amber-300">Awaiting SLA Target</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Assign department below to trigger timer</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Banner Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Information & Evidence & Timeline): 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Grievance Details Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Grievance Information</CardTitle>
                <CardDescription>Citizen submission details and location coordinates</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Citizen Description
                </h4>
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Location
                  </span>
                  <p className="font-bold text-slate-800">{complaint.location.address}</p>
                  <p className="text-slate-500 text-[11px]">
                    {complaint.location.ward}, {complaint.location.city}
                  </p>
                  {complaint.location.latitude && complaint.location.longitude && (
                    <p className="text-[10px] text-blue-600 font-mono pt-1">
                      GPS: {complaint.location.latitude}, {complaint.location.longitude}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Classification
                  </span>
                  <p className="font-bold text-slate-800">{complaint.category}</p>
                  <p className="text-slate-500 text-[11px]">
                    Current Priority: <span className="font-semibold text-slate-800 uppercase">{complaint.priority}</span>
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Severity: <span className="font-semibold text-slate-800">{complaint.severity}</span>
                  </p>
                </div>
              </div>

              {/* Citizen Original Evidence Gallery */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Citizen Attached Evidence ({complaint.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.attachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={() => setPreviewImageUrl(att.downloadURL)}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 cursor-pointer shadow-xs hover:border-blue-500 transition-all"
                      >
                        <img
                          src={att.downloadURL}
                          alt={att.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>Inspect</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution & Feedback Summary (if completed) */}
          {complaint.resolution && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-950">Recorded Resolution Proof</CardTitle>
                    <CardDescription className="text-emerald-700">
                      Work completed on {formatDate(complaint.resolution.resolvedAt)} by {complaint.resolution.resolvedBy}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-slate-800 bg-white p-3.5 rounded-xl border border-emerald-200">
                  {complaint.resolution.summary}
                </p>

                {complaint.resolution.proofAttachments && complaint.resolution.proofAttachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {complaint.resolution.proofAttachments.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setPreviewImageUrl(p.downloadURL)}
                        className="rounded-lg overflow-hidden border border-emerald-200 aspect-video cursor-pointer"
                      >
                        <img src={p.downloadURL} alt="Proof" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Citizen Rating Display */}
                {complaint.feedback && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">Citizen Satisfaction Rating:</span>
                      {complaint.feedback.comment && (
                        <p className="text-slate-500 italic mt-0.5">&ldquo;{complaint.feedback.comment}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-bold text-amber-600 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                      <span>{complaint.feedback.rating}/5</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Traceable Audit Log & Timeline */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Traceable Activity &amp; Audit Log</CardTitle>
                <CardDescription>Complete municipal actions, citizen submissions &amp; internal notes</CardDescription>
              </div>
              {/* Internal notes toggle */}
              <button
                type="button"
                onClick={() => setShowInternalInTimeline(!showInternalInTimeline)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  showInternalInTimeline
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>{showInternalInTimeline ? 'Showing Internal Notes' : 'Hiding Internal Notes'}</span>
              </button>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {timelineUpdatesToDisplay.map((item, index) => {
                  const isInternal = item.isInternal;
                  return (
                    <div key={item.id || index} className="relative pl-6">
                      <div
                        className={`absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center ${
                          isInternal ? 'border-amber-500' : 'border-blue-600'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isInternal ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.action}</span>
                          {isInternal && (
                            <Badge variant="warning" size="sm" className="text-[10px]">
                              Internal Authority Memo
                            </Badge>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <div
                          className={`p-2.5 rounded-lg text-xs leading-relaxed border ${
                            isInternal
                              ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-medium'
                              : 'bg-slate-50 border-slate-100 text-slate-700'
                          }`}
                        >
                          {item.message}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          <span>By: {item.actorName}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{item.actorRole.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Authority Action Command Center (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-blue-200 shadow-md">
            <CardHeader className="bg-slate-50/80 border-b border-slate-200">
              <div>
                <CardTitle className="text-blue-950">Authority Action Panel</CardTitle>
                <CardDescription>Dispatch, update status, record notes, or mark resolved</CardDescription>
              </div>
            </CardHeader>

            {/* Action Tabs */}
            <div className="grid grid-cols-4 border-b border-slate-200 text-[11px] font-bold bg-slate-100/60">
              {[
                { id: 'assign', label: 'Assign & SLA' },
                { id: 'status', label: 'Status' },
                { id: 'internal', label: 'Private Note' },
                { id: 'resolve', label: 'Resolve' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'assign' | 'status' | 'internal' | 'resolve')}
                  className={`py-2.5 text-center transition-colors cursor-pointer border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 bg-white text-blue-700 shadow-xs'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CardContent className="p-5">
              {/* TAB 1: ASSIGN DEPARTMENT, OFFICER & SLA */}
              {activeTab === 'assign' && (
                <form onSubmit={handleAssignSubmit} className="space-y-4">
                  <Select
                    label="Assign Municipal Department"
                    value={selectedDeptId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    options={INITIAL_DEPARTMENTS.map((d) => ({
                      value: d.id,
                      label: `${d.name} (${d.code})`,
                    }))}
                    required
                  />

                  <Select
                    label="Responsible Field Officer"
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    options={filteredOfficers.map((o) => ({
                      value: o.id,
                      label: `${o.name} - ${o.designation}`,
                    }))}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Enforce Priority"
                      value={assignedPriority}
                      onChange={(e) => setAssignedPriority(e.target.value as ComplaintPriority)}
                      options={[
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'emergency', label: 'Emergency' },
                      ]}
                    />

                    <Input
                      label="Resolution SLA (Hours)"
                      type="number"
                      min={1}
                      max={168}
                      value={slaHours}
                      onChange={(e) => setSlaHours(parseInt(e.target.value) || 24)}
                      required
                    />
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900">
                    <p className="font-semibold">SLA Enforcement Notice</p>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Submitting will transition status to <strong>ASSIGNED</strong> and start an official {slaHours}-hour countdown for the officer.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={assigning}
                    className="w-full bg-blue-600 hover:bg-blue-500"
                  >
                    Assign Department &amp; Activate SLA
                  </Button>
                </form>
              )}

              {/* TAB 2: UPDATE STATUS */}
              {activeTab === 'status' && (
                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  <Select
                    label="Target Status"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as ComplaintStatus)}
                    options={[
                      { value: 'under_review', label: 'Under Review' },
                      { value: 'in_progress', label: 'In Progress (Active Field Work)' },
                      { value: 'awaiting_info', label: 'Awaiting Citizen Info' },
                      { value: 'escalated', label: 'Escalated to Chief Engineer' },
                      { value: 'rejected', label: 'Rejected (Invalid / Non-Municipal)' },
                    ]}
                  />

                  <Textarea
                    label="Public Timeline Message"
                    placeholder="Provide an official update that will be visible on the citizen's tracker..."
                    rows={4}
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    helperText="Citizens receive this message directly on their timeline."
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={updatingStatus}
                    className="w-full bg-blue-600 hover:bg-blue-500"
                  >
                    Publish Status Update
                  </Button>
                </form>
              )}

              {/* TAB 3: INTERNAL PRIVATE NOTE */}
              {activeTab === 'internal' && (
                <form onSubmit={handleInternalNoteSubmit} className="space-y-4">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Confidential Internal Remark</p>
                      <p className="text-[11px] text-amber-800">
                        This note is strictly visible to Project Managers and Engineers. It will NEVER be shown to citizens.
                      </p>
                    </div>
                  </div>

                  <Textarea
                    label="Internal Observation / Work Instructions"
                    placeholder="e.g. Contractor ABC was instructed to bring hot-mix asphalt before 4 PM. Awaiting road closure clearance from traffic police."
                    rows={4}
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={addingNote}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    Save Confidential Note
                  </Button>
                </form>
              )}

              {/* TAB 4: RESOLUTION & COMPLETION PROOF */}
              {activeTab === 'resolve' && (
                <form onSubmit={handleResolveSubmit} className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                    <p className="font-bold">Resolution &amp; Proof Verification</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Attaching completion proof is required to close out municipal SLAs and notify citizens for satisfaction verification.
                    </p>
                  </div>

                  <Textarea
                    label="Summary of Work Completed"
                    placeholder="e.g. Pothole filled and sealed with bitumen emulsion. Road resurfaced and opened for vehicular traffic. Inspected by Junior Engineer."
                    rows={3}
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                    required
                  />

                  {/* Proof Uploads */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload Resolution Proof (Images / Inspection Sheets)
                    </label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 p-4 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-700">Click to upload completion photos</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, PDF</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleProofFilesChange}
                      />
                    </label>

                    {proofPreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {proofPreviews.map((p, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-video">
                            <img src={p.url} alt="Proof preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={resolving}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Mark Resolved &amp; Notify Citizen
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImageUrl && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImageUrl(null)}
          title="Evidence & Attachment Viewer"
          maxWidth="2xl"
        >
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <img
              src={previewImageUrl}
              alt="Attachment preview"
              className="max-h-[70vh] w-auto rounded-xl object-contain shadow-md"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewImageUrl, '_blank')}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open Original in New Tab
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuthorityComplaintDetailPage;
