import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Brush
} from 'recharts';
import { 
  Users, GraduationCap, DollarSign, AlertCircle, TrendingUp, TrendingDown, 
  MoreHorizontal, ZoomIn, ZoomOut, RefreshCw, ArrowRight
} from 'lucide-react';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { useData } from '../contexts/DataContext';
import { ViewState } from '../types';

const BRAND_PURPLE = '#7C3AED';

interface StatCardProps {
  title: string;
  value: string;
  badge: string;
  badgeColor: 'green' | 'red';
  icon: any;
  onClick?: () => void;
  viewTarget?: ViewState;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, badge, badgeColor, icon: Icon, onClick, viewTarget }) => {
  const cardContent = (
    <div className={`bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 transition-all duration-300 ${
      onClick ? 'cursor-pointer hover:shadow-lg hover:border-brand-200 hover:-translate-y-1' : ''
    }`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-brand-50 rounded-2xl text-brand-600">
        <Icon size={24} strokeWidth={2} />
      </div>
        <div className="flex items-center gap-2">
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            badgeColor === 'green' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
      }`}>
        {badgeColor === 'green' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {badge}
      </span>
          {onClick && (
            <ArrowRight size={16} className="text-brand-600 opacity-60" />
          )}
        </div>
    </div>
    
    <div>
        <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">{value}</h3>
        <p className="text-slate-700 text-sm font-semibold">{title}</p>
    </div>
  </div>
);

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {cardContent}
      </button>
    );
  }

  return cardContent;
};

interface DashboardProps {
  onNavigate?: (view: ViewState) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { students, staff, expenses, payments, refreshData, isSyncing } = useData();
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [revenueZoom, setRevenueZoom] = useState({ startIndex: 0, endIndex: 4 });
  
  // Calculate real stats from data
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const totalFeesPending = students.reduce((sum, s) => sum + (s.feesPending || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalStaff = staff.length;
    
    // Calculate average attendance
    const avgAttendance = students.length > 0
      ? students.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / students.length
      : 0;
    
    return {
      totalStudents,
      activeStudents,
      totalFeesPending,
      totalExpenses,
      totalPayments,
      totalStaff,
      avgAttendance,
    };
  }, [students, staff, expenses, payments]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      refreshTimerRef.current = setInterval(() => {
        refreshData();
      }, refreshInterval * 1000);
    } else {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, refreshData]);

  // Full week attendance data (including Sunday)
  const dataAttendance = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    // Generate data for full week starting from Sunday
    return days.map((day, index) => {
      // Mock data - in real app, calculate from actual attendance records
      const basePresent = 450;
      const baseAbsent = 20;
      const variation = Math.floor(Math.random() * 30) - 15;
      
      return {
        name: day,
        present: Math.max(400, basePresent + variation),
        absent: Math.max(10, baseAbsent - Math.floor(variation / 2)),
      };
    });
  }, [students]);

  // Revenue data with more months for zoom
  const dataRevenue = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      name: month,
      amount: 10000000 + Math.floor(Math.random() * 15000000),
    }));
  }, [payments, expenses]);

  // Filtered revenue data based on zoom
  const zoomedRevenueData = useMemo(() => {
    return dataRevenue.slice(revenueZoom.startIndex, revenueZoom.endIndex + 1);
  }, [dataRevenue, revenueZoom]);

  // Advanced Filter State using the new DateRange type
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });

  const handleZoomIn = () => {
    const range = revenueZoom.endIndex - revenueZoom.startIndex;
    if (range > 2) {
      const newRange = Math.max(2, Math.floor(range * 0.7));
      const center = Math.floor((revenueZoom.startIndex + revenueZoom.endIndex) / 2);
      setRevenueZoom({
        startIndex: Math.max(0, center - Math.floor(newRange / 2)),
        endIndex: Math.min(dataRevenue.length - 1, center + Math.floor(newRange / 2))
      });
    }
  };

  const handleZoomOut = () => {
    const range = revenueZoom.endIndex - revenueZoom.startIndex;
    if (range < dataRevenue.length - 1) {
      const newRange = Math.min(dataRevenue.length - 1, Math.floor(range * 1.5));
      const center = Math.floor((revenueZoom.startIndex + revenueZoom.endIndex) / 2);
      setRevenueZoom({
        startIndex: Math.max(0, center - Math.floor(newRange / 2)),
        endIndex: Math.min(dataRevenue.length - 1, center + Math.floor(newRange / 2))
      });
    }
  };

  const handleResetZoom = () => {
    setRevenueZoom({ startIndex: 0, endIndex: dataRevenue.length - 1 });
  };

  const handleCardClick = (view: ViewState) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h2>
            {isSyncing && (
              <RefreshCw size={20} className="text-brand-600 animate-spin" />
            )}
          </div>
          <p className="text-slate-800 font-burmese mt-2 leading-relaxed text-lg font-semibold">မင်္ဂလာပါ ဆရာကြီး ဦးကျော်ကြီး</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Auto-refresh Controls */}
          <div className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                autoRefresh 
                  ? 'bg-brand-600 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Auto
            </button>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-xs font-bold bg-transparent border-none outline-none cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>
          
          {/* Manual Refresh */}
          <button
            onClick={() => refreshData()}
            disabled={isSyncing}
            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        
        {/* Advanced Date Range Picker */}
        <div className="bg-white p-1.5 rounded-[20px] shadow-sm border border-slate-100 flex items-center relative z-20">
           <DateRangePicker date={dateRange} setDate={setDateRange} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents.toString()} 
          badge={`${stats.activeStudents} Active`} 
          badgeColor="green"
          icon={Users} 
          onClick={() => handleCardClick('STUDENTS')}
          viewTarget="STUDENTS"
        />
        <StatCard 
          title="Total Staff" 
          value={stats.totalStaff.toString()} 
          badge="Active" 
          badgeColor="green"
          icon={GraduationCap} 
          onClick={() => handleCardClick('HR')}
          viewTarget="HR"
        />
        <StatCard 
          title="Pending Fees" 
          value={`${(stats.totalFeesPending / 1000000).toFixed(1)}M`} 
          badge="MMK" 
          badgeColor="red"
          icon={DollarSign} 
          onClick={() => handleCardClick('FINANCE_UNPAID')}
          viewTarget="FINANCE_UNPAID"
        />
        <StatCard 
          title="Total Expenses" 
          value={`${(stats.totalExpenses / 1000000).toFixed(1)}M`} 
          badge="Action Req" 
          badgeColor="red"
          icon={AlertCircle} 
          onClick={() => handleCardClick('FINANCE_EXPENSES')}
          viewTarget="FINANCE_EXPENSES"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Chart - Full Week */}
        <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Overview (Full Week)</h3>
            <select className="bg-slate-50 border-none text-slate-800 text-sm font-semibold px-4 py-2 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer hover:bg-slate-100 transition-colors">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 700, fontSize: '13px' }}
                  labelStyle={{ color: '#475569', fontWeight: 600, fontSize: '12px' }}
                />
                <Bar 
                  dataKey="present" 
                  fill={BRAND_PURPLE} 
                  radius={[8, 8, 0, 0]} 
                  name="Present" 
                  barSize={40} 
                />
                <Bar 
                  dataKey="absent" 
                  fill="#ef4444" 
                  radius={[8, 8, 0, 0]} 
                  name="Absent" 
                  barSize={40} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart with Zoom */}
        <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex flex-col">
           <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Revenue</h3>
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
                <button
                  onClick={handleZoomIn}
                  disabled={revenueZoom.endIndex - revenueZoom.startIndex <= 2}
                  className="p-1.5 rounded hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom In"
                >
                  <ZoomIn size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={handleZoomOut}
                  disabled={revenueZoom.endIndex - revenueZoom.startIndex >= dataRevenue.length - 1}
                  className="p-1.5 rounded hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} className="text-slate-600" />
                </button>
                {(revenueZoom.startIndex > 0 || revenueZoom.endIndex < dataRevenue.length - 1) && (
                  <button
                    onClick={handleResetZoom}
                    className="px-2 py-1 text-xs font-bold text-slate-600 hover:bg-white rounded transition-colors"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleCardClick('FINANCE')}
                className="text-brand-700 hover:bg-brand-50 p-2 rounded-xl transition-colors"
                title="View Details"
              >
              <MoreHorizontal size={20} />
            </button>
            </div>
           </div>
           
           <div className="flex-1 min-h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={zoomedRevenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_PURPLE} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={BRAND_PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} 
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                   formatter={(value: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value)}
                   contentStyle={{ 
                     borderRadius: '16px', 
                     border: 'none', 
                     boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                     backgroundColor: '#ffffff',
                     color: '#0f172a'
                   }}
                   itemStyle={{ color: BRAND_PURPLE, fontWeight: 700, fontSize: '13px' }}
                   labelStyle={{ color: '#475569', fontWeight: 600, fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke={BRAND_PURPLE} 
                  fillOpacity={1} 
                  fill="url(#colorAmt)" 
                  strokeWidth={3} 
                />
                {/* Brush for zoom control */}
                {zoomedRevenueData.length < dataRevenue.length && (
                  <Brush 
                    dataKey="name" 
                    height={30} 
                    stroke={BRAND_PURPLE}
                    fill="#f8fafc"
                    onChange={(e) => {
                      if (e && typeof e === 'object' && 'startIndex' in e && 'endIndex' in e) {
                        setRevenueZoom({
                          startIndex: e.startIndex || 0,
                          endIndex: e.endIndex || dataRevenue.length - 1
                        });
                      }
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
           </div>

           {/* Zoom Info */}
           {zoomedRevenueData.length < dataRevenue.length && (
             <div className="mt-3 text-xs text-slate-500 text-center">
               Showing {zoomedRevenueData.length} of {dataRevenue.length} months
             </div>
           )}

           {/* Goal Card Overlay / Footer */}
           <div className="mt-6 flex justify-between items-center p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl relative">
              <div className="flex items-center space-x-4">
                 <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-700">
                    <DollarSign size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-xs text-indigo-900 font-bold uppercase tracking-wide">Monthly Goal</p>
                    <p className="text-base font-bold text-indigo-950">85% Reached</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
