import React, { useState } from 'react';
import { Exam } from '../types';
import { 
  FileText, Plus, Calendar, CheckCircle2, AlertCircle, 
  MoreHorizontal, Clock, Trash2, X, Search, Filter, PenSquare
} from 'lucide-react';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { ModalPortal } from './ModalPortal';
import { useData } from '../contexts/DataContext';

export const ExamManagement: React.FC = () => {
  const { exams, addExam, updateExam, deleteExam, classes } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [newExam, setNewExam] = useState<Partial<Exam>>({
    academicYear: '2024-2025',
    term: 'Term 1',
    status: 'Upcoming',
    classes: []
  });

  // Ensure modal always appears in-frame on both desktop + mobile
  useModalScrollLock(isModalOpen, { scrollToTopOnOpen: true });

  // --- Helpers ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Ongoing': return 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse';
      case 'Completed': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'Published': return 'bg-green-50 text-green-600 border-green-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Upcoming': return <Calendar size={14} />;
      case 'Ongoing': return <Clock size={14} />;
      case 'Completed': return <CheckCircle2 size={14} />;
      case 'Published': return <FileText size={14} />;
      default: return null;
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setNewExam({
      academicYear: '2024-2025',
      term: 'Term 1',
      status: 'Upcoming',
      classes: []
    });
    setIsModalOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setNewExam({
      name: exam.name,
      academicYear: exam.academicYear,
      term: exam.term,
      startDate: exam.startDate,
      endDate: exam.endDate,
      status: exam.status,
      classes: exam.classes
    });
    setIsModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.name || !newExam.startDate || !newExam.endDate) return;

    if (editingId) {
      updateExam(editingId, {
        name: newExam.name!,
        academicYear: newExam.academicYear!,
        term: newExam.term!,
        startDate: newExam.startDate!,
        endDate: newExam.endDate!,
        status: newExam.status as any,
        classes: newExam.classes || [],
      });
    } else {
      // Create new exam
      const exam: Exam = {
        id: `EX-${Math.floor(Math.random() * 10000)}`,
        name: newExam.name,
        academicYear: newExam.academicYear || '2024-2025',
        term: newExam.term || 'Term 1',
        startDate: newExam.startDate,
        endDate: newExam.endDate,
        status: newExam.status as any,
        classes: newExam.classes || []
      };
      addExam(exam);
    }

    setIsModalOpen(false);
    setEditingId(null);
    setNewExam({
       academicYear: '2024-2025',
       term: 'Term 1',
       status: 'Upcoming',
       classes: []
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      deleteExam(id);
    }
  };

  const toggleClassSelection = (classId: string) => {
    const currentClasses = newExam.classes || [];
    if (currentClasses.includes(classId)) {
      setNewExam({ ...newExam, classes: currentClasses.filter(c => c !== classId) });
    } else {
      setNewExam({ ...newExam, classes: [...currentClasses, classId] });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Exam Management</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">စာမေးပွဲ စီမံခန့်ခွဲမှု</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2 w-fit"
        >
           <Plus size={18} /> Schedule Exam
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
               <Calendar size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Upcoming</p>
               <p className="text-2xl font-bold text-slate-800">{exams.filter(e => e.status === 'Upcoming').length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ongoing</p>
               <p className="text-2xl font-bold text-slate-800">{exams.filter(e => e.status === 'Ongoing').length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
               <CheckCircle2 size={24} />
            </div>
            <div>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Completed</p>
               <p className="text-2xl font-bold text-slate-800">{exams.filter(e => e.status === 'Completed').length}</p>
            </div>
         </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search exam name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
            />
         </div>
         <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-100 min-w-[140px]"
            >
               <option value="All">All Status</option>
               <option value="Upcoming">Upcoming</option>
               <option value="Ongoing">Ongoing</option>
               <option value="Completed">Completed</option>
               <option value="Published">Published</option>
            </select>
         </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
         {filteredExams.map((exam) => (
            <div key={exam.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 hover:shadow-md transition-shadow relative group">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="flex items-start gap-4">
                     <div className="p-4 bg-brand-50 text-brand-600 rounded-2xl hidden sm:block">
                        <FileText size={28} />
                     </div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h4 className="text-xl font-bold text-slate-800">{exam.name}</h4>
                           <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${getStatusColor(exam.status)}`}>
                              {getStatusIcon(exam.status)}
                              {exam.status}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-2">
                           {exam.term} • {exam.academicYear}
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {exam.classes.map(clsId => {
                              const cls = classes.find(c => c.id === clsId);
                              return cls ? (
                                 <span key={clsId} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                                    {cls.name}
                                 </span>
                              ) : null;
                           })}
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 min-w-[150px]">
                      <div className="text-right">
                         <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                         <p className="text-sm font-bold text-slate-700">{exam.startDate} <span className="text-slate-400 font-normal">to</span> {exam.endDate}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={() => handleEdit(exam)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 flex items-center gap-1"
                         >
                            <PenSquare size={14} /> Edit
                         </button>
                         <button 
                           onClick={() => handleDelete(exam.id)}
                           className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 flex items-center gap-1"
                         >
                            <Trash2 size={14} /> Delete
                         </button>
                      </div>
                  </div>

               </div>
            </div>
         ))}
         {filteredExams.length === 0 && (
             <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p>No exams found matching your criteria.</p>
             </div>
         )}
      </div>

      {/* Add/Edit Exam Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
              <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl relative max-h-[90vh] flex flex-col pn-modal-panel pn-modal-compact">
                {/* Fixed header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{editingId ? 'Edit Exam Schedule' : 'Schedule New Exam'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"><X size={20} /></button>
                </div>

                {/* Scrollable body */}
                <form onSubmit={handleSaveExam} className="flex-1 overflow-y-auto pn-modal-body space-y-4 p-4 sm:p-6">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Exam Name</label>
                     <input 
                        type="text" 
                        placeholder="e.g. Second Term Final Exam"
                        value={newExam.name || ''}
                        onChange={e => setNewExam({...newExam, name: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                        autoFocus
                        required
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Academic Year</label>
                        <select 
                           value={newExam.academicYear}
                           onChange={e => setNewExam({...newExam, academicYear: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                        >
                           <option>2024-2025</option>
                           <option>2025-2026</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Term</label>
                        <select 
                           value={newExam.term}
                           onChange={e => setNewExam({...newExam, term: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                        >
                           <option>Term 1</option>
                           <option>Term 2</option>
                           <option>Term 3</option>
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                        <input 
                           type="date" 
                           value={newExam.startDate || ''}
                           onChange={e => setNewExam({...newExam, startDate: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-600"
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                        <input 
                           type="date" 
                           value={newExam.endDate || ''}
                           onChange={e => setNewExam({...newExam, endDate: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 text-slate-600"
                           required
                        />
                     </div>
                  </div>
                  
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                     <select 
                        value={newExam.status}
                        onChange={e => setNewExam({...newExam, status: e.target.value as any})}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                     >
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Published">Published</option>
                     </select>
                  </div>

                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">Applicable Classes</label>
                     <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl max-h-64 overflow-y-auto custom-scrollbar border border-slate-100">
                        {classes.map(cls => (
                           <label key={cls.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors">
                              <input 
                                 type="checkbox" 
                                 checked={newExam.classes?.includes(cls.id)}
                                 onChange={() => toggleClassSelection(cls.id)}
                                 className="rounded text-brand-600 focus:ring-brand-500"
                              />
                              <span className="text-sm font-medium text-slate-700">{cls.name}</span>
                           </label>
                        ))}
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all mt-4"
                  >
                     {editingId ? 'Update Exam Schedule' : 'Create Exam Schedule'}
                  </button>
                </form>
              </div>
          </div>
        </ModalPortal>
      )}

    </div>
  );
};