import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Building,
  Flag,
  HardHat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  FileText,
  AlertCircle,
  Megaphone,
  Pin,
  ExternalLink,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { formatCurrencyINR, formatDate, formatPercentage } from '../../utils/formatters';
import {
  getProjectById,
  getProjectMilestones,
  getProjectUpdates,
  getProjectIssues,
  getProjectDocuments,
  getProjectPhotos,
} from '../../api/projectService';
import type {
  Project,
  ProjectMilestone,
  ProjectUpdate,
  ProjectIssue,
  ProjectDocument,
  ProjectPhoto,
} from '../../types/project';

export const CitizenProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'milestones' | 'updates' | 'issues' | 'documents'>('milestones');

  useEffect(() => {
    let isMounted = true;
    async function loadProjectDetails() {
      if (!projectId) return;
      try {
        const p = await getProjectById(projectId, false);
        if (!isMounted) return;
        setProject(p);
        if (p) {
          const [ms, upds, isss, docs, phs] = await Promise.all([
            getProjectMilestones(projectId),
            getProjectUpdates(projectId, false),
            getProjectIssues(projectId, false),
            getProjectDocuments(projectId, false),
            getProjectPhotos(projectId, false),
          ]);
          if (isMounted) {
            setMilestones(ms);
            setUpdates(upds);
            setIssues(isss);
            setDocuments(docs);
            setPhotos(phs);
          }
        }
      } catch {
        // error loading
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProjectDetails();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
        <p className="text-xs text-slate-500">Retrieving project transparency record...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Project Not Available</h2>
        <p className="text-xs text-slate-500">
          This project is either confidential, not published for public transparency yet, or does not exist.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/citizen/projects')}>
          Return to Public Projects
        </Button>
      </div>
    );
  }

  const isOverBudget = project.actualSpending > project.approvedBudget;

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return <Badge variant="success" size="md" dot>Completed</Badge>;
    if (s === 'ongoing') return <Badge variant="primary" size="md" dot>Ongoing</Badge>;
    if (s === 'delayed') return <Badge variant="danger" size="md" dot>Delayed</Badge>;
    if (s === 'at risk') return <Badge variant="warning" size="md" dot>At Risk</Badge>;
    return <Badge variant="neutral" size="md">Upcoming</Badge>;
  };

  const getMilestoneStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed') return <Badge variant="success" size="sm">Completed</Badge>;
    if (s === 'in progress') return <Badge variant="primary" size="sm">In Progress</Badge>;
    if (s === 'delayed') return <Badge variant="danger" size="sm">Delayed</Badge>;
    return <Badge variant="neutral" size="sm">Pending</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate('/dashboard/citizen/projects')}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Projects</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-200 bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-400/30">
              {project.projectNumber}
            </span>
            {getStatusBadge(project.status)}
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">{project.name}</h1>
          <p className="text-xs text-slate-300 mt-2 max-w-3xl leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-white/10 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            <span>{project.department}</span>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{project.location.ward || 'Municipal Ward'} &bull; {project.location.city}</span>
          </span>
          {project.contractorName && (
            <>
              <span>&bull;</span>
              <span className="flex items-center gap-1.5">
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <span>Contractor: {project.contractorName}</span>
              </span>
            </>
          )}
          {project.location?.latitude && project.location?.longitude && (
            <>
              <span>&bull;</span>
              <button
                onClick={() =>
                  navigate(
                    `/dashboard/citizen/map?focusLat=${project.location.latitude}&focusLng=${project.location.longitude}`
                  )
                }
                className="flex items-center gap-1.5 text-sky-300 hover:text-white transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>View on GIS Map</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Key Financial & Schedule Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Approved Budget</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              {formatCurrencyINR(project.approvedBudget)}
            </p>
            <p className="text-[10px] text-slate-500">Sanctioned allocation</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Actual Spending</span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-1">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              {formatCurrencyINR(project.actualSpending)}
            </p>
            <p className="text-[10px] text-slate-500">Audited expenditure</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Budget Deviation</span>
            <p
              className={`text-lg sm:text-xl font-bold flex items-center gap-1 ${
                isOverBudget ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {isOverBudget ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {formatPercentage(project.budgetDeviation)}
            </p>
            <p className="text-[10px] text-slate-500">Variance from budget</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Risk Score</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {project.riskLabel === 'Normal' ? (
                <Badge variant="success" size="md">Normal (0-1/4)</Badge>
              ) : project.riskLabel === 'Attention' ? (
                <Badge variant="warning" size="md">Attention ({project.riskScore}/4)</Badge>
              ) : (
                <Badge variant="danger" size="md">High Attention ({project.riskScore}/4)</Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-500">Algorithmic risk evaluation</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress & Timeline Bar */}
      <Card className="border-slate-200/80">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Overall Milestone Execution</h3>
              <p className="text-xs text-slate-500">
                {milestones.filter((m) => m.status.toLowerCase() === 'completed').length} of{' '}
                {milestones.length} major deliverables completed
              </p>
            </div>
            <span className="text-lg font-bold text-emerald-700">{project.progress}% Complete</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100">
            <div>
              <span className="text-slate-500">Sanction / Start Date:</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(project.startDate)}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Target Completion:</span>
              <p className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(project.plannedCompletionDate)}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Timeline Variance:</span>
              <p
                className={`font-semibold mt-0.5 flex items-center gap-1 ${
                  project.delayDays > 0 ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {project.delayDays > 0 ? `${project.delayDays} days delay` : 'On Schedule'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'bg-white border border-b-0 border-slate-200 text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Milestones Timeline ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'updates'
              ? 'bg-white border border-b-0 border-slate-200 text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Official Public Updates ({updates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'bg-white border border-b-0 border-slate-200 text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Reported Challenges ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-white border border-b-0 border-slate-200 text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Public Documents &amp; Photos ({documents.length + photos.length})</span>
        </button>
      </div>

      {/* Tab 1: Milestones Timeline */}
      {activeTab === 'milestones' && (
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>Milestone Execution Schedule</CardTitle>
              <CardDescription>
                Audited schedule phases agreed upon between Municipal Corporation and Contractor.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No individual milestones recorded yet for this project.
              </p>
            ) : (
              <div className="relative border-l-2 border-emerald-200 ml-4 pl-6 space-y-6">
                {milestones.map((ms, index) => {
                  const isDone = ms.status.toLowerCase() === 'completed';
                  return (
                    <div key={ms.id} className="relative group">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                          isDone
                            ? 'bg-emerald-600 ring-2 ring-emerald-200'
                            : ms.status.toLowerCase() === 'in progress'
                            ? 'bg-blue-600 ring-2 ring-blue-200'
                            : ms.status.toLowerCase() === 'delayed'
                            ? 'bg-amber-600 ring-2 ring-amber-200'
                            : 'bg-slate-300'
                        }`}
                      />

                      <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-200 transition-all space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">
                              Phase {index + 1}:
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">{ms.title}</h4>
                          </div>
                          {getMilestoneStatusBadge(ms.status)}
                        </div>

                        <p className="text-xs text-slate-600">{ms.description}</p>

                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                            <span>Phase Progress</span>
                            <span>{ms.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDone
                                  ? 'bg-emerald-500'
                                  : ms.status.toLowerCase() === 'delayed'
                                  ? 'bg-amber-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${ms.progressPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            Target: {formatDate(ms.targetDate)}
                          </span>
                          {ms.actualDate && (
                            <span className="text-emerald-700 font-medium">
                              Delivered on: {formatDate(ms.actualDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Public Updates */}
      {activeTab === 'updates' && (
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>Official Public Dispatches</CardTitle>
              <CardDescription>
                Verified project dispatches issued by the municipal engineering department.
              </CardDescription>
            </div>
            <Badge variant="success" size="sm">Public View</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {updates.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No public dispatches published yet for this project.
              </p>
            ) : (
              updates.map((upd) => (
                <div
                  key={upd.id}
                  className={`p-4 rounded-xl border transition-all ${
                    upd.pinned
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      {upd.pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <Pin className="w-3 h-3" /> Pinned Bulletin
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-900">{upd.title}</h4>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatDate(upd.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {upd.content}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <Building className="w-3 h-3 text-slate-400" />
                    <span>Posted by {upd.authorName} &bull; {upd.authorRole}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Issues & Blockers */}
      {activeTab === 'issues' && (
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>Identified Project Challenges &amp; Mitigations</CardTitle>
              <CardDescription>
                Transparent record of ground-level obstacles encountered during execution.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {issues.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Zero Unresolved Obstacles</p>
                <p className="text-xs text-slate-500">
                  Currently no active blockers reported on this municipal worksite.
                </p>
              </div>
            ) : (
              issues.map((iss) => (
                <div
                  key={iss.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            iss.severity.toLowerCase() === 'critical'
                              ? 'danger'
                              : iss.severity.toLowerCase() === 'high'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {iss.severity} Severity
                        </Badge>
                        <h4 className="text-xs font-bold text-slate-900">{iss.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Logged on {formatDate(iss.createdAt)} by {iss.reportedByName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        iss.status.toLowerCase() === 'resolved' || iss.status.toLowerCase() === 'closed'
                          ? 'success'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {iss.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{iss.description}</p>

                  {iss.resolutionNotes && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-[11px] text-emerald-900 border border-emerald-200/60">
                      <span className="font-bold">Resolution Note:</span> {iss.resolutionNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Public Documents & Photos */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Documents */}
          <Card className="border-slate-200/80">
            <CardHeader>
              <div>
                <CardTitle>Sanctioned Documents &amp; Certificates</CardTitle>
                <CardDescription>
                  Verified public Detailed Project Reports (DPR) and clearance certificates.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No public documents uploaded for this project yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{doc.fileName}</p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 p-2 rounded-lg hover:bg-emerald-50 shrink-0"
                        title="View Document"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card className="border-slate-200/80">
            <CardHeader>
              <div>
                <CardTitle>Verified Site Progress Photographs</CardTitle>
                <CardDescription>
                  Visual proof of project ground execution tagged with construction phase.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  No public progress photos posted yet for this worksite.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs group"
                    >
                      <div className="relative aspect-video overflow-hidden bg-slate-100">
                        <img
                          src={photo.photoUrl}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {photo.phase && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-bold text-white">
                            {photo.phase} Phase
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                          {photo.caption}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Uploaded {formatDate(photo.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Citizen Feedback & Complaint Action Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-600" />
            Citizen Oversight &amp; Grievance Redressal
          </h3>
          <p className="text-xs text-slate-600 max-w-xl">
            Notice a defect, prolonged construction barricade, or safety issue on this project? File a formal civic complaint linked to this project number.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 text-white shrink-0"
          onClick={() => navigate('/dashboard/citizen/complaints/new')}
        >
          Report Project Issue &rarr;
        </Button>
      </div>
    </div>
  );
};

export default CitizenProjectDetailPage;
