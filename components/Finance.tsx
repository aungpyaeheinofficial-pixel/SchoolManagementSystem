import React, { useState } from 'react';
import { 
  Upload, Percent, AlertCircle, CheckCircle, Loader2, 
  TrendingUp, TrendingDown, DollarSign, FileText, 
  CreditCard, Wallet, Calendar, Search, Filter, Plus, 
  MoreHorizontal, Printer, X, Download, ChevronDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { STUDENTS_MOCK } from '../constants';
import { Expense, Transaction } from '../types';

// --- Mock Data ---

const EXPENSES_MOCK: Expense[] = [
  { id: "EXP-001", category: 'Utilities', description: 'Electricity Bill - Nov', amount: 15000, date: '2024-12-10', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: "EXP-002", category: 'Salaries', description: 'Teacher Salaries - Nov', amount: 500000, date: '2024-12-08', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: "EXP-003", category: 'Supplies', description: 'Office Stationery', amount: 25000, date: '2024-12-05', paymentMethod: 'Cash', status: 'Paid' },
];

const TRANSACTIONS_MOCK: Transaction[] = [
  { id: "TRX-001", name: "Ma Hla Hla", type: 'Income', description: 'Tuition Fee - Dec', amount: 50000, date: '2024-12-10', status: 'Verified', paymentMethod: 'KBZPay' },
  { id: "TRX-002", name: "Electricity Bill", type: 'Expense', description: 'Monthly Bill', amount: 15000, date: '2024-12-10', status: 'Verified', paymentMethod: 'Bank Transfer' },
  { id: "TRX-003", name: "Mg Ba Kaung", type: 'Income', description: 'Tuition Fee - Dec', amount: 45000, date: '2024-12-09', status: 'Pending', paymentMethod: 'Wave Money' },
];

const INCOME_DATA = [
  { name: 'Jun', income: 1200000, expense: 800000 },
  { name: 'Jul', income: 1500000, expense: 900000 },
  { name: 'Aug', income: 1300000, expense: 850000 },
  { name: 'Sep', income: 1400000, expense: 880000 },
  { name: 'Oct', income: 1800000, expense: 950000 },
  { name: 'Nov', income: 1600000, expense: 920000 },
];

const EXPENSE_BREAKDOWN = [
  { name: 'Salaries', value: 500000, color: '#EF4444' },
  { name: 'Utilities', value: 100000, color: '#F59E0B' },
  { name: 'Supplies', value: 80000, color: '#10B981' },
  { name: 'Others', value: 50000, color: '#6366F1' },
];

type Tab = 'OVERVIEW' | 'FEES' | 'EXPENSES' | 'REPORTS';

export const Finance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
  
  // States for Fees Collection
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any | null>(null);
  const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'FORM' | 'RECEIPT'>('FORM');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Filter States
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [filterDay, setFilterDay] = useState('');

  // States for Expense
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({ category: 'Others', paymentMethod: 'Cash' });

  // Helpers
  const years = [2023, 2024, 2025];
  const months = [
    { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ];

  // --- Handlers ---

  const handleCollectClick = (student: any) => {
    setSelectedStudentForPayment(student);
    setPaymentStep('FORM');
    setUploadSuccess(false);
    setIsCollectModalOpen(true);
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
    }, 1500);
  };

  const handlePaymentSubmit = () => {
    // Logic to save payment would go here
    setPaymentStep('RECEIPT');
  };

  // --- Components ---

  const StatCard = ({ title, value, subtext, trend, color }: any) => (
    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
      <p className="text-slate-500 text-sm font-medium mb-2">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">{value}</h3>
      <div className="flex items-center space-x-2">
        <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trend === 'up' ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
          {subtext}
        </span>
        <span className="text-xs text-slate-400">vs last month</span>
      </div>
    </div>
  );

  const FilterControls = () => (
     <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        {/* Year */}
        <select 
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100"
        >
           {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Month */}
        <select 
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:outline-none cursor-pointer hover:bg-slate-100"
        >
           <option value="">All Months</option>
           {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        {/* Specific Day */}
        <div className="relative">
           <input 
            type="date"
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="pl-3 pr-2 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:outline-none w-auto hover:bg-slate-100"
           />
        </div>
     </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 text-lg">Financial Overview</h3>
          <FilterControls />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Income" value="2,150,000 MMK" subtext="15%" trend="up" />
        <StatCard title="Total Expenses" value="1,240,000 MMK" subtext="8%" trend="up" />
        <StatCard title="Net Profit" value="910,000 MMK" subtext="25%" trend="up" />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-amber-800 text-xs font-bold uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-amber-900 mt-1">3 <span className="text-sm font-medium opacity-70">Students</span></p>
          </div>
          <AlertCircle className="text-amber-500 opacity-50" size={24} />
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
           <div>
            <p className="text-blue-800 text-xs font-bold uppercase tracking-wider">Collected Wk</p>
            <p className="text-xl font-bold text-blue-900 mt-1">450K <span className="text-xs font-medium opacity-70">MMK</span></p>
          </div>
          <Wallet className="text-blue-500 opacity-50" size={24} />
        </div>
         <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
           <div>
            <p className="text-red-800 text-xs font-bold uppercase tracking-wider">Overdue</p>
            <p className="text-2xl font-bold text-red-900 mt-1">1 <span className="text-sm font-medium opacity-70">Late</span></p>
          </div>
          <AlertCircle className="text-red-500 opacity-50" size={24} />
        </div>
         <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between">
           <div>
            <p className="text-green-800 text-xs font-bold uppercase tracking-wider">Due Today</p>
            <p className="text-2xl font-bold text-green-900 mt-1">2 <span className="text-sm font-medium opacity-70">Inv</span></p>
          </div>
          <Calendar className="text-green-500 opacity-50" size={24} />
        </div>
      </div>

      {/* Main Charts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800">Income vs Expense</h3>
            <select className="bg-slate-50 border-none text-slate-500 text-xs font-medium px-3 py-1.5 rounded-lg focus:ring-0 cursor-pointer">
              <option>Last 6 Months</option>
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={INCOME_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                 <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={3} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={3} name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions / Pending Actions */}
        <div className="space-y-6">
           {/* Pending Action Widget */}
           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
              <h3 className="font-bold text-lg text-slate-800 mb-4">Pending Verification</h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">Mg Ba Kaung</p>
                      <p className="text-xs text-slate-500">Grade 11 (B)</p>
                    </div>
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">45,000 MMK</span>
                 </div>
                 <div className="h-16 bg-slate-200 rounded-lg w-full flex items-center justify-center text-slate-400 text-xs">
                    Screenshot Preview
                 </div>
                 <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-green-500 text-white rounded-xl text-xs font-bold hover:bg-green-600 transition-colors">Approve</button>
                    <button className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">Reject</button>
                 </div>
              </div>
           </div>

           {/* Mini List */}
           <div className="bg-white p-6 rounded-[32px] shadow-sm">
             <h3 className="font-bold text-lg text-slate-800 mb-4">Recent</h3>
             <div className="space-y-4">
               {TRANSACTIONS_MOCK.slice(0, 3).map(trx => (
                 <div key={trx.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                       <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'Income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {trx.type === 'Income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-slate-800">{trx.name}</p>
                         <p className="text-xs text-slate-400">{trx.date}</p>
                       </div>
                    </div>
                    <span className={`text-sm font-bold ${trx.type === 'Income' ? 'text-green-600' : 'text-slate-800'}`}>
                      {trx.type === 'Income' ? '+' : '-'}{trx.amount.toLocaleString()}
                    </span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );

  const FeesTab = () => (
    <div className="space-y-6 animate-fade-in">
       {/* Filters */}
       <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col xl:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
             <div className="relative flex-1 min-w-[200px] md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Search student..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
             </div>
             
             {/* Date Filters Row */}
             <FilterControls />

             <div className="flex gap-2">
                <button className="px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors whitespace-nowrap">
                   <Filter size={16} /> Grade <ChevronDown size={14} />
                </button>
             </div>
          </div>
          <button className="w-full md:w-auto px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors">
             <Download size={16} /> Export List
          </button>
       </div>

       {/* Student List Table */}
       <div className="bg-white rounded-[32px] shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-50/50">
                <tr>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Grade</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pending</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                   <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {STUDENTS_MOCK.map((student) => (
                   <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                         <p className="font-bold text-slate-800 text-sm">{student.nameEn}</p>
                         <p className="text-xs text-slate-500">{student.id}</p>
                      </td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">{student.grade}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                         {student.feesPending.toLocaleString()} MMK
                      </td>
                      <td className="px-6 py-4">
                         {student.feesPending > 0 ? (
                            <span className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-100">DUE NOW</span>
                         ) : (
                            <span className="px-2 py-1 rounded-lg bg-green-50 text-green-600 text-xs font-bold border border-green-100">PAID</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         {student.feesPending > 0 ? (
                            <button 
                               onClick={() => handleCollectClick(student)}
                               className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-brand-600/20 shadow-lg hover:bg-brand-700 transition-all active:scale-95"
                            >
                               Collect
                            </button>
                         ) : (
                            <button className="px-4 py-2 text-slate-400 font-bold text-xs hover:text-brand-600 transition-colors">
                               History
                            </button>
                         )}
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );

  const ExpenseTab = () => (
    <div className="space-y-6 animate-fade-in">
       {/* Enhanced Header with Date Filter */}
       <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <h3 className="font-bold text-slate-800 ml-2 whitespace-nowrap text-lg">Expense Management</h3>
            
            {/* Quick Filter: Year & Month & Date */}
            <FilterControls />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
             <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search expenses..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all" />
             </div>
             <button 
                onClick={() => setIsAddExpenseOpen(true)}
                className="w-full md:w-auto px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
             >
                <Plus size={18} /> Add Expense
             </button>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPENSES_MOCK.map((expense) => (
             <div key={expense.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 hover:shadow-md transition-shadow group">
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-2xl transition-colors ${
                      expense.category === 'Salaries' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' :
                      expense.category === 'Utilities' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' :
                      'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
                   }`}>
                      <DollarSign size={20} />
                   </div>
                   <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded-lg border border-green-100">Paid</span>
                </div>
                <h4 className="font-bold text-lg text-slate-800 mb-1">{expense.description}</h4>
                <p className="text-xs text-slate-400 mb-4 font-medium flex items-center gap-1">
                  <Calendar size={12} />
                  {expense.date} 
                  <span className="mx-1">•</span> 
                  {expense.paymentMethod}
                </p>
                <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                   <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg">{expense.category}</span>
                   <span className="text-lg font-bold text-slate-800">-{expense.amount.toLocaleString()}</span>
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const ReportsTab = () => (
     <div className="space-y-6 animate-fade-in">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="font-bold text-slate-800 text-lg">Generated Reports</h3>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <FilterControls />
               <button className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition-colors whitespace-nowrap">
                 <Download size={16} /> Download PDF
               </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* P&L Statement */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 relative z-10">
                 <h3 className="font-bold text-xl text-slate-800">Profit & Loss</h3>
              </div>
              
              <div className="space-y-6 relative z-10">
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Income</h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">Tuition Fees</span>
                          <span className="font-bold text-slate-800">1,500,000 MMK</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">Registration</span>
                          <span className="font-bold text-slate-800">200,000 MMK</span>
                       </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-sm">
                        <span className="font-bold text-green-600">Total Income</span>
                        <span className="font-bold text-green-600">1,700,000 MMK</span>
                    </div>
                 </div>

                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Expenses</h4>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">Salaries</span>
                          <span className="font-bold text-slate-800">500,000 MMK</span>
                       </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-600 font-medium">Utilities</span>
                          <span className="font-bold text-slate-800">100,000 MMK</span>
                       </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-sm">
                        <span className="font-bold text-red-600">Total Expenses</span>
                        <span className="font-bold text-red-600">600,000 MMK</span>
                    </div>
                 </div>

                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800">NET PROFIT</span>
                    <span className="text-xl font-bold text-green-600">+1,100,000 MMK</span>
                 </div>
              </div>
           </div>

           {/* Expense Breakdown */}
           <div className="bg-white p-8 rounded-[32px] shadow-sm flex flex-col items-center justify-center">
               <h3 className="font-bold text-xl text-slate-800 mb-6 w-full text-left">Expense Breakdown</h3>
               <div className="w-[300px] h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={EXPENSE_BREAKDOWN}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {EXPENSE_BREAKDOWN.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                           ))}
                        </Pie>
                        <RechartsTooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  {EXPENSE_BREAKDOWN.map((item) => (
                     <div key={item.name} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium text-slate-600">{item.name}</span>
                     </div>
                  ))}
               </div>
           </div>
        </div>
     </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Module Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-800">Finance & Accounts</h2>
           <p className="text-slate-500 font-burmese mt-1 leading-loose">ဘဏ္ဍာရေးစီမံခန့်ခွဲမှု</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm inline-flex">
           {(['OVERVIEW', 'FEES', 'EXPENSES', 'REPORTS'] as Tab[]).map((tab) => (
              <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-600'
                 }`}
              >
                 {tab === 'FEES' ? 'FEES COLLECTION' : tab}
              </button>
           ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
         {activeTab === 'OVERVIEW' && <OverviewTab />}
         {activeTab === 'FEES' && <FeesTab />}
         {activeTab === 'EXPENSES' && <ExpenseTab />}
         {activeTab === 'REPORTS' && <ReportsTab />}
      </div>

      {/* --- MODALS --- */}

      {/* Fees Collection Modal */}
      {isCollectModalOpen && selectedStudentForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden relative">
              <button onClick={() => setIsCollectModalOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10">
                 <X size={20} />
              </button>

              {paymentStep === 'FORM' ? (
                 <div className="p-8">
                    <div className="text-center mb-6">
                       <h3 className="text-2xl font-bold text-slate-800">Collect Fees</h3>
                       <p className="text-slate-500 text-sm mt-1">{selectedStudentForPayment.nameEn} • {selectedStudentForPayment.grade}</p>
                    </div>

                    <div className="space-y-6">
                       {/* Amount Card */}
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center relative overflow-hidden">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Due</p>
                          <p className="text-3xl font-bold text-slate-800">{selectedStudentForPayment.feesPending.toLocaleString()} MMK</p>
                          
                          {/* Sibling Discount Badge Mockup */}
                          <div className="mt-3 inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold">
                             <Percent size={10} /> Sibling Discount Applied (5%)
                          </div>
                       </div>

                       {/* Payment Method */}
                       <div>
                          <label className="block text-sm font-bold text-slate-700 mb-3">Payment Method</label>
                          <div className="grid grid-cols-3 gap-3">
                             {['Cash', 'KBZPay', 'Wave'].map((method) => (
                                <button
                                   key={method}
                                   onClick={() => setPaymentMethod(method)}
                                   className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                                      paymentMethod === method
                                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                   }`}
                                >
                                   {method}
                                </button>
                             ))}
                          </div>
                       </div>

                       {/* Upload Section (If not Cash) */}
                       {paymentMethod !== 'Cash' && (
                           <div 
                              onClick={simulateUpload}
                              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                 uploadSuccess ? 'border-green-500 bg-green-50' : 'border-slate-200 hover:border-brand-400'
                              }`}
                           >
                              {isUploading ? (
                                 <div className="flex flex-col items-center">
                                    <Loader2 className="animate-spin text-brand-600 mb-2" />
                                    <p className="text-xs font-bold text-slate-500">Verifying...</p>
                                 </div>
                              ) : uploadSuccess ? (
                                 <div className="flex flex-col items-center text-green-600">
                                    <CheckCircle className="mb-2" />
                                    <p className="text-xs font-bold">Screenshot Uploaded</p>
                                 </div>
                              ) : (
                                 <div className="flex flex-col items-center text-slate-400">
                                    <Upload className="mb-2" />
                                    <p className="text-xs font-bold">Upload Screenshot</p>
                                 </div>
                              )}
                           </div>
                       )}

                       <button 
                          onClick={handlePaymentSubmit}
                          disabled={paymentMethod !== 'Cash' && !uploadSuccess}
                          className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                             paymentMethod !== 'Cash' && !uploadSuccess 
                             ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                             : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30 active:scale-[0.98]'
                          }`}
                       >
                          Confirm & Record Payment
                       </button>
                    </div>
                 </div>
              ) : (
                 <div className="bg-slate-50 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                       <CheckCircle size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h3>
                    <p className="text-slate-500 text-sm mb-8">Receipt generated successfully.</p>
                    
                    {/* Visual Receipt Stub */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left mb-8 max-w-xs mx-auto relative">
                       {/* Rip effect decoration */}
                       <div className="absolute -top-1 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')]"></div>
                       
                       <p className="text-center font-bold text-brand-600 text-xs uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Receipt</p>
                       <div className="space-y-2 text-xs">
                          <div className="flex justify-between"><span className="text-slate-400">Date</span> <span className="font-bold text-slate-700">10 Dec 2024</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">ID</span> <span className="font-bold text-slate-700">RCP-2024-88</span></div>
                          <div className="flex justify-between"><span className="text-slate-400">Student</span> <span className="font-bold text-slate-700">{selectedStudentForPayment.nameEn}</span></div>
                          <div className="border-t border-dashed border-slate-200 my-2"></div>
                          <div className="flex justify-between text-sm"><span className="font-bold text-slate-800">Total Paid</span> <span className="font-bold text-brand-600">{selectedStudentForPayment.feesPending.toLocaleString()}</span></div>
                       </div>
                    </div>

                    <div className="flex gap-3">
                       <button className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2">
                          <Printer size={16} /> Print
                       </button>
                       <button 
                          onClick={() => setIsCollectModalOpen(false)}
                          className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 shadow-lg shadow-brand-600/20"
                       >
                          Done
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl p-8 relative">
              <button onClick={() => setIsAddExpenseOpen(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 z-10">
                 <X size={20} />
              </button>
              <h3 className="text-2xl font-bold text-slate-800 mb-6">Add Expense</h3>
              <form className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20">
                       <option>Salaries</option>
                       <option>Utilities</option>
                       <option>Supplies</option>
                       <option>Maintenance</option>
                       <option>Others</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20" placeholder="e.g. Office Supplies" />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
                    <input type="number" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 font-mono" placeholder="0" />
                 </div>
                 <div className="pt-4">
                    <button type="button" onClick={() => setIsAddExpenseOpen(false)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all">
                       Save Expense
                    </button>
                 </div>
              </form>
           </div>
         </div>
      )}
    </div>
  );
};