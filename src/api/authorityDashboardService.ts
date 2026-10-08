import { getAllComplaints } from './complaintService';
import { getProjects, getProjectUpdates, getProjectActivities } from './projectService';
import { getAllSuggestions } from './suggestionService';
import { getAllPollsForAuthority } from './pollService';
import type { Complaint } from '../types/complaint';
import type { Project, ProjectUpdate, ProjectActivity } from '../types/project';
import type { Poll } from '../types/poll';

export interface AuthorityDashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  delayedProjects: number;
  atRiskProjects: number;
  completedProjects: number;
  totalComplaints: number;
  pendingComplaints: number;
  emergencyComplaints: number;
  overdueComplaints: number;
  activePolls: number;
  pendingSuggestions: number;
  totalSanctionedBudget: number; // in Crores INR
  totalActualSpending: number; // in Crores INR
}

export type AttentionType =
  | 'emergency_complaint'
  | 'overdue_complaint'
  | 'delayed_project'
  | 'at_risk_project'
  | 'pending_suggestion'
  | 'closing_poll';

export interface AttentionItem {
  id: string;
  type: AttentionType;
  title: string;
  identifier: string;
  severity: 'emergency' | 'critical' | 'high' | 'warning' | 'info';
  description: string;
  timestamp: string;
  overdueDuration?: string;
  actionLabel: string;
  actionUrl: string;
}

export interface StatusDistributionItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface RecentDashboardActivity {
  id: string;
  category: 'project' | 'complaint' | 'suggestion' | 'poll';
  action: string;
  title: string;
  actor: string;
  timestamp: string;
  link: string;
}

export interface AuthorityDashboardData {
  metrics: AuthorityDashboardMetrics;
  attentionItems: AttentionItem[];
  emergencyComplaints: Complaint[];
  overdueComplaints: Complaint[];
  complaintStatusBreakdown: StatusDistributionItem[];
  projectStatusBreakdown: StatusDistributionItem[];
  activeProjectsList: Project[];
  delayedProjectsList: Project[];
  atRiskProjectsList: Project[];
  suggestionsSummary: {
    total: number;
    pending: number;
    accepted: number;
    inProgress: number;
    implemented: number;
    rejected: number;
  };
  pollsSummary: {
    total: number;
    active: number;
    scheduled: number;
    draft: number;
    closed: number;
    activePolls: Poll[];
  };
  recentActivities: RecentDashboardActivity[];
  recentProjectUpdates: ProjectUpdate[];
}

/**
 * Calculates human-readable overdue duration from an ISO deadline string
 */
export function calculateOverdueDuration(deadlineStr: string, now: Date = new Date()): string {
  const deadline = new Date(deadlineStr);
  const diffMs = now.getTime() - deadline.getTime();
  if (diffMs <= 0) return 'Due soon';

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${Math.max(1, diffHours)}h overdue`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d overdue`;
}

/**
 * Checks if a complaint is currently overdue against its SLA deadline
 */
export function isComplaintOverdue(complaint: Complaint, now: Date = new Date()): boolean {
  const isResolvedOrClosed =
    complaint.status === 'resolved' ||
    complaint.status === 'closed' ||
    complaint.status === 'rejected';

  if (isResolvedOrClosed) return false;

  // Direct status check from Phase 4 SLA calculator
  if (complaint.sla?.status === 'breached') return true;

  // Fallback date comparison
  if (complaint.sla?.deadline) {
    const deadline = new Date(complaint.sla.deadline);
    return !isNaN(deadline.getTime()) && now.getTime() > deadline.getTime();
  }

  return false;
}

/**
 * Aggregates all live data from existing modules for the Project Manager Dashboard
 */
