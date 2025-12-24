import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GRADE_LEVELS_LIST } from '../constants';
import { 
  Search, Filter, MoreHorizontal, FileDown, Phone, UserPlus, Eye, Edit, Trash2, X, 
  ChevronDown, ChevronUp, CheckSquare, Square, Download, Mail, User, Calendar,
  MapPin, Users, Award, AlertCircle, DollarSign
} from 'lucide-react';
import { ViewState } from '../types';
import type { Student } from '../types';
import { Admissions } from './Admissions';
import { useData } from '../contexts/DataContext';
import { format, parseISO, isWithinInterval } from 'date-fns';

interface StudentListProps {
  onNavigate?: (view: ViewState) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ onNavigate }) => {
  const { students, setStudents, addStudent, updateStudent, deleteStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [formData, setFormData] = useState<Partial<Student>>({
    id: '',
    nameEn: '',
    nameMm: '',
    fatherName: '',
    grade: '',
    nrc: '',
    dob: '',
    status: 'Active',
    attendanceRate: 90,
    feesPending: 0,
    phone: ''
  });
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    gender: '',
    dobFrom: '',
    dobTo: '',
    address: '',
    admissionDateFrom: '',
    admissionDateTo: '',
  });
  
  // Multi-select state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Quick filter state
  const [quickFilter, setQuickFilter] = useState<string>('All');
  
  // Hover tooltip state
  const [hoveredStudentId, setHoveredStudentId] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const advancedSearchRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (advancedSearchRef.current && !advancedSearchRef.current.contains(event.target as Node)) {
        // Keep advanced search open on click inside
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter students based on all criteria
  const filteredStudents = useMemo(() => {
    let result = students;

    // Quick filters
    if (quickFilter === 'Fees Due') {
      result = result.filter(s => s.feesPending > 0);
    } else if (quickFilter === 'Low Attendance') {
      result = result.filter(s => s.attendanceRate < 80);
    } else if (quickFilter === 'Top Performers') {
      result = result.filter(s => s.attendanceRate >= 90);
    }

    // Basic search
    if (searchTerm) {
      result = result.filter(student =>
      student.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.nameMm.includes(searchTerm) ||
        student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.fatherName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Grade filter
    const getBaseGrade = (gradeStr: string) => {
      const match = gradeStr.match(/^(KG|Grade \d+)/);
      return match ? match[0] : gradeStr;
    };
    
    if (gradeFilter !== 'All') {
      result = result.filter(student =>
        getBaseGrade(student.grade) === getBaseGrade(gradeFilter) ||
        student.grade.includes(gradeFilter)
      );
    }

    // Advanced filters
    if (advancedFilters.gender) {
      result = result.filter(s => s.gender === advancedFilters.gender);
    }

    if (advancedFilters.dobFrom || advancedFilters.dobTo) {
      result = result.filter(s => {
        if (!s.dob) return false;
        try {
          const dob = parseISO(s.dob);
          const from = advancedFilters.dobFrom ? parseISO(advancedFilters.dobFrom) : null;
          const to = advancedFilters.dobTo ? parseISO(advancedFilters.dobTo) : null;
          
          if (from && to) {
            return isWithinInterval(dob, { start: from, end: to });
          } else if (from) {
            return dob >= from;
          } else if (to) {
            return dob <= to;
          }
          return true;
        } catch {
          return false;
        }
      });
    }

    if (advancedFilters.address) {
      result = result.filter(s => 
        s.address?.toLowerCase().includes(advancedFilters.address.toLowerCase())
      );
    }

    if (advancedFilters.admissionDateFrom || advancedFilters.admissionDateTo) {
      result = result.filter(s => {
        if (!s.admissionDate) return false;
        try {
          const admissionDate = parseISO(s.admissionDate);
          const from = advancedFilters.admissionDateFrom ? parseISO(advancedFilters.admissionDateFrom) : null;
          const to = advancedFilters.admissionDateTo ? parseISO(advancedFilters.admissionDateTo) : null;
          
          if (from && to) {
            return isWithinInterval(admissionDate, { start: from, end: to });
          } else if (from) {
            return admissionDate >= from;
          } else if (to) {
            return admissionDate <= to;
          }
          return true;
        } catch {
          return false;
        }
      });
    }

    return result;
  }, [students, searchTerm, gradeFilter, quickFilter, advancedFilters]);

  // Update select all when individual selections change
  useEffect(() => {
    if (filteredStudents.length > 0) {
      setSelectAll(selectedStudents.size === filteredStudents.length && filteredStudents.length > 0);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, filteredStudents]);

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
    setSelectAll(!selectAll);
  };

  // Handle individual selection
  const handleSelectStudent = (id: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStudents(newSelected);
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (selectedStudents.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedStudents.size} student(s)?`)) {
      selectedStudents.forEach(id => deleteStudent(id));
      setSelectedStudents(new Set());
    }
  };

  const handleBulkExport = () => {
    if (selectedStudents.size === 0) return;
    const selected = filteredStudents.filter(s => selectedStudents.has(s.id));
    exportStudents(selected);
  };

  const handleBulkStatusChange = (status: Student['status']) => {
    if (selectedStudents.size === 0) return;
    selectedStudents.forEach(id => {
      updateStudent(id, { status });
    });
    setSelectedStudents(new Set());
  };

  const exportStudents = (studentsToExport: Student[] = filteredStudents) => {
    const headers = ["ID", "Name (En)", "Name (Mm)", "Father Name", "Grade", "Gender", "DOB", "Address", "Admission Date", "Phone", "Status", "Attendance", "Fees Pending"];
    const csvContent = [
      headers.join(","),
      ...studentsToExport.map(student => [
        student.id,
        `"${student.nameEn}"`,
        `"${student.nameMm}"`,
        `"${student.fatherName}"`,
        student.grade,
        student.gender || '',
        student.dob || '',
        `"${student.address || ''}"`,
        student.admissionDate || '',
        student.phone,
        student.status,
        `${student.attendanceRate}%`,
        student.feesPending
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student_directory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    exportStudents();
  };

  const clearAdvancedFilters = () => {
    setAdvancedFilters({
      gender: '',
      dobFrom: '',
      dobTo: '',
      address: '',
      admissionDateFrom: '',
      admissionDateTo: '',
    });
  };

  const openModal = (mode: 'view' | 'edit' | 'add', student?: Student) => {
    setModalMode(mode);
    if (student) {
      setFormData({ ...student });
    } else {
      setFormData({
        id: '',
        nameEn: '',
        nameMm: '',
        fatherName: '',
        grade: '',
        nrc: '',
        dob: '',
        status: 'Active',
        attendanceRate: 90,
        feesPending: 0,
        phone: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(id);
      setOpenMenuId(null);
    }
  };

  const handleSave = () => {
    if (!formData.nameEn || !formData.nameMm || !formData.fatherName || !formData.grade || !formData.phone) {
      alert('Please fill required fields (Name, Father Name, Grade, Phone).');
      return;
    }

    if (modalMode === 'add') {
      const newStudent: Student = {
        ...(formData as Student),
        id: formData.id?.trim() || `ST-${Date.now()}`,
        attendanceRate: formData.attendanceRate ?? 0,
        feesPending: formData.feesPending ?? 0,
        status: formData.status as any || 'Active'
      };
      addStudent(newStudent);
    } else if (modalMode === 'edit' && formData.id) {
      updateStudent(formData.id, formData as Partial<Student>);
    }
    setIsModalOpen(false);
    setOpenMenuId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOpenMenuId(null);
  };

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Student Directory</h2>
          <p className="text-slate-500 font-burmese text-sm mt-1 leading-loose">ကျောင်းသားအချက်အလက်များ</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-5 py-3 bg-white rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)] font-medium"
          >
            <FileDown size={18} />
            <span className="text-sm">Export CSV</span>
          </button>
          <button
            onClick={() => setShowAdmissionModal(true)}
            className="px-6 py-3 bg-brand-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-500 hover:shadow-brand-600/40 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            <span>Admission</span>
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setQuickFilter('All')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            quickFilter === 'All'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Students
        </button>
        <button
          onClick={() => setQuickFilter('Fees Due')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            quickFilter === 'Fees Due'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'bg-white text-amber-600 hover:bg-amber-50'
          }`}
        >
          <DollarSign size={16} />
          Fees Due
        </button>
        <button
          onClick={() => setQuickFilter('Low Attendance')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            quickFilter === 'Low Attendance'
              ? 'bg-red-600 text-white shadow-lg'
              : 'bg-white text-red-600 hover:bg-red-50'
          }`}
        >
          <AlertCircle size={16} />
          Low Attendance
        </button>
        <button
          onClick={() => setQuickFilter('Top Performers')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            quickFilter === 'Top Performers'
              ? 'bg-green-600 text-white shadow-lg'
              : 'bg-white text-green-600 hover:bg-green-50'
          }`}
        >
          <Award size={16} />
          Top Performers
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-2">
        <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
              placeholder="Search by name, ID, father name..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select
              className="w-full pl-12 pr-8 py-3 bg-slate-50 border-none rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white cursor-pointer font-burmese"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
              <option value="All">All Grades (အားလုံးသော အတန်းများ)</option>
              {GRADE_LEVELS_LIST.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
          </select>
          </div>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              showAdvancedSearch
                ? 'bg-brand-600 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Filter size={18} />
            Advanced
            {showAdvancedSearch ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div ref={advancedSearchRef} className="border-t border-slate-100 pt-4 mt-2 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Gender</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  value={advancedFilters.gender}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, gender: e.target.value })}
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">DOB From</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  value={advancedFilters.dobFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dobFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">DOB To</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  value={advancedFilters.dobTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, dobTo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Address</label>
                <input
                  type="text"
                  placeholder="Search by address..."
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  value={advancedFilters.address}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Admission Date From</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  value={advancedFilters.admissionDateFrom}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, admissionDateFrom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Admission Date To</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:bg-white"
                  value={advancedFilters.admissionDateTo}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, admissionDateTo: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={clearAdvancedFilters}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedStudents.size > 0 && (
        <div className="bg-brand-600 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="font-bold">{selectedStudents.size} student(s) selected</span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto pn-btn-row">
            <button
              onClick={handleBulkExport}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={() => handleBulkStatusChange('Active')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              Mark Active
            </button>
            <button
              onClick={() => handleBulkStatusChange('Fees Due')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              Mark Fees Due
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedStudents(new Set())}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-colors w-full sm:w-auto"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-visible">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                {/* Select column (sticky so it stays visible on mobile/tablet horizontal scroll) */}
                <th className="sticky left-0 z-30 bg-slate-50/90 backdrop-blur px-4 sm:px-6 lg:px-8 py-6 text-center border-r border-slate-100 min-w-[64px] w-[64px]">
                  <button
                    onClick={handleSelectAll}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 transition-colors"
                    aria-label={selectAll ? 'Unselect all students' : 'Select all students'}
                  >
                    {selectAll ? (
                      <CheckSquare size={24} className="text-brand-600" />
                    ) : (
                      <Square size={24} className="text-slate-500" />
                    )}
                  </button>
                </th>
                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student Profile</th>
                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Father's Name</th>
                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Grade</th>
                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-8 py-6 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                <th className="relative px-8 py-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-slate-50/80 transition-colors group relative"
                  onMouseEnter={() => setHoveredStudentId(student.id)}
                  onMouseLeave={() => setHoveredStudentId(null)}
                >
                  {/* Select column (sticky so it stays visible on mobile/tablet horizontal scroll) */}
                  <td className="sticky left-0 z-20 bg-white px-4 sm:px-6 lg:px-8 py-5 whitespace-nowrap border-r border-slate-100 min-w-[64px] w-[64px] text-center">
                    <button
                      onClick={() => handleSelectStudent(student.id)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-100 transition-colors"
                      aria-label={selectedStudents.has(student.id) ? `Unselect ${student.nameEn}` : `Select ${student.nameEn}`}
                    >
                      {selectedStudents.has(student.id) ? (
                        <CheckSquare size={24} className="text-brand-600" />
                      ) : (
                        <Square size={24} className="text-slate-500 hover:text-brand-600" />
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-sm font-bold mr-4 border border-brand-200">
                            {(student.nameEn || student.nameMm || student.id || '?').charAt(0)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{student.nameEn}</span>
                            <span className="text-xs font-burmese text-slate-500 leading-loose">{student.nameMm}</span>
                            <span className="text-[10px] text-brand-500 font-mono font-medium">{student.id}</span>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-600 font-burmese leading-loose font-medium">
                    {student.fatherName}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {student.grade}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-slate-100 text-slate-500 rounded-lg">
                             <Phone size={14} />
                        </div>
                        <span className="font-medium text-xs font-mono">{student.phone}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border
                      ${student.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : student.status === 'Fees Due'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                       <div className="flex-1 w-20 bg-slate-100 rounded-full h-1.5 mr-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${student.attendanceRate < 80 ? 'bg-red-500' : 'bg-brand-500'}`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                       </div>
                       <span className={`text-xs font-bold ${student.attendanceRate < 80 ? 'text-red-600' : 'text-slate-600'}`}>
                         {student.attendanceRate}%
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap text-right relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === student.id ? null : student.id);
                        }}
                        className={`p-2 rounded-xl transition-colors ${openMenuId === student.id ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-brand-600 hover:bg-brand-50'}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {/* Action Dropdown */}
                    {openMenuId === student.id && (
                        <div ref={menuRef} className="absolute right-8 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-fade-in origin-top-right">
                            <button onClick={() => openModal('view', student)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2 transition-colors">
                                <Eye size={16} /> View Details
                            </button>
                            <button onClick={() => openModal('edit', student)} className="w-full text-left px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-600 flex items-center gap-2 transition-colors">
                                <Edit size={16} /> Edit Profile
                            </button>
                            <div className="border-t border-slate-50"></div>
                            <button onClick={() => handleDelete(student.id)} className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                                <Trash2 size={16} /> Suspend / Delete
                            </button>
                        </div>
                    )}
                  </td>
                  
                  {/* Hover Tooltip */}
                  {hoveredStudentId === student.id && (
                    <div
                      ref={tooltipRef}
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-50 animate-fade-in pointer-events-none"
                      style={{ transform: 'translateX(-50%) translateY(-100%)' }}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                          <div className="h-12 w-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-lg font-bold border border-brand-200">
                            {(student.nameEn || student.nameMm || student.id || '?').charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800">{student.nameEn}</h4>
                            <p className="text-xs font-burmese text-slate-500">{student.nameMm}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500 text-xs">ID:</span>
                            <p className="font-mono font-bold text-slate-700">{student.id}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs">Grade:</span>
                            <p className="font-bold text-slate-700">{student.grade}</p>
                          </div>
                          {student.gender && (
                            <div>
                              <span className="text-slate-500 text-xs">Gender:</span>
                              <p className="font-bold text-slate-700">{student.gender}</p>
                            </div>
                          )}
                          {student.dob && (
                            <div>
                              <span className="text-slate-500 text-xs">DOB:</span>
                              <p className="font-bold text-slate-700">{format(parseISO(student.dob), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                          {student.admissionDate && (
                            <div>
                              <span className="text-slate-500 text-xs">Admission:</span>
                              <p className="font-bold text-slate-700">{format(parseISO(student.admissionDate), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500 text-xs">Status:</span>
                            <p className={`font-bold ${
                              student.status === 'Active' ? 'text-green-600' :
                              student.status === 'Fees Due' ? 'text-amber-600' :
                              'text-red-600'
                            }`}>{student.status}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs">Attendance:</span>
                            <p className={`font-bold ${student.attendanceRate < 80 ? 'text-red-600' : 'text-green-600'}`}>
                              {student.attendanceRate}%
                            </p>
                          </div>
                        </div>
                        {student.address && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <MapPin size={12} />
                              Address:
                            </span>
                            <p className="font-medium text-slate-700 text-xs mt-1">{student.address}</p>
                          </div>
                        )}
                        {student.feesPending > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-slate-500 text-xs">Pending Fees:</span>
                            <p className="font-bold text-amber-600">{student.feesPending.toLocaleString()} MMK</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            No students found matching your criteria.
          </div>
        )}
      </div>
    </div>
    <StudentModal 
      isOpen={isModalOpen} 
      mode={modalMode} 
      formData={formData} 
      onClose={handleCloseModal} 
      onChange={setFormData} 
      onSave={handleSave} 
    />
    {showAdmissionModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white rounded-[32px] w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl relative">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => setShowAdmissionModal(false)}
              className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
            >
              <X size={18} />
            </button>
          </div>
          <div className="h-full overflow-y-auto px-4 pb-6 pt-2">
            <Admissions 
              onSubmitStudent={(student) => {
                addStudent(student);
                setShowAdmissionModal(false);
              }}
              onClose={() => setShowAdmissionModal(false)}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
};

// --- Modal Component ---
const StudentModal: React.FC<{
  isOpen: boolean;
  mode: 'view' | 'edit' | 'add';
  formData: Partial<Student>;
  onClose: () => void;
  onChange: (data: Partial<Student>) => void;
  onSave: () => void;
}> = ({ isOpen, mode, formData, onClose, onChange, onSave }) => {
  if (!isOpen) return null;

  const isView = mode === 'view';

  const handleChange = (key: keyof Student, value: string | number) => {
    onChange({ ...formData, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-hidden pn-modal-panel">
        {/* Header (keeps close button always visible) */}
        <div className="flex items-start justify-between gap-4 p-6 sm:p-8 pb-4 border-b border-slate-100 pn-modal-compact">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-1">
              {mode === 'view' && 'Student Details'}
              {mode === 'edit' && 'Edit Student'}
              {mode === 'add' && 'Add New Student'}
            </h3>
            <p className="text-slate-500 text-sm">
              {mode === 'view' ? 'Readonly view of student information.' : 'Fill in the details below.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="pn-modal-body pn-modal-compact p-6 sm:p-8 pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Name (English)</label>
            <input
              disabled={isView}
              value={formData.nameEn || ''}
              onChange={e => handleChange('nameEn', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              placeholder="Mg Aung Kyaw"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Name (Myanmar)</label>
            <input
              disabled={isView}
              value={formData.nameMm || ''}
              onChange={e => handleChange('nameMm', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-burmese focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              placeholder="မောင်အောင်ကျော်"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Father Name</label>
            <input
              disabled={isView}
              value={formData.fatherName || ''}
              onChange={e => handleChange('fatherName', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              placeholder="U Mya"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Student ID</label>
            <input
              disabled={isView || mode === 'edit'}
              value={formData.id || ''}
              onChange={e => handleChange('id', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-mono focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              placeholder="ST-2024-009"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Grade</label>
            <select
              disabled={isView}
              value={formData.grade || ''}
              onChange={e => handleChange('grade', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            >
              <option value="">Select Grade</option>
              {GRADE_LEVELS_LIST.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Gender</label>
            <select
              disabled={isView}
              value={formData.gender || ''}
              onChange={e => handleChange('gender', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
            <input
              disabled={isView}
              value={formData.phone || ''}
              onChange={e => handleChange('phone', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              placeholder="09-xxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
            <select
              disabled={isView}
              value={formData.status || 'Active'}
              onChange={e => handleChange('status', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            >
              <option value="Active">Active</option>
              <option value="Fees Due">Fees Due</option>
              <option value="Suspended">Suspended</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">DOB</label>
            <input
              disabled={isView}
              type="date"
              value={formData.dob || ''}
              onChange={e => handleChange('dob', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Admission Date</label>
            <input
              disabled={isView}
              type="date"
              value={formData.admissionDate || ''}
              onChange={e => handleChange('admissionDate', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
            <textarea
              disabled={isView}
              value={formData.address || ''}
              onChange={e => handleChange('address', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              rows={2}
              placeholder="Enter full address..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Attendance (%)</label>
            <input
              disabled={isView}
              type="number"
              min={0}
              max={100}
              value={formData.attendanceRate ?? 0}
              onChange={e => handleChange('attendanceRate', Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Fees Pending (MMK)</label>
            <input
              disabled={isView}
              type="number"
              min={0}
              value={formData.feesPending ?? 0}
              onChange={e => handleChange('feesPending', Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">NRC (optional)</label>
            <input
              disabled={isView}
              value={formData.nrc || ''}
              onChange={e => handleChange('nrc', e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
            />
          </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-colors w-full sm:w-auto"
            >
              Close
            </button>
            {mode !== 'view' && (
              <button
                onClick={onSave}
                className="px-7 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-colors w-full sm:w-auto"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
