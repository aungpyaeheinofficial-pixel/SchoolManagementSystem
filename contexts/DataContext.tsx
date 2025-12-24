import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Student,
  Staff,
  Expense,
  Exam,
  ExamResult,
  TimetableEntry,
  ClassGroup,
  Room,
  Subject,
  FeeType,
  Payment,
  StudentAttendanceDataset,
  StaffAttendanceDataset,
} from '../types';
import { DataService } from '../services/dataService';

interface DataContextType {
  // Students
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  
  // Staff
  staff: Staff[];
  setStaff: (staff: Staff[]) => void;
  addStaff: (member: Staff) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  
  // Expenses
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Exams
  exams: Exam[];
  setExams: (exams: Exam[]) => void;
  addExam: (exam: Exam) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  
  // Marks
  marks: ExamResult[];
  setMarks: (marks: ExamResult[]) => void;
  addMark: (mark: ExamResult) => void;
  updateMark: (id: string, updates: Partial<ExamResult>) => void;
  deleteMark: (id: string) => void;
  
  // Timetable
  timetable: TimetableEntry[];
  setTimetable: (timetable: TimetableEntry[] | ((prev: TimetableEntry[]) => TimetableEntry[])) => void;
  addTimetableEntry: (entry: TimetableEntry) => void;
  updateTimetableEntry: (id: string, updates: Partial<TimetableEntry>) => void;
  deleteTimetableEntry: (id: string) => void;
  copyWeekSchedule: (sourceClassId: string, targetClassId?: string) => TimetableEntry[];
  
  // Classes
  classes: ClassGroup[];
  setClasses: (classes: ClassGroup[]) => void;
  addClass: (classGroup: ClassGroup) => void;
  updateClass: (id: string, updates: Partial<ClassGroup>) => void;
  deleteClass: (id: string) => void;
  
  // Rooms
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  
  // Subjects
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, updates: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Fee Structures
  feeStructures: FeeType[];
  setFeeStructures: (fees: FeeType[]) => void;
  addFeeStructure: (fee: FeeType) => void;
  updateFeeStructure: (id: string, updates: Partial<FeeType>) => void;
  deleteFeeStructure: (id: string) => void;
  
  // Attendance
  attendance: StudentAttendanceDataset;
  setAttendance: (attendance: StudentAttendanceDataset) => void;
  
  // Staff Attendance
  staffAttendance: StaffAttendanceDataset;
  setStaffAttendance: (attendance: StaffAttendanceDataset) => void;
  