export async function getAuthorityDashboardData(
  departmentFilter?: string
): Promise<AuthorityDashboardData> {
  const now = new Date();

  // Fetch all domain datasets in parallel
  const [complaints, projects, suggestions, polls] = await Promise.all([
    getAllComplaints(),
    getProjects({ isAuthority: true }),
    getAllSuggestions(),
    getAllPollsForAuthority(),
  ]);

  // Apply optional department filter
  const isAllDepts = !departmentFilter || departmentFilter === 'all';
  const filteredComplaints = isAllDepts
    ? complaints
    : complaints.filter(
        (c) =>
          c.departmentId === departmentFilter ||
          c.departmentName?.toLowerCase() === departmentFilter.toLowerCase()
      );

  const filteredProjects = isAllDepts
    ? projects
    : projects.filter(
        (p) =>
          p.departmentId === departmentFilter ||
          p.department?.toLowerCase() === departmentFilter.toLowerCase()
      );

  // 1. Complaint Metrics & Categorization
  const totalComplaints = filteredComplaints.length;
  const pendingComplaints = filteredComplaints.filter(
    (c) =>
      c.status === 'submitted' ||
      c.status === 'under_review' ||
      c.status === 'assigned' ||
      c.status === 'in_progress' ||
      c.status === 'awaiting_info' ||
      c.status === 'escalated'
  ).length;

  const emergencyComplaints = filteredComplaints.filter(
    (c) =>
      c.priority?.toLowerCase() === 'emergency' &&
      c.status !== 'resolved' &&
      c.status !== 'closed' &&
      c.status !== 'rejected'
  );

  const overdueComplaints = filteredComplaints.filter((c) => isComplaintOverdue(c, now));

  // Complaint Status Breakdown
  const statusCounts: Record<string, number> = {};
  filteredComplaints.forEach((c) => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
  });

  const complaintStatusBreakdown: StatusDistributionItem[] = [
    { status: 'submitted', label: 'Submitted', count: statusCounts['submitted'] || 0, color: '#3B82F6' },
    { status: 'under_review', label: 'Under Review', count: statusCounts['under_review'] || 0, color: '#8B5CF6' },
    { status: 'assigned', label: 'Assigned', count: statusCounts['assigned'] || 0, color: '#06B6D4' },
    { status: 'in_progress', label: 'In Progress', count: statusCounts['in_progress'] || 0, color: '#F59E0B' },
    { status: 'resolved', label: 'Resolved', count: statusCounts['resolved'] || 0, color: '#10B981' },
    { status: 'closed', label: 'Closed', count: statusCounts['closed'] || 0, color: '#64748B' },
  ];

  // 2. Project Metrics & Categorization
  const totalProjects = filteredProjects.length;
  const activeProjectsList = filteredProjects.filter((p) => p.status.toLowerCase() === 'ongoing');
  const delayedProjectsList = filteredProjects.filter((p) => p.status.toLowerCase() === 'delayed');
  const atRiskProjectsList = filteredProjects.filter((p) => p.status.toLowerCase() === 'at risk');
  const completedProjects = filteredProjects.filter((p) => p.status.toLowerCase() === 'completed').length;

  const totalSanctionedBudget = filteredProjects.reduce((sum, p) => sum + (p.approvedBudget || 0), 0);
  const totalActualSpending = filteredProjects.reduce((sum, p) => sum + (p.actualSpending || 0), 0);

  const projectStatusCounts: Record<string, number> = {};
  filteredProjects.forEach((p) => {
    const st = p.status.toLowerCase();
    projectStatusCounts[st] = (projectStatusCounts[st] || 0) + 1;
  });

  const projectStatusBreakdown: StatusDistributionItem[] = [
    { status: 'ongoing', label: 'Ongoing', count: projectStatusCounts['ongoing'] || 0, color: '#2563EB' },
    { status: 'upcoming', label: 'Upcoming', count: projectStatusCounts['upcoming'] || 0, color: '#64748B' },
    { status: 'delayed', label: 'Delayed', count: projectStatusCounts['delayed'] || 0, color: '#D97706' },
    { status: 'at risk', label: 'At Risk', count: projectStatusCounts['at risk'] || 0, color: '#DC2626' },
    { status: 'completed', label: 'Completed', count: projectStatusCounts['completed'] || 0, color: '#059669' },
  ];

  // 3. Suggestions Summary (Phase 5)
  const pendingSuggestions = suggestions.filter(
    (s) => s.status === 'submitted' || s.status === 'under_review'
  );
  const suggestionsSummary = {
    total: suggestions.length,
    pending: pendingSuggestions.length,
    accepted: suggestions.filter((s) => s.status === 'accepted').length,
    inProgress: suggestions.filter((s) => s.status === 'in_progress').length,
    implemented: suggestions.filter((s) => s.status === 'implemented').length,
    rejected: suggestions.filter((s) => s.status === 'rejected').length,
  };

  // 4. Polls Summary (Phase 5)
  const activePollsList = polls.filter((p) => p.status === 'active');
  const pollsSummary = {
    total: polls.length,
    active: activePollsList.length,
    scheduled: polls.filter((p) => p.status === 'scheduled').length,
    draft: polls.filter((p) => p.status === 'draft').length,
    closed: polls.filter((p) => p.status === 'closed').length,
    activePolls: activePollsList,
  };

  // 5. Aggregate "Requires Attention" Action Center Items
  const attentionItems: AttentionItem[] = [];

  // A. Emergency Complaints
  emergencyComplaints.forEach((c) => {
    attentionItems.push({
      id: `att-cmp-emg-${c.id}`,
      type: 'emergency_complaint',
      title: c.title,
      identifier: c.complaintNumber,
      severity: 'emergency',
      description: `Critical emergency grievance reported in ${c.location.ward || 'ward'}. Requires immediate municipal dispatch.`,
      timestamp: c.createdAt,
      actionLabel: 'Dispatch Complaint',
      actionUrl: `/dashboard/project-manager/complaints/${c.id}`,
    });
  });

  // B. Overdue Complaints
  overdueComplaints.forEach((c) => {
    // Avoid duplicate if already in emergency
    if (!attentionItems.some((item) => item.id === `att-cmp-emg-${c.id}`)) {
      const overdueDuration = c.sla?.deadline ? calculateOverdueDuration(c.sla.deadline, now) : undefined;
      attentionItems.push({
        id: `att-cmp-ovd-${c.id}`,
        type: 'overdue_complaint',
        title: c.title,
        identifier: c.complaintNumber,
        severity: 'critical',
        description: `SLA resolution deadline breached. Assigned to ${c.departmentName || 'unassigned'}.`,
        timestamp: c.createdAt,
        overdueDuration,
        actionLabel: 'Review SLA Breach',
        actionUrl: `/dashboard/project-manager/complaints/${c.id}`,
      });
    }
  });

  // C. Delayed Projects
  delayedProjectsList.forEach((p) => {
    attentionItems.push({
      id: `att-prj-del-${p.id}`,
      type: 'delayed_project',
      title: p.name,
      identifier: p.projectNumber,
      severity: 'warning',
      description: `Worksite timeline delayed by ${p.delayDays || 'multiple'} days past targeted stage-gate delivery.`,
      timestamp: p.updatedAt || p.createdAt,
      actionLabel: 'Review Milestones',
      actionUrl: `/dashboard/project-manager/projects/${p.id}`,
    });
  });

  // D. At-Risk Projects
  atRiskProjectsList.forEach((p) => {
    // If not already added as delayed
    if (!attentionItems.some((item) => item.id === `att-prj-del-${p.id}`)) {
      attentionItems.push({
        id: `att-prj-rsk-${p.id}`,
        type: 'at_risk_project',
        title: p.name,
        identifier: p.projectNumber,
        severity: 'high',
        description: `Evaluated with high project risk score (${p.riskScore}/4). Budget deviation: ${p.budgetDeviation > 0 ? '+' : ''}${p.budgetDeviation}%.`,
        timestamp: p.updatedAt || p.createdAt,
        actionLabel: 'Inspect Risk Factors',
        actionUrl: `/dashboard/project-manager/projects/${p.id}`,
      });
    }
  });

  // E. Pending Suggestions awaiting review
  if (pendingSuggestions.length > 0) {
    const firstPending = pendingSuggestions[0];
    attentionItems.push({
      id: `att-sgg-pnd-${firstPending.id}`,
      type: 'pending_suggestion',
      title: `${pendingSuggestions.length} Citizen Ideas Awaiting Evaluation`,
      identifier: firstPending.suggestionNumber || 'SGG-QUEUE',
      severity: 'info',
      description: `Latest: "${firstPending.title}". Community proposals awaiting municipal acceptance or response.`,
      timestamp: firstPending.createdAt,
      actionLabel: 'Moderate Suggestions',
      actionUrl: '/dashboard/project-manager/suggestions',
    });
  }

  // F. Polls Closing Soon (within 48 hours)
  activePollsList.forEach((poll) => {
    const ends = new Date(poll.endsAt || poll.endDate || '');
    const diffHours = (ends.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours > 0 && diffHours <= 48) {
      attentionItems.push({
        id: `att-pol-cls-${poll.id}`,
        type: 'closing_poll',
        title: `Civic Poll Concluding in ${Math.round(diffHours)} Hours`,
        identifier: poll.title,
        severity: 'info',
        description: `Ballot voting active with ${poll.totalVotes || 0} citizen votes recorded so far.`,
        timestamp: poll.createdAt,
        actionLabel: 'Monitor Ballot',
        actionUrl: `/dashboard/project-manager/voting/${poll.id}`,
      });
    }
  });

  // 6. Aggregate Recent Activities & Recent Project Updates
  const recentActivities: RecentDashboardActivity[] = [];

  // Fetch recent project activities and updates across projects
  const recentProjectUpdates: ProjectUpdate[] = [];

  for (const proj of filteredProjects.slice(0, 5)) {
    try {
      const [acts, upds] = await Promise.all([
        getProjectActivities(proj.id),
        getProjectUpdates(proj.id, true),
      ]);

      acts.forEach((a: ProjectActivity) => {
        recentActivities.push({
          id: a.id,
          category: 'project',
          action: a.action.replace(/_/g, ' '),
          title: `${proj.projectNumber}: ${a.description}`,
          actor: a.actorName,
          timestamp: a.timestamp,
          link: `/dashboard/project-manager/projects/${proj.id}`,
        });
      });

      recentProjectUpdates.push(...upds);
    } catch {
      // ignore
    }
  }

  // Add recent complaints to activities
  filteredComplaints.slice(0, 5).forEach((c) => {
    recentActivities.push({
      id: `act-cmp-${c.id}`,
      category: 'complaint',
      action: `Complaint ${c.status.toUpperCase()}`,
      title: `${c.complaintNumber}: ${c.title}`,
      actor: c.citizenName || 'Citizen',
      timestamp: c.updatedAt || c.createdAt,
      link: `/dashboard/project-manager/complaints/${c.id}`,
    });
  });

  // Add recent suggestions to activities
  suggestions.slice(0, 3).forEach((s) => {
    recentActivities.push({
      id: `act-sgg-${s.id}`,
      category: 'suggestion',
      action: `Suggestion ${s.status.toUpperCase()}`,
      title: `${s.suggestionNumber}: ${s.title}`,
      actor: s.citizenName || 'Citizen',
      timestamp: s.createdAt,
      link: `/dashboard/project-manager/suggestions/${s.id}`,
    });
  });

  // Sort activities by timestamp descending
  recentActivities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Sort project updates by timestamp descending
  recentProjectUpdates.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 7. Compile Final Metrics
  const metrics: AuthorityDashboardMetrics = {
    totalProjects,
    activeProjects: activeProjectsList.length,
    delayedProjects: delayedProjectsList.length,
    atRiskProjects: atRiskProjectsList.length,
    completedProjects,
    totalComplaints,
    pendingComplaints,
    emergencyComplaints: emergencyComplaints.length,
    overdueComplaints: overdueComplaints.length,
    activePolls: pollsSummary.active,
    pendingSuggestions: suggestionsSummary.pending,
    totalSanctionedBudget,
    totalActualSpending,
  };

  return {
    metrics,
    attentionItems,
    emergencyComplaints,
    overdueComplaints,
    complaintStatusBreakdown,
    projectStatusBreakdown,
    activeProjectsList,
    delayedProjectsList,
    atRiskProjectsList,
    suggestionsSummary,
    pollsSummary,
    recentActivities: recentActivities.slice(0, 10),
    recentProjectUpdates: recentProjectUpdates.slice(0, 6),
  };
}
