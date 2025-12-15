import React, { useState } from 'react';
import { FEE_STRUCTURES_MOCK, GRADE_LEVELS_LIST } from '../constants';
import { FeeType } from '../types';
import { 
  Plus, Search, Edit3, Trash2, X, MoreHorizontal, 
  DollarSign, Calendar, Users, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { ModalPortal } from './ModalPortal';

export const FeeStructures: React.FC = () => {
  // State
  const [fees, setFees] = useState<FeeType[]>(FEE_STRUCTURES_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFreq, setFilterFreq] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState: Partial<FeeType> = {
    nameEn: '',
    nameMm: '',
    amount: 0,
    frequency: 'Monthly',
    academicYear: '2024-2025',
    applicableGrades: [],
    description: '',
    dueDate: '',
    isActive: true
  };
  
  const [formData, setFormData] = useState<Partial<FeeType>>(initialFormState);

  // Ensure modal always appears in-frame on both desktop + mobile
  useModalScrollLock(isModalOpen, { scrollToTopOnOpen: true });

  // --- Helpers ---
  const filteredFees = fees.filter(fee => {
    const matchesSearch = 
      fee.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
      fee.nameMm.includes(searchTerm);
    const matchesFreq = filterFreq === 'All' || fee.frequency === filterFreq;
    return matchesSearch && matchesFreq;
  });

  const getFrequencyColor = (freq: string) => {
    switch(freq) {
      case 'Monthly': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Yearly': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'One-time': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  // --- Handlers ---
  const handleOpenModal = (fee?: FeeType) => {
    if (fee) {
      setEditingId(fee.id);
      setFormData({ ...fee });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const toggleGradeSelection = (grade: string) => {
    const currentGrades = formData.applicableGrades || [];
    
    // Logic for "All" toggle
    if (grade === 'All') {
       if (currentGrades.includes('All')) {
          setFormData({ ...formData, applicableGrades: [] });
       } else {
          setFormData({ ...formData, applicableGrades: ['All'] });
       }
       return;
    }

    // Normal toggle
    // If "All" was previously selected, remove it first
    let newGrades = currentGrades.filter(g => g !== 'All');

    if (newGrades.includes(grade)) {
      newGrades = newGrades.filter(g => g !== grade);
    } else {
      newGrades.push(grade);
    }
    setFormData({ ...formData, applicableGrades: newGrades });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nameEn || !formData.amount) return;

    if (editingId) {
      setFees(prev => prev.map(f => f.id === editingId ? { ...f, ...formData } as FeeType : f));
    } else {
      const newFee: FeeType = {
        ...formData,
        id: `FEE-${Date.now()}`,
        isActive: true
      } as FeeType;
      setFees([...fees, newFee]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this fee structure? This cannot be undone.')) {
      setFees(prev => prev.filter(f => f.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Fee Structures</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">ကျောင်းလခနှင့် အခကြေးငွေ သတ်မှတ်ချက်များ</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2 w-fit"
        >
           <Plus size={18} /> Add New Fee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search fees..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
            />
         </div>
         <div className="flex items-center gap-2">
            <select 
               value={filterFreq}
               onChange={(e) => setFilterFreq(e.target.value)}
               className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 px-4 py-3 outline-none cursor-pointer hover:bg-slate-100 min-w-[160px]"
            >
               <option value="All">All Frequencies</option>
               <option value="Monthly">Monthly</option>
               <option value="Termly">Termly</option>
               <option value="Yearly">Yearly</option>
               <option value="One-time">One-time</option>
            </select>
         </div>
      </div>

      {/* Fee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {filteredFees.map(fee => (
            <div key={fee.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 hover:shadow-md transition-all group relative">
               <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${fee.isActive ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                     <DollarSign size={24} />
                  </div>
                  <div className="flex gap-2">
                     <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${getFrequencyColor(fee.frequency)}`}>
                        {fee.frequency}
                     </span>
                  </div>
               </div>

               <h3 className="font-bold text-lg text-slate-800">{fee.nameEn}</h3>
               <p className="font-burmese text-sm text-slate-500 mb-2">{fee.nameMm}</p>
               <h4 className="text-2xl font-bold text-slate-800 mb-4">
                  {fee.amount.toLocaleString()} <span className="text-sm text-slate-400 font-medium">MMK</span>
               </h4>

               <div className="space-y-3 pt-4 border-t border-slate-50">
                   <div className="flex items-start gap-3">
                      <Users size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">Applicable Grades</p>
                         <p className="text-sm font-medium text-slate-700 leading-snug font-burmese">
                            {fee.applicableGrades.includes('All') ? 'All Grades (အားလုံးသော အတန်းများ)' : fee.applicableGrades.join(', ')}
                         </p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <Calendar size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <div>
                         <p className="text-xs font-bold text-slate-500 uppercase">Due Date</p>
                         <p className="text-sm font-medium text-slate-700">{fee.dueDate || 'N/A'}</p>
                      </div>
                   </div>
               </div>
                
               {/* Actions Overlay */}
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <button 
                     onClick={() => handleOpenModal(fee)}
                     className="p-2 bg-slate-100 hover:bg-brand-50 hover:text-brand-600 rounded-lg text-slate-500 transition-colors"
                  >
                     <Edit3 size={16} />
                  </button>
                  <button 
                     onClick={() => handleDelete(fee.id)}
                     className="p-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-500 transition-colors"
                  >
                     <Trash2 size={16} />
                  </button>
               </div>
            </div>
         ))}
      </div>

      {filteredFees.length === 0 && (
         <div className="p-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
             <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 font-medium">No fee structures found.</p>
         </div>
      )}

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
              <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
                <button onClick={handleCloseModal} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors pn-modal-close">
                    <X size={20} />
                </button>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-1">{editingId ? 'Edit Fee Structure' : 'Create New Fee'}</h3>
                <p className="text-slate-500 text-sm mb-6">Define fee details, amounts, and applicable grades.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Name (English)</label>
                        <input 
                           type="text" 
                           required
                           placeholder="e.g. Tuition Fee"
                           value={formData.nameEn}
                           onChange={e => setFormData({...formData, nameEn: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Name (Myanmar)</label>
                        <input 
                           type="text" 
                           placeholder="e.g. ကျောင်းလခ"
                           value={formData.nameMm}
                           onChange={e => setFormData({...formData, nameMm: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-burmese focus:ring-2 focus:ring-brand-500/20"
                        />
                     </div>
                  </div>

                  {/* Financials */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Amount (MMK)</label>
                        <input 
                           type="number" 
                           required
                           min="0"
                           value={formData.amount}
                           onChange={e => setFormData({...formData, amount: parseInt(e.target.value)})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-brand-500/20"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Frequency</label>
                        <select 
                           value={formData.frequency}
                           onChange={e => setFormData({...formData, frequency: e.target.value as any})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        >
                           <option value="Monthly">Monthly</option>
                           <option value="Termly">Termly</option>
                           <option value="Yearly">Yearly</option>
                           <option value="One-time">One-time</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Academic Year</label>
                        <select 
                           value={formData.academicYear}
                           onChange={e => setFormData({...formData, academicYear: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                        >
                           <option>2024-2025</option>
                           <option>2025-2026</option>
                        </select>
                     </div>
                  </div>

                  {/* Grade Selection */}
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-3">Applicable Grades</label>
                     <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 max-h-40 overflow-y-auto">
                        <button
                           type="button"
                           onClick={() => toggleGradeSelection('All')}
                           className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all font-burmese ${
                              formData.applicableGrades?.includes('All') 
                              ? 'bg-brand-600 text-white border-brand-600' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'
                           }`}
                        >
                           All Grades (အားလုံးသော အတန်းများ)
                        </button>
                        {GRADE_LEVELS_LIST.map(grade => (
                           <button
                              key={grade}
                              type="button"
                              onClick={() => toggleGradeSelection(grade)}
                              disabled={formData.applicableGrades?.includes('All')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                 formData.applicableGrades?.includes(grade)
                                 ? 'bg-brand-100 text-brand-700 border-brand-200'
                                 : formData.applicableGrades?.includes('All')
                                   ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                   : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'
                              }`}
                           >
                              {grade}
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Due Date / Policy</label>
                        <input 
                           type="text" 
                           placeholder="e.g. 5th of every month"
                           value={formData.dueDate}
                           onChange={e => setFormData({...formData, dueDate: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                        />
                     </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
                        <input 
                           type="text" 
                           placeholder="Short description..."
                           value={formData.description}
                           onChange={e => setFormData({...formData, description: e.target.value})}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                        />
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                     <button 
                        type="button"
                        onClick={handleCloseModal}
                        className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                     >
                        Cancel
                     </button>
                     <button 
                        type="submit"
                        className="px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all"
                     >
                        {editingId ? 'Update Fee' : 'Create Fee Structure'}
                     </button>
                  </div>
                </form>
              </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};