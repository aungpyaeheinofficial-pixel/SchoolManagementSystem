import React, { useState, useMemo } from 'react';
import { ExamResult, Student } from '../types';
import { 
  FileText, Search, Filter, Download, Printer, X, 
  ChevronDown, GraduationCap, Medal, Trophy, TrendingUp, AlertCircle, CheckCircle2, FileDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useData } from '../contexts/DataContext';

export const ExamReportCards: React.FC = () => {
  const { exams, classes, subjects, students, marks } = useData();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // --- Derived Data & Calculations ---

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedExam = exams.find(e => e.id === selectedExamId);

  // Filter students by class and search
  const classStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = selectedClass ? s.grade === selectedClass.name : true;
      const matchesSearch = 
        s.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesClass && matchesSearch;
    });
  }, [searchTerm, selectedClass, students]);

  // Helper: Get Marks for a student
  const getStudentMarks = (studentId: string) => {
    return marks.filter(m => m.examId === selectedExamId && m.studentId === studentId);
  };

  // Helper: Calculate Stats (Total, Avg, Result)
  const calculateStudentStats = (studentId: string) => {
    const marks = getStudentMarks(studentId);
    
    // In a real app, we'd get the full subject list for the class to handle "missing" marks (absent).
    // For this mock, we map existing marks + simulate 0 for missing if needed, 
    // but here we just aggregate what exists.
    
    if (marks.length === 0) return { total: 0, average: 0, isPass: false, grade: 'N/A' };

    const total = marks.reduce((sum, m) => sum + m.score, 0);
    const average = total / (marks.length || 1);
    
    // Simple logic: Fail if any subject < 40
    const isPass = marks.every(m => m.score >= 40); 
    
    let grade = 'F';
    if (average >= 80) grade = 'A';
    else if (average >= 60) grade = 'B';
    else if (average >= 40) grade = 'C';
    else if (average >= 20) grade = 'D';

    return { total, average, isPass, grade };
  };

  // Calculate Ranks
  const rankedStudents = useMemo(() => {
    const withStats = classStudents.map(s => ({
      ...s,
      stats: calculateStudentStats(s.id)
    }));
    
    // Sort by Total Score Descending
    return withStats.sort((a, b) => b.stats.total - a.stats.total);
  }, [classStudents, selectedExamId]);

  // --- Modal Logic ---
  
  const getSubjectDetails = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Headers
    const headers = ["Rank", "Student ID", "Name (En)", "Name (Mm)", "Total Score", "Average", "Grade", "Result"];
    
    // Rows
    const rows = rankedStudents.map((student, index) => {
      const { stats } = student;
      return [
        index + 1,
        student.id,
        `"${student.nameEn}"`,
        `"${student.nameMm}"`,
        stats.total,
        stats.average.toFixed(2),
        stats.grade,
        stats.isPass ? "PASS" : "FAIL"
      ].join(",");
    });

    // Combine
    const csvContent = [headers.join(","), ...rows].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `report_cards_${selectedClass?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'class'}_${selectedExam?.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'exam'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export individual report card as PDF
  const exportReportCardPDF = (student: Student) => {
    const marks = getStudentMarks(student.id);
    const stats = calculateStudentStats(student.id);
    const rank = rankedStudents.findIndex(s => s.id === student.id) + 1;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const marksRows = marks.map(mark => {
      const subject = getSubjectDetails(mark.subjectId);
      const gradeColor = mark.grade === 'A' || mark.grade === 'A+' ? '#10B981' : 
                         mark.grade === 'F' ? '#EF4444' : '#64748b';
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-weight: 600; color: #1e293b;">${subject?.nameEn || 'Subject'}</div>
            <div style="font-size: 11px; color: #64748b;">${subject?.nameMm || ''}</div>
          </td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #64748b;">100</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #64748b;">40</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b; font-size: 16px;">${mark.score}</td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
            <span style="background: ${gradeColor}20; color: ${gradeColor}; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 12px;">${mark.grade}</span>
          </td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #64748b; font-style: italic;">${mark.remark || '-'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Report Card - ${student.nameEn}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Myanmar:wght@400;700&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Inter', 'Noto Sans Myanmar', sans-serif; 
            background: white;
            color: #1e293b;
            line-height: 1.5;
            padding: 0;
          }
          
          .page {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
          }
          
          .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 3px solid #7c3aed;
            margin-bottom: 30px;
          }
          
          .logo {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            border-radius: 50%;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 28px;
            font-weight: 700;
          }
          
          .school-name {
            font-size: 26px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
          }
          
          .school-name-mm {
            font-size: 16px;
            color: #7c3aed;
            font-weight: 600;
            margin-top: 4px;
          }
          
          .school-address {
            font-size: 12px;
            color: #64748b;
            margin-top: 8px;
          }
          
          .report-title {
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            color: white;
            text-align: center;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 24px;
          }
          
          .info-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 30px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
          }
          
          .info-group h4 {
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          
          .info-row {
            display: flex;
            margin-bottom: 8px;
            font-size: 13px;
          }
          
          .info-label {
            width: 100px;
            color: #64748b;
            font-weight: 500;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 600;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          
          thead th {
            background: #7c3aed;
            color: white;
            padding: 14px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          thead th:first-child { border-radius: 8px 0 0 0; }
          thead th:last-child { border-radius: 0 8px 0 0; }
          
          tfoot td {
            background: #f1f5f9;
            padding: 14px 12px;
            font-weight: 700;
          }
          
          tfoot td:first-child { border-radius: 0 0 0 8px; }
          tfoot td:last-child { border-radius: 0 0 8px 0; }
          
          .result-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .result-box {
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          
          .result-pass {
            background: #dcfce7;
            border: 2px solid #86efac;
          }
          
          .result-fail {
            background: #fee2e2;
            border: 2px solid #fca5a5;
          }
          
          .result-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.7;
            margin-bottom: 4px;
          }
          
          .result-value {
            font-size: 24px;
            font-weight: 700;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          
          .stat-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px;
            text-align: center;
          }
          
          .stat-label {
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .stat-value {
            font-size: 22px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 4px;
          }
          
          .signatures {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 40px;
            margin-top: 60px;
            padding-top: 20px;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            height: 50px;
            border-bottom: 2px dashed #cbd5e1;
            margin-bottom: 8px;
          }
          
          .signature-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          
          .footer p {
            font-size: 10px;
            color: #94a3b8;
          }
          
          @media print {
            body { padding: 0; }
            .page { padding: 20px; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="logo">📚</div>
            <div class="school-name">PYIN NYAR NAN DAW PRIVATE SCHOOL</div>
            <div class="school-name-mm">ပညာနန်းတော် ကိုယ်ပိုင်အထက်တန်းကျောင်း</div>
            <div class="school-address">No. 123, Pyay Road, Kamayut Township, Yangon, Myanmar</div>
          </div>
          
          <div class="report-title">Student Report Card / စာမေးပွဲအမှတ်စာရင်း</div>
          
          <div class="info-section">
            <div class="info-group">
              <h4>Student Information / ကျောင်းသားအချက်အလက်</h4>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${student.nameEn}</span>
              </div>
              <div class="info-row">
                <span class="info-label">အမည်:</span>
                <span class="info-value">${student.nameMm}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Student ID:</span>
                <span class="info-value">${student.id}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Grade:</span>
                <span class="info-value">${student.grade}</span>
              </div>
            </div>
            <div class="info-group">
              <h4>Exam Information / စာမေးပွဲအချက်အလက်</h4>
              <div class="info-row">
                <span class="info-label">Examination:</span>
                <span class="info-value">${selectedExam?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Term:</span>
                <span class="info-value">${selectedExam?.term || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Academic Year:</span>
                <span class="info-value">${selectedExam?.academicYear || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date Issued:</span>
                <span class="info-value">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Subject / ဘာသာရပ်</th>
                <th style="text-align: center; width: 12%;">Max Marks</th>
                <th style="text-align: center; width: 12%;">Pass Marks</th>
                <th style="text-align: center; width: 15%;">Obtained</th>
                <th style="text-align: center; width: 12%;">Grade</th>
                <th style="text-align: right; width: 19%;">Remark</th>
              </tr>
            </thead>
            <tbody>
              ${marks.length > 0 ? marksRows : '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #94a3b8;">No marks recorded</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td style="font-weight: 700; color: #1e293b;">TOTAL</td>
                <td style="text-align: center; color: #64748b;">${marks.length * 100}</td>
                <td style="text-align: center; color: #64748b;">${marks.length * 40}</td>
                <td style="text-align: center; font-size: 18px; color: #7c3aed;">${stats.total}</td>
                <td style="text-align: center; font-size: 18px; color: #7c3aed;">${stats.grade}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <div class="result-section">
            <div class="result-box ${stats.isPass ? 'result-pass' : 'result-fail'}">
              <div class="result-label">Final Result / ရလဒ်</div>
              <div class="result-value" style="color: ${stats.isPass ? '#16a34a' : '#dc2626'};">
                ${stats.isPass ? '✓ PASSED' : '✗ NEEDS IMPROVEMENT'}
              </div>
            </div>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-label">Class Rank</div>
                <div class="stat-value">${rank}/${classStudents.length}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Average</div>
                <div class="stat-value">${stats.average.toFixed(1)}%</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Attendance</div>
                <div class="stat-value">${student.attendanceRate}%</div>
              </div>
            </div>
          </div>
          
          <div class="signatures">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Class Teacher</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Parent / Guardian</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Principal</div>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer-generated document. No signature is required for authentication.</p>
            <p style="margin-top: 4px;">© Powered by A7 System All rights reserved.</p>
          </div>
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

  // Export all report cards as PDF (batch)
  const exportAllReportCardsPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF');
      return;
    }

    const allCardsHTML = rankedStudents.map((student, index) => {
      const marks = getStudentMarks(student.id);
      const stats = student.stats;
      const rank = index + 1;

      const marksRows = marks.map(mark => {
        const subject = getSubjectDetails(mark.subjectId);
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">${subject?.nameEn || 'Subject'}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">100</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0;">40</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0; font-weight: 700;">${mark.score}</td>
            <td style="padding: 8px; text-align: center; border: 1px solid #e2e8f0; font-weight: 700;">${mark.grade}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="report-card" style="page-break-after: always; padding: 30px;">
          <div style="text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 15px; margin-bottom: 20px;">
            <h1 style="font-size: 20px; margin: 0; color: #1e293b;">PYIN NYAR NAN DAW PRIVATE SCHOOL</h1>
            <p style="color: #7c3aed; margin: 5px 0;">ပညာနန်းတော် ကိုယ်ပိုင်အထက်တန်းကျောင်း</p>
            <p style="font-size: 11px; color: #64748b;">Student Report Card - ${selectedExam?.name || ''}</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
            <div>
              <p><strong>Name:</strong> ${student.nameEn} (${student.nameMm})</p>
              <p><strong>Student ID:</strong> ${student.id}</p>
              <p><strong>Grade:</strong> ${student.grade}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Rank:</strong> ${rank} / ${rankedStudents.length}</p>
              <p><strong>Academic Year:</strong> ${selectedExam?.academicYear || 'N/A'}</p>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #7c3aed; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #7c3aed;">Subject</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #7c3aed;">Max</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #7c3aed;">Pass</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #7c3aed;">Obtained</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #7c3aed;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${marksRows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No marks</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td style="padding: 10px; border: 1px solid #e2e8f0;">TOTAL</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0;">${marks.length * 100}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0;">${marks.length * 40}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; color: #7c3aed;">${stats.total}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #e2e8f0; color: #7c3aed;">${stats.grade}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: ${stats.isPass ? '#dcfce7' : '#fee2e2'}; border-radius: 8px; margin-bottom: 20px;">
            <div>
              <p style="font-size: 11px; color: ${stats.isPass ? '#16a34a' : '#dc2626'}; font-weight: 700;">RESULT</p>
              <p style="font-size: 18px; font-weight: 700; color: ${stats.isPass ? '#16a34a' : '#dc2626'};">${stats.isPass ? 'PASSED' : 'FAILED'}</p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 11px; color: #64748b;">Average: <strong>${stats.average.toFixed(1)}%</strong></p>
              <p style="font-size: 11px; color: #64748b;">Attendance: <strong>${student.attendanceRate}%</strong></p>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 11px;">
            <div style="width: 30%;">
              <div style="border-bottom: 1px dashed #94a3b8; height: 40px; margin-bottom: 5px;"></div>
              <p style="color: #64748b;">Class Teacher</p>
            </div>
            <div style="width: 30%;">
              <div style="border-bottom: 1px dashed #94a3b8; height: 40px; margin-bottom: 5px;"></div>
              <p style="color: #64748b;">Parent/Guardian</p>
            </div>
            <div style="width: 30%;">
              <div style="border-bottom: 1px dashed #94a3b8; height: 40px; margin-bottom: 5px;"></div>
              <p style="color: #64748b;">Principal</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>All Report Cards - ${selectedClass?.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Myanmar:wght@400;700&display=swap');
          body { font-family: 'Inter', 'Noto Sans Myanmar', sans-serif; margin: 0; padding: 0; }
          @media print {
            .report-card { page-break-after: always; }
            .report-card:last-child { page-break-after: auto; }
          }
        </style>
      </head>
      <body>
        ${allCardsHTML}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // --- Render Components ---

  const ReportCardModal = ({ student, onClose }: { student: Student, onClose: () => void }) => {
    const marks = getStudentMarks(student.id);
    const stats = calculateStudentStats(student.id);
    const rank = rankedStudents.findIndex(s => s.id === student.id) + 1;
    
    // Chart Data Preparation
    const chartData = marks.map(m => ({
      subject: getSubjectDetails(m.subjectId)?.code || 'Sub',
      score: m.score,
      fullMark: 100
    }));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className="bg-white rounded-[24px] w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Modal Header Actions */}
          <div className="sticky top-0 z-10 p-4 bg-slate-50 border-b border-slate-200 print:hidden relative pr-14">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-bold text-slate-700 text-sm sm:text-base min-w-0 truncate">
                Report Card Preview
              </h3>

              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
                <button
                  onClick={() => exportReportCardPDF(student)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-red-600"
                >
                  <FileDown size={16} />
                  <span className="hidden sm:inline">Export PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-brand-700"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">Print</span>
                </button>
              </div>
            </div>

            {/* Always-visible close button (mobile + desktop) */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300"
              aria-label="Close report card preview"
            >
              <X size={20} />
            </button>
          </div>

          {/* Printable Content Area */}
          <div className="p-8 md:p-12 overflow-y-auto print:p-0 print:overflow-visible" id="printable-area">
            
            {/* School Header */}
            <div className="text-center mb-8 border-b-2 border-brand-100 pb-6">
               <div className="flex justify-center mb-4">
                 <div className="w-16 h-16 bg-brand-600 rounded-full flex items-center justify-center text-white">
                    <GraduationCap size={32} />
                 </div>
               </div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">PYIN NYAR NAN DAW PRIVATE SCHOOL</h1>
               <p className="text-slate-500 font-burmese font-bold mt-1">ပညာနန်းတော် ကိုယ်ပိုင်အထက်တန်းကျောင်း</p>
               <p className="text-sm text-slate-400 mt-2">No. 123, Pyay Road, Kamayut Township, Yangon</p>
            </div>

            {/* Student & Exam Info */}
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 bg-slate-50 p-6 rounded-2xl print:bg-transparent print:p-0 print:mb-4">
               <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Student Details</h4>
                  <div className="grid grid-cols-[100px_1fr] gap-x-4 text-sm">
                     <span className="text-slate-500 font-medium">Name:</span>
                     <span className="font-bold text-slate-800">{student.nameEn} ({student.nameMm})</span>
                     
                     <span className="text-slate-500 font-medium">Student ID:</span>
                     <span className="font-bold text-slate-800">{student.id}</span>
                     
                     <span className="text-slate-500 font-medium">Grade:</span>
                     <span className="font-bold text-slate-800">{student.grade}</span>

                     <span className="text-slate-500 font-medium">Roll No:</span>
                     <span className="font-bold text-slate-800">12</span>
                  </div>
               </div>
               <div className="space-y-2 text-right md:text-left">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Details</h4>
                  <div className="grid grid-cols-[100px_1fr] gap-x-4 text-sm">
                     <span className="text-slate-500 font-medium">Examination:</span>
                     <span className="font-bold text-slate-800">{selectedExam?.name}</span>
                     
                     <span className="text-slate-500 font-medium">Academic Year:</span>
                     <span className="font-bold text-slate-800">{selectedExam?.academicYear}</span>
                     
                     <span className="text-slate-500 font-medium">Date Issued:</span>
                     <span className="font-bold text-slate-800">{new Date().toLocaleDateString()}</span>
                  </div>
               </div>
            </div>

            {/* Marks Table */}
            <div className="mb-8">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b-2 border-slate-200">
                        <th className="py-3 font-bold text-slate-600 text-sm">Subject</th>
                        <th className="py-3 font-bold text-slate-600 text-sm text-center">Max Marks</th>
                        <th className="py-3 font-bold text-slate-600 text-sm text-center">Pass Marks</th>
                        <th className="py-3 font-bold text-slate-600 text-sm text-center">Obtained</th>
                        <th className="py-3 font-bold text-slate-600 text-sm text-center">Grade</th>
                        <th className="py-3 font-bold text-slate-600 text-sm text-right">Remark</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {marks.length > 0 ? marks.map((mark) => {
                        const subject = getSubjectDetails(mark.subjectId);
                        return (
                           <tr key={mark.id}>
                              <td className="py-4">
                                 <p className="font-bold text-slate-800 text-sm">{subject?.nameEn}</p>
                                 <p className="text-xs font-burmese text-slate-500">{subject?.nameMm}</p>
                              </td>
                              <td className="py-4 text-center text-sm font-medium text-slate-500">100</td>
                              <td className="py-4 text-center text-sm font-medium text-slate-500">40</td>
                              <td className="py-4 text-center font-bold text-slate-800">
                                 {mark.score}
                              </td>
                              <td className="py-4 text-center">
                                 <span className={`px-2 py-1 rounded text-xs font-bold ${
                                    mark.grade === 'A' || mark.grade === 'A+' ? 'bg-green-100 text-green-700' :
                                    mark.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                 }`}>
                                    {mark.grade}
                                 </span>
                              </td>
                              <td className="py-4 text-right text-sm text-slate-500 italic">
                                 {mark.remark || '-'}
                              </td>
                           </tr>
                        );
                     }) : (
                       <tr>
                         <td colSpan={6} className="py-8 text-center text-slate-400">
                           No marks recorded for this student in this exam yet.
                         </td>
                       </tr>
                     )}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-200 bg-slate-50 print:bg-transparent">
                     <tr>
                        <td className="py-4 font-bold text-slate-800">Total</td>
                        <td className="py-4 text-center font-bold text-slate-500">{marks.length * 100}</td>
                        <td className="py-4"></td>
                        <td className="py-4 text-center font-bold text-brand-600 text-lg">{stats.total}</td>
                        <td className="py-4 text-center font-bold text-brand-600 text-lg">{stats.grade}</td>
                        <td className="py-4"></td>
                     </tr>
                  </tfoot>
               </table>
            </div>

            {/* Analysis & Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 break-inside-avoid">
               <div>
                  <h4 className="font-bold text-slate-800 mb-4">Performance Analysis</h4>
                  <div className="h-64 w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 print:border-slate-300">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="subject" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                           <YAxis hide domain={[0, 100]} />
                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                           <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10B981' : entry.score < 40 ? '#EF4444' : '#7C3AED'} />
                              ))}
                           </Bar>
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>
               
               <div className="flex flex-col justify-between">
                  <div className="space-y-4">
                     <h4 className="font-bold text-slate-800 mb-2">Final Result</h4>
                     <div className={`p-4 rounded-2xl border flex items-center gap-4 ${stats.isPass ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {stats.isPass ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                        <div>
                           <p className="text-sm font-bold opacity-80 uppercase tracking-wide">Status</p>
                           <p className="text-2xl font-bold">{stats.isPass ? 'PASSED' : 'NEEDS IMPROVEMENT'}</p>
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                           <p className="text-xs font-bold text-slate-400 uppercase">Class Rank</p>
                           <div className="flex items-end gap-2">
                              <span className="text-2xl font-bold text-slate-800">{rank}</span>
                              <span className="text-xs text-slate-500 mb-1">/ {classStudents.length}</span>
                           </div>
                        </div>
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                           <p className="text-xs font-bold text-slate-400 uppercase">Attendance</p>
                           <span className="text-2xl font-bold text-slate-800">{student.attendanceRate}%</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Footer / Signatures */}
            <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-3 gap-8 text-center break-inside-avoid">
               <div>
                  <div className="h-16 border-b border-dashed border-slate-300 mb-2"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Class Teacher</p>
               </div>
               <div>
                  <div className="h-16 border-b border-dashed border-slate-300 mb-2"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Parent / Guardian</p>
               </div>
               <div>
                  <div className="h-16 border-b border-dashed border-slate-300 mb-2"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Principal</p>
               </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Report Cards</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">စာမေးပွဲ အောင်စာရင်းကတ်များ</p>
        </div>
        
        {/* Bulk Actions */}
        <div className="flex items-center gap-3">
             <button onClick={handleExport} className="px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                <Download size={18} />
                <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={exportAllReportCardsPDF} className="px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition-all flex items-center gap-2">
                <FileDown size={18} />
                <span className="hidden sm:inline">PDF All</span>
            </button>
            <button onClick={handlePrint} className="px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center gap-2">
                <Printer size={18} />
                <span className="hidden sm:inline">Print</span>
            </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Exam Select */}
         <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Examination</label>
            <div className="relative group">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
                >
                    {exams.map(exam => (
                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
         </div>

         {/* Class Select */}
         <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class</label>
            <div className="relative group">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer appearance-none"
                >
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
         </div>

         {/* Search */}
         <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Student</label>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500/20"
                />
            </div>
         </div>
      </div>

      {/* Grid List of Students */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {rankedStudents.map((student, index) => {
           const { stats } = student;
           
           return (
             <div key={student.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-50 hover:shadow-md transition-all relative group flex flex-col justify-between h-full">
                
                {/* Rank Badge */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                   index === 0 ? 'bg-yellow-100 text-yellow-700' :
                   index === 1 ? 'bg-slate-200 text-slate-700' :
                   index === 2 ? 'bg-orange-100 text-orange-700' :
                   'bg-slate-50 text-slate-400'
                }`}>
                   {index + 1}
                </div>

                <div className="mb-6">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg border border-brand-100">
                        {(student.nameEn || student.nameMm || student.id || '?').charAt(0)}
                     </div>
                      <div>
                         <h4 className="font-bold text-slate-800 leading-tight">{student.nameEn}</h4>
                         <p className="text-xs text-slate-400 font-mono mt-0.5">{student.id}</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="bg-slate-50 rounded-xl p-2.5">
                         <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                         <p className="text-lg font-bold text-slate-800">{stats.total}</p>
                      </div>
                      <div className={`rounded-xl p-2.5 ${stats.isPass ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                         <p className="text-[10px] font-bold opacity-70 uppercase">Grade</p>
                         <p className="text-lg font-bold">{stats.grade}</p>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={() => setSelectedStudent(student)}
                  className="w-full py-3 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-sm hover:border-brand-600 hover:text-brand-600 hover:bg-brand-50 transition-all"
                >
                   View Report Card
                </button>
             </div>
           );
         })}
      </div>

      {rankedStudents.length === 0 && (
         <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
             <Filter size={48} className="mx-auto text-slate-300 mb-4" />
             <p className="text-slate-500 font-medium">No students found matching current filters.</p>
         </div>
      )}

      {/* Modal Render */}
      {selectedStudent && (
        <ReportCardModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}

    </div>
  );
};