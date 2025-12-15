import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { GRADE_LEVELS_LIST } from '../constants';
import { ViewState } from '../types';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { format, isWithinInterval, parseISO, differenceInDays } from 'date-fns';
import { 
  Search, Filter, Phone, Bell, ArrowRight, 
  AlertCircle, DollarSign, CheckCircle2, MoreHorizontal, X, Calendar, Download, ArrowUpDown 
} from 'lucide-react';

interface UnpaidListProps {
  onNavigate: (view: ViewState) => void;
}

export const UnpaidList: React.FC<UnpaidListProps> = ({ onNavigate }) => {
  const { students } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [reminderSent, setReminderSent] = useState<string[]>([]); // Track IDs of students who were sent a reminder
  const [reminderCooldown, setReminderCooldown] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<'amount' | 'date' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filter + Sort Logic
  const unpaidStudents = useMemo(() => {
    const filtered = students.filter(student => {
      // 1. Must have pending fees
      if (student.feesPending <= 0) return false;

      // 2. Grade Filter
      const matchesGrade = gradeFilter === 'All' || student.grade.includes(gradeFilter);

      // 3. Search Filter
      const matchesSearch = 
        student.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.nameMm.includes(searchTerm) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase());

      // 4. Date Range Filter (based on last payment date)
      let matchesDateRange = true;
      if (dateRange?.from && student.lastPaymentDate) {
        const paymentDate = parseISO(student.lastPaymentDate);
        if (dateRange.to) {
          // Range selected - filter payments within range
          matchesDateRange = isWithinInterval(paymentDate, { 
            start: dateRange.from, 
            end: dateRange.to 
          });
        } else {
          // Single date selected - match exact date
          matchesDateRange = format(paymentDate, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
        }
      }

      return matchesGrade && matchesSearch && matchesDateRange;
    });

    // Sorting
    if (!sortField) return filtered;
    const sorted = [...filtered].sort((a, b) => {
      if (sortField === 'amount') {
        return sortDir === 'asc' ? a.feesPending - b.feesPending : b.feesPending - a.feesPending;
      }
      // sortField === 'date'
      const aDate = a.lastPaymentDate ? parseISO(a.lastPaymentDate).getTime() : 0;
      const bDate = b.lastPaymentDate ? parseISO(b.lastPaymentDate).getTime() : 0;
      return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
    });
    return sorted;
  }, [searchTerm, gradeFilter, dateRange, sortField, sortDir]);

  // Clear date filter
  const clearDateFilter = () => setDateRange(undefined);

  // Statistics
  const totalOutstanding = unpaidStudents.reduce((sum, s) => sum + s.feesPending, 0);
  const totalDefaulters = unpaidStudents.length;
  const maxDue = Math.max(...unpaidStudents.map(s => s.feesPending), 0);

  // Handlers
  const REMINDER_COOLDOWN_MS = 1000 * 60 * 60 * 24; // 24 hours

  const handleRemind = (id: string) => {
    const now = Date.now();
    const lastSent = reminderCooldown[id];
    if (lastSent && now - lastSent < REMINDER_COOLDOWN_MS) {
      const waitHours = Math.ceil((REMINDER_COOLDOWN_MS - (now - lastSent)) / (1000 * 60 * 60));
      alert(`Reminder already sent recently. Try again in ~${waitHours} hour(s).`);
      return;
    }
    // In a real app, this triggers an SMS/Notification
    setReminderSent(prev => [...prev, id]);
    setReminderCooldown(prev => ({ ...prev, [id]: now }));
  };

  const handleRemindAll = () => {
    const ids = unpaidStudents.map(s => s.id);
    setReminderSent(prev => [...new Set([...prev, ...ids])]);
    alert(`Reminders sent to ${ids.length} students.`);
  };

  const handleSort = (field: 'amount' | 'date') => {
    if (sortField === field) {
      // toggle direction
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleExportCSV = () => {
    const header = ['Student ID', 'Name', 'Grade', 'Father', 'Phone', 'Last Payment', 'Fees Pending'];
    const rows = unpaidStudents.map(s => [
      s.id,
      s.nameEn,
      s.grade,
      s.fatherName,
      s.phone,
      s.lastPaymentDate ? format(parseISO(s.lastPaymentDate), 'yyyy-MM-dd') : 'N/A',
      s.feesPending.toString()
    ]);
    const csv = [header, ...rows].map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `unpaid-list-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCollect = () => {
    // Navigate to Payment Entry module
    onNavigate('FINANCE_PAYMENTS');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Unpaid Fees List</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">မပေးသေးသူစာရင်းနှင့် အကြွေးကျန်များ</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={handleRemindAll}
             disabled={unpaidStudents.length === 0}
             className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
           >
              <Bell size={18} />
              <span className="hidden sm:inline">Remind All</span>
           </button>
           <button 
             onClick={handleCollect}
             className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2"
           >
              <span>Go to Payments</span>
              <ArrowRight size={18} />
           </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-[24px] shadow-lg shadow-red-500/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><AlertCircle size={100} /></div>
            <p className="font-medium opacity-90 mb-1">Total Outstanding</p>
            <h3 className="text-3xl font-bold">{totalOutstanding.toLocaleString()} <span className="text-lg opacity-70">MMK</span></h3>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
             <p className="text-slate-500 font-bold text-sm mb-1 uppercase tracking-wide">Defaulters</p>
             <h3 className="text-3xl font-bold text-slate-800">{totalDefaulters} <span className="text-lg text-slate-400 font-medium">Students</span></h3>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
             <p className="text-slate-500 font-bold text-sm mb-1 uppercase tracking-wide">Highest Due</p>
             <h3 className="text-3xl font-bold text-slate-800">{maxDue.toLocaleString()} <span className="text-lg text-slate-400 font-medium">MMK</span></h3>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
         <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
            />
         </div>
            <div className="flex items-center gap-3 flex-wrap">
         <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
               value={gradeFilter}
               onChange={(e) => setGradeFilter(e.target.value)}
                     className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-100 min-w-[140px] font-burmese"
            >
                     <option value="All">All Grades (အားလုံးသော အတန်းများ)</option>
               {GRADE_LEVELS_LIST.map(g => (
                  <option key={g} value={g}>{g}</option>
               ))}
            </select>
         </div>

               {/* Date Range Filter */}
               <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-slate-400" />
                  <DateRangePicker date={dateRange} setDate={setDateRange} />
               </div>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-2">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sort by:</span>
           <button
             onClick={() => handleSort('date')}
             className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
               sortField === 'date' ? 'border-brand-500 text-brand-700 bg-brand-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}
           >
             <ArrowUpDown size={12} /> Last Payment {sortField === 'date' ? `(${sortDir})` : ''}
           </button>
           <button
             onClick={() => handleSort('amount')}
             className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
               sortField === 'amount' ? 'border-brand-500 text-brand-700 bg-brand-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
             }`}
           >
             <ArrowUpDown size={12} /> Pending Amount {sortField === 'amount' ? `(${sortDir})` : ''}
           </button>

           <button
             onClick={handleExportCSV}
             className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
           >
             <Download size={14} /> Export CSV
           </button>
         </div>

         {/* Active Filters Display */}
         {(dateRange?.from || gradeFilter !== 'All' || searchTerm) && (
           <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Filters:</span>
             
             {searchTerm && (
               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                 Search: "{searchTerm}"
                 <button onClick={() => setSearchTerm('')} className="hover:text-red-500 transition-colors">
                   <X size={12} />
                 </button>
               </span>
             )}

             {gradeFilter !== 'All' && (
               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                 Grade: {gradeFilter}
                 <button onClick={() => setGradeFilter('All')} className="hover:text-red-500 transition-colors">
                   <X size={12} />
                 </button>
               </span>
             )}

             {dateRange?.from && (
               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                 Last Payment: {format(dateRange.from, 'MMM dd')}
                 {dateRange.to && ` - ${format(dateRange.to, 'MMM dd, yyyy')}`}
                 {!dateRange.to && `, ${format(dateRange.from, 'yyyy')}`}
                 <button onClick={clearDateFilter} className="hover:text-red-500 transition-colors">
                   <X size={12} />
                 </button>
               </span>
             )}

             <button 
               onClick={() => {
                 setSearchTerm('');
                 setGradeFilter('All');
                 setDateRange(undefined);
               }}
               className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors ml-auto"
             >
               Clear All
             </button>
           </div>
         )}
      </div>

      {/* List Table */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-slate-50">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-50/50">
                  <tr>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Profile</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Last Payment</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Amount</th>
                     <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {unpaidStudents.map((student) => {
                     const isReminded = reminderSent.includes(student.id);
                     
                     return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-200">
                                    {student.nameEn.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{student.nameEn}</p>
                                    <p className="text-xs text-slate-500">{student.id} • {student.grade}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="text-sm">
                                 <p className="font-medium text-slate-700">{student.fatherName} (Father)</p>
                                 <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                                    <Phone size={12} />
                                    <span className="text-xs font-mono">{student.phone}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              {student.lastPaymentDate ? (
                                <>
                                  <p className="text-sm text-slate-600 font-medium">
                                    {format(parseISO(student.lastPaymentDate), 'dd MMM yyyy')}
                                  </p>
                                  {(() => {
                                    const daysOverdue = differenceInDays(new Date(), parseISO(student.lastPaymentDate));
                                    if (daysOverdue > 30) {
                                      return <p className="text-[10px] text-red-500 font-bold uppercase mt-0.5">Overdue {daysOverdue} Days</p>;
                                    } else if (daysOverdue > 14) {
                                      return <p className="text-[10px] text-orange-500 font-bold uppercase mt-0.5">Due {daysOverdue} Days Ago</p>;
                                    } else {
                                      return <p className="text-[10px] text-slate-400 font-medium mt-0.5">{daysOverdue} days ago</p>;
                                    }
                                  })()}
                                </>
                              ) : (
                                <p className="text-sm text-slate-400 italic">No payment yet</p>
                              )}
                           </td>
                           <td className="px-6 py-5">
                              <span className="text-red-600 font-bold text-base bg-red-50 px-2 py-1 rounded-lg">
                                 {student.feesPending.toLocaleString()} MMK
                              </span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                 <button 
                                    onClick={() => handleRemind(student.id)}
                                    disabled={isReminded}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 ${
                                       isReminded 
                                       ? 'bg-green-50 text-green-700 border-green-200 cursor-default'
                                       : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                 >
                                    {isReminded ? <CheckCircle2 size={12} /> : <Bell size={12} />}
                                    {isReminded ? 'Sent' : 'Remind'}
                                 </button>
                                 <button 
                                    onClick={handleCollect}
                                    className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all flex items-center gap-1"
                                 >
                                    <DollarSign size={12} /> Collect
                                 </button>
                              </div>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
         
         {unpaidStudents.length === 0 && (
            <div className="p-12 text-center text-slate-400">
               <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                  <CheckCircle2 size={32} />
               </div>
               <p className="font-bold text-slate-700">Great Job!</p>
               <p className="text-sm">No students found with outstanding fees.</p>
            </div>
         )}
      </div>
    </div>
  );
};