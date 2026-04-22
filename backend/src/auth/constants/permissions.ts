export const Permissions = {
  COMPANY_MANAGE: 'company.manage',
  USER_MANAGE: 'user.manage',
  ROLE_MANAGE: 'role.manage',
  EMPLOYEE_READ: 'employee.read',
  EMPLOYEE_MANAGE: 'employee.manage',
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_MANAGE: 'attendance.manage',
  LEAVE_READ: 'leave.read',
  LEAVE_REQUEST: 'leave.request',
  LEAVE_APPROVE_TEAM: 'leave.approve.team',
  LEAVE_APPROVE_HR: 'leave.approve.hr',
  PAYROLL_READ_SELF: 'payroll.read.self',
  PAYROLL_READ_ALL: 'payroll.read.all',
  PAYROLL_MANAGE: 'payroll.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionKey = (typeof Permissions)[keyof typeof Permissions];

export const RolePermissionMatrix: Record<string, PermissionKey[]> = {
  COMPANY_ADMIN: [
    Permissions.COMPANY_MANAGE,
    Permissions.USER_MANAGE,
    Permissions.ROLE_MANAGE,
    Permissions.EMPLOYEE_READ,
    Permissions.EMPLOYEE_MANAGE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_MANAGE,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_APPROVE_HR,
    Permissions.PAYROLL_READ_ALL,
    Permissions.PAYROLL_MANAGE,
    Permissions.SETTINGS_MANAGE,
    Permissions.AUDIT_READ,
  ],
  HR_MANAGER: [
    Permissions.EMPLOYEE_READ,
    Permissions.EMPLOYEE_MANAGE,
    Permissions.ATTENDANCE_READ,
    Permissions.ATTENDANCE_MANAGE,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_APPROVE_HR,
    Permissions.PAYROLL_READ_ALL,
  ],
  TEAM_LEAD: [
    Permissions.EMPLOYEE_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.LEAVE_READ,
    Permissions.LEAVE_APPROVE_TEAM,
  ],
  EMPLOYEE: [
    Permissions.EMPLOYEE_READ,
    Permissions.ATTENDANCE_READ,
    Permissions.LEAVE_REQUEST,
    Permissions.PAYROLL_READ_SELF,
  ],
};
