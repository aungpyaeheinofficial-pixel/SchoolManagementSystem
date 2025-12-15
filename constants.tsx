import { Student, Staff, NavItem, ClassGroup, Room, Subject, TimeSlot, TimetableEntry, Exam, ExamResult, FeeType, Expense } from './types';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  CalendarCheck, 
  CreditCard, 
  Briefcase,
  UserCog,
  Clock,
  BookOpen,
  LayoutGrid,
  Library,
  CalendarDays,
  ClipboardList,
  FileText,
  PenTool,
  ScrollText,
  Banknote,
  UserX,
  Receipt,
  BarChart3,
  GraduationCap,
  Wallet,
  CalendarDays as CalendarReport,
  TrendingUp,
  Settings
} from 'lucide-react';

export const APP_NAME_EN = "Pyin Nyar Nan Daw";
export const APP_NAME_MM = "ပညာနန်းတော်";

export const GRADE_LEVELS_LIST = [
  "KG (သူငယ်တန်း)",
  "Grade 1 (ပထမတန်း)",
  "Grade 2 (ဒုတိယတန်း)",
  "Grade 3 (တတိယတန်း)",
  "Grade 4 (စတုတ္ထတန်း)",
  "Grade 5 (ပဉ္စမတန်း)",
  "Grade 6 (ဆဋ္ဌမတန်း)",
  "Grade 7 (သတ္တမတန်း)",
  "Grade 8 (အဋ္ဌမတန်း)",
  "Grade 9 (နဝမတန်း)",
  "Grade 10 (ဒသမတန်း)",
  "Grade 11 (ဧကာဒသမတန်း)",
  "Grade 12 (ဒွါဒသမတန်း)"
];

export const STUDENTS_MOCK: Student[] = [
  {
    id: "ST-2024-001",
    nameEn: "Mg Aung Kyaw",
    nameMm: "မောင်အောင်ကျော်",
    fatherName: "U Mya",
    grade: "Grade 10 (A) - ဒသမတန်း",
    nrc: "12/UKaTa(N)123456",
    dob: "2008-05-12",
    status: 'Active',
    attendanceRate: 95,
    feesPending: 0,
    phone: "09-450012345",
    lastPaymentDate: "2024-12-01"
  },
  {
    id: "ST-2024-002",
    nameEn: "Ma Hla Hla",
    nameMm: "မလှလှ",
    fatherName: "U Ba",
    grade: "Grade 10 (A) - ဒသမတန်း",
    nrc: "12/BaHaNa(N)098765",
    dob: "2008-08-22",
    status: 'Fees Due',
    attendanceRate: 72,
    feesPending: 250000,
    phone: "09-790054321",
    lastPaymentDate: "2024-10-15"
  },
  {
    id: "ST-2024-003",
    nameEn: "Mg Thura Zaw",
    nameMm: "မောင်သူရဇော်",
    fatherName: "U Win",
    grade: "Grade 9 (B) - နဝမတန်း",
    nrc: "",
    dob: "2009-02-14",
    status: 'Active',
    attendanceRate: 88,
    feesPending: 0,
    phone: "09-250112233",
    lastPaymentDate: "2024-11-28"
  },
  {
    id: "ST-2024-004",
    nameEn: "Ma Ei Phyu",
    nameMm: "မအိဖြူ",
    fatherName: "U Thein Lwin",
    grade: "Grade 11 (Sci) - ဧကာဒသမတန်း",
    nrc: "12/KaMaYa(N)112233",
    dob: "2007-11-05",
    status: 'Active',
    attendanceRate: 98,
    feesPending: 150000,
    phone: "09-970088990",
    lastPaymentDate: "2024-11-05"
  },
  {
    id: "ST-2024-005",
    nameEn: "Mg Kyaw Kyaw",
    nameMm: "မောင်ကျော်ကျော်",
    fatherName: "U Soe",
    grade: "Grade 10 (A) - ဒသမတန်း",
    nrc: "12/TaMaNa(N)445566",
    dob: "2008-01-30",
    status: 'Suspended',
    attendanceRate: 45,
    feesPending: 400000,
    phone: "09-690077665",
    lastPaymentDate: "2024-09-20"
  },
  {
    id: "ST-2024-006",
    nameEn: "Mg Zayar",
    nameMm: "မောင်ဇေယျာ",
    fatherName: "U Hlaing",
    grade: "Grade 9 (A) - နဝမတန်း",
    nrc: "",
    dob: "2009-05-20",
    status: 'Fees Due',
    attendanceRate: 85,
    feesPending: 50000,
    phone: "09-778899001",
    lastPaymentDate: "2024-11-25"
  },
  {
    id: "ST-2024-007",
    nameEn: "Ma May Thu",
    nameMm: "မမေသူ",
    fatherName: "U Myo",
    grade: "Grade 11 (Arts) - ဧကာဒသမတန်း",
    nrc: "",
    dob: "2007-09-12",
    status: 'Fees Due',
    attendanceRate: 92,
    feesPending: 110000,
    phone: "09-445566778",
    lastPaymentDate: "2024-10-30"
  },
  {
    id: "ST-2024-008",
    nameEn: "Mg Arkar",
    nameMm: "မောင်အာကာ",
    fatherName: "U Tun",
    grade: "Grade 12 (A) - ဒွါဒသမတန်း",
    nrc: "",
    dob: "2006-12-05",
    status: 'Fees Due',
    attendanceRate: 60,
    feesPending: 600000,
    phone: "09-223344556",
    lastPaymentDate: "2024-08-15"
  }
];

