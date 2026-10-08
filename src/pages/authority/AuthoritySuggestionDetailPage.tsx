import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  Lock,
  Send,
  Check,
} from 'lucide-react';
import {
  getSuggestionById,
  getSuggestionUpdates,
  updateSuggestionStatus,
  addSuggestionAuthorityResponse,
  addSuggestionInternalNote,
} from '../../api/suggestionService';
import type { Suggestion, SuggestionUpdate, SuggestionStatus, SuggestionCategory } from '../../types/suggestion';
import { formatDate } from '../../utils/formatters';

const STATUS_CONFIG: Record<SuggestionStatus, { label: string; variant: BadgeVariant; desc: string }> = {
  submitted: { label: 'Submitted', variant: 'warning', desc: 'Awaiting moderation review' },
  under_review: { label: 'Under Review', variant: 'info', desc: 'Evaluating feasibility and municipal alignment' },
  accepted: { label: 'Accepted', variant: 'success', desc: 'Approved for planning and integration' },
  in_progress: { label: 'In Progress', variant: 'info', desc: 'Under municipal implementation' },
  implemented: { label: 'Implemented', variant: 'primary', desc: 'Successfully executed in public operations' },
  rejected: { label: 'Rejected', variant: 'danger', desc: 'Not feasible or incompatible with current urban plans' },
  closed: { label: 'Closed', variant: 'neutral', desc: 'Proposal lifecycle completed' },
};

const CATEGORY_LABELS: Partial<Record<SuggestionCategory, string>> = {
  infrastructure: 'Infrastructure & Roads',
  environment: 'Environment & Green Spaces',
  transportation: 'Public Transportation & Mobility',
  health: 'Public Health & Sanitation',
  education: 'Education & Civic Facilities',
  technology: 'Smart City & Digital Services',
  safety: 'Public Safety & Lighting',
  governance: 'Civic Governance & Transparency',
  other: 'General Urban Improvement',
};

