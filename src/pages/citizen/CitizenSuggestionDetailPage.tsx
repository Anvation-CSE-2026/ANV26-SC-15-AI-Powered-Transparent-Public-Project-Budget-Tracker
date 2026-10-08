import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  Lightbulb,
  MapPin,
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Eye,
  Info,
} from 'lucide-react';
import { getSuggestionById, getSuggestionUpdates } from '../../api/suggestionService';
import type { Suggestion, SuggestionUpdate, SuggestionStatus, SuggestionCategory } from '../../types/suggestion';
import { formatDate } from '../../utils/formatters';

const STATUS_CONFIG: Record<SuggestionStatus, { label: string; variant: BadgeVariant; desc: string }> = {
  submitted: { label: 'Submitted', variant: 'warning', desc: 'Received and awaiting moderation review' },
  under_review: { label: 'Under Review', variant: 'info', desc: 'Evaluating feasibility and municipal alignment' },
  accepted: { label: 'Accepted', variant: 'success', desc: 'Approved for planning and integration' },
  in_progress: { label: 'In Progress', variant: 'info', desc: 'Under active urban execution' },
  implemented: { label: 'Implemented', variant: 'primary', desc: 'Successfully executed in public operations' },
  rejected: { label: 'Rejected', variant: 'danger', desc: 'Not feasible or incompatible with current urban plans' },
  closed: { label: 'Closed', variant: 'neutral', desc: 'Proposal lifecycle closed' },
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

export const CitizenSuggestionDetailPage: React.FC = () => {
  const { suggestionId } = useParams<{ suggestionId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [updates, setUpdates] = useState<SuggestionUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attachment Modal preview
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!suggestionId) return;
    let ignore = false;

    Promise.all([
      getSuggestionById(suggestionId),
      getSuggestionUpdates(suggestionId, userProfile?.role || 'citizen'),
    ])
      .then(([sData, uData]) => {
        if (!ignore) {
          if (!sData) {
            setError('The requested civic suggestion could not be found.');
          } else {
            setSuggestion(sData);
            setUpdates(uData);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[CivicSight] Error loading suggestion details:', err);
        if (!ignore) {
          setError('Unable to load suggestion details at this time.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [suggestionId, userProfile?.role]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <div className="flex items-center space-x-3">
          <LoadingSkeleton className="h-9 w-24" />
          <LoadingSkeleton className="h-6 w-48" />
        </div>
        <LoadingSkeleton className="h-44 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton className="h-64 w-full" />
            <LoadingSkeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton className="h-72 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl max-w-md mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Suggestion Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{error || 'This proposal may have been archived.'}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/dashboard/citizen/suggestions')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Suggestions
        </Button>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[suggestion.status] || STATUS_CONFIG.submitted;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/citizen/suggestions')}
            className="flex items-center text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/dashboard/citizen" className="hover:underline">Dashboard</Link>
            <span>/</span>
            <Link to="/dashboard/citizen/suggestions" className="hover:underline">Suggestions</Link>
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
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 md:text-right shrink-0">
              <div className="flex items-center md:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Submitted: {formatDate(suggestion.createdAt)}</span>
              </div>
              <div className="flex items-center md:justify-end gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated: {formatDate(suggestion.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Status Explanation Banner */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
            <Info className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Current Lifecycle State: {statusInfo.label}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {statusInfo.desc}
              </p>
            </div>
          </div>

          {/* Proposal Description */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Proposal Description & Context
            </h3>
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              {suggestion.description}
            </p>
          </div>

          {/* Expected Impact / Public Benefits */}
          {suggestion.expectedImpact && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Expected Public Benefits & Impact
              </h3>
              <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                {suggestion.expectedImpact}
              </p>
            </div>
          )}

          {/* Target Location */}
          {suggestion.location && (suggestion.location.address || suggestion.location.ward) && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Target Civic Location
              </h3>
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {suggestion.location.address && (
                    <p className="font-medium text-slate-900 dark:text-white">
                      {suggestion.location.address}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
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
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Supporting Documentation ({suggestion.attachments.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {suggestion.attachments.map((att, idx) => {
                  const isImage = att.contentType.startsWith('image/');
                  return (
                    <div
                      key={att.id || idx}
                      className="group border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-900 hover:border-brand-500 transition-colors flex items-center justify-between"
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
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
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
                        className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1"
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

      {/* Authority Response Section */}
      {suggestion.authorityResponse && (
        <Card className="border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle className="text-base font-bold">Official Municipal Review & Decision</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {suggestion.authorityResponse.message}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1">
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Reviewing Authority:</span>{' '}
                {suggestion.authorityResponse.respondedBy}
              </div>
              {suggestion.authorityResponse.department && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Department:</span>{' '}
                  {suggestion.authorityResponse.department}
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Decision Date:</span>{' '}
                {formatDate(suggestion.authorityResponse.respondedAt)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Updates */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Lifecycle Progress Timeline
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {updates.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              <Lightbulb className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              Your suggestion has been logged and queued for departmental evaluation.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
              {updates.map((upd) => (
                <div key={upd.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-brand-500 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 p-4 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {upd.status ? STATUS_CONFIG[upd.status]?.label || upd.status : upd.action}
                        </span>
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
                      <span>Updated by: {upd.actorName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