export const STAFF_MOCK: Staff[] = [
  { id: "TF-001", name: "Daw Mya Mya Aye", role: "Senior Teacher", baseSalary: 450000, department: "Mathematics", joinDate: "2015-06-01" },
  { id: "TF-002", name: "U Win Htut", role: "Teacher", baseSalary: 350000, department: "Physics", joinDate: "2018-06-01" },
  { id: "TF-003", name: "Daw Su Su", role: "Teacher", baseSalary: 340000, department: "Myanmar", joinDate: "2019-06-01" },
  { id: "TF-004", name: "U Kyaw Swar", role: "Teacher", baseSalary: 380000, department: "Chemistry", joinDate: "2017-06-01" },
  { id: "AD-001", name: "Ma Hnin Wai", role: "Admin Officer", baseSalary: 300000, department: "Administration", joinDate: "2020-01-15" },
];

export const FEE_STRUCTURES_MOCK: FeeType[] = [
  { 
    id: "FEE-001", 
    nameEn: "High School Tuition", 
    nameMm: "အထက်တန်းကျောင်းလခ",
    amount: 50000, 
    frequency: "Monthly", 
    academicYear: "2024-2025", 
    applicableGrades: ["Grade 9", "Grade 10", "Grade 11", "Grade 12"],
    description: "Standard monthly tuition fee for high school students.",
    dueDate: "5th of every month",
    isActive: true
  },
  { 
    id: "FEE-002", 
    nameEn: "Middle School Tuition", 
    nameMm: "အလယ်တန်းကျောင်းလခ",
    amount: 45000, 
    frequency: "Monthly", 
    academicYear: "2024-2025", 
    applicableGrades: ["Grade 6", "Grade 7", "Grade 8"],
    description: "Standard monthly tuition fee for middle school students.",
    dueDate: "5th of every month",
    isActive: true
  },
  { 
    id: "FEE-003", 
    nameEn: "Registration Fee", 
    nameMm: "ကျောင်းအပ်ခ",
    amount: 20000, 
    frequency: "One-time", 
    academicYear: "2024-2025", 
    applicableGrades: ["All"],
    description: "Annual registration fee collected at the beginning of the year.",
    dueDate: "Upon Admission",
    isActive: true
  },
  { 
    id: "FEE-004", 
    nameEn: "Computer Lab Fee", 
    nameMm: "ကွန်ပျူတာကြေး",
    amount: 5000, 
    frequency: "Monthly", 
    academicYear: "2024-2025", 
    applicableGrades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11"],
    description: "Fee for maintenance of computer lab facilities.",
    dueDate: "5th of every month",
    isActive: true
  },
];

