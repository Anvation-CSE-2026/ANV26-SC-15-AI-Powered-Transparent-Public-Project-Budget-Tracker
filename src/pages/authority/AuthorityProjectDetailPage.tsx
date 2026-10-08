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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertCircle,
  Megaphone,
  Pin,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  History,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrencyINR, formatDate, formatPercentage } from '../../utils/formatters';
import {
  getProjectById,
  updateProject,
  getProjectMilestones,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  getProjectUpdates,
  addProjectUpdate,
  getProjectIssues,
  addProjectIssue,
  updateProjectIssue,
  getProjectDocuments,
  addProjectDocument,
  getProjectPhotos,
  addProjectPhoto,
  getProjectActivities,
} from '../../api/projectService';
import type {
  Project,
  ProjectMilestone,
  ProjectUpdate,
  ProjectIssue,
  ProjectDocument,
  ProjectPhoto,
  ProjectActivity,
  ProjectStatus,
  MilestoneStatus,
  IssueSeverity,
  IssueStatus,
  UpdateVisibility,
} from '../../types/project';

export const AuthorityProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    'milestones' | 'updates' | 'issues' | 'documents' | 'activity'
  >('milestones');

  // Milestone Form Modal/State
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDescription, setMsDescription] = useState('');
  const [msTargetDate, setMsTargetDate] = useState('');
  const [msWeight, setMsWeight] = useState('20');

  // Update Form State
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [updTitle, setUpdTitle] = useState('');
  const [updContent, setUpdContent] = useState('');
  const [updVisibility, setUpdVisibility] = useState<UpdateVisibility>('Public');
  const [updPinned, setUpdPinned] = useState(false);

  // Issue Form State
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [issTitle, setIssTitle] = useState('');
  const [issDescription, setIssDescription] = useState('');
  const [issSeverity, setIssSeverity] = useState<IssueSeverity>('Medium');

  // Document & Photo Form State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('#');
  const [docIsPublic, setDocIsPublic] = useState(true);

  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPhase, setPhotoPhase] = useState<'Before' | 'In Progress' | 'After'>('In Progress');
  const [photoIsPublic, setPhotoIsPublic] = useState(true);

  // Status Change Quick Action
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = React.useCallback(async () => {
    if (!projectId) return;
    try {
      const p = await getProjectById(projectId, true);
      setProject(p);
      if (p) {
        const [ms, upds, isss, docs, phs, acts] = await Promise.all([
          getProjectMilestones(projectId),
          getProjectUpdates(projectId, true),
          getProjectIssues(projectId, true),
          getProjectDocuments(projectId, true),
          getProjectPhotos(projectId, true),
          getProjectActivities(projectId),
        ]);
        setMilestones(ms);
        setUpdates(upds);
        setIssues(isss);
        setDocuments(docs);
        setPhotos(phs);
        setActivities(acts);
      }
    } catch {
      // error handling
    }
  }, [projectId]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (!projectId) return;
      try {
        const p = await getProjectById(projectId, true);
        if (!isMounted) return;
        setProject(p);
        if (p) {
          const [ms, upds, isss, docs, phs, acts] = await Promise.all([
            getProjectMilestones(projectId),
            getProjectUpdates(projectId, true),
            getProjectIssues(projectId, true),
            getProjectDocuments(projectId, true),
            getProjectPhotos(projectId, true),
            getProjectActivities(projectId),
          ]);
          if (isMounted) {
            setMilestones(ms);
            setUpdates(upds);
            setIssues(isss);
            setDocuments(docs);
            setPhotos(phs);
            setActivities(acts);
          }
        }
      } catch {
        // error handling
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Handle Milestone Add
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim() || !projectId || !userProfile) return;

    try {
      await addMilestone(
        projectId,
        {
          title: msTitle.trim(),
          description: msDescription.trim(),
          targetDate: msTargetDate || new Date().toISOString().split('T')[0],
          weight: Number(msWeight) || 20,
          order: milestones.length + 1,
          status: 'Pending',
          progressPercentage: 0,
        },
        userProfile
      );
      setMsTitle('');
      setMsDescription('');
      setShowAddMilestone(false);
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Milestone Progress/Status Edit
  const handleUpdateMilestoneStatus = async (
    milestoneId: string,
    newStatus: MilestoneStatus,
    newProgress: number
  ) => {
    if (!projectId || !userProfile) return;
    try {
      await updateMilestone(
        projectId,
        milestoneId,
        {
          status: newStatus,
          progressPercentage: newProgress,
          actualDate: newStatus.toLowerCase() === 'completed' ? new Date().toISOString().split('T')[0] : undefined,
        },
        userProfile
      );
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Milestone Delete
  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!projectId || !userProfile) return;
    if (!window.confirm('Are you sure you want to remove this milestone?')) return;
    try {
      await deleteMilestone(projectId, milestoneId, userProfile);
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Project Update Post
  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updTitle.trim() || !updContent.trim() || !projectId || !userProfile) return;

    try {
      await addProjectUpdate(
        projectId,
        {
          title: updTitle.trim(),
          content: updContent.trim(),
          visibility: updVisibility,
          pinned: updPinned,
        },
        userProfile
      );
      setUpdTitle('');
      setUpdContent('');
      setShowAddUpdate(false);
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Issue Add
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issTitle.trim() || !projectId || !userProfile) return;

    try {
      await addProjectIssue(
        projectId,
        {
          title: issTitle.trim(),
          description: issDescription.trim(),
          severity: issSeverity,
          assignedTo: project?.contractorId,
          assignedToName: project?.contractorName,
        },
        userProfile
      );
      setIssTitle('');
      setIssDescription('');
      setShowAddIssue(false);
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Issue Status Update
  const handleUpdateIssueStatus = async (
    issueId: string,
    newStatus: IssueStatus,
    notes?: string
  ) => {
    if (!projectId || !userProfile) return;
    try {
      await updateProjectIssue(
        projectId,
        issueId,
        { status: newStatus, resolutionNotes: notes },
        userProfile
      );
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Doc Add
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !projectId || !userProfile) return;

    try {
      await addProjectDocument(
        projectId,
        {
          title: docTitle.trim(),
          fileName: docFileName.trim() || `${docTitle.trim()}.pdf`,
          fileUrl: docFileUrl.trim() || '#',
          fileType: 'application/pdf',
          fileSize: 2450000,
          uploadedBy: userProfile.uid,
          uploadedByName: userProfile.displayName || userProfile.username,
          isPublic: docIsPublic,
        },
        userProfile
      );
      setDocTitle('');
      setDocFileName('');
      setShowAddDoc(false);
      await loadData();
    } catch {
      // ignore
    }
  };

  // Handle Photo Add
  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoCaption.trim() || !photoUrl.trim() || !projectId || !userProfile) return;

    try {
      await addProjectPhoto(
        projectId,
        {
          caption: photoCaption.trim(),
          photoUrl: photoUrl.trim(),
          phase: photoPhase,
          uploadedBy: userProfile.uid,
          uploadedByName: userProfile.displayName || userProfile.username,
          isPublic: photoIsPublic,
        },
        userProfile
      );
      setPhotoCaption('');
      setPhotoUrl('');
      setShowAddPhoto(false);
      await loadData();
    } catch {
      // ignore
    }
  };

  // Quick Project Status change
  const handleChangeProjectStatus = async (newStatus: ProjectStatus) => {
    if (!projectId || !userProfile) return;
    try {
      setUpdatingStatus(true);
      await updateProject(projectId, { status: newStatus }, userProfile);
      await loadData();
    } catch {
      // ignore
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Quick Visibility toggle
  const handleToggleVisibility = async () => {
    if (!projectId || !userProfile || !project) return;
    try {
      await updateProject(projectId, { isPublic: !project.isPublic }, userProfile);
      await loadData();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading authority project command center...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4 max-w-xl mx-auto py-12 text-center">
        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Project Record Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested municipal project identifier could not be located in records.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/project-manager/projects')}>
          Return to Projects Portfolio
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => navigate('/dashboard/project-manager/projects')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Projects Management</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold text-blue-200 bg-blue-900/60 px-2.5 py-1 rounded-md border border-blue-400/30">
              {project.projectNumber}
            </span>
            {getStatusBadge(project.status)}
            <button
              onClick={handleToggleVisibility}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              title="Click to toggle citizen visibility"
            >
              {project.isPublic ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-300" />
                  <span>Internal Draft</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">{project.name}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Status Select */}
            <select
              value={project.status}
              disabled={updatingStatus}
              onChange={(e) => handleChangeProjectStatus(e.target.value as ProjectStatus)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white/10 border border-white/20 text-white focus:outline-hidden focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              <option value="Upcoming" className="text-slate-900">Upcoming</option>
              <option value="Ongoing" className="text-slate-900">Ongoing</option>
              <option value="Delayed" className="text-slate-900">Delayed</option>
              <option value="At Risk" className="text-slate-900">At Risk</option>
              <option value="Completed" className="text-slate-900">Completed</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}/edit`)}
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Edit Project Details
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-white/10 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>{project.department}</span>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-blue-400" />
            <span>{project.location.ward || 'Central'} &bull; {project.location.address}</span>
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
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Approved Budget</span>
            <p className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              {formatCurrencyINR(project.approvedBudget)}
            </p>
            <p className="text-[10px] text-slate-400">Sanctioned limit</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Actual Spent</span>
            <p className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
              {formatCurrencyINR(project.actualSpending)}
            </p>
            <p className="text-[10px] text-slate-400">Audited contractor claims</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Budget Deviation</span>
            <p
              className={`text-base sm:text-lg font-bold flex items-center gap-0.5 ${
                isOverBudget ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {isOverBudget ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {formatPercentage(project.budgetDeviation)}
            </p>
            <p className="text-[10px] text-slate-400">Neutral variance</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Progress</span>
            <p className="text-base sm:text-lg font-bold text-blue-600">{project.progress}%</p>
            <p className="text-[10px] text-slate-400">
              {milestones.filter((m) => m.status.toLowerCase() === 'completed').length}/{milestones.length} milestones
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Risk Indicator</span>
            <div className="pt-0.5">
              {project.riskLabel === 'Normal' ? (
                <Badge variant="success" size="sm">Normal (0-1/4)</Badge>
              ) : project.riskLabel === 'Attention' ? (
                <Badge variant="warning" size="sm">Attention ({project.riskScore}/4)</Badge>
              ) : (
                <Badge variant="danger" size="sm">High Attention ({project.riskScore}/4)</Badge>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Automated assessment</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'milestones'
              ? 'bg-white border border-b-0 border-slate-200 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Milestones ({milestones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('updates')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'updates'
              ? 'bg-white border border-b-0 border-slate-200 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Updates &amp; Notes ({updates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'bg-white border border-b-0 border-slate-200 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Issues Tracker ({issues.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-white border border-b-0 border-slate-200 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documents &amp; Photos ({documents.length + photos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'activity'
              ? 'bg-white border border-b-0 border-slate-200 text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Activity Log ({activities.length})</span>
        </button>
      </div>

      {/* Tab 1: Milestones */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Project Execution Milestones</h3>
              <p className="text-xs text-slate-500">
                Track completion percentages, update physical delivery status, and reorder stages.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddMilestone(!showAddMilestone)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 text-xs"
            >
              {showAddMilestone ? 'Close Form' : 'Add Milestone'}
            </Button>
          </div>

          {/* Add Milestone Form */}
          {showAddMilestone && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardContent className="p-4">
                <form onSubmit={handleCreateMilestone} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Add New Milestone Deliverable</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Milestone Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Concrete Base Pouring"
                        value={msTitle}
                        onChange={(e) => setMsTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={msTargetDate}
                        onChange={(e) => setMsTargetDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Weight / Share (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={msWeight}
                        onChange={(e) => setMsWeight(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Technical Description
                    </label>
                    <input
                      type="text"
                      placeholder="Specifications, volume, or testing criteria..."
                      value={msDescription}
                      onChange={(e) => setMsDescription(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddMilestone(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="bg-blue-600 text-xs">
                      Save Milestone
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Milestone List */}
          <div className="space-y-3">
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No milestones added yet. Add key deliverables to monitor progress.
              </p>
            ) : (
              milestones.map((ms, idx) => (
                <Card key={ms.id} className="border-slate-200">
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                        <h4 className="text-sm font-bold text-slate-900">{ms.title}</h4>
                        <Badge
                          variant={
                            ms.status.toLowerCase() === 'completed'
                              ? 'success'
                              : ms.status.toLowerCase() === 'in progress'
                              ? 'primary'
                              : ms.status.toLowerCase() === 'delayed'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {ms.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{ms.description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Target: {formatDate(ms.targetDate)}
                        </span>
                        {ms.actualDate && (
                          <span className="text-emerald-700 font-medium">
                            Completed: {formatDate(ms.actualDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Control and Status Changer */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="w-32 space-y-1 text-right">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Progress:</span>
                          <span className="font-bold text-slate-800">{ms.progressPercentage}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={ms.progressPercentage}
                          onChange={(e) =>
                            handleUpdateMilestoneStatus(
                              ms.id,
                              Number(e.target.value) === 100
                                ? 'Completed'
                                : Number(e.target.value) > 0
                                ? 'In Progress'
                                : 'Pending',
                              Number(e.target.value)
                            )
                          }
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>

                      <select
                        value={ms.status}
                        onChange={(e) =>
                          handleUpdateMilestoneStatus(
                            ms.id,
                            e.target.value as MilestoneStatus,
                            e.target.value.toLowerCase() === 'completed' ? 100 : ms.progressPercentage
                          )
                        }
                        className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Completed">Completed</option>
                      </select>

                      <button
                        onClick={() => handleDeleteMilestone(ms.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Updates & Notes */}
      {activeTab === 'updates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Project Updates &amp; Notes</h3>
              <p className="text-xs text-slate-500">
                Post public dispatches to citizens or log confidential internal staff notes.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddUpdate(!showAddUpdate)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 text-xs"
            >
              {showAddUpdate ? 'Close Form' : 'Post Update / Note'}
            </Button>
          </div>

          {/* Add Update Form */}
          {showAddUpdate && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardContent className="p-4">
                <form onSubmit={handleCreateUpdate} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Post Project Update or Memo</h4>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bulletin Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Foundation testing passed; asphalt paving commences next week"
                      value={updTitle}
                      onChange={(e) => setUpdTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Content / Engineering Note *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe the milestone update, technical details, or internal memos..."
                      value={updContent}
                      onChange={(e) => setUpdContent(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-4">
                      {/* Visibility Selector */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-slate-700">Visibility:</label>
                        <select
                          value={updVisibility}
                          onChange={(e) => setUpdVisibility(e.target.value as UpdateVisibility)}
                          className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                        >
                          <option value="Public">Public (Visible to Citizens)</option>
                          <option value="Internal">Internal (Authority Only)</option>
                        </select>
                      </div>

                      {/* Pinned Checkbox */}
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={updPinned}
                          onChange={(e) => setUpdPinned(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Pin to top</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddUpdate(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm" className="bg-blue-600 text-xs">
                        Publish Update
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* List Updates */}
          <div className="space-y-3">
            {updates.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No project updates or memos recorded yet.
              </p>
            ) : (
              updates.map((upd) => (
                <Card
                  key={upd.id}
                  className={`border transition-all ${
                    upd.visibility === 'Internal'
                      ? 'border-amber-200 bg-amber-50/20'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {upd.visibility === 'Internal' ? (
                          <Badge variant="warning" size="sm" className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Internal Memo (Hidden from Citizens)
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Public Dispatch
                          </Badge>
                        )}
                        {upd.pinned && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Pin className="w-3 h-3" /> Pinned
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

                    <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      Authored by {upd.authorName} &bull; {upd.authorRole}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Issues Tracker */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Project Issues &amp; Roadblocks</h3>
              <p className="text-xs text-slate-500">
                Log and assign critical bottlenecks to contractors with resolution verification.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddIssue(!showAddIssue)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-blue-600 hover:bg-blue-500 text-xs"
            >
              {showAddIssue ? 'Close Form' : 'Log Issue'}
            </Button>
          </div>

          {/* Add Issue Form */}
          {showAddIssue && (
            <Card className="border-blue-200 bg-blue-50/20">
              <CardContent className="p-4">
                <form onSubmit={handleCreateIssue} className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900">Log New Site Issue</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Issue Title *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Utility water pipe snag at ch 2+400"
                        value={issTitle}
                        onChange={(e) => setIssTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Severity *
                      </label>
                      <select
                        value={issSeverity}
                        onChange={(e) => setIssSeverity(e.target.value as IssueSeverity)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Problem Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Details of the obstruction and impact on schedule..."
                      value={issDescription}
                      onChange={(e) => setIssDescription(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddIssue(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="bg-blue-600 text-xs">
                      Submit Issue
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* List Issues */}
          <div className="space-y-3">
            {issues.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Zero active issues reported for this project.
              </p>
            ) : (
              issues.map((iss) => (
                <Card key={iss.id} className="border-slate-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
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
                        <h4 className="text-sm font-bold text-slate-900">{iss.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={iss.status}
                          onChange={(e) =>
                            handleUpdateIssueStatus(iss.id, e.target.value as IssueStatus)
                          }
                          className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{iss.description}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>Reported by {iss.reportedByName} on {formatDate(iss.createdAt)}</span>
                      {iss.assignedToName && <span>Assigned: {iss.assignedToName}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Documents & Photos */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Documents Header & List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Project Documents &amp; Sanctions</h3>
                <p className="text-xs text-slate-500">
                  Upload DPRs, clearances, and quality inspection audits.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDoc(!showAddDoc)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {showAddDoc ? 'Close' : 'Add Document'}
              </Button>
            </div>

            {showAddDoc && (
              <Card className="border-blue-200 bg-blue-50/20">
                <CardContent className="p-4">
                  <form onSubmit={handleCreateDocument} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Upload Project Document Metadata</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Document Title *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sanctioned DPR and Rate Schedule"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          File Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. DPR_Sanctioned_2026.pdf"
                          value={docFileName}
                          onChange={(e) => setDocFileName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        File / Resource URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://... or #"
                        value={docFileUrl}
                        onChange={(e) => setDocFileUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={docIsPublic}
                          onChange={(e) => setDocIsPublic(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Visible to citizens</span>
                      </label>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddDoc(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" className="bg-blue-600 text-xs">
                          Attach Document
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{d.title}</p>
                      <p className="text-[11px] text-slate-500 truncate">{d.fileName}</p>
                      <span className="text-[10px] text-slate-400">
                        {d.isPublic ? 'Public' : 'Confidential'} &bull; Uploaded {formatDate(d.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photos Header & List */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Verified Site Photographs</h3>
                <p className="text-xs text-slate-500">
                  Visual evidence tagged by phase (Before, In Progress, After).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                {showAddPhoto ? 'Close' : 'Add Photo'}
              </Button>
            </div>

            {showAddPhoto && (
              <Card className="border-blue-200 bg-blue-50/20">
                <CardContent className="p-4">
                  <form onSubmit={handleCreatePhoto} className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900">Upload Site Photograph</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Caption *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Paver laying bituminous layer"
                          value={photoCaption}
                          onChange={(e) => setPhotoCaption(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Photo URL *
                        </label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Construction Phase
                        </label>
                        <select
                          value={photoPhase}
                          onChange={(e) =>
                            setPhotoPhase(e.target.value as 'Before' | 'In Progress' | 'After')
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="Before">Before</option>
                          <option value="In Progress">In Progress</option>
                          <option value="After">After</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={photoIsPublic}
                            onChange={(e) => setPhotoIsPublic(e.target.checked)}
                            className="rounded text-blue-600"
                          />
                          <span>Visible to citizens</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddPhoto(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" size="sm" className="bg-blue-600 text-xs">
                        Save Photo
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 overflow-hidden bg-white group"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={p.photoUrl}
                      alt={p.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.phase && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-bold text-white">
                        {p.phase}
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{p.caption}</p>
                    <p className="text-[10px] text-slate-400">
                      {p.isPublic ? 'Public' : 'Internal'} &bull; {formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Activity Log */}
      {activeTab === 'activity' && (
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>Immutable Project Audit Trail</CardTitle>
              <CardDescription>
                Chronological record of all updates, milestone changes, and budget events.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No activity logs recorded yet for this project.
              </p>
            ) : (
              <div className="relative border-l-2 border-blue-200 ml-4 pl-6 space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white" />
                    <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">{act.action}</span>
                        <span className="text-slate-400 text-[11px]">
                          {formatDate(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{act.description}</p>
                      <p className="text-[10px] text-slate-400">
                        Actor: {act.actorName} ({act.actorRole})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuthorityProjectDetailPage;
