import React, { useState } from 'react';
import { calculateSSB } from '../constants';
import { Expense, Staff } from '../types';
import { Users, DollarSign, FileText, Download, UserPlus, X, Check, Printer, Wallet, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const HR: React.FC = () => {
  const { staff: staffList, addStaff, expenses, addExpense, deleteExpense } = useData();
  const payrollMonth = new Date().toISOString().slice(0, 7); // yyyy-mm

  // --- State Management ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    department: 'Teaching',
    baseSalary: '',
  });

  // --- Calculations ---
  // Logic: Sum of all Net Pay (Base - SSB)
  const totalPayroll = staffList.reduce((acc, staff) => {
     const ssb = calculateSSB(staff.baseSalary);
     return acc + (staff.baseSalary - ssb.employee);
  }, 0);

  // --- Handlers ---
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.baseSalary) return;

    const getNextStaffId = () => {
      const nums = staffList
        .map((s) => {
          const m = String(s.id || '').match(/(\d+)/);
          return m ? Number(m[1]) : NaN;
        })
        .filter((n) => Number.isFinite(n)) as number[];
      const next = (nums.length ? Math.max(...nums) : 0) + 1;
      return `TF-${String(next).padStart(3, '0')}`;
    };

    const staff: Staff = {
      id: getNextStaffId(),
      name: newStaff.name,
      role: newStaff.role,
      department: newStaff.department,
      baseSalary: parseInt(newStaff.baseSalary),
      joinDate: new Date().toISOString().split('T')[0]
    };

    addStaff(staff);
    setIsAddModalOpen(false);
    setNewStaff({ name: '', role: '', department: 'Teaching', baseSalary: '' });
  };

  const getPayrollExpenseId = (staffId: string, month: string) => `SAL-${staffId}-${month}`;

  const isStaffPaidForMonth = (staffId: string, month: string): boolean => {
    const id = getPayrollExpenseId(staffId, month);
    return expenses.some((e) => e.id === id);
  };

  const togglePayment = (member: Staff) => {
    const month = new Date().toISOString().slice(0, 7); // yyyy-mm
    const id = getPayrollExpenseId(member.id, month);

    if (isStaffPaidForMonth(member.id, month)) {
      deleteExpense(id);
      return;
    }

    const ssb = calculateSSB(member.baseSalary);
    const netPay = member.baseSalary - ssb.employee;
    const expense: Expense = {
      id,
      category: 'Salaries',
      description: `Payroll (${month}) - ${member.name} (${member.id})`,
      amount: netPay,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'Bank Transfer',
      status: 'Paid',
    };
    addExpense(expense);
  };

  const handleExport = () => {
    const headers = ["ID", "Name", "Role", "Department", "Base Salary", "SSB Deduction", "Net Pay", "Status"];
    const csvContent = [
      headers.join(","),
      ...staffList.map(staff => {
        const ssb = calculateSSB(staff.baseSalary);
        const net = staff.baseSalary - ssb.employee;
        const month = new Date().toISOString().slice(0, 7);
        const status = isStaffPaidForMonth(staff.id, month) ? "Paid" : "Pending";
        return [
          staff.id, 
          `"${staff.name}"`, 
          staff.role, 
          staff.department, 
          staff.baseSalary, 
          ssb.employee, 
          net,
          status
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPayslip = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsPayslipOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">HR & Payroll</h2>
          <p className="text-slate-500 font-burmese text-sm mt-1 leading-loose">ဝန်ထမ်းရေးရာနှင့် လစာပေးချေမှု</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 px-5 py-3 bg-transparent border-2 border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors font-bold"
          >
            <Download size={18} />
            <span className="text-sm">Export Report</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-brand-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:shadow-brand-600/40 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>New Staff</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center space-x-4 border border-slate-50">
             <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Users size={24} />
             </div>
             <div>
                <p className="text-slate-500 text-sm font-medium">Total Staff</p>
                <h3 className="text-2xl font-bold text-slate-800">{staffList.length}</h3>
             </div>
          </div>
           <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center space-x-4 border border-slate-50">
             <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                <DollarSign size={24} />
             </div>
             <div>
                <p className="text-slate-500 text-sm font-medium">Monthly Payroll</p>
                <h3 className="text-2xl font-bold text-slate-800">{totalPayroll.toLocaleString()} MMK</h3>
             </div>
          </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-slate-50">
         <div className="p-8 pb-4 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">Payroll Overview</h3>
             <span className="text-xs font-bold bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl">October 2023</span>
         </div>
         <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Role & Dept</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Base Salary</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">SSB (2%)</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Net Pay</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {staffList.map(staff => {
                const ssb = calculateSSB(staff.baseSalary);
                const netPay = staff.baseSalary - ssb.employee;
                const month = new Date().toISOString().slice(0, 7);
                const isPaid = isStaffPaidForMonth(staff.id, month);
                
                return (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-5">
                        <div className="flex items-center">
                             <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold mr-4 text-sm border border-brand-100">
                                {staff.name.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold text-slate-800 text-sm">{staff.name}</p>
                                <p className="text-xs text-slate-400 font-medium">{staff.id}</p>
                             </div>
                        </div>
                    </td>
                    <td className="px-8 py-5">
                         <p className="text-sm font-bold text-slate-700">{staff.role}</p>
                         <p className="text-xs text-slate-500 font-medium">{staff.department}</p>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-600 font-semibold">{staff.baseSalary.toLocaleString()} <span className="text-xs text-slate-400 font-normal">MMK</span></td>
                    <td className="px-8 py-5 text-sm text-red-500 font-bold">-{ssb.employee.toLocaleString()}</td>
                    <td className="px-8 py-5 text-sm font-bold text-brand-600">{netPay.toLocaleString()} MMK</td>
                    <td className="px-8 py-5">
                        <button 
                          onClick={() => togglePayment(staff)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isPaid 
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Pending'}
                        </button>
                    </td>
                    <td className="px-8 py-5">
                       <button 
                        onClick={() => openPayslip(staff)}
                        className="flex items-center space-x-1 text-slate-400 hover:text-brand-600 transition-colors text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm"
                       >
                          <FileText size={16} />
                          <span>Slip</span>
                       </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Add Staff Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[32px] p-4 sm:p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-2xl font-bold text-slate-800">Add New Staff</h3>
               <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 pn-modal-close">
                 <X size={20} />
               </button>
             </div>
             
             <form onSubmit={handleAddStaff} className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                   <input 
                      autoFocus
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none"
                      placeholder="e.g. U Hla Maung"
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none"
                        placeholder="e.g. Teacher"
                        value={newStaff.role}
                        onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                    <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none"
                        value={newStaff.department}
                        onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
                    >
                      <option>Teaching</option>
                      <option>Administration</option>
                      <option>Security</option>
                      <option>Maintenance</option>
                    </select>
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Base Salary (MMK)</label>
                   <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all outline-none font-mono"
                      placeholder="e.g. 300000"
                      value={newStaff.baseSalary}
                      onChange={(e) => setNewStaff({...newStaff, baseSalary: e.target.value})}
                   />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-6 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-500 transition-all"
                  >
                    Add Staff
                  </button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* --- Payslip Modal --- */}
      {isPayslipOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col pn-modal-panel">
              
              {/* Slip Header */}
              <div className="bg-brand-600 p-6 sm:p-8 text-white relative overflow-hidden flex-shrink-0">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Wallet size={120} />
                 </div>
                 <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">Payslip</h3>
                      <p className="opacity-80">October 2023</p>
                    </div>
                    <button onClick={() => setIsPayslipOpen(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors">
                       <X size={20} />
                    </button>
                 </div>
                 <div className="mt-6 flex items-center space-x-4">
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm">
                      {selectedStaff.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{selectedStaff.name}</p>
                      <p className="text-sm opacity-80">{selectedStaff.role} • {selectedStaff.id}</p>
                    </div>
                 </div>
              </div>

              {/* Slip Body */}
              <div className="p-4 sm:p-8 space-y-8 overflow-y-auto pn-modal-compact">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Earnings</h4>
                       <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                          <span className="text-slate-600 font-medium">Base Salary</span>
                          <span className="font-bold text-slate-800">{selectedStaff.baseSalary.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                          <span className="text-slate-600 font-medium">Overtime</span>
                          <span className="font-bold text-slate-800">0</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Deductions</h4>
                       <div className="flex justify-between items-center p-4 bg-red-50 rounded-2xl text-red-700">
                          <span className="font-medium">SSB (2%)</span>
                          <span className="font-bold">-{calculateSSB(selectedStaff.baseSalary).employee.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                          <span className="text-slate-600 font-medium">Tax</span>
                          <span className="font-bold text-slate-800">0</span>
                       </div>
                    </div>
                 </div>

                 <div className="border-t border-dashed border-slate-200 my-6"></div>

                 <div className="flex justify-between items-end">
                    <div>
                       <p className="text-sm text-slate-400 font-medium mb-1">Net Payable</p>
                       <p className="text-3xl font-bold text-brand-600">
                         {(selectedStaff.baseSalary - calculateSSB(selectedStaff.baseSalary).employee).toLocaleString()} 
                         <span className="text-sm text-slate-400 font-medium ml-2">MMK</span>
                       </p>
                    </div>
                    {isStaffPaidForMonth(selectedStaff.id, payrollMonth) ? (
                       <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                          <Check size={20} />
                          <span className="font-bold">Paid</span>
                       </div>
                    ) : (
                       <div className="flex items-center space-x-2 text-slate-500 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                          <AlertCircle size={20} />
                          <span className="font-bold">Pending</span>
                       </div>
                    )}
                 </div>
              </div>

              {/* Slip Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
                 <button className="flex items-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-colors shadow-sm">
                    <Printer size={18} />
                    <span>Print</span>
                 </button>
                 <button className="flex items-center space-x-2 px-6 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-colors">
                    <Download size={18} />
                    <span>Download PDF</span>
                 </button>
              </div>

           </div>
        </div>
      )}

    </div>
  );
};