import { UserRole } from '../context/AuthContext';

export const Permissions = {
  // Admin Permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_COMPANIES: 'manage_companies',
  MANAGE_JOBS: 'manage_jobs',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  PERFORM_BULK_OPERATIONS: 'perform_bulk_operations',

  // Company Permissions
  POST_JOBS: 'post_jobs',
  MANAGE_APPLICATIONS: 'manage_applications',
  VIEW_COMPANY_ANALYTICS: 'view_company_analytics',
  MANAGE_COMPANY_PROFILE: 'manage_company_profile',

  // Ambassador Permissions
  APPLY_TO_JOBS: 'apply_to_jobs',
  VIEW_APPLICATIONS: 'view_applications',
  UPDATE_PROFILE: 'update_profile',
  VIEW_EARNINGS: 'view_earnings',
} as const;

export type Permission = keyof typeof Permissions;

export const RolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    Permissions.MANAGE_USERS,
    Permissions.MANAGE_COMPANIES,
    Permissions.MANAGE_JOBS,
    Permissions.VIEW_ANALYTICS,
    Permissions.MANAGE_SETTINGS,
    Permissions.VIEW_AUDIT_LOGS,
    Permissions.PERFORM_BULK_OPERATIONS,
  ],
  company: [
    Permissions.POST_JOBS,
    Permissions.MANAGE_APPLICATIONS,
    Permissions.VIEW_COMPANY_ANALYTICS,
    Permissions.MANAGE_COMPANY_PROFILE,
  ],
  ambassador: [
    Permissions.APPLY_TO_JOBS,
    Permissions.VIEW_APPLICATIONS,
    Permissions.UPDATE_PROFILE,
    Permissions.VIEW_EARNINGS,
  ],
  guest: [],
};

export const hasPermission = (
  userPermissions: string[],
  requiredPermission: Permission
): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
};

export const hasAllPermissions = (
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean => {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return RolePermissions[role] || [];
};

export const isAuthorized = (
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean => {
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
};
