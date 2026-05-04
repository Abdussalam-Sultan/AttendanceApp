/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff' | string;
  employeeId: string;
  department: string;
  departmentId?: string;
  Department?: Department;
  location: string;
  avatar: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  birthDate?: string;
  joinDate?: string;
  contractType?: string;
  manager?: string;
  branchId?: string;
  branch?: Branch;
}

export interface Department {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  code: string;
  managerId?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave';

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: AttendanceStatus;
  lateMinutes?: number;
  isOfflineSync?: boolean;
  user?: {
    name: string;
    employeeId: string;
    avatar?: string;
  };
  branchName?: string;
  departmentName?: string;
}

export interface LeaveRequest {
  id: string | number;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  date: string;
  duration: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  attachment?: string;
  isOfflineSync?: boolean;
}

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  leave: number;
  totalWorkingDays: number;
  attendancePercentage: number;
}

export interface BranchStats {
  branchName?: string;
  averageAttendance: number;
  totalEmployees: number;
  onLeaveToday: number;
  activeToday: number;
  leaveBalanceAverage: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'General' | 'Policy' | 'Event';
}
