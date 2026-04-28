import { User, AttendanceRecord, AttendanceStats } from './types';

export const MOCK_USER: User = {
  id: '1',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@technova.com',
  role: 'Software Developer',
  employeeId: 'TN12345',
  department: 'Engineering',
  location: 'Noida, India',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop',
};

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: '1',
    date: 'Thursday, 23 May 2024',
    checkIn: '09:41 AM',
    checkOut: null,
    status: 'present',
  },
  {
    id: '2',
    date: 'Wednesday, 22 May 2024',
    checkIn: '09:02 AM',
    checkOut: '06:01 PM',
    status: 'present',
  },
  {
    id: '3',
    date: 'Tuesday, 21 May 2024',
    checkIn: '08:58 AM',
    checkOut: '06:03 PM',
    status: 'present',
  },
  {
    id: '4',
    date: 'Monday, 20 May 2024',
    checkIn: '09:05 AM',
    checkOut: '06:10 PM',
    status: 'present',
  },
  {
    id: '5',
    date: 'Friday, 17 May 2024',
    checkIn: '09:20 AM',
    checkOut: '06:05 PM',
    status: 'late',
    lateMinutes: 20,
  },
  {
    id: '6',
    date: 'Thursday, 16 May 2024',
    checkIn: '--:--',
    checkOut: '--:--',
    status: 'absent',
  },
];

export const MOCK_STATS: AttendanceStats = {
  present: 18,
  late: 2,
  absent: 1,
  leave: 0,
  totalWorkingDays: 21,
  attendancePercentage: 90,
};
