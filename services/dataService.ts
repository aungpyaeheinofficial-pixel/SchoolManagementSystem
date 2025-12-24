import { Student, Staff, Expense, Exam, ExamResult, TimetableEntry, ClassGroup, Room, Subject, FeeType } from '../types';
import { STUDENTS_MOCK, STAFF_MOCK, EXPENSES_MOCK, EXAMS_MOCK, MARKS_MOCK, TIMETABLE_MOCK, CLASSES_MOCK, ROOMS_MOCK, SUBJECTS_MOCK, FEE_STRUCTURES_MOCK } from '../constants';
import { apiFetch } from './api';

// Storage Keys
const STORAGE_KEYS = {
  students: 'pnsp_students',
  staff: 'pnsp_staff',
  expenses: 'pnsp_expenses',
  exams: 'pnsp_exams',
  marks: 'pnsp_marks',
  timetable: 'pnsp_timetable',
  classes: 'pnsp_classes',
  rooms: 'pnsp_rooms',
  subjects: 'pnsp_subjects',
  feeStructures: 'pnsp_fee_structures',
  attendance: 'pnsp_attendance',
  staffAttendance: 'pnsp_staff_attendance',
  payments: 'pnsp_payments',
};

// Initialize data from localStorage or use mock data
const initializeData = <T>(key: string, mockData: T[]): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : mockData;
    }
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
  }
  return mockData;
};

// Save data to localStorage
const saveData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Trigger custom event for data sync
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, data } }));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

// Data Service Class
export class DataService {
  // -------- Backend Sync (optional) --------
  private static isBackendSyncEnabled(): boolean {
    // If apiFetch can resolve base URL, it's enabled.
    try {
      // apiFetch will throw if base URL is missing; we don't call it here.
      return !!(import.meta as any).env?.VITE_API_BASE_URL;
    } catch {
      return false;
    }
  }

