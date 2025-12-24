export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  LATE = 'LATE'
}

export interface Student {
  id: string;
  nameEn: string;
  nameMm: string;
  fatherName: string;
  grade: string;
  nrc?: string; // e.g., 12/KaMaYa(N)123456
  dob: string;
  status: 'Active' | 'Graduated' | 'Suspended' | 'Fees Due';
  attendanceRate: number; // 0-100
  feesPending: number;
  phone: string;
  lastPaymentDate?: string; // ISO date string for last fee payment
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  department: string;
  joinDate: string;
}

export interface NavItem {
  id: string;
  labelEn: string;
  labelMm: string;
  icon: any;
  children?: NavItem[]; // Added for sub-menus
}

export type ViewState = 
  | 'DASHBOARD' 
  | 'STUDENTS' 
  | 'ADMISSIONS' 
  | 'ATTENDANCE' 
  | 'FINANCE' 
  | 'FINANCE_FEES'
  | 'FINANCE_PAYMENTS'
  | 'FINANCE_UNPAID'
  | 'FINANCE_EXPENSES'
  | 'HR' 
  | 'HR_ATTENDANCE'
  | 'ACADEMIC_CLASSES'
  | 'ACADEMIC_SUBJECTS'
  | 'ACADEMIC_TIMETABLE'
  | 'EXAM_MANAGEMENT'
  | 'EXAM_MARKS_ENTRY'
  | 'EXAM_REPORT_CARDS'
  | 'EXAM_ANALYTICS'
  | 'REPORTS_STUDENTS'
  | 'REPORTS_FINANCE'
  | 'REPORTS_ATTENDANCE'
  | 'REPORTS_ACADEMIC'
  | 'SETTINGS';

// Finance Specific Types
export interface Expense {
  id: string;
  category: 'Salaries' | 'Utilities' | 'Supplies' | 'Maintenance' | 'Transportation' | 'Others';
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: 'Paid' | 'Pending';
}

export interface Transaction {
  id: string;
  studentId?: string;
  name: string; // Student or Payer Name
  type: 'Income' | 'Expense';
  description: string;
  amount: number;
  date: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  paymentMethod: string;
}

// Payments (single receipt with multiple items)
export interface PaymentItem {
  lineNo: number;
  feeTypeId?: string;
  description?: string;
  amount: number;
}

export interface Payment {
  id: string;
  studentId?: string;
  payerName?: string;
  paymentMethod: string;
  remark?: string;
  discount: number;
  totalAmount: number;
  date: string; // ISO date string (yyyy-mm-dd)
  items: PaymentItem[];
  meta?: Record<string, any>;
}

// Attendance shapes (matches backend datasetService nested format)
export type StudentAttendanceDataset = Record<
  string, // date (yyyy-mm-dd)
  Record<
    string, // classId
    Record<string, { status: AttendanceStatus; remark: string }>
  >
>;

export type StaffAttendanceDataset = Record<
  string, // date (yyyy-mm-dd)
  Record<string, { status: AttendanceStatus; checkIn: string; checkOut: string; remark: string }>
>;

export interface FeeType {
  id: string;
  nameEn: string;
  nameMm: string;
  amount: number;
  frequency: 'Monthly' | 'Yearly' | 'One-time' | 'Termly';
  academicYear: string;
  applicableGrades: string[]; // e.g. ["Grade 10", "Grade 11"]
  description?: string;
  dueDate?: string; // e.g. "5th of every month" or specific date
  isActive: boolean;
}

// Academic Types
export interface ClassGroup {
  id: string;
  name: string; // e.g. Grade 10 (A)
  gradeLevel: string;
  section: string;
  teacherId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
  studentCount: number;
  maxCapacity: number;
}

export interface Room {
  id: string;
  number: string; // e.g. 101, Lab-A
  building: string; // Building A
  type: 'Classroom' | 'Laboratory' | 'Hall' | 'Office';
  capacity: number;
  isOccupied: boolean;
  facilities: string[]; // e.g. ["Projector", "AC"]
}

export interface Subject {
  id: string;
  code: string; // e.g. MYA-101
  nameEn: string;
  nameMm: string;
  gradeLevel: string; // e.g. "Grade 10" or "All"
  type: 'Core' | 'Elective' | 'Activity';
  periodsPerWeek: number;
  department: string;
}

export interface TimeSlot {
  id: number;
  startTime: string; // "09:00"
  endTime: string;   // "09:45"
  label: string;     // "Period 1"
}

export interface TimetableEntry {
  id: string;
  classId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  periodId: number;
  subjectId: string;
  teacherId: string;
  curriculumType: 'Public' | 'Private'; // To filter views
}

export interface Exam {
  id: string;
  name: string;
  academicYear: string;
  term: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Published';
  classes: string[]; // IDs of classes participating
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  score: number;
  grade: string; // A, B, C, D, F
  remark?: string;
}