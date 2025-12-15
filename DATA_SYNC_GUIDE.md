# Real-Life Data Syncing System Guide

## Overview
Your school management system now has a complete real-life data syncing system that:
- ✅ Persists all data to localStorage (can be upgraded to backend API)
- ✅ Syncs data across all components automatically
- ✅ Provides CRUD operations for all entities
- ✅ Supports data export/import for backup
- ✅ Real-time updates across the application

## Architecture

### 1. Data Service Layer (`services/dataService.ts`)
- Handles all data operations (CRUD)
- Manages localStorage persistence
- Provides export/import functionality
- Emits events for data updates

### 2. Data Context (`contexts/DataContext.tsx`)
- React Context Provider for shared state
- Provides hooks for components to access data
- Automatically syncs data across components
- Handles data loading and saving

### 3. Components Integration
- Components use `useData()` hook to access data
- All CRUD operations sync automatically
- No need to pass props down multiple levels

## How to Use

### In Components

```typescript
import { useData } from '../contexts/DataContext';

const MyComponent: React.FC = () => {
  // Get data and functions from context
  const { 
    students, 
    addStudent, 
    updateStudent, 
    deleteStudent,
    expenses,
    addExpense,
    // ... etc
  } = useData();

  // Add new student
  const handleAdd = () => {
    addStudent({
      id: 'ST-001',
      nameEn: 'John Doe',
      // ... other fields
    });
  };

  // Update student
  const handleUpdate = (id: string) => {
    updateStudent(id, { 
      nameEn: 'Updated Name' 
    });
  };

  // Delete student
  const handleDelete = (id: string) => {
    deleteStudent(id);
  };
};
```

## Available Data Entities

### Students
- `students` - Array of all students
- `addStudent(student)` - Add new student
- `updateStudent(id, updates)` - Update student
- `deleteStudent(id)` - Delete student
- `setStudents(students)` - Replace all students

### Staff
- `staff` - Array of all staff
- `addStaff(member)` - Add new staff
- `updateStaff(id, updates)` - Update staff
- `deleteStaff(id)` - Delete staff
- `setStaff(staff)` - Replace all staff

### Expenses
- `expenses` - Array of all expenses
- `addExpense(expense)` - Add new expense
- `updateExpense(id, updates)` - Update expense
- `deleteExpense(id)` - Delete expense
- `setExpenses(expenses)` - Replace all expenses

### Exams
- `exams` - Array of all exams
- `addExam(exam)` - Add new exam
- `updateExam(id, updates)` - Update exam
- `deleteExam(id)` - Delete exam
- `setExams(exams)` - Replace all exams

### Exam Marks/Results
- `marks` - Array of all exam results
- `addMark(mark)` - Add new mark
- `updateMark(id, updates)` - Update mark
- `deleteMark(id)` - Delete mark
- `setMarks(marks)` - Replace all marks

### Timetable
- `timetable` - Array of timetable entries
- `setTimetable(timetable)` - Update timetable

### Classes
- `classes` - Array of all classes
- `addClass(classGroup)` - Add new class
- `updateClass(id, updates)` - Update class
- `deleteClass(id)` - Delete class
- `setClasses(classes)` - Replace all classes

### Rooms
- `rooms` - Array of all rooms
- `addRoom(room)` - Add new room
- `updateRoom(id, updates)` - Update room
- `deleteRoom(id)` - Delete room
- `setRooms(rooms)` - Replace all rooms

### Subjects
- `subjects` - Array of all subjects
- `addSubject(subject)` - Add new subject
- `updateSubject(id, updates)` - Update subject
- `deleteSubject(id)` - Delete subject
- `setSubjects(subjects)` - Replace all subjects

### Fee Structures
- `feeStructures` - Array of all fee structures
- `addFeeStructure(fee)` - Add new fee structure
- `updateFeeStructure(id, updates)` - Update fee structure
- `deleteFeeStructure(id)` - Delete fee structure
- `setFeeStructures(fees)` - Replace all fee structures

### Attendance
- `attendance` - Object with attendance records
- `setAttendance(attendance)` - Update attendance