  // Payments
  payments: Payment[];
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  
  // Sync
  refreshData: () => void;
  isSyncing: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [students, setStudentsState] = useState<Student[]>([]);
  const [staff, setStaffState] = useState<Staff[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [exams, setExamsState] = useState<Exam[]>([]);
  const [marks, setMarksState] = useState<ExamResult[]>([]);
  const [timetable, setTimetableState] = useState<TimetableEntry[]>([]);
  const [classes, setClassesState] = useState<ClassGroup[]>([]);
  const [rooms, setRoomsState] = useState<Room[]>([]);
  const [subjects, setSubjectsState] = useState<Subject[]>([]);
  const [feeStructures, setFeeStructuresState] = useState<FeeType[]>([]);
  const [attendance, setAttendanceState] = useState<StudentAttendanceDataset>({});
  const [staffAttendance, setStaffAttendanceState] = useState<StaffAttendanceDataset>({});
  const [payments, setPaymentsState] = useState<Payment[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep classes sorted KG -> Grade 12 (fallback alpha) for consistent dropdowns/lists
  const sortClasses = (list: ClassGroup[]) => {
    const gradeRank = (text: string) => {
      const lower = text.toLowerCase();
      if (lower.startsWith('kg')) return 0;
      const match = lower.match(/grade\s*(\d{1,2})/);
      return match ? parseInt(match[1], 10) : 99;
    };
    return [...list].sort((a, b) => {
      const aRank = gradeRank(a.gradeLevel || a.name || '');
      const bRank = gradeRank(b.gradeLevel || b.name || '');
      if (aRank !== bRank) return aRank - bRank;
      return (a.section || '').localeCompare(b.section || '');
    });
  };

  // Load initial data
  const loadData = () => {
    setIsSyncing(true);
    try {
      setStudentsState(DataService.getStudents());
      setStaffState(DataService.getStaff());
      setExpensesState(DataService.getExpenses());
      setExamsState(DataService.getExams());
      setMarksState(DataService.getMarks());
      setTimetableState(DataService.getTimetable());
      setClassesState(sortClasses(DataService.getClasses()));
      setRoomsState(DataService.getRooms());
      setSubjectsState(DataService.getSubjects());
      setFeeStructuresState(DataService.getFeeStructures());
      setAttendanceState(DataService.getAttendance());
      setStaffAttendanceState(DataService.getStaffAttendance());
      setPaymentsState(DataService.getPayments());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Listen for data updates
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      const { key } = event.detail;
      switch (key) {
        case 'pnsp_students':
          setStudentsState(DataService.getStudents());
          break;
        case 'pnsp_staff':
          setStaffState(DataService.getStaff());
          break;
        case 'pnsp_expenses':
          setExpensesState(DataService.getExpenses());
          break;
        case 'pnsp_exams':
          setExamsState(DataService.getExams());
          break;
        case 'pnsp_marks':
          setMarksState(DataService.getMarks());
          break;
        case 'pnsp_timetable':
          setTimetableState(DataService.getTimetable());
          break;
        case 'pnsp_classes':
          setClassesState(sortClasses(DataService.getClasses()));
          break;
        case 'pnsp_rooms':
          setRoomsState(DataService.getRooms());
          break;
        case 'pnsp_subjects':
          setSubjectsState(DataService.getSubjects());
          break;
        case 'pnsp_fee_structures':
          setFeeStructuresState(DataService.getFeeStructures());
          break;
        case 'pnsp_attendance':
          setAttendanceState(DataService.getAttendance());
          break;
        case 'pnsp_staff_attendance':
          setStaffAttendanceState(DataService.getStaffAttendance());
          break;
        case 'pnsp_payments':
          setPaymentsState(DataService.getPayments());
          break;
      }
    };

    const handleDataImported = () => {
      loadData();
    };

    window.addEventListener('dataUpdated', handleDataUpdate as EventListener);
    window.addEventListener('dataImported', handleDataImported);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate as EventListener);
      window.removeEventListener('dataImported', handleDataImported);
    };
  }, []);

  // Wrapper functions that sync to storage
  const setStudents = (newStudents: Student[]) => {
    setStudentsState(newStudents);
    DataService.saveStudents(newStudents);
  };

  const addStudent = (student: Student) => {
    DataService.addStudent(student);
    setStudentsState(DataService.getStudents());
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    DataService.updateStudent(id, updates);
    setStudentsState(DataService.getStudents());
  };

  const deleteStudent = (id: string) => {
    DataService.deleteStudent(id);
    setStudentsState(DataService.getStudents());
  };

  const setStaff = (newStaff: Staff[]) => {
    setStaffState(newStaff);
    DataService.saveStaff(newStaff);
  };

  const addStaff = (member: Staff) => {
    DataService.addStaff(member);
    setStaffState(DataService.getStaff());
  };

  const updateStaff = (id: string, updates: Partial<Staff>) => {
    DataService.updateStaff(id, updates);
    setStaffState(DataService.getStaff());
  };

  const deleteStaff = (id: string) => {
    DataService.deleteStaff(id);
    setStaffState(DataService.getStaff());
  };

  const setExpenses = (newExpenses: Expense[]) => {
    setExpensesState(newExpenses);
    DataService.saveExpenses(newExpenses);
  };

  const addExpense = (expense: Expense) => {
    DataService.addExpense(expense);
    setExpensesState(DataService.getExpenses());
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    DataService.updateExpense(id, updates);
    setExpensesState(DataService.getExpenses());
  };

  const deleteExpense = (id: string) => {
    DataService.deleteExpense(id);
    setExpensesState(DataService.getExpenses());
  };

  const setExams = (newExams: Exam[]) => {
    setExamsState(newExams);
    DataService.saveExams(newExams);
  };

  const addExam = (exam: Exam) => {
    DataService.addExam(exam);
    setExamsState(DataService.getExams());
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    DataService.updateExam(id, updates);
    setExamsState(DataService.getExams());
  };

  const deleteExam = (id: string) => {
    DataService.deleteExam(id);
    setExamsState(DataService.getExams());
  };

  const setMarks = (newMarks: ExamResult[]) => {
    setMarksState(newMarks);
    DataService.saveMarks(newMarks);
  };

  const addMark = (mark: ExamResult) => {
    DataService.addMark(mark);
    setMarksState(DataService.getMarks());
  };

  const updateMark = (id: string, updates: Partial<ExamResult>) => {
    DataService.updateMark(id, updates);
    setMarksState(DataService.getMarks());
  };

  const deleteMark = (id: string) => {
    DataService.deleteMark(id);
    setMarksState(DataService.getMarks());
  };

  const setTimetable = (newTimetable: TimetableEntry[] | ((prev: TimetableEntry[]) => TimetableEntry[])) => {
    if (typeof newTimetable === 'function') {
      setTimetableState(prev => {
        const updated = newTimetable(prev);
        DataService.saveTimetable(updated);
        return updated;
      });
    } else {
      setTimetableState(newTimetable);
      DataService.saveTimetable(newTimetable);
    }
  };

  const addTimetableEntry = (entry: TimetableEntry) => {
    setTimetableState(prev => {
      const updated = [...prev, entry];
      DataService.saveTimetable(updated);
      return updated;
    });
  };

  const updateTimetableEntry = (id: string, updates: Partial<TimetableEntry>) => {
    setTimetableState(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...updates } : item);
      DataService.saveTimetable(updated);
      return updated;
    });
  };

  const deleteTimetableEntry = (id: string) => {
    setTimetableState(prev => {
      const updated = prev.filter(item => item.id !== id);
      DataService.saveTimetable(updated);
      return updated;
    });
  };

  const copyWeekSchedule = (sourceClassId: string, targetClassId?: string): TimetableEntry[] => {
    const sourceEntries = timetable.filter(t => t.classId === sourceClassId);
    const newEntries = sourceEntries.map(entry => ({
      ...entry,
      id: `TT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      classId: targetClassId || sourceClassId
    }));
    return newEntries;
  };

  const setClasses = (newClasses: ClassGroup[]) => {
    const sorted = sortClasses(newClasses);
    setClassesState(sorted);
    DataService.saveClasses(sorted);
  };

  const addClass = (classGroup: ClassGroup) => {
    DataService.addClass(classGroup);
    setClassesState(sortClasses(DataService.getClasses()));
  };

  const updateClass = (id: string, updates: Partial<ClassGroup>) => {
    DataService.updateClass(id, updates);
    setClassesState(sortClasses(DataService.getClasses()));
  };

  const deleteClass = (id: string) => {
    DataService.deleteClass(id);
    setClassesState(sortClasses(DataService.getClasses()));
  };

  const setRooms = (newRooms: Room[]) => {
    setRoomsState(newRooms);
    DataService.saveRooms(newRooms);
  };

  const addRoom = (room: Room) => {
    DataService.addRoom(room);
    setRoomsState(DataService.getRooms());
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    DataService.updateRoom(id, updates);
    setRoomsState(DataService.getRooms());
  };

  const deleteRoom = (id: string) => {
    DataService.deleteRoom(id);
    setRoomsState(DataService.getRooms());
  };

  const setSubjects = (newSubjects: Subject[]) => {
    setSubjectsState(newSubjects);
    DataService.saveSubjects(newSubjects);
  };

  const addSubject = (subject: Subject) => {
    DataService.addSubject(subject);
    setSubjectsState(DataService.getSubjects());
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    DataService.updateSubject(id, updates);
    setSubjectsState(DataService.getSubjects());
  };

  const deleteSubject = (id: string) => {
    DataService.deleteSubject(id);
    setSubjectsState(DataService.getSubjects());
  };

  const setFeeStructures = (newFees: FeeType[]) => {
    setFeeStructuresState(newFees);
    DataService.saveFeeStructures(newFees);
  };

  const addFeeStructure = (fee: FeeType) => {
    DataService.addFeeStructure(fee);
    setFeeStructuresState(DataService.getFeeStructures());
  };

  const updateFeeStructure = (id: string, updates: Partial<FeeType>) => {
    DataService.updateFeeStructure(id, updates);
    setFeeStructuresState(DataService.getFeeStructures());
  };

  const deleteFeeStructure = (id: string) => {
    DataService.deleteFeeStructure(id);
    setFeeStructuresState(DataService.getFeeStructures());
  };

  const setAttendance = (newAttendance: StudentAttendanceDataset) => {
    setAttendanceState(newAttendance);
    DataService.saveAttendance(newAttendance);
  };

  const setStaffAttendance = (newAttendance: StaffAttendanceDataset) => {
    setStaffAttendanceState(newAttendance);
    DataService.saveStaffAttendance(newAttendance);
  };

  const setPayments = (newPayments: Payment[]) => {
    setPaymentsState(newPayments);
    DataService.savePayments(newPayments);
  };

  const addPayment = (payment: Payment) => {
    DataService.addPayment(payment);
    setPaymentsState(DataService.getPayments());
  };

  const refreshData = () => {
    loadData();
  };

  const value: DataContextType = {
    students,
    setStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    staff,
    setStaff,
    addStaff,
    updateStaff,
    deleteStaff,
    expenses,
    setExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    exams,
    setExams,
    addExam,
    updateExam,
    deleteExam,
    marks,
    setMarks,
    addMark,
    updateMark,
    deleteMark,
    timetable,
    setTimetable,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    copyWeekSchedule,
    classes,
    setClasses,
    addClass,
    updateClass,
    deleteClass,
    rooms,
    setRooms,
    addRoom,
    updateRoom,
    deleteRoom,
    subjects,
    setSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    feeStructures,
    setFeeStructures,
    addFeeStructure,
    updateFeeStructure,
    deleteFeeStructure,
    attendance,
    setAttendance,
    staffAttendance,
    setStaffAttendance,
    payments,
    setPayments,
    addPayment,
    refreshData,
    isSyncing,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};