  static getLocalServerVersion(): number {
    const raw = localStorage.getItem('pnsp_server_version');
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  static setLocalServerVersion(version: number) {
    localStorage.setItem('pnsp_server_version', String(version));
  }

  private static isDatasetEmpty(data: any): boolean {
    if (!data || typeof data !== 'object') return true;

    const arrays = [
      data.students,
      data.staff,
      data.expenses,
      data.exams,
      data.marks,
      data.timetable,
      data.classes,
      data.rooms,
      data.subjects,
      data.feeStructures,
      data.payments,
    ];

    const arraysEmpty = arrays.every((v) => !Array.isArray(v) || v.length === 0);
    const attendanceEmpty =
      !data.attendance || (typeof data.attendance === 'object' && Object.keys(data.attendance).length === 0);
    const staffAttendanceEmpty =
      !data.staffAttendance || (typeof data.staffAttendance === 'object' && Object.keys(data.staffAttendance).length === 0);

    return arraysEmpty && attendanceEmpty && staffAttendanceEmpty;
  }

  static async pullFromServer(): Promise<{ version: number; isEmpty: boolean; data: any | null }> {
    const res = await apiFetch<{ version: number; data: any | null }>('/api/sync/pull', { auth: true });
    const version = res?.version || 0;
    const data = res?.data ?? null;
    const isEmpty = this.isDatasetEmpty(data);

    // Keep local notion of server version so conflict detection works.
    this.setLocalServerVersion(version);

    if (data && !isEmpty) {
      // Import into local storage so existing app continues to work unchanged.
      this.importAllData(JSON.stringify(data));
    }

    return { version, isEmpty, data };
  }

  static async pushToServer(): Promise<{ version: number }> {
    const data = JSON.parse(this.exportAllData());

    const attempt = async (baseVersion: number) => {
      const res = await apiFetch<{ version: number }>('/api/sync/push', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ baseVersion, data }),
      });
      if (typeof res?.version === 'number') this.setLocalServerVersion(res.version);
      return { version: res?.version || baseVersion };
    };

    const baseVersion = this.getLocalServerVersion();
    try {
      return await attempt(baseVersion);
    } catch (e: any) {
      // If another device/tab pushed first, we may hit a 409 conflict.
      // In that case, refresh the server version and retry once using the latest version,
      // so this client can push its current local state.
      const msg = String(e?.message || '');
      if (msg.includes('API 409')) {
        const latest = await this.peekServerVersion();
        this.setLocalServerVersion(latest.version);
        return await attempt(latest.version);
      }
      throw e;
    }
  }

  static async peekServerVersion(): Promise<{ version: number }> {
    const res = await apiFetch<{ version: number }>('/api/sync/pull', { auth: true });
    return { version: res?.version || 0 };
  }

  private static syncTimer: number | null = null;
  static startAutoSync(): void {
    if (!this.isBackendSyncEnabled()) return;

    const schedule = () => {
      if (this.syncTimer) window.clearTimeout(this.syncTimer);
      this.syncTimer = window.setTimeout(() => {
        this.pushToServer().catch((e) => console.warn('Auto-sync failed:', e));
      }, 1200);
    };

    window.addEventListener('dataUpdated', schedule as any);
    window.addEventListener('dataImported', schedule as any);
  }

  // Students
  static getStudents(): Student[] {
    return initializeData(STORAGE_KEYS.students, STUDENTS_MOCK);
  }

  static saveStudents(students: Student[]): void {
    saveData(STORAGE_KEYS.students, students);
  }

  static addStudent(student: Student): void {
    const students = this.getStudents();
    students.push(student);
    this.saveStudents(students);
  }

  static updateStudent(id: string, updates: Partial<Student>): void {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === id);
    if (index !== -1) {
      students[index] = { ...students[index], ...updates };
      this.saveStudents(students);
    }
  }

  static deleteStudent(id: string): void {
    const students = this.getStudents().filter(s => s.id !== id);
    this.saveStudents(students);
  }

  // Staff
  static getStaff(): Staff[] {
    return initializeData(STORAGE_KEYS.staff, STAFF_MOCK);
  }

  static saveStaff(staff: Staff[]): void {
    saveData(STORAGE_KEYS.staff, staff);
  }

  static addStaff(member: Staff): void {
    const staff = this.getStaff();
    staff.push(member);
    this.saveStaff(staff);
  }

  static updateStaff(id: string, updates: Partial<Staff>): void {
    const staff = this.getStaff();
    const index = staff.findIndex(s => s.id === id);
    if (index !== -1) {
      staff[index] = { ...staff[index], ...updates };
      this.saveStaff(staff);
    }
  }

  static deleteStaff(id: string): void {
    const staff = this.getStaff().filter(s => s.id !== id);
    this.saveStaff(staff);
  }

  // Expenses
  static getExpenses(): Expense[] {
    return initializeData(STORAGE_KEYS.expenses, EXPENSES_MOCK);
  }

  static saveExpenses(expenses: Expense[]): void {
    saveData(STORAGE_KEYS.expenses, expenses);
  }

  static addExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.push(expense);
    this.saveExpenses(expenses);
  }

  static updateExpense(id: string, updates: Partial<Expense>): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses[index] = { ...expenses[index], ...updates };
      this.saveExpenses(expenses);
    }
  }

  static deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.saveExpenses(expenses);
  }

  // Exams
  static getExams(): Exam[] {
    return initializeData(STORAGE_KEYS.exams, EXAMS_MOCK);
  }

  static saveExams(exams: Exam[]): void {
    saveData(STORAGE_KEYS.exams, exams);
  }

  static addExam(exam: Exam): void {
    const exams = this.getExams();
    exams.push(exam);
    this.saveExams(exams);
  }

  static updateExam(id: string, updates: Partial<Exam>): void {
    const exams = this.getExams();
    const index = exams.findIndex(e => e.id === id);
    if (index !== -1) {
      exams[index] = { ...exams[index], ...updates };
      this.saveExams(exams);
    }
  }

  static deleteExam(id: string): void {
    const exams = this.getExams().filter(e => e.id !== id);
    this.saveExams(exams);
  }

  // Exam Results/Marks
  static getMarks(): ExamResult[] {
    return initializeData(STORAGE_KEYS.marks, MARKS_MOCK);
  }

  static saveMarks(marks: ExamResult[]): void {
    saveData(STORAGE_KEYS.marks, marks);
  }

  static addMark(mark: ExamResult): void {
    const marks = this.getMarks();
    marks.push(mark);
    this.saveMarks(marks);
  }

  static updateMark(id: string, updates: Partial<ExamResult>): void {
    const marks = this.getMarks();
    const index = marks.findIndex(m => m.id === id);
    if (index !== -1) {
      marks[index] = { ...marks[index], ...updates };
      this.saveMarks(marks);
    }
  }

  static deleteMark(id: string): void {
    const marks = this.getMarks().filter(m => m.id !== id);
    this.saveMarks(marks);
  }

  // Timetable
  static getTimetable(): TimetableEntry[] {
    return initializeData(STORAGE_KEYS.timetable, TIMETABLE_MOCK);
  }

  static saveTimetable(timetable: TimetableEntry[]): void {
    saveData(STORAGE_KEYS.timetable, timetable);
  }

  static updateTimetable(updates: TimetableEntry[]): void {
    this.saveTimetable(updates);
  }

  // Classes
  static getClasses(): ClassGroup[] {
    return initializeData(STORAGE_KEYS.classes, CLASSES_MOCK);
  }

  static saveClasses(classes: ClassGroup[]): void {
    saveData(STORAGE_KEYS.classes, classes);
  }

  static addClass(classGroup: ClassGroup): void {
    const classes = this.getClasses();
    classes.push(classGroup);
    this.saveClasses(classes);
  }

  static updateClass(id: string, updates: Partial<ClassGroup>): void {
    const classes = this.getClasses();
    const index = classes.findIndex(c => c.id === id);
    if (index !== -1) {
      classes[index] = { ...classes[index], ...updates };
      this.saveClasses(classes);
    }
  }

  static deleteClass(id: string): void {
    const classes = this.getClasses().filter(c => c.id !== id);
    this.saveClasses(classes);
  }

  // Rooms
  static getRooms(): Room[] {
    return initializeData(STORAGE_KEYS.rooms, ROOMS_MOCK);
  }

  static saveRooms(rooms: Room[]): void {
    saveData(STORAGE_KEYS.rooms, rooms);
  }

  static addRoom(room: Room): void {
    const rooms = this.getRooms();
    rooms.push(room);
    this.saveRooms(rooms);
  }

  static updateRoom(id: string, updates: Partial<Room>): void {
    const rooms = this.getRooms();
    const index = rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...updates };
      this.saveRooms(rooms);
    }
  }

  static deleteRoom(id: string): void {
    const rooms = this.getRooms().filter(r => r.id !== id);
    this.saveRooms(rooms);
  }

  // Subjects
  static getSubjects(): Subject[] {
    return initializeData(STORAGE_KEYS.subjects, SUBJECTS_MOCK);
  }

  static saveSubjects(subjects: Subject[]): void {
    saveData(STORAGE_KEYS.subjects, subjects);
  }

  static addSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    subjects.push(subject);
    this.saveSubjects(subjects);
  }

  static updateSubject(id: string, updates: Partial<Subject>): void {
    const subjects = this.getSubjects();
    const index = subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      subjects[index] = { ...subjects[index], ...updates };
      this.saveSubjects(subjects);
    }
  }

  static deleteSubject(id: string): void {
    const subjects = this.getSubjects().filter(s => s.id !== id);
    this.saveSubjects(subjects);
  }

  // Fee Structures
  static getFeeStructures(): FeeType[] {
    return initializeData(STORAGE_KEYS.feeStructures, FEE_STRUCTURES_MOCK);
  }

  static saveFeeStructures(fees: FeeType[]): void {
    saveData(STORAGE_KEYS.feeStructures, fees);
  }

  static addFeeStructure(fee: FeeType): void {
    const fees = this.getFeeStructures();
    fees.push(fee);
    this.saveFeeStructures(fees);
  }

  static updateFeeStructure(id: string, updates: Partial<FeeType>): void {
    const fees = this.getFeeStructures();
    const index = fees.findIndex(f => f.id === id);
    if (index !== -1) {
      fees[index] = { ...fees[index], ...updates };
      this.saveFeeStructures(fees);
    }
  }

  static deleteFeeStructure(id: string): void {
    const fees = this.getFeeStructures().filter(f => f.id !== id);
    this.saveFeeStructures(fees);
  }

  // Attendance (Student)
  static getAttendance(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.attendance);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static saveAttendance(attendance: Record<string, any>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(attendance));
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key: STORAGE_KEYS.attendance, data: attendance } }));
    } catch (error) {
      console.error('Error saving attendance:', error);
    }
  }

  // Staff Attendance
  static getStaffAttendance(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.staffAttendance);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  static saveStaffAttendance(attendance: Record<string, any>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.staffAttendance, JSON.stringify(attendance));
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key: STORAGE_KEYS.staffAttendance, data: attendance } }));
    } catch (error) {
      console.error('Error saving staff attendance:', error);
    }
  }

  // Payments
  static getPayments(): any[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.payments);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static savePayments(payments: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key: STORAGE_KEYS.payments, data: payments } }));
    } catch (error) {
      console.error('Error saving payments:', error);
    }
  }

  static addPayment(payment: any): void {
    const payments = this.getPayments();
    payments.push(payment);
    this.savePayments(payments);
  }

  // Sync all data (for backup/restore)
  static exportAllData(): string {
    return JSON.stringify({
      students: this.getStudents(),
      staff: this.getStaff(),
      expenses: this.getExpenses(),
      exams: this.getExams(),
      marks: this.getMarks(),
      timetable: this.getTimetable(),
      classes: this.getClasses(),
      rooms: this.getRooms(),
      subjects: this.getSubjects(),
      feeStructures: this.getFeeStructures(),
      attendance: this.getAttendance(),
      staffAttendance: this.getStaffAttendance(),
      payments: this.getPayments(),
      exportDate: new Date().toISOString(),
    }, null, 2);
  }

  static importAllData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.students) this.saveStudents(data.students);
      if (data.staff) this.saveStaff(data.staff);
      if (data.expenses) this.saveExpenses(data.expenses);
      if (data.exams) this.saveExams(data.exams);
      if (data.marks) this.saveMarks(data.marks);
      if (data.timetable) this.saveTimetable(data.timetable);
      if (data.classes) this.saveClasses(data.classes);
      if (data.rooms) this.saveRooms(data.rooms);
      if (data.subjects) this.saveSubjects(data.subjects);
      if (data.feeStructures) this.saveFeeStructures(data.feeStructures);
      if (data.attendance) this.saveAttendance(data.attendance);
      if (data.staffAttendance) this.saveStaffAttendance(data.staffAttendance);
      if (data.payments) this.savePayments(data.payments);
      
      // Trigger refresh
      window.dispatchEvent(new CustomEvent('dataImported'));
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    window.dispatchEvent(new CustomEvent('dataCleared'));
  }
}


