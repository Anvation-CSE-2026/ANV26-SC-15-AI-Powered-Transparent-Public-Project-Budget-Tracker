import React, { useEffect, useState, useTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Textarea } from '../../components/common/Textarea';
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
  User,
  ShieldCheck,
  ExternalLink,
  FileCheck2,
  Send,
  Eye,
} from 'lucide-react';
import { getComplaintById, getComplaintUpdates, submitComplaintFeedback } from '../../api/complaintService';
import type { Complaint, ComplaintUpdate, ComplaintStatus, ComplaintPriority } from '../../types/complaint';
import { formatDate } from '../../utils/formatters';
import { WorksiteMapPreview } from '../../components/map/WorksiteMapPreview';

export const CitizenComplaintDetailPage: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Citizen Feedback Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Attachment Modal Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!complaintId) return;
    let ignore = false;

    Promise.all([
      getComplaintById(complaintId),
      getComplaintUpdates(complaintId, 'citizen'),
    ])
      .then(([cData, uData]) => {
        if (!ignore) {
          setComplaint(cData);
          setUpdates(uData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading complaint details:', err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [complaintId]);

  // Handle citizen rating & feedback submission
  const handleFeedbackSubmit = async () => {
    if (!complaintId || !complaint) return;
    const authUser = userProfile || {
      uid: currentUser?.uid || complaint.citizenId,
      email: currentUser?.email || complaint.citizenEmail,
      username: currentUser?.displayName || complaint.citizenName,
      displayName: currentUser?.displayName || complaint.citizenName,
      role: 'citizen' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    setSubmittingFeedback(true);
    setFeedbackError(null);

    try {
      await submitComplaintFeedback(complaintId, rating, feedbackComment, authUser);
      setFeedbackSuccess(true);
      // Refresh state smoothly
      startTransition(() => {
        setComplaint((prev) =>
          prev
            ? {
                ...prev,
                status: 'closed',
                feedback: {
                  rating,
                  comment: feedbackComment.trim(),
                  submittedAt: new Date().toISOString(),
                },
              }
            : null
        );
      });
      // Refresh updates list to include the newly appended update
      const refreshedUpdates = await getComplaintUpdates(complaintId, 'citizen');
      setUpdates(refreshedUpdates);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit feedback';
      setFeedbackError(msg);
    } finally {
      setSubmittingFeedback(false);
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
      default:
        return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6">
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
          The requested complaint document could not be retrieved from the municipal database.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/citizen/complaints')}>
          Return to My Complaints
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <button
          onClick={() => navigate('/dashboard/citizen/complaints')}
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaints List</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-200 bg-blue-900/60 px-3 py-1 rounded-md border border-blue-700/50">
                {complaint.complaintNumber}
              </span>
              {getStatusBadge(complaint.status)}
              <Badge variant={getPriorityBadgeVariant(complaint.priority)} size="sm">
                Priority: {complaint.priority.toUpperCase()}
              </Badge>
              <Badge variant="neutral" size="sm">
                {complaint.category}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-heading text-white pt-1">
              {complaint.title}
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-2 pt-0.5">
              <span>Submitted on {formatDate(complaint.createdAt)}</span>
              <span>&bull;</span>
              <span>Ward: {complaint.location.ward || 'Municipal Zone'}</span>
            </p>
          </div>

          {/* Quick SLA Pill */}
          {complaint.sla && (
            <div className="bg-white/10 backdrop-blur-xs border border-white/10 p-3.5 rounded-xl shrink-0 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-300 block">Municipal SLA</span>
              <div className="flex items-center gap-1.5 mt-0.5 justify-end">
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
                    ? `Overdue (${Math.abs(complaint.sla.hoursRemaining || 0)}h)`
                    : `${complaint.sla.hoursRemaining || 0}h remaining`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Details, Evidence, Resolution & Feedback) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Details Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Grievance Information</CardTitle>
                <CardDescription>Submitted citizen report and exact location details</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60 whitespace-pre-line">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Location &amp; Address
                  </span>
                  <p className="font-bold text-slate-800">{complaint.location.address}</p>
                  <p className="text-slate-500 text-[11px]">
                    {complaint.location.ward}, {complaint.location.city}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                  <span className="text-slate-500 font-semibold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Classification
                  </span>
                  <p className="font-bold text-slate-800">{complaint.category}</p>
                  <p className="text-slate-500 text-[11px]">
                    Perceived Severity: <span className="font-semibold text-slate-700">{complaint.severity}</span>
                  </p>
                </div>
              </div>

              {/* Worksite GIS Map Location */}
              {complaint.location.latitude && complaint.location.longitude && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Verified Geo-Coordinates
                  </h4>
                  <WorksiteMapPreview
                    latitude={complaint.location.latitude}
                    longitude={complaint.location.longitude}
                    title={complaint.title}
                    address={complaint.location.address}
                    ward={complaint.location.ward}
                    city={complaint.location.city}
                    type="complaint"
                    priority={complaint.priority}
                    status={complaint.status}
                    heightClass="h-44"
                  />
                </div>
              )}

              {/* Citizen Original Evidence Gallery */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Attached Evidence Photos ({complaint.attachments.length})
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
                          <span>View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RESOLUTION SECTION (Shown when status is resolved or closed) */}
          {(complaint.status === 'resolved' || complaint.status === 'closed') && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-emerald-950">Official Municipal Resolution Proof</CardTitle>
                    <CardDescription className="text-emerald-700">
                      Work verified and marked completed by municipal field officers
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Resolved by: {complaint.resolution?.resolvedBy || 'Municipal Engineer'}
                    </span>
                    <span>
                      {complaint.resolution?.resolvedAt
                        ? formatDate(complaint.resolution.resolvedAt)
                        : formatDate(complaint.updatedAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 leading-relaxed pt-1">
                    {complaint.resolution?.summary || 'The reported civic issue has been resolved by the assigned municipal works team.'}
                  </p>

                  {/* Resolution Proof Photos */}
                  {complaint.resolution?.proofAttachments &&
                    complaint.resolution.proofAttachments.length > 0 && (
                      <div className="pt-3">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                          Completion Proof Photos
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {complaint.resolution.proofAttachments.map((proof) => (
                            <div
                              key={proof.id}
                              onClick={() => setPreviewImageUrl(proof.downloadURL)}
                              className="group relative rounded-xl overflow-hidden border border-emerald-200 aspect-video bg-slate-100 cursor-pointer shadow-xs hover:border-emerald-500 transition-all"
                            >
                              <img
                                src={proof.downloadURL}
                                alt={proof.fileName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                <Eye className="w-4 h-4" />
                                <span>Inspect Proof</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* CITIZEN FEEDBACK & RATING WIDGET */}
                {complaint.status === 'resolved' ? (
                  <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-xs space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                        Verify Work &amp; Submit Satisfaction Rating
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Please rate the quality of work performed. Submitting feedback will officially mark this complaint as <strong>Closed</strong>.
                      </p>
                    </div>

                    {feedbackError && (
                      <p className="text-xs text-rose-600 font-semibold">{feedbackError}</p>
                    )}

                    {/* Interactive 5-Star Picker */}
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs font-semibold text-slate-700">Rating:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const active = (hoverRating || rating) >= starVal;
                          return (
                            <button
                              key={starVal}
                              type="button"
                              onMouseEnter={() => setHoverRating(starVal)}
                              onMouseLeave={() => setHoverRating(null)}
                              onClick={() => setRating(starVal)}
                              className="p-1 hover:scale-110 transition-transform cursor-pointer"
                              title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  active
                                    ? 'text-amber-500 fill-amber-400'
                                    : 'text-slate-300 hover:text-slate-400'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-bold text-amber-600 ml-2">
                        {rating === 5
                          ? 'Excellent (5/5)'
                          : rating === 4
                          ? 'Good (4/5)'
                          : rating === 3
                          ? 'Satisfactory (3/5)'
                          : rating === 2
                          ? 'Needs Improvement (2/5)'
                          : 'Poor / Unsatisfactory (1/5)'}
                      </span>
                    </div>

                    <Textarea
                      placeholder="Optional feedback: Did the repair hold up? Any remaining debris or concerns?"
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />

                    <div className="flex justify-end pt-1">
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={submittingFeedback || isPending}
                        onClick={handleFeedbackSubmit}
                        leftIcon={<Send className="w-4 h-4" />}
                        className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/20 text-white"
                      >
                        Confirm Resolution &amp; Close Grievance
                      </Button>
                    </div>
                  </div>
                ) : complaint.status === 'closed' && (complaint.feedback || feedbackSuccess) ? (
                  <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Citizen Feedback Submitted
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (complaint.feedback?.rating || rating)
                                ? 'text-amber-500 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {complaint.feedback?.comment && (
                      <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        &ldquo;{complaint.feedback.comment}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Case officially closed with citizen verification</span>
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Assigned Dept, SLA & Official Timeline) */}
        <div className="space-y-6">
          {/* Department & SLA Card */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Department &amp; SLA</CardTitle>
                <CardDescription>Assigned municipal team and timeline SLA</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {complaint.departmentName ? (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                    Assigned Department
                  </span>
                  <p className="text-sm font-bold text-blue-950">{complaint.departmentName}</p>
                  {complaint.assignedOfficerName && (
                    <p className="text-xs text-blue-800 flex items-center gap-1.5 pt-1">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Officer: {complaint.assignedOfficerName}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Awaiting Assignment</p>
                  <p>Municipal dispatch is currently verifying this report and routing it to the appropriate department.</p>
                </div>
              )}

              {/* SLA Target */}
              {complaint.sla ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">SLA Target Deadline</span>
                    <Badge
                      variant={
                        complaint.sla.status === 'breached'
                          ? 'danger'
                          : complaint.sla.status === 'approaching'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {complaint.sla.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-slate-800 font-medium">{formatDate(complaint.sla.deadline)}</p>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        complaint.sla.status === 'breached'
                          ? 'bg-rose-500 w-full'
                          : complaint.sla.status === 'approaching'
                          ? 'bg-amber-500 w-4/5'
                          : 'bg-emerald-500 w-1/2'
                      }`}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Official Timeline Updates Feed */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Official Municipal Timeline</CardTitle>
                <CardDescription>Traceable audit log of actions &amp; status updates</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {updates.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No public updates logged yet.
                </p>
              ) : (
                <div className="relative border-l-2 border-blue-200 ml-3 space-y-6">
                  {updates.map((item, index) => (
                    <div key={item.id || index} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.action}</span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          {item.message}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          <span>Updated by: {item.actorName}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{item.actorRole.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Lightbox Modal */}
      {previewImageUrl && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewImageUrl(null)}
          title="Evidence Attachment Viewer"
          maxWidth="2xl"
        >
          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <img
              src={previewImageUrl}
              alt="Evidence preview"
              className="max-h-[70vh] w-auto rounded-xl object-contain shadow-md"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(previewImageUrl, '_blank')}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              Open Full Image in New Tab
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CitizenComplaintDetailPage;
