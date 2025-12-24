import React, { useMemo, useState } from 'react';
import { GRADE_LEVELS_LIST } from '../constants';
import { Subject } from '../types';
import { 
  BookOpen, Search, Filter, Plus, MoreHorizontal, 
  PenSquare, Trash2, X, Microscope, Calculator, 
  Languages, Globe, Activity, GraduationCap, Users
} from 'lucide-react';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { ModalPortal } from './ModalPortal';
import { useData } from '../contexts/DataContext';

export const AcademicSubjects: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, classes } = useData();
  const [filterGrade, setFilterGrade] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const initialSubject: Partial<Subject> = {
    type: 'Core',
    gradeLevel: 'Grade 10',
    department: 'General'
  };
  const [newSubject, setNewSubject] = useState<Partial<Subject>>(initialSubject);

  // Ensure modal always appears in-frame on both desktop + mobile
  useModalScrollLock(isModalOpen, { scrollToTopOnOpen: true });

  // --- Logic ---
  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = 
      sub.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.nameMm.includes(searchTerm) ||
      sub.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Extract base grade for matching (e.g., "Grade 10" from "Grade 10 (ဒသမတန်း)")
    const getBaseGrade = (gradeStr: string) => {
      const match = gradeStr.match(/^(KG|Grade \d+)/);
      return match ? match[0] : gradeStr;
    };
    
    const matchesGrade = filterGrade === 'All' || 
      sub.gradeLevel === filterGrade || 
      sub.gradeLevel === 'All' ||
      getBaseGrade(sub.gradeLevel) === getBaseGrade(filterGrade) ||
      sub.gradeLevel.includes(filterGrade) ||
      filterGrade.includes(sub.gradeLevel);

    return matchesSearch && matchesGrade;
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this subject?')) {
      deleteSubject(id);
    }
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const subject: Subject = {
      id: editingId || `SUB-${Math.floor(Math.random() * 10000)}`,
      code: newSubject.code || 'N/A',
      nameEn: newSubject.nameEn || 'New Subject',
      nameMm: newSubject.nameMm || '',
      gradeLevel: newSubject.gradeLevel || 'Grade 10',
      type: newSubject.type as any,
      periodsPerWeek: newSubject.periodsPerWeek || 4,
      department: newSubject.department || 'General'
    };
    if (modalMode === 'edit' && editingId) {
      updateSubject(editingId, subject);
    } else {
      addSubject(subject);
    }
    setIsModalOpen(false);
    setEditingId(null);
    setModalMode('add');
    setNewSubject(initialSubject);
  };

  // Helper to get icon based on subject name/dept
  const getSubjectIcon = (name: string, dept: string) => {
    const n = name.toLowerCase();
    const d = dept.toLowerCase();
    if (d.includes('science') || n.includes('physics') || n.includes('chemistry') || n.includes('bio')) return <Microscope size={18} />;
    if (d.includes('math') || n.includes('math')) return <Calculator size={18} />;
    if (d.includes('myanmar') || d.includes('english')) return <Languages size={18} />;
    if (d.includes('arts') || n.includes('history') || n.includes('geo')) return <Globe size={18} />;
    if (d.includes('sport') || n.includes('pe')) return <Activity size={18} />;
    return <BookOpen size={18} />;
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-20">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Subjects</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">သင်ရိုးညွှန်းတမ်း ဘာသာရပ်များ</p>
        </div>
        
        <button 
          onClick={() => { setModalMode('add'); setEditingId(null); setNewSubject(initialSubject); setIsModalOpen(true); }}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2 w-fit"
        >
           <Plus size={18} /> Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
            />
         </div>
         <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select 
               value={filterGrade}
               onChange={(e) => setFilterGrade(e.target.value)}
               className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-100 min-w-[140px] font-burmese"
            >
               <option value="All">All Grades (အားလုံးသော အတန်းများ)</option>
               {GRADE_LEVELS_LIST.map(g => (
                  <option key={g} value={g}>{g}</option>
               ))}
            </select>
         </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-slate-50">
         <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
         <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/50">
               <tr>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Code</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Subject Name</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Department</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Grade Level</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Type</th>
                  <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                     <td className="px-8 py-5">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                           {sub.code}
                        </span>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                              {getSubjectIcon(sub.nameEn, sub.department)}
                           </div>
                           <div>
                              <p className="font-bold text-slate-800 text-sm">{sub.nameEn}</p>
                              <p className="text-xs text-slate-500 font-burmese leading-loose">{sub.nameMm}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-5 text-sm font-medium text-slate-600">
                        {sub.department}
                     </td>
                     <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-700">{sub.gradeLevel}</span>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                           sub.type === 'Core' 
                           ? 'bg-blue-50 text-blue-600 border-blue-100' 
                           : sub.type === 'Elective'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                           {sub.type}
                        </span>
                        <span className="ml-2 text-xs text-slate-400 font-medium">{sub.periodsPerWeek} p/w</span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto md:pointer-events-none md:group-hover:pointer-events-auto">
                            <button 
                              onClick={() => {
                                setModalMode('edit');
                                setEditingId(sub.id);
                                setNewSubject(sub);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                               <PenSquare size={16} />
                            </button>
                            <button 
                               onClick={() => handleDelete(sub.id)}
                               className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
         </div>
         {filteredSubjects.length === 0 && (
            <div className="p-10 text-center text-slate-500">
               No subjects found matching your criteria.
            </div>
         )}
      </div>

      {/* Taught in Classes */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Taught in Classes</h3>
            <p className="text-sm text-slate-500">Classes matched by grade level</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((sub) => {
            const taughtClasses = classes.filter(c => c.name.includes(sub.gradeLevel.split(' ')[1] || sub.gradeLevel));
            return (
              <div key={`classes-${sub.id}`} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                      <GraduationCap size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{sub.nameEn}</p>
                      <p className="text-[11px] text-slate-500 font-burmese">{sub.nameMm}</p>
                    </div>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">
                    {taughtClasses.length} classes
                  </span>
                </div>
                <div className="space-y-2 max-h-36 overflow-auto pr-1">
                  {taughtClasses.length === 0 && (
                    <p className="text-xs text-slate-400">No class mapped</p>
                  )}
                  {taughtClasses.map(cls => (
                    <div key={cls.id} className="flex items-center justify-between text-xs bg-white border border-slate-100 rounded-xl px-3 py-2">
                      <span className="font-bold text-slate-700">{cls.name}</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users size={12} /> {cls.studentCount ?? 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
              <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 relative max-h-[90vh] flex flex-col pn-modal-panel pn-modal-compact">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"><X size={20} /></button>
                <h3 className="text-2xl font-bold text-slate-800 mb-6">{modalMode === 'edit' ? 'Edit Subject' : 'Add New Subject'}</h3>
                
                <form onSubmit={handleAddSubject} className="space-y-4 overflow-y-auto pn-modal-body">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Subject Code</label>
                          <input 
                            type="text" 
                            placeholder="e.g. ENG-101"
                            value={newSubject.code}
                            onChange={e => setNewSubject({...newSubject, code: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Mathematics"
                            value={newSubject.department}
                            onChange={e => setNewSubject({...newSubject, department: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                          />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject Name (English)</label>
                      <input 
                          type="text" 
                          placeholder="e.g. Advanced English"
                          value={newSubject.nameEn}
                          onChange={e => setNewSubject({...newSubject, nameEn: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject Name (Myanmar)</label>
                      <input 
                          type="text" 
                          placeholder="e.g. အင်္ဂလိပ်စာ"
                          value={newSubject.nameMm}
                          onChange={e => setNewSubject({...newSubject, nameMm: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 font-burmese"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Grade Level</label>
                          <select 
                            value={newSubject.gradeLevel}
                            onChange={e => setNewSubject({...newSubject, gradeLevel: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                          >
                            <option>Grade 9</option>
                            <option>Grade 10</option>
                            <option>Grade 11</option>
                            <option>All</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                          <select 
                            value={newSubject.type}
                            onChange={e => setNewSubject({...newSubject, type: e.target.value as any})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                          >
                            <option>Core</option>
                            <option>Elective</option>
                            <option>Activity</option>
                          </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Periods Per Week</label>
                      <input 
                          type="number" 
                          value={newSubject.periodsPerWeek}
                          onChange={e => setNewSubject({...newSubject, periodsPerWeek: parseInt(e.target.value)})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all mt-4"
                    >
                      Save Subject
                    </button>
                </form>
              </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};