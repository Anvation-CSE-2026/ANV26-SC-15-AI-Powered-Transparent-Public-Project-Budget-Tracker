import { useState, useEffect, useCallback } from 'react';
import {
  getAssignedProjects,
  getContractorSubmissionsList,
  getContractorDashboardMetrics,
} from '../api/contractorService';
import type {
  ContractorSubmission,
  ContractorDashboardMetrics,
} from '../types/contractor';
import type { Project } from '../types/project';

export interface UseContractorDashboardResult {
  assignedProjects: Project[];
  submissions: ContractorSubmission[];
  metrics: ContractorDashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useContractorDashboard(contractorId?: string): UseContractorDashboardResult {
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<ContractorSubmission[]>([]);
  const [metrics, setMetrics] = useState<ContractorDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(Boolean(contractorId));
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!contractorId) {
      setAssignedProjects([]);
      setSubmissions([]);
      setMetrics(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [projects, subs, mets] = await Promise.all([
        getAssignedProjects(contractorId),
        getContractorSubmissionsList(contractorId),
        getContractorDashboardMetrics(contractorId),
      ]);
      setAssignedProjects(projects);
      setSubmissions(subs);
      setMetrics(mets);
    } catch {
      setError('Unable to load contractor dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [contractorId]);

  useEffect(() => {
    let isMounted = true;
    if (!contractorId) {
      return;
    }

    Promise.all([
      getAssignedProjects(contractorId),
      getContractorSubmissionsList(contractorId),
      getContractorDashboardMetrics(contractorId),
    ])
      .then(([projects, subs, mets]) => {
        if (isMounted) {
          setAssignedProjects(projects);
          setSubmissions(subs);
          setMetrics(mets);
          setError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to load contractor dashboard data.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [contractorId]);

  return {
    assignedProjects,
    submissions,
    metrics,
    loading,
    error,
    refresh: fetchData,
  };
}
