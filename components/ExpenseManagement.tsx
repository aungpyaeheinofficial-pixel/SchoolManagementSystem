import React, { useState, useMemo, useEffect } from 'react';
import { EXPENSE_CATEGORIES } from '../constants';
import { Expense, ExpenseCategory } from '../types';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { format, parseISO, isWithinInterval, differenceInDays } from 'date-fns';
import {
  Plus, Search, Filter, Receipt, TrendingUp, TrendingDown,
  CheckCircle2, Clock, AlertCircle, X, Edit3, Trash2,
  FileDown, DollarSign, Calendar, Building, CreditCard,
  RefreshCw, FileText, ArrowUpDown
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import { ModalPortal } from './ModalPortal';

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

export const ExpenseManagement: React.FC = () => {
  const { expenses, setExpenses, addExpense, updateExpense, deleteExpense } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialFormState: Partial<Expense> = {
    category: 'Others',
    description: '',
    descriptionMm: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'Cash',
    status: 'Pending',
    vendor: '',
    receiptNo: '',
    approvedBy: '',
    notes: '',
    recurring: false
  };

  const [formData, setFormData] = useState<Partial<Expense>>(initialFormState);

  // Ensure modal always appears in-frame on both desktop + mobile
  useModalScrollLock(isModalOpen, { scrollToTopOnOpen: true });

  // Filtering & Sorting
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(exp => {
      // Search filter
      const matchesSearch =
        exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.descriptionMm && exp.descriptionMm.includes(searchTerm)) ||
        exp.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'All' || exp.category === categoryFilter;

      // Status filter
      const matchesStatus = statusFilter === 'All' || exp.status === statusFilter;

      // Date range filter
      let matchesDateRange = true;
      if (dateRange?.from) {
        const expDate = parseISO(exp.date);
        if (dateRange.to) {
          matchesDateRange = isWithinInterval(expDate, { start: dateRange.from, end: dateRange.to });
        } else {
          matchesDateRange = format(expDate, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
        }
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
    });

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [expenses, searchTerm, categoryFilter, statusFilter, dateRange, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidExpenses = filteredExpenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = filteredExpenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);
    const overdueExpenses = filteredExpenses.filter(e => e.status === 'Overdue').reduce((sum, e) => sum + e.amount, 0);

    // By category
    const byCategory = EXPENSE_CATEGORIES.map(cat => ({
      ...cat,
      total: filteredExpenses.filter(e => e.category === cat.id).reduce((sum, e) => sum + e.amount, 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    return { totalExpenses, paidExpenses, pendingExpenses, overdueExpenses, byCategory };
  }, [filteredExpenses]);

  // Handlers
  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingId(expense.id);
      setFormData({ ...expense });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.category) return;

    if (editingId) {
      if (editingId) {
        updateExpense(editingId, formData as Partial<Expense>);
      }
    } else {
      const newExpense: Expense = {
        ...formData,
        id: `EXP-${Date.now()}`
      } as Expense;
      addExpense(newExpense);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      deleteExpense(id);
    }
  };

  const handleMarkAsPaid = (id: string) => {
    updateExpense(id, { 
      status: 'Paid' as const, 
      receiptNo: expenses.find(e => e.id === id)?.receiptNo || `RCP-${Date.now()}` 
    });
  };

  const handleExport = () => {
    const header = ['ID', 'Date', 'Category', 'Description', 'Vendor', 'Amount', 'Status', 'Payment Method', 'Receipt No', 'Approved By'];
    const rows = filteredExpenses.map(e => [
      e.id,
      e.date,
      e.category,
      e.description,
      e.vendor || '',
      e.amount.toString(),
      e.status,
      e.paymentMethod,
      e.receiptNo || '',
      e.approvedBy || ''
    ]);
    const csv = [header, ...rows].map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Overdue': return 'bg-red-50 text-red-700 border-red-200';
      case 'Cancelled': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === category);
    return cat?.color || 'bg-slate-500';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Expense Management</h2>
          <p className="text-slate-700 font-burmese mt-2 leading-relaxed text-lg font-semibold">အသုံးစရိတ် စီမံခန့်ခွဲမှု</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-6 rounded-[24px] shadow-lg shadow-purple-500/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Receipt size={100} /></div>
          <p className="font-medium opacity-90 mb-1">Total Expenses</p>
          <h3 className="text-3xl font-bold">{(stats.totalExpenses / 1000000).toFixed(2)} <span className="text-lg opacity-70">M</span></h3>
          <p className="text-sm mt-2 opacity-70 font-semibold">{filteredExpenses.length} records</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl"><CheckCircle2 size={20} /></div>
            <p className="text-slate-700 font-bold text-sm uppercase tracking-wide">Paid</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{(stats.paidExpenses / 1000000).toFixed(2)} <span className="text-sm text-slate-400">M MMK</span></h3>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
            <p className="text-slate-700 font-bold text-sm uppercase tracking-wide">Pending</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{(stats.pendingExpenses / 1000000).toFixed(2)} <span className="text-sm text-slate-400">M MMK</span></h3>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl"><AlertCircle size={20} /></div>
            <p className="text-slate-700 font-bold text-sm uppercase tracking-wide">Overdue</p>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{(stats.overdueExpenses / 1000000).toFixed(2)} <span className="text-sm text-slate-400">M MMK</span></h3>
        </div>
      </div>

      {/* Category Breakdown */}
      {stats.byCategory.length > 0 && (
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50">
          <h3 className="font-bold text-slate-900 mb-4">Expense by Category</h3>
          <div className="flex flex-wrap gap-3">
            {stats.byCategory.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                <span className="text-sm font-semibold text-slate-700">{cat.labelEn}</span>
                <span className="text-sm font-bold text-slate-900">{(cat.total / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by description, vendor, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-100 min-w-[140px]"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.labelEn}</option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 px-4 py-2.5 outline-none cursor-pointer hover:bg-slate-100"
            >
              <option value="All">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>
        </div>

        {/* Active Filters */}
        {(dateRange?.from || categoryFilter !== 'All' || statusFilter !== 'All' || searchTerm) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active Filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}
            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                Category: {categoryFilter}
                <button onClick={() => setCategoryFilter('All')} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}
            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('All')} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}
            {dateRange?.from && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium">
                Date: {format(dateRange.from, 'MMM dd')}
                {dateRange.to && ` - ${format(dateRange.to, 'MMM dd, yyyy')}`}
                <button onClick={() => setDateRange(undefined)} className="hover:text-red-500"><X size={12} /></button>
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('All');
                setStatusFilter('All');
                setDateRange(undefined);
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 ml-auto"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-slate-50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('date')} className="flex items-center gap-1 hover:text-slate-700">
                    Date <ArrowUpDown size={12} className={sortField === 'date' ? 'text-brand-600' : ''} />
                  </button>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('category')} className="flex items-center gap-1 hover:text-slate-700">
                    Category <ArrowUpDown size={12} className={sortField === 'category' ? 'text-brand-600' : ''} />
                  </button>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <button onClick={() => toggleSort('amount')} className="flex items-center gap-1 hover:text-slate-700">
                    Amount <ArrowUpDown size={12} className={sortField === 'amount' ? 'text-brand-600' : ''} />
                  </button>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-800">{format(parseISO(expense.date), 'dd MMM yyyy')}</p>
                    {expense.recurring && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold mt-1">
                        <RefreshCw size={10} /> {expense.recurringPeriod}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(expense.category)}`}></div>
                      <span className="text-sm font-semibold text-slate-700">{expense.category}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-slate-800">{expense.description}</p>
                    {expense.descriptionMm && (
                      <p className="text-xs text-slate-500 font-burmese mt-0.5">{expense.descriptionMm}</p>
                    )}
                    {expense.receiptNo && (
                      <p className="text-[10px] text-slate-400 font-mono mt-1">#{expense.receiptNo}</p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm text-slate-600 font-medium">{expense.vendor || '-'}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base font-bold text-slate-900">
                      {expense.amount.toLocaleString()} <span className="text-xs text-slate-400 font-medium">MMK</span>
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {expense.status === 'Pending' && (
                        <button
                          onClick={() => handleMarkAsPaid(expense.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} /> Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(expense)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
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

        {filteredExpenses.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} />
            </div>
            <p className="font-bold text-slate-700">No Expenses Found</p>
            <p className="text-sm">Try adjusting your filters or add a new expense.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay pn-modal-upper" onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors pn-modal-close">
                <X size={20} />
              </button>

              <h3 className="text-2xl font-bold text-slate-900 mb-1">{editingId ? 'Edit Expense' : 'Add New Expense'}</h3>
              <p className="text-slate-600 text-sm mb-6 font-burmese">အသုံးစရိတ် အချက်အလက်များ ထည့်သွင်းပါ</p>

              <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    required
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.labelEn} ({cat.labelMm})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Amount (MMK)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. November Electricity Bill"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description (Myanmar)</label>
                <input
                  type="text"
                  placeholder="e.g. နိုဝင်ဘာလ လျှပ်စစ်ဘီလ်"
                  value={formData.descriptionMm}
                  onChange={e => setFormData({ ...formData, descriptionMm: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-burmese focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. YESB, Max Energy"
                    value={formData.vendor || ''}
                    onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="KBZPay">KBZPay</option>
                    <option value="Wave">Wave</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Receipt No.</label>
                  <input
                    type="text"
                    placeholder="e.g. ELEC-2024-11"
                    value={formData.receiptNo || ''}
                    onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Approved By</label>
                  <input
                    type="text"
                    placeholder="e.g. Principal, Admin Officer"
                    value={formData.approvedBy || ''}
                    onChange={e => setFormData({ ...formData, approvedBy: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional notes..."
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 resize-none"
                />
              </div>

              {/* Recurring */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.recurring || false}
                    onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Recurring Expense</span>
                </label>
                {formData.recurring && (
                  <select
                    value={formData.recurringPeriod || 'Monthly'}
                    onChange={e => setFormData({ ...formData, recurringPeriod: e.target.value as any })}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                )}
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
                  {editingId ? 'Update Expense' : 'Add Expense'}
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

