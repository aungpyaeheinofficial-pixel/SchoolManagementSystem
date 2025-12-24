import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  ChevronDown
} from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { AttendanceStatus, StudentAttendanceDataset } from '../types';
import { useData } from '../contexts/DataContext';

type StatusType = AttendanceStatus;

interface AttendanceRecord {
  status: StatusType;
  remark: string;
}

interface AttendanceState {
  [studentId: string]: AttendanceRecord;
}

export const Attendance: React.FC = () => {
  const { classes, students, attendance: attendanceStore, setAttendance: setAttendanceStore } = useData();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const dateKey = useMemo(() => {
    const d = dateRange?.from ?? new Date();
    return d.toISOString().slice(0, 10);
  }, [dateRange?.from]);

  useEffect(() => {
    if (!selectedClassId && classes.length) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classStudents = useMemo(() => {
    const cls = classes.find((c) => c.id === selectedClassId);
    if (!cls) return [];
    // Simple mapping: student.grade string often matches class.name
    return students.filter((s) => s.grade === cls.name);
  }, [classes, selectedClassId, students]);
  
  // Initialize all students as PRESENT
  const [attendance, setAttendance] = useState<AttendanceState>({});
  
  const [isSaving, setIsSaving] = useState(false);

  // Load existing saved attendance for date+class into local editable state
  useEffect(() => {
    if (!selectedClassId) return;
    const savedForClass = (attendanceStore?.[dateKey]?.[selectedClassId] || {}) as Record<
      string,
      { status: StatusType; remark: string }
    >;

    const next: AttendanceState = {};
    for (const s of classStudents) {
      next[s.id] = savedForClass[s.id] ?? { status: 'PRESENT', remark: '' };
    }
    setAttendance(next);
  }, [attendanceStore, classStudents, dateKey, selectedClassId]);

  // Dynamic Stats Calculation
  const stats = useMemo(() => {
    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 };
    Object.values(attendance).forEach((record: AttendanceRecord) => {
      counts[record.status]++;
    });
    return counts;
  }, [attendance]);

  const handleStatusChange = (studentId: string, status: StatusType) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remark }
    }));
  };

  const handleSave = () => {
    if (!selectedClassId) return;
    setIsSaving(true);

    const nextStore: StudentAttendanceDataset = {
      ...(attendanceStore || {}),
      [dateKey]: {
        ...((attendanceStore && attendanceStore[dateKey]) || {}),
        [selectedClassId]: Object.fromEntries(
          Object.entries(attendance).map(([studentId, rec]) => [studentId, { status: rec.status, remark: rec.remark }])
        ),
      },
    };

    setAttendanceStore(nextStore);
    setTimeout(() => setIsSaving(false), 400);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Daily Attendance</h2>
          <p className="text-slate-500 font-burmese text-sm mt-1 leading-loose">နေ့စဉ် ကျောင်းခေါ်ချိန်မှတ်တမ်း</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 z-20">
          {/* Controls Group */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
             {/* Advanced Date Picker */}
             <DateRangePicker date={dateRange} setDate={setDateRange} />
             
             <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
             
             {/* Class Selector */}
             <div className="relative group hidden sm:block">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors" size={16} />
                <select 
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-transparent text-sm font-bold text-slate-600 outline-none rounded-xl hover:bg-slate-50 transition-colors cursor-pointer appearance-none min-w-[180px] font-burmese"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-brand-600/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <>Saving...</>
            ) : (
               <>
                 <Save size={18} />
                 <span>Save</span>
               </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Present</p>
               <p className="text-2xl font-bold text-slate-800">{stats.PRESENT}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
               <XCircle size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Absent</p>
               <p className="text-2xl font-bold text-slate-800">{stats.ABSENT}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Late</p>
               <p className="text-2xl font-bold text-slate-800">{stats.LATE}</p>
            </div>
         </div>
         <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 flex items-center gap-4 hover:translate-y-[-2px] transition-transform duration-300">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
               <AlertCircle size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">On Leave</p>
               <p className="text-2xl font-bold text-slate-800">{stats.LEAVE}</p>
            </div>
         </div>
      </div>

      {/* Attendance List Table */}
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-50">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50/50">
                  <tr>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-center">Roll No</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Status</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {classStudents.map((student, idx) => {
                     const status = attendance[student.id]?.status || 'PRESENT';
                     
                     return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-5 text-center font-bold text-slate-400">
                              {(idx + 1).toString().padStart(2, '0')}
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-brand-50 text-brand-600 border-2 border-white shadow-sm">
                                    {student.nameEn.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{student.nameEn}</p>
                                    <p className="text-xs text-slate-500 font-burmese leading-loose">{student.nameMm}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                 <button 
                                    onClick={() => handleStatusChange(student.id, 'PRESENT')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                       status === 'PRESENT' 
                                       ? 'bg-green-500 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    Present
                                 </button>
                                 <button 
                                    onClick={() => handleStatusChange(student.id, 'LATE')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                       status === 'LATE' 
                                       ? 'bg-amber-400 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    Late
                                 </button>
                                 <button 
                                    onClick={() => handleStatusChange(student.id, 'ABSENT')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                       status === 'ABSENT' 
                                       ? 'bg-red-500 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    Absent
                                 </button>
                                 <button 
                                    onClick={() => handleStatusChange(student.id, 'LEAVE')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                       status === 'LEAVE' 
                                       ? 'bg-blue-500 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    Leave
                                 </button>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <input 
                                 type="text" 
                                 placeholder="Add Note..." 
                                 value={attendance[student.id]?.remark || ''}
                                 onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                 className="w-full bg-transparent border-b border-slate-200 py-1 text-sm text-slate-600 focus:border-brand-500 outline-none placeholder-slate-300 transition-colors"
                              />
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};