import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { EXAMS_MOCK, CLASSES_MOCK, SUBJECTS_MOCK, STUDENTS_MOCK, MARKS_MOCK } from '../constants';
import { ExamResult } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  PenTool, Save, CheckCircle2, AlertCircle, ChevronDown, 
  Search, Filter, BookOpen, GraduationCap, FileText, Download,
  Upload, X, Check, Clock, Keyboard, AlertTriangle, FileSpreadsheet
} from 'lucide-react';

// Grading scale configuration
const GRADE_SCALE = [
  { min: 90, max: 100, grade: 'A+', color: 'bg-emerald-100 text-emerald-700' },
  { min: 80, max: 89, grade: 'A', color: 'bg-green-100 text-green-700' },
  { min: 70, max: 79, grade: 'B+', color: 'bg-teal-100 text-teal-700' },
  { min: 60, max: 69, grade: 'B', color: 'bg-blue-100 text-blue-700' },
  { min: 50, max: 59, grade: 'C+', color: 'bg-cyan-100 text-cyan-700' },
  { min: 40, max: 49, grade: 'C', color: 'bg-yellow-100 text-yellow-700' },
  { min: 30, max: 39, grade: 'D', color: 'bg-orange-100 text-orange-700' },
  { min: 0, max: 29, grade: 'F', color: 'bg-red-100 text-red-700' },
];

