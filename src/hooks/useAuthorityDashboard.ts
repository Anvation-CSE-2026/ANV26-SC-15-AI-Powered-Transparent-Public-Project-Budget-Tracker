import { useState, useEffect, useCallback } from 'react';
import {
  getAuthorityDashboardData,
  type AuthorityDashboardData,
} from '../api/authorityDashboardService';

export interface UseAuthorityDashboardResult {
  data: AuthorityDashboardData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAuthorityDashboard(departmentFilter?: string): UseAuthorityDashboardResult {
  const [data, setData] = useState<AuthorityDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getAuthorityDashboardData(departmentFilter);
      setData(res);
    } catch {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [departmentFilter]);

  useEffect(() => {
    let isMounted = true;
    getAuthorityDashboardData(departmentFilter)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to load dashboard data. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [departmentFilter]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  };
}
