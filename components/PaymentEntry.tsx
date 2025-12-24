import React, { useState, useMemo } from 'react';
import { Student, Payment } from '../types';
import { 
  Search, User, CheckCircle2, DollarSign, Calendar, CreditCard, 
  Printer, X, ChevronRight, Wallet, Banknote, History, Filter
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const PaymentEntry: React.FC = () => {
  const { students, feeStructures, addPayment, updateStudent } = useData();

  // Steps: 'SEARCH' -> 'FEES' -> 'RECEIPT'
  const [step, setStep] = useState<'SEARCH' | 'FEES' | 'RECEIPT'>('SEARCH');
  
  // Selection State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  
  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [remark, setRemark] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0); // Input amount (for change calc)

  // --- Derived Data ---

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return students.filter(s => 
      s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.nameMm.includes(searchTerm) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, students]);

  const applicableFees = useMemo(() => {
    if (!selectedStudent) return [];
    return feeStructures.filter(fee => {
      if (!fee.isActive) return false;
      const isAll = fee.applicableGrades.includes('All');
      // Simple grade matching logic: check if student grade string contains fee grade key
      // e.g. "Grade 10 (A)" contains "Grade 10"
      const isGradeMatch = fee.applicableGrades.some(g => selectedStudent.grade.includes(g));
      return isAll || isGradeMatch;
    });
  }, [selectedStudent, feeStructures]);

  const totalPayable = useMemo(() => {
    const fees = applicableFees.filter(f => selectedFeeIds.includes(f.id));
    const subtotal = fees.reduce((sum, f) => sum + f.amount, 0);
    return Math.max(0, subtotal - discount);
  }, [applicableFees, selectedFeeIds, discount]);

  // --- Handlers ---

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchTerm('');
    // Auto-select all fees by default for convenience
    // In a real app, we'd check which are already paid
    const fees = feeStructures.filter(fee => {
        if (!fee.isActive) return false;
        const isAll = fee.applicableGrades.includes('All');
        const isGradeMatch = fee.applicableGrades.some(g => student.grade.includes(g));
        return isAll || isGradeMatch;
    });
    setSelectedFeeIds(fees.map(f => f.id));
    setStep('FEES');
  };

  const toggleFee = (id: string) => {
    setSelectedFeeIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleProcessPayment = () => {
    if (!selectedStudent) return;

    const now = new Date();
    const date = now.toISOString().slice(0, 10);

    const selectedFees = applicableFees.filter((f) => selectedFeeIds.includes(f.id));
    const subtotal = selectedFees.reduce((sum, f) => sum + f.amount, 0);
    const totalAmount = Math.max(0, subtotal - discount);

    const payment: Payment = {
      id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      studentId: selectedStudent.id,
      payerName: selectedStudent.nameEn,
      paymentMethod,
      remark: remark || undefined,
      discount: Number.isFinite(discount) ? discount : 0,
      totalAmount,
      date,
      items: selectedFees.map((f, idx) => ({
        lineNo: idx + 1,
        feeTypeId: f.id,
        description: f.nameEn,
        amount: f.amount,
      })),
      meta: {
        source: 'PaymentEntry',
      },
    };

    addPayment(payment);

    // Update student fee status (simple: reduce pending by paid total)
    const nextPending = Math.max(0, (selectedStudent.feesPending || 0) - totalAmount);
    updateStudent(selectedStudent.id, {
      feesPending: nextPending,
      lastPaymentDate: date,
      status: nextPending > 0 ? 'Fees Due' : (selectedStudent.status === 'Fees Due' ? 'Active' : selectedStudent.status),
    });

    setStep('RECEIPT');
  };

  const handleReset = () => {
    setSelectedStudent(null);
    setSelectedFeeIds([]);
    setPaymentMethod('Cash');
    setRemark('');
    setDiscount(0);
    setPaidAmount(0);
    setStep('SEARCH');
  };

  // --- Render Steps ---

  const renderSearchStep = () => (
    <div className="max-w-2xl mx-auto pt-10 animate-fade-in">
       <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-200">
             <DollarSign size={40} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Fee Payment Entry</h2>
          <p className="text-slate-500 mt-2">Search for a student to begin transaction</p>
       </div>

       <div className="bg-white p-2 rounded-[24px] shadow-lg shadow-slate-200/50 border border-slate-100 relative z-20">
          <div className="relative">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
             <input 
               autoFocus
               type="text" 
               className="w-full pl-16 pr-6 py-5 bg-transparent text-lg font-medium text-slate-800 outline-none placeholder:text-slate-300"
               placeholder="Enter student name or ID..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          
          {/* Results Dropdown */}
          {searchResults.length > 0 && (
             <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[24px] shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
                   {searchResults.map(student => (
                      <button 
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-4 group"
                      >
                         <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                            {student.nameEn.charAt(0)}
                         </div>
                         <div>
                            <h4 className="font-bold text-slate-800">{student.nameEn}</h4>
                            <p className="text-sm text-slate-500">{student.grade} • {student.id}</p>
                         </div>
                         <div className="ml-auto">
                            <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-500" />
                         </div>
                      </button>
                   ))}
                </div>
             </div>
          )}
       </div>

       {searchResults.length === 0 && searchTerm.length > 2 && (
          <div className="text-center mt-12 text-slate-400 animate-fade-in">
             <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} />
             </div>
             <p>No students found matching "{searchTerm}"</p>
          </div>
       )}
    </div>
  );

  const renderFeesStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in h-[calc(100vh-140px)]">
       {/* Left Column: Student & Fees */}
       <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 pb-20">
          
          {/* Student Header */}
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-2xl">
                   {selectedStudent?.nameEn.charAt(0)}
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-800">{selectedStudent?.nameEn}</h3>
                   <p className="text-slate-500 font-burmese">{selectedStudent?.nameMm}</p>
                   <div className="flex gap-3 mt-1 text-sm text-slate-400 font-medium">
                      <span>{selectedStudent?.id}</span>
                      <span>•</span>
                      <span>{selectedStudent?.grade}</span>
                   </div>
                </div>
             </div>
             <button onClick={handleReset} className="px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
                Change
             </button>
          </div>

          {/* Fees List */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-50 overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Applicable Fees</h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-lg">
                   {selectedFeeIds.length} Selected
                </span>
             </div>
             <div className="divide-y divide-slate-50">
                {applicableFees.map(fee => {
                   const isSelected = selectedFeeIds.includes(fee.id);
                   return (
                      <div 
                        key={fee.id}
                        onClick={() => toggleFee(fee.id)}
                        className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-brand-50/30' : 'hover:bg-slate-50'}`}
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 bg-white'}`}>
                               {isSelected && <CheckCircle2 size={16} />}
                            </div>
                            <div>
                               <p className={`font-bold ${isSelected ? 'text-brand-700' : 'text-slate-700'}`}>{fee.nameEn}</p>
                               <p className="text-xs text-slate-400 font-medium">{fee.frequency}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-bold text-slate-800">{fee.amount.toLocaleString()} MMK</p>
                            <p className="text-xs text-slate-400">Due: {fee.dueDate || 'Immediate'}</p>
                         </div>
                      </div>
                   );
                })}
                {applicableFees.length === 0 && (
                   <div className="p-12 text-center text-slate-400">
                      No applicable fees found for this student's grade.
                   </div>
                )}
             </div>
          </div>
       </div>

       {/* Right Column: Payment Summary */}
       <div className="space-y-6">
          <div className="bg-white p-6 rounded-[24px] shadow-xl shadow-brand-900/5 border border-slate-50 sticky top-0">
             <h3 className="font-bold text-slate-800 mb-6">Payment Details</h3>
             
             <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Subtotal</span>
                   <span className="font-bold text-slate-800">
                      {applicableFees.filter(f => selectedFeeIds.includes(f.id)).reduce((sum, f) => sum + f.amount, 0).toLocaleString()} MMK
                   </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Discount</span>
                   <input 
                     type="number" 
                     value={discount}
                     onChange={e => setDiscount(Number(e.target.value))}
                     className="w-24 text-right bg-slate-50 border-none rounded-lg px-2 py-1 text-sm font-bold text-red-500 focus:ring-1 focus:ring-red-200"
                   />
                </div>
                <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-end">
                   <span className="text-slate-600 font-bold">Total Payable</span>
                   <span className="text-2xl font-bold text-brand-600">{totalPayable.toLocaleString()} MMK</span>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Payment Method</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['Cash', 'KBZPay', 'Wave', 'Bank'].map(method => (
                         <button
                           key={method}
                           onClick={() => setPaymentMethod(method)}
                           className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                              paymentMethod === method 
                              ? 'bg-brand-600 text-white border-brand-600' 
                              : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300'
                           }`}
                         >
                            {method}
                         </button>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Remark / Note</label>
                   <textarea 
                      value={remark}
                      onChange={e => setRemark(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 resize-none"
                      placeholder="Optional note..."
                   />
                </div>

                <button 
                   onClick={handleProcessPayment}
                   disabled={selectedFeeIds.length === 0}
                   className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                   <CheckCircle2 size={20} /> Confirm Payment
                </button>
             </div>
          </div>
       </div>
    </div>
  );

  const renderReceiptStep = () => (
    <div className="max-w-md mx-auto pt-10 animate-fade-in">
       <div className="bg-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
          {/* Decorative Top */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-400 to-brand-600"></div>
          
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
             </div>
             <h2 className="text-2xl font-bold text-slate-800">Payment Successful</h2>
             <p className="text-slate-500 text-sm mt-1">Transaction recorded successfully</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8 relative">
             {/* Receipt Cutout Effect */}
             <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>
             <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full"></div>
             
             <div className="space-y-4">
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Receipt No</span>
                   <span className="font-mono font-bold text-slate-700">RCP-{Date.now().toString().slice(-6)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Date</span>
                   <span className="font-bold text-slate-700">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-slate-500">Student</span>
                   <span className="font-bold text-slate-700">{selectedStudent?.nameEn}</span>
                </div>
                <div className="border-t border-dashed border-slate-300 pt-4 mt-2">
                   <div className="flex justify-between items-end">
                      <span className="font-bold text-slate-800">Amount Paid</span>
                      <span className="text-2xl font-bold text-brand-600">{totalPayable.toLocaleString()}</span>
                   </div>
                   <p className="text-right text-xs text-slate-400 mt-1 uppercase">{paymentMethod}</p>
                </div>
             </div>
          </div>

          <div className="flex gap-3">
             <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 flex items-center justify-center gap-2">
                <Printer size={18} /> Print
             </button>
             <button 
                onClick={handleReset}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20"
             >
                New Payment
             </button>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
       {/* Breadcrumb Header */}
       {step !== 'SEARCH' && step !== 'RECEIPT' && (
          <button 
            onClick={handleReset} 
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm mb-4 w-fit transition-colors"
          >
             <X size={16} /> Cancel Transaction
          </button>
       )}

       <div className="flex-1">
          {step === 'SEARCH' && renderSearchStep()}
          {step === 'FEES' && renderFeesStep()}
          {step === 'RECEIPT' && renderReceiptStep()}
       </div>
    </div>
  );
};