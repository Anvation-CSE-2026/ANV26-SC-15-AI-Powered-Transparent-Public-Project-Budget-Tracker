/**
 * Development & Demo Admin Access Gate Configuration
 *
 * NOTE: This is a client-side access gate for the development and evaluation flow.
 * Real system authorization is strictly enforced by:
 * - Firebase Authentication UID
 * - Cloud Firestore user profile role
 * - Cloud Firestore Security Rules
 * - RoleGuard & ProtectedRoute
 */

export const DEMO_ADMIN_ACCESS_CODE = '123456';

export function verifyAdminAccessCode(code: string): boolean {
  return code.trim() === DEMO_ADMIN_ACCESS_CODE;
}
