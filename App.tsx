import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { Admissions } from './components/Admissions';
import { Finance } from './components/Finance';
import { FeeStructures } from './components/FeeStructures';
import { PaymentEntry } from './components/PaymentEntry';
import { UnpaidList } from './components/UnpaidList';
import { ExpenseManagement } from './components/ExpenseManagement';
import { HR } from './components/HR';
import { Attendance } from './components/Attendance';
import { StaffAttendance } from './components/StaffAttendance';
import { AcademicClasses } from './components/AcademicClasses';
import { AcademicSubjects } from './components/AcademicSubjects';
import { AcademicTimetable } from './components/AcademicTimetable';
import { ExamManagement } from './components/ExamManagement';
import { ExamMarkEntry } from './components/ExamMarkEntry';
import { ExamReportCards } from './components/ExamReportCards';
import { ExamAnalytics } from './components/ExamAnalytics';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { DataProvider, useData } from './contexts/DataContext';
import { ViewState } from './types';
import { Menu, LogOut, User, Bell, ChevronDown } from 'lucide-react';
import { DataService } from './services/dataService';
import { canAccessView, normalizeRole } from './utils/rbac';

interface AuthUser {
  email: string;
  role: string;
  name: string;
}

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get data from context
  const { students, setStudents, timetable, setTimetable } = useData();

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pnsp_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('pnsp_current_user');
      }
    }
  }, []);

  // If backend is configured, enable background auto-sync once per app session.
  useEffect(() => {
    DataService.startAutoSync();
  }, []);

  const getDefaultViewForRole = (roleRaw: string | null | undefined): ViewState => {
    const role = normalizeRole(roleRaw);
    if (role === 'admin') return 'DASHBOARD';
    if (role === 'teacher') return 'ATTENDANCE';
    if (role === 'accountant') return 'FINANCE';
    return 'DASHBOARD';
  };

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('pnsp_current_user', JSON.stringify(user));

    // Redirect to first allowed view for this role
    const nextView = canAccessView(user.role, currentView)
      ? currentView
      : getDefaultViewForRole(user.role);
    setCurrentView(nextView);

    // Backend sync flow:
    // - Pull server dataset
    // - If server is empty (fresh DB), push current local dataset to seed server tables
    DataService.pullFromServer()
      .then(({ isEmpty }) => {
        if (isEmpty) {
          return DataService.pushToServer().catch(() => undefined);
        }
        return undefined;
      })
      .catch(() => {
        // silent; app still works offline/local-first
      });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('DASHBOARD');
    localStorage.removeItem('pnsp_current_user');
    setShowUserMenu(false);
  };

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Enforce role-based access: if current view not allowed, snap to default
  const effectiveRole = currentUser?.role || 'teacher';
  const allowedView = canAccessView(effectiveRole, currentView);
  useEffect(() => {
    if (!canAccessView(effectiveRole, currentView)) {
      setCurrentView(getDefaultViewForRole(effectiveRole));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRole, currentView]);
  const viewToRender = canAccessView(effectiveRole, currentView)
    ? currentView
    : getDefaultViewForRole(effectiveRole);

  const renderContent = () => {
    switch (viewToRender) {
      case 'DASHBOARD':
        return <Dashboard onNavigate={setCurrentView} />;
      case 'STUDENTS':
        return (
          <StudentList 
            onNavigate={setCurrentView} 
            students={students} 
            setStudents={setStudents} 
          />
        );
      case 'ADMISSIONS':
        return (
          <StudentList 
            onNavigate={setCurrentView} 
            students={students} 
            setStudents={setStudents} 
          />
        );
      case 'ATTENDANCE':
        return <Attendance />;
      
      // Finance Routes
      case 'FINANCE':
        return <Finance />;
      case 'FINANCE_FEES':
        return <FeeStructures />;
      case 'FINANCE_PAYMENTS':
        return <PaymentEntry />;
      case 'FINANCE_UNPAID':
        return <UnpaidList onNavigate={setCurrentView} />;
      case 'FINANCE_EXPENSES':
        return <ExpenseManagement />;
        
      case 'HR':
        return <HR />;
      case 'HR_ATTENDANCE':
        return <StaffAttendance />;
      
      // Academic Module Routes
      case 'ACADEMIC_CLASSES':
        return <AcademicClasses />;
      case 'ACADEMIC_SUBJECTS':
        return <AcademicSubjects />;
      case 'ACADEMIC_TIMETABLE':
        return (
          <AcademicTimetable 
            timetableData={timetable} 
            onUpdate={setTimetable} 
          />
        );

      // Exam Module Routes
      case 'EXAM_MANAGEMENT':
        return <ExamManagement />;
      case 'EXAM_MARKS_ENTRY':
        return <ExamMarkEntry />;
      case 'EXAM_REPORT_CARDS':
        return <ExamReportCards />;
      case 'EXAM_ANALYTICS':
        return <ExamAnalytics />;

      // Reports Module Routes
      case 'REPORTS_STUDENTS':
        return <Reports initialType="students" />;
      case 'REPORTS_FINANCE':
        return <Reports initialType="finance" />;
      case 'REPORTS_ATTENDANCE':
        return <Reports initialType="attendance" />;
      case 'REPORTS_ACADEMIC':
        return <Reports initialType="academic" />;

      // Settings
      case 'SETTINGS':
        return <Settings />;

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
             <h3 className="text-xl font-medium">Coming Soon</h3>
             <p>This module is under development.</p>
          </div>
        );
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (normalizeRole(role)) {
      case 'admin': return 'bg-violet-100 text-violet-700';
      case 'teacher': return 'bg-emerald-100 text-emerald-700';
      case 'accountant': return 'bg-amber-100 text-amber-700';
      case 'student': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (normalizeRole(role)) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'accountant': return 'Accountant';
      case 'student': return 'Student';
      default: return role;
    }
  };

  return (
    <div className="flex min-h-screen font-sans text-slate-900">
      
      {/* Navigation */}
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        role={currentUser?.role || 'teacher'}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f3f4f6]">
        
        {/* Topbar with Menu Button and User Info */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 md:px-6 lg:px-8 justify-between z-10 shadow-sm sticky top-0">
           <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileOpen(!isMobileOpen);
                  } else {
                    setIsSidebarCollapsed(!isSidebarCollapsed);
                  }
                }}
                className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors hover:text-brand-600"
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
              <span className="font-bold text-brand-600 hidden sm:inline">PNND System</span>
              <span className="font-bold text-brand-600 sm:hidden">Menu</span>
           </div>

           {/* Right side - User info */}
           <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-bold text-slate-900 leading-tight">{currentUser?.name}</p>
                    <p className="text-xs text-slate-700 font-medium">{getRoleLabel(currentUser?.role || '')}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-600 hidden md:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setShowUserMenu(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-40 overflow-hidden animate-fade-in">
                      {/* User Info */}
                      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {currentUser?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{currentUser?.name}</p>
                            <p className="text-xs text-slate-700 font-medium">{currentUser?.email}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getRoleBadgeColor(currentUser?.role || '')}`}>
                              {getRoleLabel(currentUser?.role || '')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setCurrentView('SETTINGS');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <User size={18} className="text-slate-600" />
                          <span className="text-sm font-medium">My Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <LogOut size={18} />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
           </div>
        </header>

        {/* Scrollable Content */}
        <div data-app-scroll-container="true" className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto pb-10">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