export const ExamMarkEntry: React.FC = () => {
  const { marks: contextMarks, setMarks, addMark, updateMark } = useData();
  
  // --- Selection State ---
  const [selectedExamId, setSelectedExamId] = useState<string>(EXAMS_MOCK[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(CLASSES_MOCK[2]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(SUBJECTS_MOCK[0]?.id || '');
  
  // --- Subject Search State ---
  const [subjectSearchOpen, setSubjectSearchOpen] = useState(false);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const subjectSearchRef = useRef<HTMLDivElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  
  // --- Data State ---
  const [currentMarks, setCurrentMarks] = useState<ExamResult[]>(
    contextMarks.length > 0 ? contextMarks : MARKS_MOCK
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // --- Import State ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<{studentId: string; score: number; remark?: string}[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Keyboard Navigation ---
  const [focusedRow, setFocusedRow] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // --- Toast State ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- Derived Data ---
  const selectedClass = CLASSES_MOCK.find(c => c.id === selectedClassId);
  const selectedSubject = SUBJECTS_MOCK.find(s => s.id === selectedSubjectId);
  
  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    const term = subjectSearchTerm.toLowerCase();
    return SUBJECTS_MOCK.filter(sub => 
      sub.code.toLowerCase().includes(term) ||
      sub.nameEn.toLowerCase().includes(term) ||
      sub.nameMm.includes(subjectSearchTerm)
    );
  }, [subjectSearchTerm]);

  // Filter students belonging to the selected class
  const classStudents = useMemo(() => {
    return STUDENTS_MOCK.filter(s => {
      if (selectedClass?.name.includes("Grade 10")) return s.grade.includes("Grade 10");
      if (selectedClass?.name.includes("Grade 9")) return s.grade.includes("Grade 9");
      if (selectedClass?.name.includes("Grade 11")) return s.grade.includes("Grade 11");
      return true;
    });
  }, [selectedClassId, selectedClass]);

  // --- Auto-calculate Grade ---
  const calculateGrade = useCallback((score: number): { grade: string; color: string } => {
    const gradeInfo = GRADE_SCALE.find(g => score >= g.min && score <= g.max);
    return gradeInfo || { grade: 'F', color: 'bg-red-100 text-red-700' };
  }, []);

  // --- Validation ---
  const validateScore = (score: number | string): { valid: boolean; error?: string } => {
    const numScore = typeof score === 'string' ? parseInt(score) : score;
    if (isNaN(numScore)) return { valid: false, error: 'Invalid number' };
    if (numScore < 0) return { valid: false, error: 'Score cannot be negative' };
    if (numScore > 100) return { valid: false, error: 'Score cannot exceed 100' };
    return { valid: true };
  };

  // --- Get/Set Marks ---
  const getMarkForStudent = (studentId: string) => {
    return currentMarks.find(
      m => m.examId === selectedExamId && 
           m.studentId === studentId && 
           m.subjectId === selectedSubjectId
    );
  };

  const handleScoreChange = (studentId: string, scoreStr: string, rowIndex: number) => {
    const score = scoreStr === '' ? 0 : parseInt(scoreStr);
    
    // Validate
    const validation = validateScore(score);
    if (!validation.valid) {
      setValidationErrors(prev => ({ ...prev, [studentId]: validation.error! }));
      return;
    } else {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[studentId];
        return newErrors;
      });
    }

    const { grade } = calculateGrade(score);
    setHasUnsavedChanges(true);

    setCurrentMarks(prev => {
      const existingIndex = prev.findIndex(
        m => m.examId === selectedExamId && 
             m.studentId === studentId && 
             m.subjectId === selectedSubjectId
      );

      if (existingIndex >= 0) {
        const newMarks = [...prev];
        newMarks[existingIndex] = { ...newMarks[existingIndex], score, grade };
        return newMarks;
      } else {
        const newMark: ExamResult = {
          id: `MK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          examId: selectedExamId,
          studentId: studentId,
          subjectId: selectedSubjectId,
          score: score || 0,
          grade
        };
        return [...prev, newMark];
      }
    });
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setHasUnsavedChanges(true);
    setCurrentMarks(prev => {
      const existingIndex = prev.findIndex(
        m => m.examId === selectedExamId && 
             m.studentId === studentId && 
             m.subjectId === selectedSubjectId
      );

      if (existingIndex >= 0) {
        const newMarks = [...prev];
        newMarks[existingIndex] = { ...newMarks[existingIndex], remark };
        return newMarks;
      } else {
        const newMark: ExamResult = {
          id: `MK-${Date.now()}`,
          examId: selectedExamId,
          studentId: studentId,
          subjectId: selectedSubjectId,
          score: 0,
          grade: 'F',
          remark
        };
        return [...prev, newMark];
      }
    });
  };

  // --- Save Function ---
  const handleSave = useCallback(() => {
    if (Object.keys(validationErrors).length > 0) {
      showToast('Please fix validation errors before saving', 'error');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setMarks(currentMarks);
      setIsSaving(false);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      showToast('Marks saved successfully!', 'success');
    }, 500);
  }, [currentMarks, validationErrors, setMarks]);

  // --- Toast ---
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Auto-save ---
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const autoSaveTimer = setInterval(() => {
      if (hasUnsavedChanges && Object.keys(validationErrors).length === 0) {
        handleSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveTimer);
  }, [autoSaveEnabled, hasUnsavedChanges, validationErrors, handleSave]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Save all
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Enter: Save current and move to next student
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement as HTMLInputElement;
        if (activeElement?.type === 'number' || activeElement?.type === 'text') {
          e.preventDefault();
          const currentIndex = inputRefs.current.findIndex(ref => ref === activeElement);
          if (currentIndex >= 0) {
            // Move to next row's score input
            const nextScoreIndex = Math.floor(currentIndex / 2) * 2 + 2;
            if (nextScoreIndex < inputRefs.current.length) {
              inputRefs.current[nextScoreIndex]?.focus();
              setFocusedRow(Math.floor(nextScoreIndex / 2));
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // --- Click outside to close subject dropdown ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subjectSearchRef.current && !subjectSearchRef.current.contains(e.target as Node)) {
        setSubjectSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Export ---
  const handleExport = () => {
    const headers = ["No.", "Student ID", "Name (En)", "Name (Mm)", "Score", "Grade", "Remark"];
    const csvContent = [
      headers.join(","),
      ...classStudents.map((student, index) => {
        const markData = getMarkForStudent(student.id);
        return [
          index + 1,
          student.id,
          `"${student.nameEn}"`,
          `"${student.nameMm}"`,
          markData?.score ?? 0,
          markData?.grade ?? '-',
          `"${markData?.remark ?? ''}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `exam_marks_${selectedClass?.name || 'class'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Bulk Import ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header row
        const dataLines = lines.slice(1);
        const parsed: { studentId: string; score: number; remark?: string; studentName?: string }[] = [];
        const preview: any[] = [];

        dataLines.forEach((line, idx) => {
          const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
          
          // Expected format: No., Student ID, Name, Score, Remark (or similar)
          // Try to find student ID and score columns
          let studentId = '';
          let score = 0;
          let remark = '';
          let studentName = '';

          // Try different column positions
          if (cols.length >= 4) {
            studentId = cols[1]; // Column 2: Student ID
            studentName = cols[2]; // Column 3: Name
            const scoreStr = cols[3] || cols[4]; // Column 4 or 5: Score
            score = parseInt(scoreStr) || 0;
            remark = cols[cols.length - 1] || ''; // Last column: Remark
          } else if (cols.length >= 2) {
            studentId = cols[0];
            score = parseInt(cols[1]) || 0;
            remark = cols[2] || '';
          }

          // Validate student exists
          const student = STUDENTS_MOCK.find(s => s.id === studentId);
          
          if (studentId && !isNaN(score)) {
            parsed.push({ studentId, score, remark, studentName });
            preview.push({
              row: idx + 2,
              studentId,
              studentName: student?.nameEn || studentName || 'Not Found',
              score,
              remark,
              valid: student !== undefined && score >= 0 && score <= 100
            });
          }
        });

        setImportPreview(preview);
        setImportData(parsed);

        if (parsed.length === 0) {
          setImportError('No valid data found in file. Please check the format.');
        }
      } catch (err) {
        setImportError('Error parsing file. Please ensure it\'s a valid CSV format.');
      }
    };

    reader.onerror = () => {
      setImportError('Error reading file.');
    };

    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    const validData = importData.filter(d => {
      const student = STUDENTS_MOCK.find(s => s.id === d.studentId);
      return student && d.score >= 0 && d.score <= 100;
    });

    validData.forEach(item => {
      const { grade } = calculateGrade(item.score);
      handleScoreChange(item.studentId, item.score.toString(), 0);
      if (item.remark) {
        handleRemarkChange(item.studentId, item.remark);
      }
    });

    showToast(`Imported ${validData.length} marks successfully!`, 'success');
    setShowImportModal(false);
    setImportData([]);
    setImportPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const headers = ["No.", "Student ID", "Name", "Score", "Remark"];
    const rows = classStudents.map((s, i) => [i + 1, s.id, s.nameEn, '', ''].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `marks_template_${selectedClass?.name || 'class'}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 animate-fade-in px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.type === 'success' ? <Check size={20} /> : 
           toast.type === 'error' ? <AlertTriangle size={20} /> : 
           <Clock size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Mark Entry</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">စာမေးပွဲ အမှတ်စာရင်း ထည့်သွင်းခြင်း</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
            {/* Auto-save indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className={`w-2 h-2 rounded-full ${autoSaveEnabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              <span>Auto-save {autoSaveEnabled ? 'on' : 'off'}</span>
              {lastSaved && (
                <span className="text-slate-400">
                  • Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {hasUnsavedChanges && (
                <span className="text-amber-500 font-medium">• Unsaved changes</span>
              )}
            </div>

            <button 
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2"
            >
                <Upload size={18} />
                <span className="hidden sm:inline">Import</span>
            </button>
            <button 
                onClick={handleExport}
                className="px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2"
            >
                <Download size={18} />
                <span className="hidden sm:inline">Export</span>
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaving || Object.keys(validationErrors).length > 0}
                className="px-6 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save size={18} />}
                <span>Save (Ctrl+S)</span>
            </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="flex gap-4 p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100 text-sm">
        <Keyboard size={18} className="text-blue-600 shrink-0" />
        <div className="flex flex-wrap gap-4">
          <span><kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Tab</kbd> Next field</span>
          <span><kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Enter</kbd> Next student</span>
          <span><kbd className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">Ctrl+S</kbd> Save all</span>
        </div>
      </div>

      {/* Filters / Selectors */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Exam Selector */}
         <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Examination</label>
            <div className="relative group">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
                >
                    {EXAMS_MOCK.map(exam => (
                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
         </div>

         {/* Class Selector */}
         <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class / Section</label>
            <div className="relative group">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
                >
                    {CLASSES_MOCK.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
         </div>

         {/* Subject Selector with Search */}
         <div className="space-y-2" ref={subjectSearchRef}>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</label>
            <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                <input 
                    ref={subjectInputRef}
                    type="text"
                    value={subjectSearchOpen ? subjectSearchTerm : `${selectedSubject?.code} - ${selectedSubject?.nameEn}`}
                    onChange={(e) => setSubjectSearchTerm(e.target.value)}
                    onFocus={() => {
                      setSubjectSearchOpen(true);
                      setSubjectSearchTerm('');
                    }}
                    placeholder="Search subjects..."
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                
                {/* Dropdown */}
                {subjectSearchOpen && (
                  <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-lg border border-slate-200 max-h-64 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">No subjects found</div>
                    ) : (
                      filteredSubjects.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSubjectId(sub.id);
                            setSubjectSearchOpen(false);
                            setSubjectSearchTerm('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors ${
                            selectedSubjectId === sub.id ? 'bg-brand-50' : ''
                          }`}
                        >
                          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                            {sub.code}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-slate-700">{sub.nameEn}</p>
                            <p className="text-xs text-slate-500 font-burmese">{sub.nameMm}</p>
                          </div>
                          {selectedSubjectId === sub.id && (
                            <Check size={16} className="ml-auto text-brand-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
            </div>
         </div>
      </div>

      {/* Grading Scale Reference */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Grading Scale</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRADE_SCALE.map(g => (
            <div key={g.grade} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${g.color}`}>
              {g.grade}: {g.min}-{g.max}
            </div>
          ))}
        </div>
      </div>

      {/* Input Table */}
      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-slate-50">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800">Student List</h3>
              <div className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    Total: {classStudents.length}
                </div>
                {Object.keys(validationErrors).length > 0 && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 flex items-center gap-1">
                    <AlertTriangle size={14} />
                    {Object.keys(validationErrors).length} errors
                  </div>
                )}
              </div>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50/30 sticky top-0">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-16">No.</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Student Name</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-36">
                          Score (0-100)
                        </th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-24">Grade</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Remark</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {classStudents.map((student, index) => {
                        const markData = getMarkForStudent(student.id);
                        const score = markData?.score ?? '';
                        const gradeInfo = markData?.score !== undefined ? calculateGrade(markData.score) : { grade: '-', color: 'bg-slate-100 text-slate-500' };
                        const remark = markData?.remark ?? '';
                        const hasError = validationErrors[student.id];

                        return (
                            <tr 
                              key={student.id} 
                              className={`hover:bg-slate-50/50 transition-colors ${focusedRow === index ? 'bg-brand-50/30' : ''} ${hasError ? 'bg-red-50/30' : ''}`}
                            >
                                <td className="px-6 py-4 text-sm font-bold text-slate-400">
                                    {String(index + 1).padStart(2, '0')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 text-sm">{student.nameEn}</span>
                                        <span className="text-xs font-burmese text-slate-500 leading-loose">{student.nameMm}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative">
                                      <input 
                                          ref={el => inputRefs.current[index * 2] = el}
                                          type="number" 
                                          min="0"
                                          max="100"
                                          value={score}
                                          onChange={(e) => handleScoreChange(student.id, e.target.value, index)}
                                          onFocus={() => setFocusedRow(index)}
                                          className={`w-full px-3 py-2 border rounded-lg text-sm font-bold text-center transition-all
                                            ${hasError 
                                              ? 'bg-red-50 border-red-300 text-red-700 focus:border-red-500 focus:ring-red-500/20' 
                                              : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-brand-500 focus:ring-brand-500/20'
                                            } focus:outline-none focus:ring-2`}
                                          placeholder="0"
                                      />
                                      {hasError && (
                                        <div className="absolute -bottom-5 left-0 text-[10px] text-red-600 font-medium">
                                          {hasError}
                                        </div>
                                      )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold ${gradeInfo.color}`}>
                                        {gradeInfo.grade}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <input 
                                        ref={el => inputRefs.current[index * 2 + 1] = el}
                                        type="text" 
                                        value={remark}
                                        onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                        onFocus={() => setFocusedRow(index)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder-slate-400"
                                        placeholder="Add remarks..."
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
             </table>
             
             {classStudents.length === 0 && (
                 <div className="p-12 text-center text-slate-400">
                     <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
                     <p>No students found for this class filter.</p>
                 </div>
             )}
          </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
            <button 
              onClick={() => {
                setShowImportModal(false);
                setImportData([]);
                setImportPreview([]);
                setImportError(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="text-brand-600" />
              Bulk Import Marks
            </h3>
            <p className="text-slate-500 mb-6 font-burmese">CSV/Excel file ကနေ အမှတ်များ upload လုပ်ခြင်း</p>

            {/* Download Template */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-700 mb-3">
                Download a pre-filled template with student IDs for easy data entry.
              </p>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} /> Download Template
              </button>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Upload CSV File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-sm focus:border-brand-500 focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              <p className="text-xs text-slate-500 mt-2">
                Format: Student ID, Score, Remark (optional)
              </p>
            </div>

            {/* Error */}
            {importError && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle size={18} />
                {importError}
              </div>
            )}

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3">
                  Preview ({importPreview.filter(p => p.valid).length} valid / {importPreview.length} total)
                </h4>
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">Row</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">Student ID</th>
                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-500">Name</th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-500">Score</th>
                        <th className="px-3 py-2 text-center text-xs font-bold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreview.map((row, idx) => (
                        <tr key={idx} className={row.valid ? '' : 'bg-red-50'}>
                          <td className="px-3 py-2 text-slate-500">{row.row}</td>
                          <td className="px-3 py-2 font-mono text-xs">{row.studentId}</td>
                          <td className="px-3 py-2">{row.studentName}</td>
                          <td className="px-3 py-2 text-center font-bold">{row.score}</td>
                          <td className="px-3 py-2 text-center">
                            {row.valid ? (
                              <CheckCircle2 size={16} className="text-green-600 mx-auto" />
                            ) : (
                              <AlertTriangle size={16} className="text-red-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData([]);
                  setImportPreview([]);
                  setImportError(null);
                }}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={importPreview.filter(p => p.valid).length === 0}
                className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Import {importPreview.filter(p => p.valid).length} Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
