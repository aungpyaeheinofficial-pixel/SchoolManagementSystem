import React, { useEffect, useState, useMemo } from 'react';
import { STUDENTS_MOCK, STAFF_MOCK, EXPENSES_MOCK, CLASSES_MOCK, MARKS_MOCK, EXAMS_MOCK, SUBJECTS_MOCK, GRADE_LEVELS_LIST } from '../constants';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  FileDown, Printer, Filter, Search, BarChart3, PieChart, TrendingUp, TrendingDown,
  Users, GraduationCap, Wallet, CalendarCheck, BookOpen, Award, AlertCircle,
  DollarSign, CheckCircle2, Clock, XCircle, ArrowRight, ChevronDown
} from 'lucide-react';

type ReportType = 'students' | 'finance' | 'attendance' | 'academic';

interface ReportsProps {
  initialType?: ReportType;
}

export const Reports: React.FC<ReportsProps> = ({ initialType = 'students' }) => {
  const [reportType, setReportType] = useState<ReportType>(initialType);
  // Keep report type in sync when navigating via Sidebar (same component instance, new prop)
  useEffect(() => {
    setReportType(initialType);
  }, [initialType]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [gradeFilter, setGradeFilter] = useState('All');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');

  // Student Report Stats
  const studentStats = useMemo(() => {
    const total = STUDENTS_MOCK.length;
    const active = STUDENTS_MOCK.filter(s => s.status === 'Active').length;
    const feesDue = STUDENTS_MOCK.filter(s => s.status === 'Fees Due' || s.feesPending > 0).length;
    const graduated = STUDENTS_MOCK.filter(s => s.status === 'Graduated').length;
    
    // By grade
    const byGrade = GRADE_LEVELS_LIST.map(grade => {
      const gradeKey = grade.split(' ')[0] + ' ' + (grade.split(' ')[1] || '');
      return {
        grade: grade,
        count: STUDENTS_MOCK.filter(s => s.grade.includes(gradeKey.trim())).length
      };
    }).filter(g => g.count > 0);

    // Attendance average
    const avgAttendance = STUDENTS_MOCK.reduce((sum, s) => sum + s.attendanceRate, 0) / total;

    return { total, active, feesDue, graduated, byGrade, avgAttendance };
  }, []);

  // Finance Report Stats
  const financeStats = useMemo(() => {
    const totalExpenses = EXPENSES_MOCK.reduce((sum, e) => sum + e.amount, 0);
    const paidExpenses = EXPENSES_MOCK.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = EXPENSES_MOCK.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);
    
    // Fee collection (mock - total pending fees from students)
    const totalFeesPending = STUDENTS_MOCK.reduce((sum, s) => sum + s.feesPending, 0);
    const studentsWithFees = STUDENTS_MOCK.filter(s => s.feesPending > 0).length;

    // By category
    const byCategory = EXPENSES_MOCK.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    // Staff salaries (from STAFF_MOCK)
    const totalSalaries = STAFF_MOCK.reduce((sum, s) => sum + s.baseSalary, 0);

    return { totalExpenses, paidExpenses, pendingExpenses, totalFeesPending, studentsWithFees, byCategory, totalSalaries };
  }, []);

  // Attendance Report Stats
  const attendanceStats = useMemo(() => {
    const avgStudentAttendance = STUDENTS_MOCK.reduce((sum, s) => sum + s.attendanceRate, 0) / STUDENTS_MOCK.length;
    const excellentAttendance = STUDENTS_MOCK.filter(s => s.attendanceRate >= 90).length;
    const poorAttendance = STUDENTS_MOCK.filter(s => s.attendanceRate < 75).length;
    
    // By grade
    const byGrade = GRADE_LEVELS_LIST.map(grade => {
      const gradeKey = grade.split(' ')[0] + ' ' + (grade.split(' ')[1] || '');
      const students = STUDENTS_MOCK.filter(s => s.grade.includes(gradeKey.trim()));
      const avg = students.length > 0 
        ? students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length 
        : 0;
      return { grade, avg, count: students.length };
    }).filter(g => g.count > 0);

    return { avgStudentAttendance, excellentAttendance, poorAttendance, byGrade, totalStudents: STUDENTS_MOCK.length };
  }, []);

  // Academic Report Stats
  const academicStats = useMemo(() => {
    const totalExams = EXAMS_MOCK.length;
    const completedExams = EXAMS_MOCK.filter(e => e.status === 'Completed' || e.status === 'Published').length;
    
    // Calculate average scores
    const avgScore = MARKS_MOCK.length > 0
      ? MARKS_MOCK.reduce((sum, r) => sum + r.score, 0) / MARKS_MOCK.length
      : 0;

    // Grade distribution
    const gradeDistribution = MARKS_MOCK.reduce((acc, r) => {
      acc[r.grade] = (acc[r.grade] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Pass rate (assuming 40+ is pass)
    const passCount = MARKS_MOCK.filter(r => r.score >= 40).length;
    const passRate = MARKS_MOCK.length > 0 ? (passCount / MARKS_MOCK.length) * 100 : 0;

    return { totalExams, completedExams, avgScore, gradeDistribution, passRate, totalResults: MARKS_MOCK.length };
  }, []);

  // Generate report data based on report type
  const getReportData = () => {
    const reportDate = format(new Date(), 'yyyy-MM-dd');
    const dateRangeStr = dateRange?.from 
      ? `${format(dateRange.from, 'dd MMM yyyy')}${dateRange.to ? ` - ${format(dateRange.to, 'dd MMM yyyy')}` : ''}`
      : 'All Time';

    switch (reportType) {
      case 'students':
        return {
          title: 'Student Report - ကျောင်းသားအစီရင်ခံစာ',
          summary: [
            ['Report Date', reportDate],
            ['Date Range', dateRangeStr],
            ['Total Students', studentStats.total.toString()],
            ['Active Students', studentStats.active.toString()],
            ['Students with Fees Due', studentStats.feesDue.toString()],
            ['Graduated', studentStats.graduated.toString()],
            ['Average Attendance', `${studentStats.avgAttendance.toFixed(1)}%`],
          ],
          headers: ['ID', 'Name (English)', 'Name (Myanmar)', 'Grade', 'Status', 'Attendance %', 'Fees Pending', 'Phone'],
          rows: STUDENTS_MOCK.map(s => [
            s.id, s.nameEn, s.nameMm, s.grade.split('-')[0], s.status, 
            `${s.attendanceRate}%`, `${s.feesPending.toLocaleString()} MMK`, s.phone
          ]),
          gradeBreakdown: studentStats.byGrade.map(g => [g.grade, g.count.toString()])
        };
      
      case 'finance':
        return {
          title: 'Financial Report - ဘဏ္ဍာရေးအစီရင်ခံစာ',
          summary: [
            ['Report Date', reportDate],
            ['Date Range', dateRangeStr],
            ['Total Expenses', `${(financeStats.totalExpenses / 1000000).toFixed(2)}M MMK`],
            ['Paid Expenses', `${(financeStats.paidExpenses / 1000000).toFixed(2)}M MMK`],
            ['Pending Expenses', `${(financeStats.pendingExpenses / 1000000).toFixed(2)}M MMK`],
            ['Total Staff Salaries', `${(financeStats.totalSalaries / 1000000).toFixed(2)}M MMK`],
            ['Pending Fee Collection', `${(financeStats.totalFeesPending / 1000).toFixed(0)}K MMK`],
            ['Students with Pending Fees', financeStats.studentsWithFees.toString()],
          ],
          headers: ['ID', 'Date', 'Category', 'Description', 'Vendor', 'Amount (MMK)', 'Status', 'Payment Method'],
          rows: EXPENSES_MOCK.map(e => [
            e.id, e.date, e.category, e.description, e.vendor || '-', 
            e.amount.toLocaleString(), e.status, e.paymentMethod
          ]),
          categoryBreakdown: Object.entries(financeStats.byCategory).map(([cat, amt]) => [cat, `${(amt as number).toLocaleString()} MMK`])
        };
      
      case 'attendance':
        return {
          title: 'Attendance Report - တက်ရောက်မှုအစီရင်ခံစာ',
          summary: [
            ['Report Date', reportDate],
            ['Date Range', dateRangeStr],
            ['Total Students', attendanceStats.totalStudents.toString()],
            ['Average Attendance', `${attendanceStats.avgStudentAttendance.toFixed(1)}%`],
            ['Excellent (90%+)', attendanceStats.excellentAttendance.toString()],
            ['Poor (<75%)', attendanceStats.poorAttendance.toString()],
          ],
          headers: ['ID', 'Name (English)', 'Name (Myanmar)', 'Grade', 'Attendance Rate', 'Status', 'Phone'],
          rows: STUDENTS_MOCK.map(s => [
            s.id, s.nameEn, s.nameMm, s.grade.split('-')[0], 
            `${s.attendanceRate}%`, s.attendanceRate >= 90 ? 'Excellent' : s.attendanceRate >= 75 ? 'Good' : 'Needs Attention', s.phone
          ]),
          gradeBreakdown: attendanceStats.byGrade.map(g => [g.grade, `${g.avg.toFixed(1)}%`, g.count.toString()])
        };
      
      case 'academic':
        return {
          title: 'Academic Report - ပညာရေးအစီရင်ခံစာ',
          summary: [
            ['Report Date', reportDate],
            ['Date Range', dateRangeStr],
            ['Total Exams', academicStats.totalExams.toString()],
            ['Completed Exams', academicStats.completedExams.toString()],
            ['Average Score', academicStats.avgScore.toFixed(1)],
            ['Pass Rate', `${academicStats.passRate.toFixed(1)}%`],
            ['Total Results', academicStats.totalResults.toString()],
          ],
          headers: ['Exam ID', 'Exam Name', 'Term', 'Academic Year', 'Start Date', 'End Date', 'Status'],
          rows: EXAMS_MOCK.map(e => [
            e.id, e.name, e.term, e.academicYear, e.startDate, e.endDate, e.status
          ]),
          gradeDistribution: Object.entries(academicStats.gradeDistribution).map(([grade, count]) => [grade, count.toString()])
        };
      
      default:
        return { title: '', summary: [], headers: [], rows: [] };
    }
  };

  // Export as CSV
  const exportCSV = () => {
    const data = getReportData();
    let csv = '';
    
    // Title
    csv += `"${data.title}"\n\n`;
    
    // Summary
    csv += '"SUMMARY"\n';
    data.summary.forEach(row => {
      csv += `"${row[0]}","${row[1]}"\n`;
    });
    csv += '\n';
    
    // Data Table
    csv += '"DETAILED DATA"\n';
    csv += data.headers.map(h => `"${h}"`).join(',') + '\n';
    data.rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    
    // Download
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as Excel (HTML table format)
  const exportExcel = () => {
    const data = getReportData();
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 8px; }
          th { background-color: #6366f1; color: white; font-weight: bold; }
          .title { font-size: 18px; font-weight: bold; background: #f1f5f9; }
          .section { font-weight: bold; background: #e2e8f0; }
          .summary-label { font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="${data.headers.length}" class="title">${data.title}</td></tr>
          <tr><td colspan="${data.headers.length}"></td></tr>
          <tr><td colspan="${data.headers.length}" class="section">SUMMARY</td></tr>
    `;
    
    data.summary.forEach(row => {
      html += `<tr><td class="summary-label">${row[0]}</td><td colspan="${data.headers.length - 1}">${row[1]}</td></tr>`;
    });
    
    html += `
          <tr><td colspan="${data.headers.length}"></td></tr>
          <tr><td colspan="${data.headers.length}" class="section">DETAILED DATA</td></tr>
          <tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr>
    `;
    
    data.rows.forEach(row => {
      html += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    });
    
    html += '</table></body></html>';
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as PDF (printable HTML)
  const exportPDF = () => {
    const data = getReportData();
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${data.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Myanmar:wght@400;700&display=swap');
          body { 
            font-family: 'Segoe UI', 'Noto Sans Myanmar', sans-serif; 
            padding: 40px; 
            color: #1e293b;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 3px solid #6366f1;
          }
          .header h1 { 
            color: #6366f1; 
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .header p { 
            color: #64748b; 
            margin: 0;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 5px;
          }
          .summary-section { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
          }
          .summary-section h2 { 
            margin: 0 0 15px 0; 
            color: #475569;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 10px; 
          }
          .summary-item { 
            display: flex; 
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .summary-label { font-weight: 600; color: #64748b; }
          .summary-value { font-weight: 700; color: #1e293b; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 12px;
          }
          th { 
            background: #6366f1; 
            color: white; 
            padding: 12px 8px; 
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 10px 8px; 
            border-bottom: 1px solid #e2e8f0; 
          }
          tr:nth-child(even) { background: #f8fafc; }
          tr:hover { background: #f1f5f9; }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #94a3b8;
            font-size: 11px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="school-name">ပညာနန်းတော် - Pyin Nyar Nan Daw</div>
          <h1>${data.title}</h1>
          <p>Generated on: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</p>
        </div>
        
        <div class="summary-section">
          <h2>Summary</h2>
          <div class="summary-grid">
            ${data.summary.map(row => `
              <div class="summary-item">
                <span class="summary-label">${row[0]}</span>
                <span class="summary-value">${row[1]}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <h2 style="color: #475569; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Detailed Data</h2>
        <table>
          <thead>
            <tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.rows.map(row => `
              <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated by Pyin Nyar Nan Daw School Management System</p>
          <p>© Powered by A7 System All rights reserved.</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const handleExport = (format: string) => {
    switch (format) {
      case 'csv':
        exportCSV();
        break;
      case 'excel':
        exportExcel();
        break;
      case 'pdf':
        exportPDF();
        break;
      default:
        alert('Unknown export format');
    }
  };

  const handlePrint = () => {
    exportPDF();
  };

  const renderStudentReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="opacity-80" />
            <span className="text-sm font-medium opacity-90">Total Students</span>
          </div>
          <h3 className="text-3xl font-bold">{studentStats.total}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-slate-600">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{studentStats.active}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-amber-500" />
            <span className="text-sm font-semibold text-slate-600">Fees Due</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{studentStats.feesDue}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-600">Avg Attendance</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{studentStats.avgAttendance.toFixed(1)}%</h3>
        </div>
      </div>

      {/* Distribution by Grade */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-600" />
          Students by Grade
        </h3>
        <div className="space-y-3">
          {studentStats.byGrade.map(item => (
            <div key={item.grade} className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 w-48 truncate">{item.grade}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-brand-500 to-brand-600 h-full rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${Math.max((item.count / studentStats.total) * 100, 10)}%` }}
                >
                  <span className="text-xs font-bold text-white">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student List Preview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Recent Students</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-600">ID</th>
                <th className="px-4 py-3 font-bold text-slate-600">Name</th>
                <th className="px-4 py-3 font-bold text-slate-600">Grade</th>
                <th className="px-4 py-3 font-bold text-slate-600">Attendance</th>
                <th className="px-4 py-3 font-bold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {STUDENTS_MOCK.slice(0, 5).map(student => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{student.id}</td>
                  <td className="px-4 py-3 font-semibold">{student.nameEn}</td>
                  <td className="px-4 py-3 text-slate-600">{student.grade.split('-')[0]}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${student.attendanceRate >= 90 ? 'text-green-600' : student.attendanceRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                      {student.attendanceRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      student.status === 'Active' ? 'bg-green-50 text-green-700' :
                      student.status === 'Fees Due' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFinanceReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={20} className="opacity-80" />
            <span className="text-sm font-medium opacity-90">Total Expenses</span>
          </div>
          <h3 className="text-2xl font-bold">{(financeStats.totalExpenses / 1000000).toFixed(1)}M</h3>
          <p className="text-xs mt-1 opacity-70">MMK</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-slate-600">Paid</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">{(financeStats.paidExpenses / 1000000).toFixed(1)}M</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-amber-500" />
            <span className="text-sm font-semibold text-slate-600">Pending</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">{(financeStats.pendingExpenses / 1000000).toFixed(1)}M</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-slate-600">Fees Pending</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900">{(financeStats.totalFeesPending / 1000).toFixed(0)}K</h3>
          <p className="text-xs text-slate-500">{financeStats.studentsWithFees} students</p>
        </div>
      </div>

      {/* Expense by Category */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-brand-600" />
            Expenses by Category
          </h3>
          <div className="space-y-3">
            {Object.entries(financeStats.byCategory).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([category, amount]) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{category}</span>
                <span className="font-bold text-slate-900">{((amount as number) / 1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-brand-600" />
            Monthly Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <span className="text-sm font-semibold text-blue-700">Staff Salaries</span>
              <span className="font-bold text-blue-900">{(financeStats.totalSalaries / 1000000).toFixed(1)}M MMK</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <span className="text-sm font-semibold text-amber-700">Operating Expenses</span>
              <span className="font-bold text-amber-900">{((financeStats.totalExpenses - financeStats.totalSalaries) / 1000000).toFixed(1)}M MMK</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-sm font-semibold text-green-700">Fee Collection Pending</span>
              <span className="font-bold text-green-900">{(financeStats.totalFeesPending / 1000).toFixed(0)}K MMK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendanceReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <CalendarCheck size={20} className="opacity-80" />
            <span className="text-sm font-medium opacity-90">Avg Attendance</span>
          </div>
          <h3 className="text-3xl font-bold">{attendanceStats.avgStudentAttendance.toFixed(1)}%</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-slate-600">Excellent (90%+)</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{attendanceStats.excellentAttendance}</h3>
          <p className="text-xs text-slate-500">students</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-slate-600">Poor (&lt;75%)</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{attendanceStats.poorAttendance}</h3>
          <p className="text-xs text-slate-500">needs attention</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-600">Total Students</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{attendanceStats.totalStudents}</h3>
        </div>
      </div>

      {/* Attendance by Grade */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-600" />
          Attendance Rate by Grade
        </h3>
        <div className="space-y-3">
          {attendanceStats.byGrade.map(item => (
            <div key={item.grade} className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 w-48 truncate">{item.grade}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                <div 
                  className={`h-full rounded-full flex items-center justify-end pr-2 ${
                    item.avg >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                    item.avg >= 75 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                    'bg-gradient-to-r from-red-400 to-red-500'
                  }`}
                  style={{ width: `${item.avg}%` }}
                >
                  <span className="text-xs font-bold text-white">{item.avg.toFixed(0)}%</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 w-16">{item.count} students</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Issues */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          Students Needing Attention (Below 80%)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-600">Student</th>
                <th className="px-4 py-3 font-bold text-slate-600">Grade</th>
                <th className="px-4 py-3 font-bold text-slate-600">Attendance</th>
                <th className="px-4 py-3 font-bold text-slate-600">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {STUDENTS_MOCK.filter(s => s.attendanceRate < 80).slice(0, 5).map(student => (
                <tr key={student.id} className="hover:bg-red-50/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{student.nameEn}</p>
                    <p className="text-xs text-slate-500 font-burmese">{student.nameMm}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{student.grade.split('-')[0]}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-red-600">{student.attendanceRate}%</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{student.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAcademicReport = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-5 rounded-2xl text-white">
          <div className="flex items-center gap-3 mb-2">
            <Award size={20} className="opacity-80" />
            <span className="text-sm font-medium opacity-90">Avg Score</span>
          </div>
          <h3 className="text-3xl font-bold">{academicStats.avgScore.toFixed(1)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-slate-600">Pass Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{academicStats.passRate.toFixed(1)}%</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-blue-500" />
            <span className="text-sm font-semibold text-slate-600">Total Exams</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{academicStats.totalExams}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-slate-600">Completed</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{academicStats.completedExams}</h3>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-brand-600" />
            Grade Distribution
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {['A', 'B', 'C', 'D', 'F'].map(grade => (
              <div key={grade} className={`p-4 rounded-xl text-center ${
                grade === 'A' ? 'bg-green-50' :
                grade === 'B' ? 'bg-blue-50' :
                grade === 'C' ? 'bg-amber-50' :
                grade === 'D' ? 'bg-orange-50' :
                'bg-red-50'
              }`}>
                <h4 className={`text-2xl font-bold ${
                  grade === 'A' ? 'text-green-600' :
                  grade === 'B' ? 'text-blue-600' :
                  grade === 'C' ? 'text-amber-600' :
                  grade === 'D' ? 'text-orange-600' :
                  'text-red-600'
                }`}>{academicStats.gradeDistribution[grade] || 0}</h4>
                <p className="text-sm font-bold mt-1">{grade}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-brand-600" />
            Recent Exams
          </h3>
          <div className="space-y-3">
            {EXAMS_MOCK.slice(0, 4).map(exam => (
              <div key={exam.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-800">{exam.name}</p>
                  <p className="text-xs text-slate-500">{exam.term} • {exam.academicYear}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                  exam.status === 'Published' ? 'bg-green-50 text-green-700' :
                  exam.status === 'Completed' ? 'bg-blue-50 text-blue-700' :
                  exam.status === 'Ongoing' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Performance (Mock) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-600" />
          Subject Performance Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SUBJECTS_MOCK.slice(0, 4).map(subject => (
            <div key={subject.id} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
              <p className="font-semibold text-slate-800 text-sm">{subject.nameEn}</p>
              <p className="text-xs text-slate-500 font-burmese">{subject.nameMm}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div className="bg-brand-500 h-full rounded-full" style={{ width: `${70 + Math.random() * 25}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-600">{(70 + Math.random() * 25).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const reportTabs = [
    { id: 'students' as ReportType, label: 'Students', labelMm: 'ကျောင်းသား', icon: GraduationCap },
    { id: 'finance' as ReportType, label: 'Finance', labelMm: 'ဘဏ္ဍာရေး', icon: Wallet },
    { id: 'attendance' as ReportType, label: 'Attendance', labelMm: 'တက်ရောက်မှု', icon: CalendarCheck },
    { id: 'academic' as ReportType, label: 'Academic', labelMm: 'ပညာရေး', icon: BookOpen },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h2>
          <p className="text-slate-700 font-burmese mt-2 leading-relaxed text-lg font-semibold">အစီရင်ခံစာများ</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={() => handleExport('csv')}
              className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-2 text-sm font-bold text-white bg-brand-600 rounded-lg transition-colors"
            >
              PDF
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        {reportTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                reportType === tab.id
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span className={`text-xs font-burmese ${reportType === tab.id ? 'opacity-80' : 'text-slate-400'}`}>
                ({tab.labelMm})
              </span>
            </button>
          );
        })}
      </div>

      {/* Report Content */}
      {reportType === 'students' && renderStudentReport()}
      {reportType === 'finance' && renderFinanceReport()}
      {reportType === 'attendance' && renderAttendanceReport()}
      {reportType === 'academic' && renderAcademicReport()}
    </div>
  );
};