export const AuthoritySuggestionDetailPage: React.FC = () => {
  const { suggestionId } = useParams<{ suggestionId: string }>();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [updates, setUpdates] = useState<SuggestionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment Modal preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Moderation Console State
  const [activeTab, setActiveTab] = useState<'status' | 'response' | 'note'>('status');

  // Status update state
  const [newStatus, setNewStatus] = useState<SuggestionStatus>('under_review');
  const [statusMessage, setStatusMessage] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Official Response state
  const [officialResponse, setOfficialResponse] = useState('');
  const [departmentName, setDepartmentName] = useState('Urban Development & Public Works');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Internal Note state
  const [internalNote, setInternalNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDetails = useCallback(() => {
    if (!suggestionId) return;
    Promise.all([
      getSuggestionById(suggestionId),
      getSuggestionUpdates(suggestionId, 'project_manager'),
    ])
      .then(([sData, uData]) => {
        if (!sData) {
          setError('Suggestion proposal not found.');
        } else {
          setSuggestion(sData);
          setNewStatus(sData.status);
          setUpdates(uData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading suggestion details:', err);
        setError('Failed to load suggestion details.');
        setLoading(false);
      });
  }, [suggestionId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const authUser = userProfile || {
    uid: currentUser?.uid || 'pm_default',
    email: currentUser?.email || 'pm@civicsight.org',
    username: currentUser?.displayName || 'Project Manager',
    displayName: currentUser?.displayName || 'Project Manager',
    role: 'project_manager' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  };

  // 1. Handle Status Change
  const handleUpdateStatus = async () => {
    if (!suggestionId || !statusMessage.trim()) {
      setActionError('Please provide a brief justification or comment for the status update.');
      return;
    }
    setIsUpdatingStatus(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await updateSuggestionStatus(suggestionId, newStatus, statusMessage, authUser);
      setStatusMessage('');
      setActionSuccess(`Status successfully transitioned to ${STATUS_CONFIG[newStatus]?.label || newStatus}.`);
      fetchDetails();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update suggestion status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 2. Handle Official Authority Response
  const handleOfficialResponse = async () => {
    if (!suggestionId || !officialResponse.trim()) {
      setActionError('Please provide the official response text.');
      return;
    }
    setIsSubmittingResponse(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addSuggestionAuthorityResponse(suggestionId, officialResponse, authUser, departmentName);
      setOfficialResponse('');
      setActionSuccess('Official municipal response published and visible to the citizen.');
      fetchDetails();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to publish official response.');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // 3. Handle Internal Confidential Note
  const handleInternalNote = async () => {
    if (!suggestionId || !internalNote.trim()) {
      setActionError('Please enter the internal confidential note.');
      return;
    }
    setIsSubmittingNote(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await addSuggestionInternalNote(suggestionId, internalNote, authUser);
      setInternalNote('');
      setActionSuccess('Internal confidential note saved (hidden from citizen).');
      fetchDetails();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to save internal note.');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4">
        <LoadingSkeleton className="h-9 w-32" />
        <LoadingSkeleton className="h-44 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton className="h-64 w-full" />
          </div>
          <div>
            <LoadingSkeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Suggestion Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error || 'Unable to locate proposal.'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/project-manager/suggestions')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Suggestions Queue
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG.submitted;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2 animate-in fade-in duration-200">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/project-manager/suggestions')}
            className="flex items-center text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Queue
          </Button>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/dashboard/project-manager" className="hover:underline">Authority Portal</Link>
            <span>/</span>
            <Link to="/dashboard/project-manager/suggestions" className="hover:underline">Suggestions</Link>
            <span>/</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{suggestion.suggestionNumber}</span>
          </div>
        </div>

        <Badge variant={statusInfo.variant} className="px-3 py-1 text-sm font-semibold self-start sm:self-auto">
          {statusInfo.label}
        </Badge>
      </div>

      {/* Main Details Banner */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-900">
                  {suggestion.suggestionNumber}
                </span>
                <Badge variant="outline" className="text-xs">
                  {CATEGORY_LABELS[suggestion.category] || suggestion.category}
                </Badge>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {suggestion.title}
              </CardTitle>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 shrink-0 min-w-[220px]">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitter: <strong className="text-slate-900 dark:text-white">{suggestion.citizenName}</strong></span>
              </div>
              {suggestion.citizenEmail && (
                <div className="text-[11px] text-slate-500 pl-5 truncate">
                  {suggestion.citizenEmail}
                </div>
              )}
              <div className="flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted: {formatDate(suggestion.createdAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Layout: Left details + Right Moderation console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Proposal Details & Updates Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Proposal Content &amp; Evidence
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Citizen Problem Statement &amp; Solution
                </h4>
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  {suggestion.description}
                </p>
              </div>

              {/* Expected Impact */}
              {suggestion.expectedImpact && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Expected Public Benefits
                  </h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    {suggestion.expectedImpact}
                  </p>
                </div>
              )}

              {/* Location */}
              {suggestion.location && (suggestion.location.address || suggestion.location.ward) && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Target Civic Location
                  </h4>
                  <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      {suggestion.location.address && (
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {suggestion.location.address}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 mt-0.5">
                        {suggestion.location.ward && <span>Ward: {suggestion.location.ward}</span>}
                        {suggestion.location.landmark && <span>Near: {suggestion.location.landmark}</span>}
                        {suggestion.location.latitude && suggestion.location.longitude && (
                          <span className="font-mono">
                            GPS: {suggestion.location.latitude.toFixed(5)}, {suggestion.location.longitude.toFixed(5)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {suggestion.attachments && suggestion.attachments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Submitted Evidence &amp; Documents ({suggestion.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestion.attachments.map((att, idx) => {
                      const isImage = att.contentType.startsWith('image/');
                      return (
                        <div
                          key={att.id || idx}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            {isImage ? (
                              <div
                                onClick={() => setPreviewImageUrl(att.downloadURL)}
                                className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 shrink-0 cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-700 relative"
                              >
                                <img
                                  src={att.downloadURL}
                                  alt={att.fileName}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Eye className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-slate-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                {att.fileName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {(att.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <a
                            href={att.downloadURL}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-brand-600 p-1"
                            title="Open file"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Published Official Response Preview */}
          {suggestion.authorityResponse && (
            <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-5 h-5" />
                  <CardTitle className="text-base font-bold">Published Official Response (Citizen Visible)</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  {suggestion.authorityResponse.message}
                </p>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-4">
                  <span>Official: <strong>{suggestion.authorityResponse.respondedBy}</strong></span>
                  {suggestion.authorityResponse.department && (
                    <span>Dept: <strong>{suggestion.authorityResponse.department}</strong></span>
                  )}
                  <span>Date: {formatDate(suggestion.authorityResponse.respondedAt)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Timeline / Updates */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-slate-500" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Audit History &amp; Internal Notes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {updates.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm">
                  No lifecycle transitions or memos recorded yet.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                  {updates.map((upd) => (
                    <div key={upd.id} className="relative group">
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 flex items-center justify-center ${
                          upd.isInternal
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                            : 'border-brand-500'
                        }`}
                      >
                        {upd.isInternal ? (
                          <Lock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                        )}
                      </div>

                      <div
                        className={`p-4 rounded-xl border space-y-2 ${
                          upd.isInternal
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-white">
                              {upd.action}
                            </span>
                            {upd.isInternal && (
                              <Badge variant="warning" className="text-[10px] py-0 px-2 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Confidential Note
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(upd.createdAt)}
                          </span>
                        </div>

                        {upd.message && (
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {upd.message}
                          </p>
                        )}

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 pt-1">
                          <User className="w-3.5 h-3.5" />
                          <span>Logged by: {upd.actorName} ({upd.actorRole})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Moderation & Decision Center */}
        <div className="space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm sticky top-4">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Authority Moderation Center
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Perform official evaluations, log transitions, and publish citizen responses.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Action Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('status');
                    setActionSuccess(null);
                    setActionError(null);
                  }}
                  className={`py-1.5 rounded-md text-center transition-colors cursor-pointer ${
                    activeTab === 'status'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('response');
                    setActionSuccess(null);
                    setActionError(null);
                  }}
                  className={`py-1.5 rounded-md text-center transition-colors cursor-pointer ${
                    activeTab === 'response'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Response
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('note');
                    setActionSuccess(null);
                    setActionError(null);
                  }}
                  className={`py-1.5 rounded-md text-center transition-colors cursor-pointer ${
                    activeTab === 'note'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Internal Note
                </button>
              </div>

              {/* Feedback Alert */}
              {actionSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{actionSuccess}</span>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* TAB 1: STATUS TRANSITION */}
              {activeTab === 'status' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Lifecycle Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as SuggestionStatus)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="submitted">Submitted (Awaiting Review)</option>
                      <option value="under_review">Under Review (Technical Evaluation)</option>
                      <option value="accepted">Accepted (Approved for Urban Planning)</option>
                      <option value="implemented">Implemented (Completed in Works)</option>
                      <option value="rejected">Rejected (Not Feasible)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Transition Rationale / Public Note *
                    </label>
                    <Textarea
                      rows={3}
                      placeholder="Explain the reason for this status change..."
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <Button
                    variant="primary"
                    className="w-full text-xs py-2"
                    onClick={handleUpdateStatus}
                    isLoading={isUpdatingStatus}
                  >
                    Commit Status Transition
                  </Button>
                </div>
              )}

              {/* TAB 2: OFFICIAL PUBLIC RESPONSE */}
              {activeTab === 'response' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Responsible Municipal Department
                    </label>
                    <input
                      type="text"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      placeholder="e.g. Urban Roads & Mobility Department"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Remarks to Submitter *
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Detail the municipal council's evaluation, budgetary provisions, or project timeline..."
                      value={officialResponse}
                      onChange={(e) => setOfficialResponse(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500">
                    ℹ️ This official statement will be directly highlighted on the citizen's proposal page.
                  </p>

                  <Button
                    variant="primary"
                    className="w-full text-xs py-2"
                    onClick={handleOfficialResponse}
                    isLoading={isSubmittingResponse}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Publish Official Response
                  </Button>
                </div>
              )}

              {/* TAB 3: INTERNAL STAFF NOTE */}
              {activeTab === 'note' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Internal Staff Only: This memo is confidential and strictly filtered out of citizen view.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Internal Engineering / Budget Note *
                    </label>
                    <Textarea
                      rows={4}
                      placeholder="Confidential notes on cost estimation, contractor viability, or technical hurdles..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full text-xs py-2 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 hover:bg-amber-50"
                    onClick={handleInternalNote}
                    isLoading={isSubmittingNote}
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Save Confidential Note
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <Modal
          isOpen={!!previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
          title="Document Attachment Preview"
        >
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto rounded-lg bg-black/5 dark:bg-black/40 p-2 flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt="Attachment Preview"
                className="max-w-full max-h-[65vh] object-contain rounded"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setPreviewImageUrl(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
