import type { UserRole } from '../types';

export const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
  citizen: '/dashboard/citizen',
  project_manager: '/dashboard/project-manager',
  contractor: '/dashboard/contractor',
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  citizen: 'Citizen',
  project_manager: 'Project Manager',
  contractor: 'Contractor',
};

/**
 * Returns the designated dashboard path for a given role.
 */
export function getDashboardRouteForRole(role: UserRole): string {
  return ROLE_DASHBOARD_ROUTES[role] || '/unauthorized';
}
