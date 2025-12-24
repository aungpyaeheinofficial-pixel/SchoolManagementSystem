import type { ViewState } from '../types';

export type AppRole = 'admin' | 'teacher' | 'accountant' | 'student';

export function normalizeRole(role: string | null | undefined): AppRole {
  const r = String(role || '').trim();
  const lower = r.toLowerCase();
  if (lower === 'admin' || r === 'ADMIN') return 'admin';
  if (lower === 'teacher' || r === 'TEACHER') return 'teacher';
  if (lower === 'accountant' || lower === 'account' || r === 'ACCOUNTANT') return 'accountant';
  if (lower === 'student' || r === 'STUDENT') return 'student';
  // Fallback: safest is least privilege
  return 'teacher';
}

// Minimal RBAC policy (adjust anytime)
const TEACHER_VIEWS: Set<ViewState> = new Set([
  'DASHBOARD',
  'STUDENTS',
  'ATTENDANCE',
  'ACADEMIC_TIMETABLE',
  'EXAM_MARKS_ENTRY',
  'EXAM_REPORT_CARDS',
  'REPORTS_ATTENDANCE',
  'REPORTS_ACADEMIC',
]);

const ACCOUNTANT_VIEWS: Set<ViewState> = new Set([
  'DASHBOARD',
  'STUDENTS',
  'FINANCE',
  'FINANCE_FEES',
  'FINANCE_PAYMENTS',
  'FINANCE_UNPAID',
  'FINANCE_EXPENSES',
  'REPORTS_FINANCE',
  'REPORTS_STUDENTS',
]);

export function canAccessView(roleRaw: string | null | undefined, view: ViewState): boolean {
  const role = normalizeRole(roleRaw);
  if (role === 'admin') return true;
  if (role === 'teacher') return TEACHER_VIEWS.has(view);
  if (role === 'accountant') return ACCOUNTANT_VIEWS.has(view);
  // student (or unknown): very limited for now
  return view === 'DASHBOARD';
}