export const EXPENSES_MOCK: Expense[] = [
  {
    id: "EXP-001",
    category: "Salaries",
    description: "November Staff Salaries",
    descriptionMm: "နိုဝင်ဘာလ ဝန်ထမ်းလစာများ",
    amount: 8500000,
    date: "2024-11-30",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    vendor: "Staff Payroll",
    receiptNo: "SAL-2024-11",
    approvedBy: "Principal",
    recurring: true,
    recurringPeriod: "Monthly"
  },
  {
    id: "EXP-002",
    category: "Utilities",
    description: "Electricity Bill - November",
    descriptionMm: "နိုဝင်ဘာလ လျှပ်စစ်ဘီလ်",
    amount: 450000,
    date: "2024-11-15",
    dueDate: "2024-11-25",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    vendor: "YESB (Yangon Electricity)",
    receiptNo: "ELEC-2024-11",
    approvedBy: "Admin Officer",
    recurring: true,
    recurringPeriod: "Monthly"
  },
  {
    id: "EXP-003",
    category: "Utilities",
    description: "Water Bill - November",
    descriptionMm: "နိုဝင်ဘာလ ရေဘီလ်",
    amount: 85000,
    date: "2024-11-10",
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "YCDC",
    receiptNo: "WTR-2024-11",
    approvedBy: "Admin Officer",
    recurring: true,
    recurringPeriod: "Monthly"
  },
  {
    id: "EXP-004",
    category: "Supplies",
    description: "Stationery & Office Supplies",
    descriptionMm: "စာရေးကိရိယာနှင့် ရုံးသုံးပစ္စည်းများ",
    amount: 320000,
    date: "2024-11-05",
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "City Mart Stationery",
    receiptNo: "SUP-2024-11-01",
    approvedBy: "Admin Officer"
  },
  {
    id: "EXP-005",
    category: "Maintenance",
    description: "AC Repair - Building A",
    descriptionMm: "အဆောက်အအုံ (က) လေအေးပေးစက် ပြုပြင်ခြင်း",
    amount: 180000,
    date: "2024-11-20",
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "Cool Tech Services",
    receiptNo: "MNT-2024-11-01",
    approvedBy: "Principal"
  },
  {
    id: "EXP-006",
    category: "Transportation",
    description: "School Bus Fuel - November",
    descriptionMm: "နိုဝင်ဘာလ ကျောင်းကား ဆီဖိုး",
    amount: 650000,
    date: "2024-11-28",
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "Max Energy Fuel Station",
    receiptNo: "FUEL-2024-11",
    approvedBy: "Admin Officer",
    recurring: true,
    recurringPeriod: "Monthly"
  },
  {
    id: "EXP-007",
    category: "Events",
    description: "Sports Day Event Expenses",
    descriptionMm: "အားကစားနေ့ ပွဲတော် အသုံးစရိတ်",
    amount: 520000,
    date: "2024-11-18",
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "Various",
    receiptNo: "EVT-2024-11-01",
    approvedBy: "Principal",
    notes: "Includes prizes, refreshments, decorations"
  },
  {
    id: "EXP-008",
    category: "Equipment",
    description: "New Projector for Lab",
    descriptionMm: "ဓာတ်ခွဲခန်းအတွက် ပရိုဂျက်တာအသစ်",
    amount: 850000,
    date: "2024-11-12",
    paymentMethod: "Bank Transfer",
    status: "Paid",
    vendor: "IT Galaxy",
    receiptNo: "EQP-2024-11-01",
    approvedBy: "Principal"
  },
  {
    id: "EXP-009",
    category: "Rent",
    description: "December Building Rent",
    descriptionMm: "ဒီဇင်ဘာလ အဆောက်အအုံ ငှားရမ်းခ",
    amount: 3000000,
    date: "2024-12-01",
    dueDate: "2024-12-05",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    vendor: "Building Owner",
    approvedBy: "Principal",
    recurring: true,
    recurringPeriod: "Monthly"
  },
  {
    id: "EXP-010",
    category: "Insurance",
    description: "Annual School Insurance",
    descriptionMm: "နှစ်စဉ် ကျောင်းအာမခံ",
    amount: 1200000,
    date: "2024-12-15",
    dueDate: "2024-12-20",
    paymentMethod: "Cheque",
    status: "Pending",
    vendor: "Myanmar Insurance",
    approvedBy: "Principal",
    recurring: true,
    recurringPeriod: "Yearly"
  },
  {
    id: "EXP-011",
    category: "Supplies",
    description: "Science Lab Chemicals",
    descriptionMm: "သိပ္ပံဓာတ်ခွဲခန်း ဓာတုပစ္စည်းများ",
    amount: 280000,
    date: "2024-11-25",
    paymentMethod: "Cash",
    status: "Paid",
    vendor: "Lab Supplies Co.",
    receiptNo: "SUP-2024-11-02",
    approvedBy: "Science Dept Head"
  },
  {
    id: "EXP-012",
    category: "Others",
    description: "Printing - Report Cards",
    descriptionMm: "အမှတ်စာရင်းကတ် ပုံနှိပ်ခ",
    amount: 150000,
    date: "2024-12-10",
    dueDate: "2024-12-12",
    paymentMethod: "Cash",
    status: "Pending",
    vendor: "Golden Print",
    approvedBy: "Admin Officer"
  }
];

