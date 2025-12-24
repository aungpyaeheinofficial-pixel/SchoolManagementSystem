import React, { useMemo, useState, useCallback, useRef } from 'react';
import { TIME_SLOTS } from '../constants';
import { TimetableEntry } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  CalendarDays, ChevronDown, BookOpen, AlertCircle, 
  Printer, Save, Info, Plus, X, Trash2, GripVertical,
  ChevronLeft, ChevronRight, Copy, User, Building, Calendar,
  Check, RefreshCw, Download
} from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { ModalPortal } from './ModalPortal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

interface AcademicTimetableProps {
  timetableData: TimetableEntry[];
  onUpdate: React.Dispatch<React.SetStateAction<TimetableEntry[]>>;
}

interface DragData {
  entryId: string;
  sourceDay: string;
  sourcePeriodId: number;
}

interface ConflictInfo {
  teacherConflict: boolean;
  roomConflict: boolean;
  conflictingTeacher?: string;
  conflictingRoom?: string;
}

export const AcademicTimetable: React.FC<AcademicTimetableProps> = ({ timetableData, onUpdate }) => {
  const { 
    timetable, 
    setTimetable, 
    addTimetableEntry, 
    updateTimetableEntry, 
    deleteTimetableEntry,
    copyWeekSchedule,
    classes,
    subjects,
    staff,
    rooms,
  } = useData();

  // Use context data instead of props
  const actualTimetable = timetable;
  const actualOnUpdate = setTimetable;

  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || '');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
  const [weekPickerDate, setWeekPickerDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{day: string, periodId: number, entry?: TimetableEntry} | null>(null);
  const [formData, setFormData] = useState({ subjectId: '', teacherId: '', roomId: '' });

  // Drag and Drop State
  const [draggedEntry, setDraggedEntry] = useState<DragData | null>(null);
  const [dropTarget, setDropTarget] = useState<{day: string, periodId: number} | null>(null);

  // Print Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTeacherId, setPrintTeacherId] = useState<string>('all');

  // Copy Modal
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetClassId, setCopyTargetClassId] = useState<string>('');

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  // Ensure any open modal appears in-frame (app uses an inner scroll container)
  useModalScrollLock(isModalOpen || isPrintModalOpen || isCopyModalOpen || isWeekPickerOpen, { scrollToTopOnOpen: true });

  // Get class room
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const classRoomId = selectedClass?.roomId || '';

  // Show success message temporarily
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // --- Conflict Detection ---

  // Check for teacher conflict across ALL classes
  const checkTeacherConflict = useCallback((teacherId: string, day: string, periodId: number, excludeEntryId?: string): string | null => {
    const conflict = actualTimetable.find(t => 
       t.teacherId === teacherId &&
       t.day === day &&
       t.periodId === periodId &&
       t.id !== excludeEntryId
    );
    if (conflict) {
      const conflictClass = classes.find(c => c.id === conflict.classId);
      return conflictClass?.name || 'Another class';
    }
    return null;
  }, [actualTimetable]);

  // Check for room conflict (same room, same time, different class)
  const checkRoomConflict = useCallback((roomId: string, day: string, periodId: number, classId: string, excludeEntryId?: string): string | null => {
    if (!roomId) return null;
    
    // Find other classes using the same room at the same time
    const otherClasses = classes.filter(c => c.roomId === roomId && c.id !== classId);
    
    for (const otherClass of otherClasses) {
      const hasEntry = actualTimetable.find(t => 
        t.classId === otherClass.id &&
        t.day === day &&
        t.periodId === periodId &&
        t.id !== excludeEntryId
      );
      if (hasEntry) {
        return otherClass.name;
      }
    }
    return null;
  }, [actualTimetable]);

  // Get full conflict info for an entry
  const getConflictInfo = useCallback((entry: TimetableEntry): ConflictInfo => {
    const teacherConflict = checkTeacherConflict(entry.teacherId, entry.day, entry.periodId, entry.id);
    const roomConflict = checkRoomConflict(classRoomId, entry.day, entry.periodId, entry.classId, entry.id);
    
    return {
      teacherConflict: !!teacherConflict,
      roomConflict: !!roomConflict,
      conflictingTeacher: teacherConflict || undefined,
      conflictingRoom: roomConflict || undefined
    };
  }, [checkTeacherConflict, checkRoomConflict, classRoomId]);

  // Precompute all conflicts
  const conflictMap = useMemo(() => {
    const map = new Map<string, ConflictInfo>();
    actualTimetable.forEach(entry => {
      map.set(entry.id, getConflictInfo(entry));
    });
    return map;
  }, [actualTimetable, getConflictInfo]);

  const getEntryForSlot = (day: string, periodId: number) => {
    return actualTimetable.find(t => 
       t.classId === selectedClassId && 
       t.day === day && 
       t.periodId === periodId
    );
  };

  const getSubject = (id: string) => subjects.find(s => s.id === id);
  const getTeacher = (id: string) => staff.find(s => s.id === id);
  const getRoom = (id: string) => rooms.find(r => r.id === id);

  // Week navigation
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;

  const goToPrevWeek = () => setCurrentWeek(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1));
  const goToToday = () => setCurrentWeek(new Date());

  const openWeekPicker = () => {
    setWeekPickerDate(format(currentWeek, 'yyyy-MM-dd'));
    setIsWeekPickerOpen(true);
  };

  const applyWeekPicker = () => {
    if (!weekPickerDate) return;
    const d = new Date(weekPickerDate);
    if (Number.isNaN(d.getTime())) return;
    setCurrentWeek(d);
    setIsWeekPickerOpen(false);
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent, entry: TimetableEntry, day: string, periodId: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', entry.id);
    setDraggedEntry({
      entryId: entry.id,
      sourceDay: day,
      sourcePeriodId: periodId
    });
  };

  const handleDragOver = (e: React.DragEvent, day: string, periodId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ day, periodId });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetPeriodId: number) => {
    e.preventDefault();
    setDropTarget(null);
    
    if (!draggedEntry) return;

    const entry = actualTimetable.find(t => t.id === draggedEntry.entryId);
    if (!entry) return;

    // Check if target slot is empty (for the same class)
    const existingEntry = getEntryForSlot(targetDay, targetPeriodId);
    if (existingEntry && existingEntry.id !== entry.id) {
      alert('This slot is already occupied. Please clear it first.');
      setDraggedEntry(null);
      return;
    }

    // Check for conflicts at new position
    const teacherConflict = checkTeacherConflict(entry.teacherId, targetDay, targetPeriodId, entry.id);
    if (teacherConflict) {
      if (!confirm(`⚠️ Teacher Conflict: ${getTeacher(entry.teacherId)?.name} is already assigned to ${teacherConflict} at this time.\n\nDo you want to proceed anyway?`)) {
        setDraggedEntry(null);
        return;
      }
    }

    const roomConflict = checkRoomConflict(classRoomId, targetDay, targetPeriodId, selectedClassId, entry.id);
    if (roomConflict) {
      if (!confirm(`⚠️ Room Conflict: Room ${selectedClass?.roomName} is used by ${roomConflict} at this time.\n\nDo you want to proceed anyway?`)) {
        setDraggedEntry(null);
        return;
      }
    }

    // Move the entry using context function
    updateTimetableEntry(entry.id, { 
      day: targetDay as typeof entry.day, 
      periodId: targetPeriodId 
    });
    
    showSuccess(`Moved ${getSubject(entry.subjectId)?.nameEn} to ${targetDay}`);
    setDraggedEntry(null);
  };

  const handleDragEnd = () => {
    setDraggedEntry(null);
    setDropTarget(null);
  };

  // --- Handlers ---

  const handleSlotClick = (day: string, periodId: number, entry?: TimetableEntry) => {
    setEditingSlot({ day, periodId, entry });
    if (entry) {
      setFormData({ 
        subjectId: entry.subjectId, 
        teacherId: entry.teacherId,
        roomId: classRoomId
      });
    } else {
      setFormData({ subjectId: '', teacherId: '', roomId: classRoomId });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || !formData.subjectId || !formData.teacherId) return;

    // Check conflicts and warn
    const teacherConflict = checkTeacherConflict(formData.teacherId, editingSlot.day, editingSlot.periodId, editingSlot.entry?.id);
    if (teacherConflict) {
      if (!confirm(`⚠️ Teacher Conflict: ${getTeacher(formData.teacherId)?.name} is already assigned to ${teacherConflict} at this time.\n\nDo you want to proceed anyway?`)) {
        return;
      }
    }

    const roomConflict = checkRoomConflict(classRoomId, editingSlot.day, editingSlot.periodId, selectedClassId, editingSlot.entry?.id);
    if (roomConflict) {
      if (!confirm(`⚠️ Room Conflict: Room ${selectedClass?.roomName} is used by ${roomConflict} at this time.\n\nDo you want to proceed anyway?`)) {
        return;
      }
    }

    if (editingSlot.entry) {
      // Update existing entry
      updateTimetableEntry(editingSlot.entry.id, {
        subjectId: formData.subjectId,
        teacherId: formData.teacherId
      });
      showSuccess('Schedule updated successfully!');
    } else {
      // Create new entry
      const newEntry: TimetableEntry = {
        id: `TT-${Date.now()}`,
        classId: selectedClassId,
        day: editingSlot.day as typeof DAYS[number],
        periodId: editingSlot.periodId,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        curriculumType: 'Public'
      };
      addTimetableEntry(newEntry);
      showSuccess('New class scheduled!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingSlot?.entry) {
      deleteTimetableEntry(editingSlot.entry.id);
      showSuccess('Schedule entry removed!');
      setIsModalOpen(false);
    }
  };

  // --- Copy Schedule ---

  const handleCopySchedule = () => {
    const sourceEntries = actualTimetable.filter(t => t.classId === selectedClassId);
    
    if (sourceEntries.length === 0) {
      alert('No schedule entries to copy for the current class.');
      return;
    }

    if (!copyTargetClassId) {
      // Copy as template (duplicate entries with new IDs for same class)
      const newEntries = sourceEntries.map(entry => ({
        ...entry,
        id: `TT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      // Save as template in localStorage
      const templates = JSON.parse(localStorage.getItem('pnsp_schedule_templates') || '{}');
      templates[selectedClassId] = {
        entries: newEntries,
        savedAt: new Date().toISOString(),
        className: selectedClass?.name
      };
      localStorage.setItem('pnsp_schedule_templates', JSON.stringify(templates));
      
      showSuccess(`Template saved! ${sourceEntries.length} entries backed up.`);
    } else {
      // Copy to another class
      const targetClass = classes.find(c => c.id === copyTargetClassId);
      
      // Remove existing entries for target class
      const filteredTimetable = actualTimetable.filter(t => t.classId !== copyTargetClassId);
      
      // Create new entries for target class
      const newEntries = sourceEntries.map(entry => ({
        ...entry,
        id: `TT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        classId: copyTargetClassId
      }));

      // Update timetable
      actualOnUpdate([...filteredTimetable, ...newEntries]);
      
      showSuccess(`Copied ${sourceEntries.length} entries to ${targetClass?.name}!`);
    }
    
    setIsCopyModalOpen(false);
    setCopyTargetClassId('');
  };

  // Load template
  const handleLoadTemplate = () => {
    const templates = JSON.parse(localStorage.getItem('pnsp_schedule_templates') || '{}');
    const template = templates[selectedClassId];
    
    if (!template) {
      alert('No saved template for this class.');
      return;
    }

    if (confirm(`Load template saved on ${format(new Date(template.savedAt), 'PPP')}?\n\nThis will replace the current schedule for ${selectedClass?.name}.`)) {
      // Remove current entries for this class
      const filteredTimetable = actualTimetable.filter(t => t.classId !== selectedClassId);
      
      // Add template entries with new IDs
      const newEntries = template.entries.map((entry: TimetableEntry) => ({
        ...entry,
        id: `TT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        classId: selectedClassId
      }));

      actualOnUpdate([...filteredTimetable, ...newEntries]);
      showSuccess('Template loaded successfully!');
    }
  };

  // --- Print Functions ---

  const handlePrint = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
    setIsPrintModalOpen(false);
  };

  const generatePrintContent = () => {
    let entries = actualTimetable;
    let title = 'Class Timetable';
    let subtitle = '';

    if (printTeacherId === 'all') {
      entries = actualTimetable.filter(t => t.classId === selectedClassId);
      title = `${selectedClass?.name} - Timetable`;
      subtitle = `Class Teacher: ${selectedClass?.teacherName} | Room: ${selectedClass?.roomName}`;
    } else {
      entries = actualTimetable.filter(t => t.teacherId === printTeacherId);
      const teacher = getTeacher(printTeacherId);
      title = `${teacher?.name} - Teaching Schedule`;
      subtitle = `Department: ${teacher?.department}`;
    }

    const slots = TIME_SLOTS.filter(s => s.label !== 'Break' && s.label !== 'Lunch');

    const generateRow = (slot: typeof TIME_SLOTS[0]) => {
      return DAYS.map(day => {
        const entry = entries.find(e => e.day === day && e.periodId === slot.id);
        if (entry) {
          const subject = getSubject(entry.subjectId);
          const teacher = getTeacher(entry.teacherId);
          const classInfo = classes.find(c => c.id === entry.classId);
          
          if (printTeacherId === 'all') {
            return `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; background: #f8f9fa;">
              <strong>${subject?.code}</strong><br/>
              <small>${subject?.nameEn}</small><br/>
              <small style="color: #666;">${teacher?.name}</small>
            </td>`;
          } else {
            return `<td style="padding: 8px; border: 1px solid #ddd; text-align: center; background: #f8f9fa;">
              <strong>${classInfo?.name}</strong><br/>
              <small>${subject?.nameEn}</small><br/>
              <small style="color: #666;">Room: ${classInfo?.roomName}</small>
            </td>`;
          }
        }
        return '<td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #999;">-</td>';
      }).join('');
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; margin-bottom: 5px; }
          h3 { color: #666; margin-top: 0; font-weight: normal; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #7c3aed; color: white; padding: 12px; border: 1px solid #6d28d9; }
          td { padding: 8px; border: 1px solid #ddd; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; }
          .week { color: #7c3aed; font-weight: bold; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${title}</h1>
            <h3>${subtitle}</h3>
          </div>
          <div class="week">${weekLabel}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              ${DAYS.map(d => `<th>${d}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${slots.map(slot => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f3f4f6; font-weight: bold; text-align: center;">
                  ${slot.startTime}<br/>${slot.endTime}
                </td>
                ${generateRow(slot)}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="margin-top: 20px; color: #999; font-size: 12px;">
          Printed on ${format(new Date(), 'PPP')} | PNND School Management System
        </p>
      </body>
      </html>
    `;
  };

  // Stats for current class
  const currentClassEntries = actualTimetable.filter(t => t.classId === selectedClassId);
  const totalSlots = TIME_SLOTS.filter(s => s.label !== 'Break' && s.label !== 'Lunch').length * DAYS.length;
  const filledSlots = currentClassEntries.length;
  const conflictCount = Array.from(conflictMap.values()).filter((c: ConflictInfo) => c.teacherConflict || c.roomConflict).length;

  return (
    <div className="space-y-6 animate-fade-in pb-20 relative">
       {/* Success Toast */}
       {successMessage && (
         <div className="fixed top-20 right-4 z-50 animate-fade-in">
           <div className="bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
             <Check size={20} />
             <span className="font-medium">{successMessage}</span>
           </div>
         </div>
       )}

       {/* Header & Controls */}
       <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Class Timetable</h2>
            <p className="text-slate-500 font-burmese mt-1 leading-loose">အချိန်ဇယား စီမံခန့်ခွဲမှု</p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
             {/* Week Navigation */}
             <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 shadow-sm px-2">
                <button 
                  onClick={goToPrevWeek}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                  title="Previous Week"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={openWeekPicker}
                  className="px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Calendar size={16} />
                  {weekLabel}
                </button>
                <button 
                  onClick={goToNextWeek}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                  title="Next Week"
                >
                  <ChevronRight size={20} />
                </button>
             </div>

             {/* Class Selector */}
             <div className="relative group bg-white rounded-xl border border-slate-200 shadow-sm min-w-[240px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                   <BookOpen size={16} />
                </div>
                <select 
                   value={selectedClassId}
                   onChange={(e) => setSelectedClassId(e.target.value)}
                   className="w-full pl-10 pr-10 py-3 bg-transparent text-sm font-bold text-slate-700 outline-none rounded-xl cursor-pointer appearance-none hover:bg-slate-50 transition-colors"
                >
                   {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                   ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2">
                <button 
                  onClick={() => setIsCopyModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  title="Copy Schedule"
                >
                  <Copy size={18} /> Copy
                </button>
                <button 
                  onClick={handleLoadTemplate}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  title="Load Template"
                >
                  <Download size={18} /> Load
                </button>
                <button 
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Printer size={18} /> Print
                </button>
             </div>
          </div>
       </div>

       {/* Stats Row */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Filled Slots</p>
            <p className="text-2xl font-bold text-brand-600">{filledSlots} <span className="text-sm text-slate-400">/ {totalSlots}</span></p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Completion</p>
            <p className="text-2xl font-bold text-green-600">{Math.round((filledSlots / totalSlots) * 100)}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Conflicts</p>
            <p className={`text-2xl font-bold ${conflictCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>{conflictCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">Room</p>
            <p className="text-lg font-bold text-slate-700 truncate">{selectedClass?.roomName || 'N/A'}</p>
          </div>
       </div>

       {/* Conflict Legend */}
       <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full border border-red-200">
            <User size={14} />
            <span className="font-medium">Teacher Conflict</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full border border-orange-200">
            <Building size={14} />
            <span className="font-medium">Room Conflict</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-full border border-slate-200">
            <GripVertical size={14} />
            <span className="font-medium">Drag to reschedule</span>
          </div>
       </div>

       {/* Timetable Grid */}
       <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto" ref={printRef}>
          <div className="min-w-[1000px]">
             {/* Header Row: Days */}
             <div className="grid grid-cols-[100px_repeat(5,1fr)] divide-x divide-slate-100 bg-gradient-to-r from-brand-600 to-purple-600 border-b border-slate-200">
                <div className="p-4 flex items-center justify-center font-bold text-xs text-white/80 uppercase tracking-wider">
                   Time
                </div>
                {DAYS.map(day => (
                   <div key={day} className="p-4 text-center font-bold text-white text-sm">
                      {day}
                   </div>
                ))}
             </div>

             {/* Rows: Time Slots */}
             {TIME_SLOTS.map((slot) => {
                const isBreak = slot.label === 'Break' || slot.label === 'Lunch';

                return (
                   <div key={slot.id} className={`grid grid-cols-[100px_repeat(5,1fr)] divide-x divide-slate-100 border-b border-slate-100 ${isBreak ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                      {/* Time Column */}
                      <div className="p-4 flex flex-col items-center justify-center text-xs border-r border-slate-100">
                         <span className="font-bold text-slate-700">{slot.startTime}</span>
                         <span className="text-slate-400 my-1">|</span>
                         <span className="font-bold text-slate-400">{slot.endTime}</span>
                         <span className="mt-1 text-[10px] font-bold text-slate-300 uppercase">{slot.label}</span>
                      </div>

                      {/* Day Columns */}
                      {DAYS.map((day) => {
                        const entry = getEntryForSlot(day, slot.id);
                        const subject = entry ? getSubject(entry.subjectId) : null;
                        const teacher = entry ? getTeacher(entry.teacherId) : null;
                        const conflict = entry ? conflictMap.get(entry.id) : null;
                        const hasTeacherConflict = conflict?.teacherConflict;
                        const hasRoomConflict = conflict?.roomConflict;
                        const hasAnyConflict = hasTeacherConflict || hasRoomConflict;
                        
                        const isDropTarget = dropTarget?.day === day && dropTarget?.periodId === slot.id;
                        const isDragging = draggedEntry && entry && draggedEntry.entryId === entry.id;

                        return (
                            <div 
                              key={`${day}-${slot.id}`} 
                              className={`p-2 relative group min-h-[100px] transition-colors ${isDropTarget ? 'bg-brand-50' : ''}`}
                              onDragOver={(e) => handleDragOver(e, day, slot.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, day, slot.id)}
                            >
                              {entry ? (
                                  <div 
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, entry, day, slot.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleSlotClick(day, slot.id, entry)}
                                    className={`
                                      h-full w-full rounded-xl p-3 border shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing flex flex-col justify-between hover:scale-[1.02]
                                      ${isDragging ? 'opacity-50 scale-95' : ''}
                                      ${hasTeacherConflict && hasRoomConflict ? 'bg-red-50 border-red-300' : 
                                        hasTeacherConflict ? 'bg-red-50 border-red-200' : 
                                        hasRoomConflict ? 'bg-orange-50 border-orange-200' : 
                                        'bg-white border-slate-200 hover:border-brand-300'}
                                  `}>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                          <div className="flex items-center gap-1">
                                            <GripVertical size={12} className="text-slate-300" />
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${hasAnyConflict ? 'bg-red-200 text-red-700' : 'bg-brand-50 text-brand-600'}`}>
                                                {subject?.code}
                                            </span>
                                          </div>
                                          {hasAnyConflict && (
                                            <div className="flex gap-1">
                                              {hasTeacherConflict && (
                                                <div className="text-red-500 animate-pulse" title={`Teacher Conflict: ${conflict?.conflictingTeacher}`}>
                                                    <User size={14} />
                                                </div>
                                              )}
                                              {hasRoomConflict && (
                                                <div className="text-orange-500 animate-pulse" title={`Room Conflict: ${conflict?.conflictingRoom}`}>
                                                    <Building size={14} />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        <p className="font-bold text-sm text-slate-800 leading-tight mb-1 line-clamp-2">
                                          {subject?.nameEn}
                                        </p>
                                        <p className="font-burmese text-xs text-slate-500 leading-loose line-clamp-1">
                                          {subject?.nameMm}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100/50 mt-1">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${hasTeacherConflict ? 'bg-red-200 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                          {(teacher?.name || '?').charAt(0)}
                                        </div>
                                        <span className={`text-xs font-medium truncate ${hasTeacherConflict ? 'text-red-600' : 'text-slate-500'}`}>
                                          {teacher?.name}
                                        </span>
                                    </div>
                                  </div>
                              ) : (
                                  <div 
                                    onClick={() => handleSlotClick(day, slot.id)}
                                    className={`h-full w-full rounded-xl border border-dashed flex items-center justify-center transition-all cursor-pointer group
                                      ${isDropTarget ? 'border-brand-400 bg-brand-100' : 'border-slate-200 hover:bg-brand-50 hover:border-brand-200'}
                                    `}
                                  >
                                    <div className={`p-2 rounded-full transition-colors ${isBreak ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-300'} group-hover:bg-brand-100 group-hover:text-brand-600`}>
                                        <Plus size={16} />
                                    </div>
                                  </div>
                              )}
                            </div>
                        );
                      })}
                   </div>
                );
             })}
          </div>
       </div>

       {/* Legend / Info */}
       <div className="flex gap-4 p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm">
          <Info size={20} className="text-blue-600 shrink-0" />
          <p>
             <span className="font-bold">Tips:</span> Drag and drop classes to reschedule. Click to edit details. 
             <span className="text-red-600 font-medium"> Red cards</span> = Teacher conflict. 
             <span className="text-orange-600 font-medium"> Orange cards</span> = Room conflict.
             Use <span className="font-medium">Copy</span> to save template and <span className="font-medium">Load</span> to restore.
          </p>
       </div>

       {/* Edit/Add Modal */}
       {isModalOpen && editingSlot && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 relative max-h-[90vh] flex flex-col pn-modal-panel pn-modal-compact">
               <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
               >
                  <X size={20} />
               </button>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-1">
                  {editingSlot.entry ? 'Edit Schedule' : 'Assign Class'}
               </h3>
               <p className="text-sm text-slate-500 mb-6 font-medium">
                  {editingSlot.day} • {TIME_SLOTS.find(s => s.id === editingSlot.periodId)?.label} ({TIME_SLOTS.find(s => s.id === editingSlot.periodId)?.startTime})
               </p>

              <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pn-modal-body">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                     <select 
                        required
                        value={formData.subjectId}
                        onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                     >
                        <option value="">Select Subject...</option>
                        {subjects.map(sub => (
                           <option key={sub.id} value={sub.id}>{sub.code} - {sub.nameEn}</option>
                        ))}
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Teacher</label>
                     <select 
                        required
                        value={formData.teacherId}
                        onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                     >
                        <option value="">Select Teacher...</option>
                        {staff.map(member => (
                           <option key={member.id} value={member.id}>{member.name} ({member.department})</option>
                        ))}
                     </select>
                     {formData.teacherId && (
                       <div className="mt-2">
                         {checkTeacherConflict(formData.teacherId, editingSlot.day, editingSlot.periodId, editingSlot.entry?.id) && (
                           <p className="text-xs text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                             <AlertCircle size={12} />
                             Teacher already assigned to {checkTeacherConflict(formData.teacherId, editingSlot.day, editingSlot.periodId, editingSlot.entry?.id)} at this time
                           </p>
                         )}
                       </div>
                     )}
                  </div>

                  <div className="pt-2 flex gap-3">
                     {editingSlot.entry && (
                        <button 
                           type="button"
                           onClick={handleDelete}
                           className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                        >
                           <Trash2 size={18} /> Remove
                        </button>
                     )}
                     <button 
                        type="submit" 
                        className="flex-[2] py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
                     >
                        <Save size={18} /> Save Schedule
                     </button>
                  </div>
               </form>
            </div>
          </div>
        </ModalPortal>
       )}

       {/* Print Modal */}
       {isPrintModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && setIsPrintModalOpen(false)}>
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 relative max-h-[90vh] flex flex-col pn-modal-panel pn-modal-compact">
               <button 
                  onClick={() => setIsPrintModalOpen(false)} 
                  className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
               >
                  <X size={20} />
               </button>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-1">
                  <Printer className="inline mr-2" size={24} />
                  Print Timetable
               </h3>
               <p className="text-sm text-slate-500 mb-6 font-medium">
                  Choose what to print
               </p>

              <div className="space-y-4 overflow-y-auto pn-modal-body">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Print Options</label>
                     <select 
                        value={printTeacherId}
                        onChange={(e) => setPrintTeacherId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                     >
                        <option value="all">📚 Current Class Timetable ({selectedClass?.name})</option>
                        <optgroup label="Individual Teacher Schedule">
                          {staff.map(member => (
                             <option key={member.id} value={member.id}>👤 {member.name} ({member.department})</option>
                          ))}
                        </optgroup>
                     </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-600">
                      <strong>Preview:</strong> {printTeacherId === 'all' 
                        ? `Full timetable for ${selectedClass?.name}` 
                        : `Teaching schedule for ${getTeacher(printTeacherId)?.name}`
                      }
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Week: {weekLabel}</p>
                  </div>

                  <button 
                     onClick={handlePrint}
                     className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2"
                  >
                     <Printer size={18} /> Print Now
                  </button>
               </div>
            </div>
          </div>
        </ModalPortal>
       )}

       {/* Copy Modal */}
       {isCopyModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && (setIsCopyModalOpen(false), setCopyTargetClassId(''))}>
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 relative max-h-[90vh] flex flex-col pn-modal-panel pn-modal-compact">
               <button 
                  onClick={() => { setIsCopyModalOpen(false); setCopyTargetClassId(''); }}
                  className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
               >
                  <X size={20} />
               </button>
               
               <h3 className="text-2xl font-bold text-slate-800 mb-1">
                  <Copy className="inline mr-2" size={24} />
                  Copy Schedule
               </h3>
               <p className="text-sm text-slate-500 mb-6 font-medium font-burmese">
                  တစ်ပတ်ကနေ တစ်ပတ် copy ကူးခြင်း
               </p>

              <div className="space-y-4 overflow-y-auto pn-modal-body">
                  <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
                    <p className="text-sm font-bold text-brand-700 mb-2">Source Schedule</p>
                    <p className="text-slate-700">{selectedClass?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{weekLabel}</p>
                    <p className="text-xs text-brand-600 font-bold mt-1">
                      {currentClassEntries.length} entries
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Copy To</label>
                    <select 
                      value={copyTargetClassId}
                      onChange={(e) => setCopyTargetClassId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                    >
                      <option value="">💾 Save as Template (for this class)</option>
                      <optgroup label="Copy to Another Class">
                        {classes.filter(c => c.id !== selectedClassId).map(cls => (
                          <option key={cls.id} value={cls.id}>📋 {cls.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
                    {copyTargetClassId ? (
                      <p>⚠️ This will <strong>replace</strong> all existing schedule entries for {classes.find(c => c.id === copyTargetClassId)?.name}.</p>
                    ) : (
                      <p>Save current schedule as a template. Use the <strong>Load</strong> button to restore it later.</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                     <button 
                        onClick={() => { setIsCopyModalOpen(false); setCopyTargetClassId(''); }}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        onClick={handleCopySchedule}
                        disabled={currentClassEntries.length === 0}
                        className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Copy size={18} /> {copyTargetClassId ? 'Copy' : 'Save Template'}
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </ModalPortal>
       )}

      {/* Week Picker Modal */}
      {isWeekPickerOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper"
            onClick={(e) => e.target === e.currentTarget && setIsWeekPickerOpen(false)}
          >
            <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-6 sm:p-8 relative max-h-[90vh] flex flex-col pn-modal-panel pn-modal-compact">
              <button
                onClick={() => setIsWeekPickerOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-slate-900 mb-1">Select Week</h3>
              <p className="text-sm text-slate-600 mb-6">
                Choose any date — we’ll open the week that contains it.
              </p>

              <div className="space-y-4 overflow-y-auto pn-modal-body">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Pick a date</label>
                  <input
                    type="date"
                    value={weekPickerDate}
                    onChange={(e) => setWeekPickerDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Current: <span className="font-bold text-slate-700">{weekLabel}</span>
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentWeek(new Date());
                      setWeekPickerDate(format(new Date(), 'yyyy-MM-dd'));
                      setIsWeekPickerOpen(false);
                    }}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={applyWeekPicker}
                    className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};
