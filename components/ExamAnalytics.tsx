import React, { useState, useMemo, useEffect } from 'react';
import { Student } from '../types';
import { useData } from '../contexts/DataContext';
import { 
  BarChart3, TrendingUp, Users, Trophy, Medal, Target, 
  Calendar, ChevronLeft, ChevronRight, Bell, BellRing, X,
  CheckCircle2, XCircle, AlertTriangle, GraduationCap, BookOpen,
  ArrowUp, ArrowDown, Minus, Filter, Download, Eye, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, parseISO, differenceInDays, addDays } from 'date-fns';

type TabType = 'analytics' | 'calendar' | 'notifications';

const COLORS = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

interface StudentProgress {
  student: Student;
  examResults: { examId: string; examName: string; total: number; average: number; rank: number }[];
}

interface Notification {
  id: string;
  type: 'reminder' | 'result' | 'warning';
  title: string;
  message: string;
  examId?: string;
  date: string;
  isRead: boolean;
}

export const ExamAnalytics: React.FC = () => {
  const { exams, marks, students, classes, subjects } = useData();

  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  useEffect(() => {
    if (!selectedExamId && exams.length) setSelectedExamId(exams[0].id);
  }, [exams, selectedExamId]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Generate notifications based on upcoming exams
  useEffect(() => {
    const today = new Date();
    const newNotifications: Notification[] = [];

    exams.forEach(exam => {
      const startDate = parseISO(exam.startDate);
      const daysUntil = differenceInDays(startDate, today);

      if (daysUntil > 0 && daysUntil <= 7) {
        newNotifications.push({
          id: `reminder-${exam.id}`,
          type: 'reminder',
          title: `Exam Reminder: ${exam.name}`,
          message: `${exam.name} starts in ${daysUntil} day${daysUntil > 1 ? 's' : ''} on ${format(startDate, 'MMM dd, yyyy')}`,
          examId: exam.id,
          date: format(today, 'yyyy-MM-dd'),
          isRead: false
        });
      }

      if (exam.status === 'Published') {
        newNotifications.push({
          id: `result-${exam.id}`,
          type: 'result',
          title: `Results Published: ${exam.name}`,
          message: `Exam results for ${exam.name} are now available.`,
          examId: exam.id,
          date: exam.endDate,
          isRead: false
        });
      }
    });

    setNotifications(newNotifications);
  }, [exams]);

  // --- Analytics Calculations ---

  // Get marks for a specific exam
  const getExamMarks = (examId: string) => {
    return marks.filter(m => m.examId === examId);
  };

  // Class Performance Comparison
  const classPerformance = useMemo(() => {
    const examMarks = getExamMarks(selectedExamId);
    const classStats = new Map<string, { total: number; count: number; pass: number; fail: number }>();

    classes.forEach(cls => {
      classStats.set(cls.id, { total: 0, count: 0, pass: 0, fail: 0 });
    });

    // Group students by class
    students.forEach(student => {
      const studentMarks = examMarks.filter(m => m.studentId === student.id);
      if (studentMarks.length === 0) return;

      const total = studentMarks.reduce((sum, m) => sum + m.score, 0);
      const average = total / studentMarks.length;
      const isPass = studentMarks.every(m => m.score >= 40);

      // Find class by grade matching
      const classId = classes.find(c => c.name === student.grade)?.id;

      if (classId) {
        const stats = classStats.get(classId)!;
        stats.total += average;
        stats.count += 1;
        if (isPass) stats.pass += 1;
        else stats.fail += 1;
        classStats.set(classId, stats);
      }
    });

    return classes.map(cls => {
      const stats = classStats.get(cls.id)!;
      return {
        id: cls.id,
        name: cls.name.length > 15 ? cls.name.substring(0, 12) + '...' : cls.name,
        fullName: cls.name,
        average: stats.count > 0 ? Math.round(stats.total / stats.count) : 0,
        pass: stats.pass,
        fail: stats.fail,
        total: stats.count,
        passRate: stats.count > 0 ? Math.round((stats.pass / stats.count) * 100) : 0
      };
    }).filter(c => c.total > 0);
  }, [selectedExamId, marks, students, classes]);

  // Subject-wise Performance
  const subjectPerformance = useMemo(() => {
    const examMarks = getExamMarks(selectedExamId);
    const subjectStats = new Map<string, { total: number; count: number; highest: number; lowest: number }>();

    examMarks.forEach(mark => {
      const stats = subjectStats.get(mark.subjectId) || { total: 0, count: 0, highest: 0, lowest: 100 };
      stats.total += mark.score;
      stats.count += 1;
      stats.highest = Math.max(stats.highest, mark.score);
      stats.lowest = Math.min(stats.lowest, mark.score);
      subjectStats.set(mark.subjectId, stats);
    });

    return Array.from(subjectStats.entries()).map(([subjectId, stats]) => {
      const subject = subjects.find(s => s.id === subjectId);
      return {
        id: subjectId,
        name: subject?.code || subjectId,
        fullName: subject?.nameEn || subjectId,
        average: Math.round(stats.total / stats.count),
        highest: stats.highest,
        lowest: stats.lowest,
        students: stats.count
      };
    }).sort((a, b) => b.average - a.average);
  }, [selectedExamId, marks, subjects]);

  // Student Rank List
  const studentRankList = useMemo(() => {
    const examMarks = getExamMarks(selectedExamId);
    const studentScores = new Map<string, { total: number; count: number; scores: number[] }>();

    examMarks.forEach(mark => {
      const current = studentScores.get(mark.studentId) || { total: 0, count: 0, scores: [] };
      current.total += mark.score;
      current.count += 1;
      current.scores.push(mark.score);
      studentScores.set(mark.studentId, current);
    });

    const ranked = Array.from(studentScores.entries())
      .map(([studentId, data]) => {
        const student = students.find(s => s.id === studentId);
        const isPass = data.scores.every(s => s >= 40);
        return {
          studentId,
          student,
          total: data.total,
          average: Math.round(data.total / data.count),
          subjects: data.count,
          isPass,
          grade: data.total / data.count >= 80 ? 'A' : 
                 data.total / data.count >= 60 ? 'B' : 
                 data.total / data.count >= 40 ? 'C' : 'F'
        };
      })
      .filter(r => selectedClassId === 'all' || 
        r.student?.grade.includes(classes.find(c => c.id === selectedClassId)?.gradeLevel || ''))
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return ranked;
  }, [selectedExamId, marks, students, selectedClassId, classes]);

  // Pass/Fail Ratio
  const passFailRatio = useMemo(() => {
    const passed = studentRankList.filter(s => s.isPass).length;
    const failed = studentRankList.filter(s => !s.isPass).length;
    return [
      { name: 'Passed', value: passed, color: '#10b981' },
      { name: 'Failed', value: failed, color: '#ef4444' }
    ];
  }, [studentRankList]);

  // Student Progress (Trend across exams)
  const getStudentProgress = (studentId: string): StudentProgress | null => {
    const student = students.find(s => s.id === studentId);
    if (!student) return null;

    const examResults = exams
      .filter(e => e.status === 'Published' || e.status === 'Completed')
      .map(exam => {
        const studentMarks = marks.filter(m => m.examId === exam.id && m.studentId === studentId);
        if (studentMarks.length === 0) return null;

        const total = studentMarks.reduce((sum, m) => sum + m.score, 0);
        const average = Math.round(total / studentMarks.length);

        // Calculate rank
        const allStudentTotals = marks
          .filter(m => m.examId === exam.id)
          .reduce((acc, m) => {
            acc[m.studentId] = (acc[m.studentId] || 0) + m.score;
            return acc;
          }, {} as Record<string, number>);

        const sortedTotals = Object.entries(allStudentTotals)
          .sort(([, a], [, b]) => (b as number) - (a as number));
        const rank = sortedTotals.findIndex(([id]) => id === studentId) + 1;

        return {
          examId: exam.id,
          examName: exam.name.length > 20 ? exam.name.substring(0, 17) + '...' : exam.name,
          total,
          average,
          rank
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    return { student, examResults };
  };

  const selectedStudentProgress = selectedStudentId ? getStudentProgress(selectedStudentId) : null;

  // --- Calendar Logic ---

  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarDate);
    const end = endOfMonth(calendarDate);
    return eachDayOfInterval({ start, end });
  }, [calendarDate]);

  const getExamsForDay = (date: Date) => {
    return exams.filter(exam => {
      const start = parseISO(exam.startDate);
      const end = parseISO(exam.endDate);
      return isWithinInterval(date, { start, end });
    });
  };

  const goToPrevMonth = () => setCalendarDate(subMonths(calendarDate, 1));
  const goToNextMonth = () => setCalendarDate(addMonths(calendarDate, 1));
  const goToToday = () => setCalendarDate(new Date());

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Exam Analytics</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">စာမေးပွဲ ခွဲခြမ်းစိတ်ဖြာမှု</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={18} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'calendar' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar size={18} /> Calendar
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 relative ${
              activeTab === 'notifications' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell size={18} /> Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-2 flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer min-w-[200px]"
              >
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-2 flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer min-w-[150px]"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-brand-500 to-purple-600 text-white p-6 rounded-[24px] shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Users size={24} />
                <span className="text-sm font-bold opacity-80">Total Students</span>
              </div>
              <p className="text-3xl font-bold">{studentRankList.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white p-6 rounded-[24px] shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 size={24} />
                <span className="text-sm font-bold opacity-80">Passed</span>
              </div>
              <p className="text-3xl font-bold">{passFailRatio[0].value}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-6 rounded-[24px] shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <XCircle size={24} />
                <span className="text-sm font-bold opacity-80">Failed</span>
              </div>
              <p className="text-3xl font-bold">{passFailRatio[1].value}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-[24px] shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <Target size={24} />
                <span className="text-sm font-bold opacity-80">Pass Rate</span>
              </div>
              <p className="text-3xl font-bold">
                {studentRankList.length > 0 
                  ? Math.round((passFailRatio[0].value / studentRankList.length) * 100) 
                  : 0}%
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Class Performance Comparison */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-brand-600" />
                Class Performance Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformance} margin={{ top: 10, right: 10, left: -10, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
                            <p className="font-bold text-slate-800">{data.fullName}</p>
                            <p className="text-sm text-brand-600">Avg: {data.average}%</p>
                            <p className="text-sm text-green-600">Pass: {data.pass}</p>
                            <p className="text-sm text-red-600">Fail: {data.fail}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="average" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pass/Fail Ratio Pie */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Target size={20} className="text-brand-600" />
                Pass/Fail Ratio
              </h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={passFailRatio}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {passFailRatio.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-slate-600">Passed ({passFailRatio[0].value})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium text-slate-600">Failed ({passFailRatio[1].value})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subject-wise Performance */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-brand-600" />
              Subject-wise Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase">Subject</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Students</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Average</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Highest</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Lowest</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectPerformance.map((subject, idx) => (
                    <tr key={subject.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-3">
                        <div>
                          <p className="font-bold text-slate-800">{subject.name}</p>
                          <p className="text-xs text-slate-500">{subject.fullName}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm font-medium text-slate-600">{subject.students}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${subject.average >= 60 ? 'text-green-600' : subject.average >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {subject.average}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-green-600 font-medium">{subject.highest}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-red-600 font-medium">{subject.lowest}</span>
                      </td>
                      <td className="p-3">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${subject.average >= 60 ? 'bg-green-500' : subject.average >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${subject.average}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Student Rank List */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                Student Rank List
              </h3>
              <button
                onClick={() => setShowProgressModal(true)}
                className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-100 flex items-center gap-2"
              >
                <TrendingUp size={16} /> View Progress
              </button>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-slate-50">
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase w-16">Rank</th>
                    <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Subjects</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Average</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Grade</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRankList.slice(0, 50).map((item) => (
                    <tr key={item.studentId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-3 text-center">
                        {item.rank <= 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto ${
                            item.rank === 1 ? 'bg-amber-100 text-amber-600' : 
                            item.rank === 2 ? 'bg-slate-200 text-slate-600' : 
                            'bg-orange-100 text-orange-600'
                          }`}>
                            <Medal size={16} />
                          </div>
                        ) : (
                          <span className="font-bold text-slate-600">{item.rank}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-bold text-slate-800">{item.student?.nameEn}</p>
                          <p className="text-xs text-slate-500 font-burmese">{item.student?.nameMm}</p>
                        </div>
                      </td>
                      <td className="p-3 text-center text-sm text-slate-600">{item.subjects}</td>
                      <td className="p-3 text-center font-bold text-slate-800">{item.total}</td>
                      <td className="p-3 text-center font-bold text-brand-600">{item.average}%</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          item.grade === 'A' ? 'bg-green-100 text-green-700' :
                          item.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          item.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {item.grade}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {item.isPass ? (
                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold flex items-center gap-1 justify-center">
                            <CheckCircle2 size={12} /> Pass
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1 justify-center">
                            <XCircle size={12} /> Fail
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedStudentId(item.studentId);
                            setShowProgressModal(true);
                          }}
                          className="p-2 hover:bg-brand-50 rounded-lg text-brand-600 transition-colors"
                          title="View Progress"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={goToPrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronLeft size={20} />
              </button>
              <h3 className="text-xl font-bold text-slate-800">
                {format(calendarDate, 'MMMM yyyy')}
              </h3>
              <button onClick={goToNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-sm font-bold hover:bg-brand-100"
            >
              Today
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-slate-500 uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: calendarDays[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-slate-50 rounded-lg"></div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map(day => {
              const dayExams = getExamsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`h-24 p-2 rounded-lg border transition-colors ${
                    isToday ? 'border-brand-500 bg-brand-50' : 'border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-sm font-bold mb-1 ${isToday ? 'text-brand-600' : 'text-slate-600'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-14">
                    {dayExams.map(exam => (
                      <div
                        key={exam.id}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded truncate ${
                          exam.status === 'Upcoming' ? 'bg-blue-100 text-blue-700' :
                          exam.status === 'Ongoing' ? 'bg-amber-100 text-amber-700' :
                          exam.status === 'Completed' ? 'bg-slate-100 text-slate-600' :
                          'bg-green-100 text-green-700'
                        }`}
                        title={exam.name}
                      >
                        {exam.name.length > 12 ? exam.name.substring(0, 10) + '...' : exam.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-slate-600">Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-slate-600">Ongoing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-sm text-slate-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-600">Published</span>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-[24px] p-12 shadow-sm border border-slate-100 text-center">
              <Bell size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No notifications at this time</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`bg-white rounded-[24px] p-6 shadow-sm border transition-all ${
                  notification.isRead ? 'border-slate-100 opacity-60' : 'border-brand-200 border-l-4 border-l-brand-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${
                    notification.type === 'reminder' ? 'bg-blue-50 text-blue-600' :
                    notification.type === 'result' ? 'bg-green-50 text-green-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {notification.type === 'reminder' ? <BellRing size={24} /> :
                     notification.type === 'result' ? <CheckCircle2 size={24} /> :
                     <AlertTriangle size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-800">{notification.title}</h4>
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-brand-600 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={12} />
                      {notification.date}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-3xl shadow-2xl p-4 sm:p-8 relative max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
            <button 
              onClick={() => { setShowProgressModal(false); setSelectedStudentId(null); }}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 pn-modal-close"
            >
              <X size={20} />
            </button>

            <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
              <TrendingUp className="text-brand-600" />
              Student Progress Report
            </h3>
            <p className="text-slate-500 mb-6 font-burmese">ကျောင်းသား ရလဒ် trend graph</p>

            {/* Student Selector */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Student</label>
              <select
                value={selectedStudentId || ''}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
              >
                <option value="">Choose a student...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.nameEn} ({s.grade})</option>
                ))}
              </select>
            </div>

            {selectedStudentProgress && selectedStudentProgress.examResults.length > 0 && (
              <>
                {/* Student Info */}
                <div className="bg-brand-50 p-4 rounded-xl mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-brand-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold">
                      {(selectedStudentProgress?.student?.nameEn || selectedStudentProgress?.student?.nameMm || selectedStudentProgress?.student?.id || '?').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{selectedStudentProgress.student.nameEn}</h4>
                      <p className="text-slate-500 font-burmese">{selectedStudentProgress.student.nameMm}</p>
                      <p className="text-sm text-brand-600 font-medium">{selectedStudentProgress.student.grade}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Chart */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Performance Trend Across Exams</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={selectedStudentProgress.examResults}>
                      <defs>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="examName" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="average" 
                        stroke="#7c3aed" 
                        strokeWidth={3}
                        fill="url(#colorAvg)" 
                        name="Average Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Rank Trend */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Rank Trend</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedStudentProgress.examResults}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="examName" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis reversed domain={[1, 'auto']} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="rank" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                        name="Class Rank"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Exam Details Table */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Detailed Results</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left p-3 text-xs font-bold text-slate-500 uppercase">Exam</th>
                          <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Total</th>
                          <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Average</th>
                          <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Rank</th>
                          <th className="text-center p-3 text-xs font-bold text-slate-500 uppercase">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudentProgress.examResults.map((result, idx) => {
                          const prevResult = idx > 0 ? selectedStudentProgress.examResults[idx - 1] : null;
                          const avgChange = prevResult ? result.average - prevResult.average : 0;
                          const rankChange = prevResult ? prevResult.rank - result.rank : 0;

                          return (
                            <tr key={result.examId} className="border-b border-slate-50">
                              <td className="p-3 font-medium text-slate-800">{result.examName}</td>
                              <td className="p-3 text-center font-bold text-slate-700">{result.total}</td>
                              <td className="p-3 text-center font-bold text-brand-600">{result.average}%</td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold">
                                  #{result.rank}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                {avgChange > 0 ? (
                                  <span className="text-green-600 flex items-center justify-center gap-1">
                                    <ArrowUp size={14} /> +{avgChange}%
                                  </span>
                                ) : avgChange < 0 ? (
                                  <span className="text-red-600 flex items-center justify-center gap-1">
                                    <ArrowDown size={14} /> {avgChange}%
                                  </span>
                                ) : (
                                  <span className="text-slate-400 flex items-center justify-center gap-1">
                                    <Minus size={14} /> -
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {selectedStudentId && (!selectedStudentProgress || selectedStudentProgress.examResults.length === 0) && (
              <div className="text-center py-12 text-slate-400">
                <GraduationCap size={48} className="mx-auto mb-3 opacity-20" />
                <p>No exam results found for this student.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