### Staff Attendance
- `staffAttendance` - Object with staff attendance records
- `setStaffAttendance(attendance)` - Update staff attendance

### Payments
- `payments` - Array of all payments
- `addPayment(payment)` - Add new payment
- `setPayments(payments)` - Replace all payments

## Data Persistence

### localStorage Keys
All data is stored in localStorage with these keys:
- `pnsp_students`
- `pnsp_staff`
- `pnsp_expenses`
- `pnsp_exams`
- `pnsp_marks`
- `pnsp_timetable`
- `pnsp_classes`
- `pnsp_rooms`
- `pnsp_subjects`
- `pnsp_fee_structures`
- `pnsp_attendance`
- `pnsp_staff_attendance`
- `pnsp_payments`

### Automatic Sync
- Data is automatically saved to localStorage on every change
- All components receive updates via React Context
- No manual save required - everything syncs automatically

## Export/Import Data

### Export All Data
```typescript
import { DataService } from '../services/dataService';

const exportData = () => {
  const jsonData = DataService.exportAllData();
  // Download as file
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pnsp-backup-${new Date().toISOString()}.json`;
  link.click();
};
```

### Import Data
```typescript
const importData = (jsonData: string) => {
  const success = DataService.importAllData(jsonData);
  if (success) {
    // Data imported, components will auto-refresh
    alert('Data imported successfully!');
  }
};
```

## Upgrading to Backend API

To upgrade from localStorage to a real backend API:

1. **Update DataService** methods to call API endpoints:
```typescript
static async getStudents(): Promise<Student[]> {
  const response = await fetch('/api/students');
  return response.json();
}

static async saveStudents(students: Student[]): Promise<void> {
  await fetch('/api/students', {
    method: 'POST',
    body: JSON.stringify(students),
    headers: { 'Content-Type': 'application/json' }
  });
}
```

2. **Update DataContext** to use async methods:
```typescript
const loadData = async () => {
  setIsSyncing(true);
  try {
    setStudentsState(await DataService.getStudents());
    // ... other data
  } finally {
    setIsSyncing(false);
  }
};
```

3. **Add error handling** for network failures
4. **Add loading states** for async operations

## Components Already Updated

✅ **App.tsx** - Uses DataProvider
✅ **StudentList** - Uses real student data
✅ **ExpenseManagement** - Uses real expense data
✅ **UnpaidList** - Uses real student data
✅ **Dashboard** - Uses real stats from data

## Components Still Using Mock Data

These components can be updated to use `useData()` hook:
- `ExamMarkEntry.tsx`
- `ExamManagement.tsx`
- `ExamReportCards.tsx`
- `HR.tsx`
- `StaffAttendance.tsx`
- `AcademicClasses.tsx`
- `AcademicSubjects.tsx`
- `Attendance.tsx`
- `PaymentEntry.tsx`
- `Reports.tsx`
- `Finance.tsx`

## Benefits

1. **Real Data Persistence** - All changes are saved automatically
2. **Cross-Component Sync** - Update in one place, see everywhere
3. **No Prop Drilling** - Access data directly via context
4. **Easy Backup** - Export/import functionality built-in
5. **Scalable** - Easy to upgrade to backend API
6. **Type Safe** - Full TypeScript support

## Example: Adding New Feature with Data Sync

```typescript
import { useData } from '../contexts/DataContext';

const NewFeature: React.FC = () => {
  const { students, addStudent, updateStudent } = useData();

  const handleAdd = () => {
    addStudent({
      id: `ST-${Date.now()}`,
      nameEn: 'New Student',
      // ... other required fields
    });
    // Data automatically syncs to localStorage
    // All other components see the update immediately
  };

  return (
    <div>
      <p>Total Students: {students.length}</p>
      <button onClick={handleAdd}>Add Student</button>
    </div>
  );
};
```

## Next Steps

1. Update remaining components to use `useData()` hook
2. Add validation before saving data
3. Add error handling for failed operations
4. Consider adding optimistic updates for better UX
5. When ready, upgrade to backend API integration


