import api, { unwrapEnvelope } from './api';
import type {
  EmployeeRecord,
  OrganizationUnit,
  PaginatedEmployees,
} from '@/types';

export const hrApi = {
  listEmployees: (params: {
    companyId: string;
    search?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get('/employees', { params })
      .then((r) => unwrapEnvelope<PaginatedEmployees>(r.data)),

  createEmployee: (data: {
    userId: number;
    companyId: string;
    departmentId?: string;
    teamId?: string;
    branchId?: string;
    jobTitle?: string;
    joiningDate?: string;
  }) => api.post('/employees', data).then((r) => unwrapEnvelope<EmployeeRecord>(r.data)),

  listDepartments: (companyId: string) =>
    api
      .get('/organization/departments', { params: { companyId } })
      .then((r) => unwrapEnvelope<OrganizationUnit[]>(r.data)),

  listTeams: (companyId: string) =>
    api
      .get('/organization/teams', { params: { companyId } })
      .then((r) => unwrapEnvelope<OrganizationUnit[]>(r.data)),

  listBranches: (companyId: string) =>
    api
      .get('/organization/branches', { params: { companyId } })
      .then((r) => unwrapEnvelope<OrganizationUnit[]>(r.data)),

  adminSummary: (companyId: string) =>
    api
      .get('/dashboard/admin-summary', { params: { companyId } })
      .then(
        (r) =>
          unwrapEnvelope<{
            employees: number;
            activeUsers: number;
            pendingLeaves: number;
            payrollProcessed: number;
          }>(r.data),
      ),

  getCompanySettings: (companyId: string) =>
    api
      .get('/settings/company', { params: { companyId } })
      .then(
        (r) =>
          unwrapEnvelope<{
            id: string;
            name: string;
            slug: string;
            timezone: string;
            logoUrl?: string | null;
          }>(r.data),
      ),

  updateCompanySettings: (
    companyId: string,
    data: { name?: string; timezone?: string; logoUrl?: string },
  ) =>
    api
      .patch('/settings/company', data, { params: { companyId } })
      .then((r) => unwrapEnvelope(r.data)),

  listLeavePolicies: (companyId: string) =>
    api.get('/leave/policies', { params: { companyId } }).then((r) => unwrapEnvelope(r.data)),
  createLeavePolicy: (data: {
    companyId: string;
    leaveType: string;
    annualAllocation: number;
    carryForwardMax: number;
    period: 'YEARLY' | 'MONTHLY';
    requiresTeamLead: boolean;
    requiresHrApproval: boolean;
  }) => api.post('/leave/policies', data).then((r) => unwrapEnvelope(r.data)),
  allocateLeaveBalance: (data: {
    employeeId: string;
    companyId: string;
    leaveType: string;
    year: number;
    allocatedDays: number;
  }) => api.post('/leave/balances/allocate', data).then((r) => unwrapEnvelope(r.data)),
  listLeaveBalances: (companyId: string, employeeId?: string) =>
    api.get('/leave/balances', { params: { companyId, employeeId } }).then((r) => unwrapEnvelope(r.data)),
  leaveCalendar: (companyId: string, month: string) =>
    api.get('/leave/calendar', { params: { companyId, month } }).then((r) => unwrapEnvelope(r.data)),
  listLeaveRequests: (companyId: string, employeeId?: string) =>
    api.get('/leave/requests', { params: { companyId, employeeId } }).then((r) => unwrapEnvelope(r.data)),
  createLeaveRequest: (data: {
    employeeId: string;
    companyId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason?: string;
  }) => api.post('/leave/requests', data).then((r) => unwrapEnvelope(r.data)),
  teamLeadDecision: (leaveRequestId: string, decision: 'approve' | 'reject', comments?: string) =>
    api.post('/leave/approve/team-lead', { leaveRequestId, decision, comments }).then((r) => unwrapEnvelope(r.data)),
  hrDecision: (leaveRequestId: string, decision: 'approve' | 'reject', comments?: string) =>
    api.post('/leave/approve/hr', { leaveRequestId, decision, comments }).then((r) => unwrapEnvelope(r.data)),

  listPayrollRecords: (companyId: string, employeeId?: string) =>
    api.get('/payroll/records', { params: { companyId, employeeId } }).then((r) => unwrapEnvelope(r.data)),
  createPayrollCycle: (data: {
    companyId: string;
    name: string;
    month: string;
    periodStart: string;
    periodEnd: string;
  }) => api.post('/payroll/cycles', data).then((r) => unwrapEnvelope(r.data)),
  listPayrollCycles: (companyId: string) =>
    api.get('/payroll/cycles', { params: { companyId } }).then((r) => unwrapEnvelope(r.data)),
  createPayrollRevision: (data: {
    payrollRecordId: string;
    employeeId: string;
    companyId: string;
    reason: string;
    amountDelta: number;
  }) => api.post('/payroll/revisions', data).then((r) => unwrapEnvelope(r.data)),
  listPayrollRevisions: (companyId: string, employeeId?: string) =>
    api.get('/payroll/revisions', { params: { companyId, employeeId } }).then((r) => unwrapEnvelope(r.data)),
  getPayslip: (payrollRecordId: string) =>
    api.get('/payroll/payslip', { params: { payrollRecordId } }).then((r) => unwrapEnvelope(r.data)),

  uploadDocument: (formData: FormData) =>
    api
      .post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => unwrapEnvelope(r.data)),
  listDocuments: (companyId: string, employeeId?: string) =>
    api.get('/documents', { params: { companyId, employeeId } }).then((r) => unwrapEnvelope(r.data)),

  listAuditLogs: (companyId?: string) =>
    api.get('/audit/logs', { params: { companyId } }).then((r) => unwrapEnvelope(r.data)),
};