export const EXPENSE_CATEGORIES = [
  { id: 'Salaries', labelEn: 'Salaries', labelMm: 'လစာများ', color: 'bg-blue-500' },
  { id: 'Utilities', labelEn: 'Utilities', labelMm: 'အသုံးအဆောင်များ', color: 'bg-amber-500' },
  { id: 'Supplies', labelEn: 'Supplies', labelMm: 'ပစ္စည်းများ', color: 'bg-green-500' },
  { id: 'Maintenance', labelEn: 'Maintenance', labelMm: 'ပြုပြင်ထိန်းသိမ်းမှု', color: 'bg-orange-500' },
  { id: 'Transportation', labelEn: 'Transportation', labelMm: 'သယ်ယူပို့ဆောင်ရေး', color: 'bg-purple-500' },
  { id: 'Events', labelEn: 'Events', labelMm: 'ပွဲအခမ်းအနားများ', color: 'bg-pink-500' },
  { id: 'Equipment', labelEn: 'Equipment', labelMm: 'ကိရိယာတန်ဆာများ', color: 'bg-indigo-500' },
  { id: 'Rent', labelEn: 'Rent', labelMm: 'ငှားရမ်းခ', color: 'bg-red-500' },
  { id: 'Insurance', labelEn: 'Insurance', labelMm: 'အာမခံ', color: 'bg-teal-500' },
  { id: 'Others', labelEn: 'Others', labelMm: 'အခြား', color: 'bg-slate-500' },
];

