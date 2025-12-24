import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  ChevronDown,
  Building2
} from 'lucide-react';
import { AttendanceStatus, StaffAttendanceDataset } from '../types';
import { useData } from '../contexts/DataContext';

type StatusType = AttendanceStatus;

interface StaffAttendanceRecord {
  status: StatusType;
  checkIn: string;
  checkOut: string;
  remark: string;
}

interface StaffAttendanceState {
  [staffId: string]: StaffAttendanceRecord;
}

export const StaffAttendance: React.FC = () => {
  const { staff, staffAttendance: staffAttendanceStore, setStaffAttendance: setStaffAttendanceStore } = useData();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  
  // Initialize all staff as PRESENT with default 8:00 AM - 4:00 PM times
  const [attendance, setAttendance] = useState<StaffAttendanceState>({});
  
  const [isSaving, setIsSaving] = useState(false);

  // Filter staff by department
  const filteredStaff = useMemo(() => {
     if (selectedDept === 'All Departments') return staff;
     return staff.filter(s => s.department === selectedDept);
  }, [selectedDept, staff]);

  // Load existing saved staff attendance for the date into local editable state
  useEffect(() => {
    const savedForDate = (staffAttendanceStore?.[selectedDate] || {}) as Record<
      string,
      { status: StatusType; checkIn: string; checkOut: string; remark: string }
    >;

    const next: StaffAttendanceState = {};
    for (const s of staff) {
      next[s.id] = savedForDate[s.id] ?? {
        status: 'PRESENT',
        checkIn: '08:00',
        checkOut: '16:00',
        remark: '',
      };
    }
    setAttendance(next);
  }, [selectedDate, staff, staffAttendanceStore]);

  // Dynamic Stats Calculation
  const stats = useMemo(() => {
    const counts = { PRESENT: 0, LATE: 0, ABSENT: 0, LEAVE: 0 };
    Object.values(attendance).forEach((record: StaffAttendanceRecord) => {
      counts[record.status]++;
    });
    // Adjust stats to only reflect filtered view if desired, but usually stats show global daily.
    // For now, let's show global stats for the day based on STAFF_MOCK size.
    return counts;
  }, [attendance]);

  const handleStatusChange = (id: string, status: StatusType) => {
    setAttendance(prev => ({
      ...prev,
      [id]: { ...prev[id], status }
    }));
  };

  const handleTimeChange = (id: string, field: 'checkIn' | 'checkOut', value: string) => {
    setAttendance(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);

    const nextStore: StaffAttendanceDataset = {
      ...(staffAttendanceStore || {}),
      [selectedDate]: Object.fromEntries(
        Object.entries(attendance).map(([staffId, rec]) => [
          staffId,
          {
            status: rec.status,
            checkIn: rec.checkIn,
            checkOut: rec.checkOut,
            remark: rec.remark || '',
          },
        ])
      ),
    };
    setStaffAttendanceStore(nextStore);

    setTimeout(() => setIsSaving(false), 400);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Staff Attendance</h2>
          <p className="text-slate-500 font-burmese text-sm mt-1 leading-loose">ဝန်ထမ်းနေ့စဉ် ရုံးတက်/ရုံးဆင်းမှတ်တမ်း</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          {/* Controls Group */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
             {/* Date Picker */}
             <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors" size={16} />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-transparent text-sm font-bold text-slate-600 outline-none rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                />
             </div>
             <div className="h-6 w-px bg-slate-200"></div>
             {/* Dept Selector */}
             <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-brand-500 transition-colors" size={16} />
                <select 
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-transparent text-sm font-bold text-slate-600 outline-none rounded-xl hover:bg-slate-50 transition-colors cursor-pointer appearance-none"
                >
                  <option>All Departments</option>
                  <option>Mathematics</option>
                  <option>Physics</option>
                  <option>Administration</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
             </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-brand-600/40 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <>Saving...</>
            ) : (
               <>
                 <Save size={18} />
                 <span>Save Record</span>
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
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Member</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Check In / Out</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredStaff.map((staff) => {
                     const record = attendance[staff.id];
                     
                     return (
                        <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                 <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm bg-brand-50 text-brand-600 border-2 border-white shadow-sm`}>
                                    {staff.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{staff.name}</p>
                                    <p className="text-xs text-slate-400 font-mono">{staff.id}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                               <span className="px-2 py-1 bg-slate-100 rounded-lg text-slate-600 text-xs font-bold">
                                 {staff.department}
                               </span>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-2">
                                 <input 
                                   type="time" 
                                   value={record.checkIn}
                                   onChange={(e) => handleTimeChange(staff.id, 'checkIn', e.target.value)}
                                   className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-brand-500 w-24"
                                   disabled={record.status === 'ABSENT' || record.status === 'LEAVE'}
                                 />
                                 <span className="text-slate-300">-</span>
                                 <input 
                                   type="time" 
                                   value={record.checkOut}
                                   onChange={(e) => handleTimeChange(staff.id, 'checkOut', e.target.value)}
                                   className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-brand-500 w-24"
                                   disabled={record.status === 'ABSENT' || record.status === 'LEAVE'}
                                 />
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                 <button 
                                    onClick={() => handleStatusChange(staff.id, 'PRESENT')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase ${
                                       record.status === 'PRESENT' 
                                       ? 'bg-green-500 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    P
                                 </button>
                                 <button 
                                    onClick={() => handleStatusChange(staff.id, 'LATE')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase ${
                                       record.status === 'LATE' 
                                       ? 'bg-amber-400 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    L
                                 </button>
                                 <button 
                                    onClick={() => handleStatusChange(staff.id, 'ABSENT')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase ${
                                       record.status === 'ABSENT' 
                                       ? 'bg-red-500 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    A
                                 </button>
                                 <button 
                                    onClick={() => handleStatusChange(staff.id, 'LEAVE')}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase ${
                                       record.status === 'LEAVE' 
                                       ? 'bg-blue-500 text-white shadow-md' 
                                       : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                 >
                                    Lve
                                 </button>
                              </div>
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