export const CLASSES_MOCK: ClassGroup[] = [
  // Primary & Middle School (Added)
  { id: "CL-KG", name: "KG (သူငယ်တန်း)", gradeLevel: "KG", section: "A", teacherId: "TF-005", teacherName: "Daw Nu Nu", roomId: "RM-KG", roomName: "KG Room", studentCount: 20, maxCapacity: 25 },
  { id: "CL-G1", name: "Grade 1 (ပထမတန်း)", gradeLevel: "Grade 1", section: "A", teacherId: "TF-006", teacherName: "Daw Aye Aye", roomId: "RM-101", roomName: "Room 101", studentCount: 25, maxCapacity: 30 },
  { id: "CL-G2", name: "Grade 2 (ဒုတိယတန်း)", gradeLevel: "Grade 2", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-102", roomName: "Room 102", studentCount: 28, maxCapacity: 30 },
  { id: "CL-G3", name: "Grade 3 (တတိယတန်း)", gradeLevel: "Grade 3", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-103", roomName: "Room 103", studentCount: 30, maxCapacity: 35 },
  { id: "CL-G4", name: "Grade 4 (စတုတ္ထတန်း)", gradeLevel: "Grade 4", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-104", roomName: "Room 104", studentCount: 30, maxCapacity: 35 },
  { id: "CL-G5", name: "Grade 5 (ပဉ္စမတန်း)", gradeLevel: "Grade 5", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-105", roomName: "Room 105", studentCount: 32, maxCapacity: 40 },
  { id: "CL-G6", name: "Grade 6 (ဆဋ္ဌမတန်း)", gradeLevel: "Grade 6", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-106", roomName: "Room 106", studentCount: 35, maxCapacity: 40 },
  { id: "CL-G7", name: "Grade 7 (သတ္တမတန်း)", gradeLevel: "Grade 7", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-107", roomName: "Room 107", studentCount: 35, maxCapacity: 40 },
  { id: "CL-G8", name: "Grade 8 (အဋ္ဌမတန်း)", gradeLevel: "Grade 8", section: "A", teacherId: "TF-NEW", teacherName: "TBD", roomId: "RM-108", roomName: "Room 108", studentCount: 35, maxCapacity: 40 },
  
  // High School (Existing with updated names)
  { id: "CL-09A", name: "Grade 9 (A) - နဝမတန်း", gradeLevel: "Grade 9", section: "A", teacherId: "TF-003", teacherName: "Daw Su Su", roomId: "RM-103", roomName: "Room 103", studentCount: 40, maxCapacity: 45 },
  { id: "CL-09B", name: "Grade 9 (B) - နဝမတန်း", gradeLevel: "Grade 9", section: "B", teacherId: "TF-002", teacherName: "U Win Htut", roomId: "RM-104", roomName: "Room 104", studentCount: 38, maxCapacity: 45 },
  { id: "CL-10A", name: "Grade 10 (A) - ဒသမတန်း", gradeLevel: "Grade 10", section: "A", teacherId: "TF-001", teacherName: "Daw Mya Mya Aye", roomId: "RM-101", roomName: "Room 101", studentCount: 38, maxCapacity: 40 },
  { id: "CL-10B", name: "Grade 10 (B) - ဒသမတန်း", gradeLevel: "Grade 10", section: "B", teacherId: "TF-002", teacherName: "U Win Htut", roomId: "RM-102", roomName: "Room 102", studentCount: 35, maxCapacity: 40 },
  { id: "CL-11S", name: "Grade 11 (Sci) - ဧကာဒသမတန်း", gradeLevel: "Grade 11", section: "Sci", teacherId: "TF-004", teacherName: "U Kyaw Swar", roomId: "RM-LAB1", roomName: "Science Lab 1", studentCount: 28, maxCapacity: 30 },
  { id: "CL-11A", name: "Grade 11 (Arts) - ဧကာဒသမတန်း", gradeLevel: "Grade 11", section: "Arts", teacherId: "TF-003", teacherName: "Daw Su Su", roomId: "RM-105", roomName: "Room 105", studentCount: 32, maxCapacity: 40 },
  { id: "CL-12A", name: "Grade 12 (A) - ဒွါဒသမတန်း", gradeLevel: "Grade 12", section: "A", teacherId: "TF-001", teacherName: "Daw Mya Mya Aye", roomId: "RM-106", roomName: "Room 106", studentCount: 30, maxCapacity: 40 },
];

export const ROOMS_MOCK: Room[] = [
  { id: "RM-101", number: "101", building: "Main Building", type: "Classroom", capacity: 40, isOccupied: true, facilities: ["Projector", "Whiteboard", "AC"] },
  { id: "RM-102", number: "102", building: "Main Building", type: "Classroom", capacity: 40, isOccupied: true, facilities: ["Whiteboard", "Fan"] },
  { id: "RM-103", number: "103", building: "Main Building", type: "Classroom", capacity: 45, isOccupied: true, facilities: ["Smartboard", "AC"] },
  { id: "RM-LAB1", number: "Lab-1", building: "Science Wing", type: "Laboratory", capacity: 30, isOccupied: true, facilities: ["Chemical Storage", "Safety Shower", "Projector"] },
  { id: "RM-LAB2", number: "Lab-2", building: "Science Wing", type: "Laboratory", capacity: 30, isOccupied: false, facilities: ["Computers", "Internet"] },
  { id: "RM-HALL", number: "Main Hall", building: "Main Building", type: "Hall", capacity: 200, isOccupied: false, facilities: ["Stage", "Sound System"] },
];

export const SUBJECTS_MOCK: Subject[] = [
  { id: "SUB-001", code: "MYA-10", nameEn: "Myanmar", nameMm: "မြန်မာစာ", gradeLevel: "Grade 10", type: "Core", periodsPerWeek: 5, department: "Myanmar" },
  { id: "SUB-002", code: "ENG-10", nameEn: "English", nameMm: "အင်္ဂလိပ်စာ", gradeLevel: "Grade 10", type: "Core", periodsPerWeek: 5, department: "English" },
  { id: "SUB-003", code: "MAT-10", nameEn: "Mathematics", nameMm: "သင်္ချာ", gradeLevel: "Grade 10", type: "Core", periodsPerWeek: 6, department: "Mathematics" },
  { id: "SUB-004", code: "PHY-10", nameEn: "Physics", nameMm: "ရူပဗေဒ", gradeLevel: "Grade 10", type: "Core", periodsPerWeek: 4, department: "Science" },
  { id: "SUB-005", code: "CHE-10", nameEn: "Chemistry", nameMm: "ဓာတုဗေဒ", gradeLevel: "Grade 10", type: "Core", periodsPerWeek: 4, department: "Science" },
  { id: "SUB-006", code: "BIO-10", nameEn: "Biology", nameMm: "ဇီဝဗေဒ", gradeLevel: "Grade 10", type: "Core", periodsPerWeek: 4, department: "Science" },
  { id: "SUB-007", code: "ECO-10", nameEn: "Economics", nameMm: "ဘောဂဗေဒ", gradeLevel: "Grade 10", type: "Elective", periodsPerWeek: 4, department: "Arts" },
  { id: "SUB-008", code: "HIS-10", nameEn: "History", nameMm: "သမိုင်း", gradeLevel: "Grade 10", type: "Elective", periodsPerWeek: 4, department: "Arts" },
  { id: "SUB-009", code: "PE-ALL", nameEn: "Physical Education", nameMm: "ကာယ", gradeLevel: "All", type: "Activity", periodsPerWeek: 2, department: "Sports" },
  { id: "SUB-010", code: "CS-10", nameEn: "Computer Science", nameMm: "ကွန်ပျူတာ", gradeLevel: "Grade 10", type: "Activity", periodsPerWeek: 2, department: "IT" },
  { id: "SUB-IGCSE-ENG", code: "IG-ENG", nameEn: "IGCSE English", nameMm: "IGCSE အင်္ဂလိပ်စာ", gradeLevel: "All", type: "Core", periodsPerWeek: 4, department: "English" },
  { id: "SUB-BREAK", code: "BREAK", nameEn: "Break Time", nameMm: "အားလပ်ချိန်", gradeLevel: "All", type: "Activity", periodsPerWeek: 5, department: "General" },
  { id: "SUB-LUNCH", code: "LUNCH", nameEn: "Lunch Break", nameMm: "ထမင်းစားချိန်", gradeLevel: "All", type: "Activity", periodsPerWeek: 5, department: "General" },
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: 1, startTime: "09:00", endTime: "09:45", label: "Period 1" },
  { id: 2, startTime: "09:45", endTime: "10:30", label: "Period 2" },
  { id: 3, startTime: "10:30", endTime: "11:00", label: "Break" },
  { id: 4, startTime: "11:00", endTime: "11:45", label: "Period 3" },
  { id: 5, startTime: "11:45", endTime: "12:30", label: "Period 4" },
  { id: 6, startTime: "12:30", endTime: "13:30", label: "Lunch" },
  { id: 7, startTime: "13:30", endTime: "14:15", label: "Period 5" },
  { id: 8, startTime: "14:15", endTime: "15:00", label: "Period 6" },
];

export const TIMETABLE_MOCK: TimetableEntry[] = [
  // Grade 10 A Schedule
  { id: "TT-01", classId: "CL-10A", day: "Monday", periodId: 1, subjectId: "SUB-001", teacherId: "TF-003", curriculumType: "Public" },
  { id: "TT-02", classId: "CL-10A", day: "Monday", periodId: 2, subjectId: "SUB-002", teacherId: "TF-001", curriculumType: "Public" }, // Conflict created here if TF-001 is assigned elsewhere
  { id: "TT-03", classId: "CL-10A", day: "Monday", periodId: 4, subjectId: "SUB-003", teacherId: "TF-001", curriculumType: "Public" },
  { id: "TT-04", classId: "CL-10A", day: "Tuesday", periodId: 1, subjectId: "SUB-003", teacherId: "TF-001", curriculumType: "Public" },
  { id: "TT-05", classId: "CL-10A", day: "Tuesday", periodId: 2, subjectId: "SUB-004", teacherId: "TF-002", curriculumType: "Public" },
  
  // Grade 10 B Schedule (Creating a conflict: TF-001 is busy on Mon Period 2 in 10A)
  { id: "TT-06", classId: "CL-10B", day: "Monday", periodId: 1, subjectId: "SUB-003", teacherId: "TF-001", curriculumType: "Public" },
  { id: "TT-07", classId: "CL-10B", day: "Monday", periodId: 2, subjectId: "SUB-003", teacherId: "TF-001", curriculumType: "Public" }, // CONFLICT: TF-001 is also in 10A at this time
  
  // Private Curriculum Example
  { id: "TT-08", classId: "CL-10A", day: "Wednesday", periodId: 1, subjectId: "SUB-IGCSE-ENG", teacherId: "TF-002", curriculumType: "Private" },
  { id: "TT-09", classId: "CL-10A", day: "Wednesday", periodId: 2, subjectId: "SUB-010", teacherId: "TF-004", curriculumType: "Private" },
];

export const EXAMS_MOCK: Exam[] = [
  { 
    id: "EX-001", 
    name: "October Mid-Term Assessment", 
    academicYear: "2024-2025", 
    term: "Term 1", 
    startDate: "2024-10-05", 
    endDate: "2024-10-12", 
    status: "Completed", 
    classes: ["CL-10A", "CL-10B", "CL-09A"] 
  },
  { 
    id: "EX-002", 
    name: "December Finals", 
    academicYear: "2024-2025", 
    term: "Term 1", 
    startDate: "2024-12-15", 
    endDate: "2024-12-22", 
    status: "Upcoming", 
    classes: ["CL-10A", "CL-10B", "CL-09A", "CL-11S"] 
  },
  { 
    id: "EX-003", 
    name: "March Matriculation Mock", 
    academicYear: "2024-2025", 
    term: "Term 2", 
    startDate: "2025-03-01", 
    endDate: "2025-03-10", 
    status: "Upcoming", 
    classes: ["CL-12A"] 
  },
];

export const MARKS_MOCK: ExamResult[] = [
  // Mg Aung Kyaw (Grade 10 A) - Oct Mid Term
  { id: "MK-001", examId: "EX-001", studentId: "ST-2024-001", subjectId: "SUB-001", score: 85, grade: "A", remark: "Excellent" },
  { id: "MK-002", examId: "EX-001", studentId: "ST-2024-001", subjectId: "SUB-002", score: 78, grade: "B", remark: "Good" },
  { id: "MK-003", examId: "EX-001", studentId: "ST-2024-001", subjectId: "SUB-003", score: 92, grade: "A+", remark: "Outstanding" },
  
  // Ma Hla Hla (Grade 10 A) - Oct Mid Term
  { id: "MK-004", examId: "EX-001", studentId: "ST-2024-002", subjectId: "SUB-001", score: 70, grade: "B", remark: "Good" },
  { id: "MK-005", examId: "EX-001", studentId: "ST-2024-002", subjectId: "SUB-002", score: 65, grade: "C", remark: "Satisfactory" },
  { id: "MK-006", examId: "EX-001", studentId: "ST-2024-002", subjectId: "SUB-003", score: 55, grade: "D", remark: "Needs improvement" },
];

export const NAV_ITEMS: NavItem[] = [
  { id: 'DASHBOARD', labelEn: 'Dashboard', labelMm: 'ပင်မစာမျက်နှာ', icon: LayoutDashboard },
  { id: 'STUDENTS', labelEn: 'Students', labelMm: 'ကျောင်းသားစာရင်း', icon: Users },
  
  // Education Management Group
  {
    id: 'ACADEMIC_GROUP',
    labelEn: 'Education Mgmt',
    labelMm: 'ပညာရေးစီမံခန့်ခွဲမှု',
    icon: BookOpen,
    children: [
      { id: 'ACADEMIC_CLASSES', labelEn: 'Classes & Rooms', labelMm: 'အတန်းနှင့်အခန်းများ', icon: LayoutGrid },
      { id: 'ACADEMIC_SUBJECTS', labelEn: 'Subjects', labelMm: 'ဘာသာရပ်များ', icon: Library },
      { id: 'ACADEMIC_TIMETABLE', labelEn: 'Timetable', labelMm: 'အချိန်ဇယား', icon: CalendarDays },
    ]
  },

  // Exams & Results Group
  {
    id: 'EXAM_GROUP',
    labelEn: 'Exams & Results',
    labelMm: 'စာမေးပွဲနှင့်ရလဒ်',
    icon: ClipboardList,
    children: [
      { id: 'EXAM_MANAGEMENT', labelEn: 'Exam Management', labelMm: 'စာမေးပွဲစီမံခန့်ခွဲမှု', icon: FileText },
      { id: 'EXAM_MARKS_ENTRY', labelEn: 'Mark Entry', labelMm: 'အမှတ်ထည့်သွင်းခြင်း', icon: PenTool },
      { id: 'EXAM_REPORT_CARDS', labelEn: 'Report Cards', labelMm: 'အမှတ်စာရင်းကတ်', icon: ScrollText },
      { id: 'EXAM_ANALYTICS', labelEn: 'Analytics', labelMm: 'ခွဲခြမ်းစိတ်ဖြာမှု', icon: BarChart3 },
    ]
  },

  { id: 'ATTENDANCE', labelEn: 'Attendance', labelMm: 'တက်ရောက်မှု', icon: CalendarCheck },
  
  // Finance Group (New Structure)
  { 
    id: 'FINANCE_GROUP', 
    labelEn: 'Finance', 
    labelMm: 'ဘဏ္ဍာရေး', 
    icon: CreditCard,
    children: [
      { id: 'FINANCE_FEES', labelEn: 'Fee Structures', labelMm: 'ကြေးနှုန်းထားများ', icon: ScrollText },
      { id: 'FINANCE_PAYMENTS', labelEn: 'Payment Entry', labelMm: 'ငွေပေးသွင်းမှု', icon: Banknote },
      { id: 'FINANCE_UNPAID', labelEn: 'Unpaid List', labelMm: 'မပေးသေးသူစာရင်း', icon: UserX },
      { id: 'FINANCE_EXPENSES', labelEn: 'Expenses', labelMm: 'အသုံးစရိတ်များ', icon: Receipt },
    ]
  },

  { 
    id: 'HR_GROUP', 
    labelEn: 'HR & Payroll', 
    labelMm: 'ဝန်ထမ်းရေးရာ', 
    icon: Briefcase,
    children: [
      { id: 'HR', labelEn: 'Staff List & Payroll', labelMm: 'လစာနှင့်ဝန်ထမ်းစာရင်း', icon: UserCog },
      { id: 'HR_ATTENDANCE', labelEn: 'Staff Attendance', labelMm: 'ဝန်ထမ်းတက်ရောက်မှု', icon: Clock },
    ]
  },

  // Reports Group
  {
    id: 'REPORTS_GROUP',
    labelEn: 'Reports',
    labelMm: 'အစီရင်ခံစာများ',
    icon: BarChart3,
    children: [
      { id: 'REPORTS_STUDENTS', labelEn: 'Student Reports', labelMm: 'ကျောင်းသားအစီရင်ခံစာ', icon: GraduationCap },
      { id: 'REPORTS_FINANCE', labelEn: 'Financial Reports', labelMm: 'ဘဏ္ဍာရေးအစီရင်ခံစာ', icon: Wallet },
      { id: 'REPORTS_ATTENDANCE', labelEn: 'Attendance Reports', labelMm: 'တက်ရောက်မှုအစီရင်ခံစာ', icon: CalendarCheck },
      { id: 'REPORTS_ACADEMIC', labelEn: 'Academic Reports', labelMm: 'ပညာရေးအစီရင်ခံစာ', icon: TrendingUp },
    ]
  },

  // Settings
  { id: 'SETTINGS', labelEn: 'Settings', labelMm: 'ဆက်တင်များ', icon: Settings },
];

export const calculateSSB = (salary: number) => {
  const cappedSalary = Math.min(salary, 300000);
  const employeeContribution = cappedSalary * 0.02;
  const employerContribution = cappedSalary * 0.03;
  return { employee: employeeContribution, employer: employerContribution };
};