import React, { useState, useRef, useEffect } from 'react';
import {
  Settings as SettingsIcon, School, Calendar, Bell, Shield, Database,
  Palette, Globe, Save, X, Check, Edit3, Upload, Download, Trash2,
  Plus, Users, GraduationCap, CreditCard, Clock, Mail, Phone,
  MapPin, FileText, AlertTriangle, RefreshCw, Lock, Eye, EyeOff
} from 'lucide-react';

type SettingsTab = 'school' | 'academic' | 'notifications' | 'grading' | 'users' | 'backup' | 'appearance';

interface SchoolInfo {
  nameEn: string;
  nameMm: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo: string;
  principalName: string;
  establishedYear: string;
  registrationNo: string;
}

interface AcademicSettings {
  currentAcademicYear: string;
  termSystem: 'semester' | 'trimester' | 'quarter';
  startMonth: string;
  workingDays: string[];
  classStartTime: string;
  classEndTime: string;
  periodDuration: number;
  breakDuration: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  feeReminders: boolean;
  attendanceAlerts: boolean;
  examNotifications: boolean;
  reminderDaysBefore: number;
}

interface GradingScale {
  id: string;
  grade: string;
  minScore: number;
  maxScore: number;
  gpa: number;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Teacher' | 'Accountant' | 'Staff';
  status: 'Active' | 'Inactive';
  lastLogin: string;
  password?: string;
}

interface AppearanceSettings {
  theme: 'light' | 'dark';
  primaryColor: string;
  language: string;
  dateFormat: string;
  currency: string;
}

// LocalStorage keys
const STORAGE_KEYS = {
  schoolInfo: 'pnsp_school_info',
  academicSettings: 'pnsp_academic_settings',
  notificationSettings: 'pnsp_notification_settings',
  gradingScale: 'pnsp_grading_scale',
  users: 'pnsp_users',
  appearance: 'pnsp_appearance',
};

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('school');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // Modal States
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradingScale | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // School Info State
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.schoolInfo);
    return saved ? JSON.parse(saved) : {
      nameEn: 'Pyin Nyar Nan Daw Private School',
      nameMm: 'ပညာနန်းတော် ကိုယ်ပိုင်အထက်တန်းကျောင်း',
      address: 'No. 123, Pyay Road, Kamayut Township, Yangon, Myanmar',
      phone: '09-123456789',
      email: 'info@pnnd.edu.mm',
      website: 'www.pnnd.edu.mm',
      logo: '',
      principalName: 'U Kyaw Kyaw',
      establishedYear: '2010',
      registrationNo: 'MOE-2010-12345'
    };
  });

  // Academic Settings State
  const [academicSettings, setAcademicSettings] = useState<AcademicSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.academicSettings);
    return saved ? JSON.parse(saved) : {
      currentAcademicYear: '2024-2025',
      termSystem: 'semester',
      startMonth: 'June',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      classStartTime: '08:00',
      classEndTime: '15:30',
      periodDuration: 45,
      breakDuration: 15
    };
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.notificationSettings);
    return saved ? JSON.parse(saved) : {
      emailNotifications: true,
      smsNotifications: true,
      feeReminders: true,
      attendanceAlerts: true,
      examNotifications: true,
      reminderDaysBefore: 7
    };
  });

  // Grading Scale State
  const [gradingScale, setGradingScale] = useState<GradingScale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.gradingScale);
    return saved ? JSON.parse(saved) : [
      { id: '1', grade: 'A+', minScore: 90, maxScore: 100, gpa: 4.0, description: 'Excellent' },
      { id: '2', grade: 'A', minScore: 80, maxScore: 89, gpa: 3.7, description: 'Very Good' },
      { id: '3', grade: 'B+', minScore: 70, maxScore: 79, gpa: 3.3, description: 'Good' },
      { id: '4', grade: 'B', minScore: 60, maxScore: 69, gpa: 3.0, description: 'Above Average' },
      { id: '5', grade: 'C+', minScore: 50, maxScore: 59, gpa: 2.3, description: 'Average' },
      { id: '6', grade: 'C', minScore: 40, maxScore: 49, gpa: 2.0, description: 'Pass' },
      { id: '7', grade: 'F', minScore: 0, maxScore: 39, gpa: 0.0, description: 'Fail' },
    ];
  });

  // Users State
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.users);
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'U Kyaw Kyaw', email: 'admin@pnnd.edu.mm', role: 'Administrator', status: 'Active', lastLogin: '2 hours ago' },
      { id: '2', name: 'Daw Khin May', email: 'khimay@pnnd.edu.mm', role: 'Teacher', status: 'Active', lastLogin: '1 day ago' },
      { id: '3', name: 'U Myo Aung', email: 'myoaung@pnnd.edu.mm', role: 'Accountant', status: 'Active', lastLogin: '3 hours ago' },
    ];
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState<AppearanceSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.appearance);
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      primaryColor: '#7c3aed',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      currency: 'MMK'
    };
  });

  // Grade Form State
  const [gradeForm, setGradeForm] = useState<Partial<GradingScale>>({
    grade: '', minScore: 0, maxScore: 100, gpa: 0, description: ''
  });

  // User Form State
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '', email: '', role: 'Teacher', status: 'Active', password: ''
  });

  // Auto-save settings when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.appearance, JSON.stringify(appearance));
    // Apply theme
    document.documentElement.classList.toggle('dark', appearance.theme === 'dark');
  }, [appearance]);

  // Save all settings
  const handleSave = async () => {
    setIsSaving(true);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.schoolInfo, JSON.stringify(schoolInfo));
    localStorage.setItem(STORAGE_KEYS.academicSettings, JSON.stringify(academicSettings));
    localStorage.setItem(STORAGE_KEYS.notificationSettings, JSON.stringify(notificationSettings));
    localStorage.setItem(STORAGE_KEYS.gradingScale, JSON.stringify(gradingScale));
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.appearance, JSON.stringify(appearance));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Logo Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSchoolInfo({ ...schoolInfo, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Grading Scale Handlers
  const openGradeModal = (grade?: GradingScale) => {
    if (grade) {
      setEditingGrade(grade);
      setGradeForm(grade);
    } else {
      setEditingGrade(null);
      setGradeForm({ grade: '', minScore: 0, maxScore: 100, gpa: 0, description: '' });
    }
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = () => {
    if (!gradeForm.grade) return;
    
    if (editingGrade) {
      setGradingScale(prev => prev.map(g => 
        g.id === editingGrade.id ? { ...g, ...gradeForm } as GradingScale : g
      ));
    } else {
      const newGrade: GradingScale = {
        id: Date.now().toString(),
        grade: gradeForm.grade || '',
        minScore: gradeForm.minScore || 0,
        maxScore: gradeForm.maxScore || 100,
        gpa: gradeForm.gpa || 0,
        description: gradeForm.description || ''
      };
      setGradingScale(prev => [...prev, newGrade].sort((a, b) => b.minScore - a.minScore));
    }
    setIsGradeModalOpen(false);
  };

  const handleDeleteGrade = (id: string) => {
    if (confirm('Are you sure you want to delete this grade?')) {
      setGradingScale(prev => prev.filter(g => g.id !== id));
    }
  };

  // User Management Handlers
  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ ...user, password: '' });
    } else {
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'Teacher', status: 'Active', password: '' });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) return;
    
    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { ...u, ...userForm, lastLogin: u.lastLogin } as User : u
      ));
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: userForm.name || '',
        email: userForm.email || '',
        role: userForm.role as User['role'] || 'Teacher',
        status: userForm.status as User['status'] || 'Active',
        lastLogin: 'Never'
      };
      setUsers(prev => [...prev, newUser]);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } as User : u
    ));
  };

  // Backup Handlers
  const handleDownloadBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      schoolInfo,
      academicSettings,
      notificationSettings,
      gradingScale,
      users: users.map(u => ({ ...u, password: undefined })), // Don't export passwords
      appearance
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pnsp-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
        if (data.academicSettings) setAcademicSettings(data.academicSettings);
        if (data.notificationSettings) setNotificationSettings(data.notificationSettings);
        if (data.gradingScale) setGradingScale(data.gradingScale);
        if (data.users) setUsers(data.users);
        if (data.appearance) setAppearance(data.appearance);
        
        // Save to localStorage
        handleSave();
        alert('Backup restored successfully!');
      } catch (error) {
        alert('Error restoring backup. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (backupInputRef.current) {
      backupInputRef.current.value = '';
    }
  };

  const handleResetData = () => {
    if (resetConfirmText !== 'RESET') return;
    
    // Clear all localStorage
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    
    // Reset to defaults
    window.location.reload();
  };

  const tabs = [
    { id: 'school' as SettingsTab, label: 'School Profile', labelMm: 'ကျောင်းအချက်အလက်', icon: School },
    { id: 'academic' as SettingsTab, label: 'Academic', labelMm: 'ပညာရေး', icon: Calendar },
    { id: 'grading' as SettingsTab, label: 'Grading Scale', labelMm: 'အမှတ်စနစ်', icon: GraduationCap },
    { id: 'notifications' as SettingsTab, label: 'Notifications', labelMm: 'အသိပေးချက်', icon: Bell },
    { id: 'users' as SettingsTab, label: 'Users & Roles', labelMm: 'အသုံးပြုသူများ', icon: Users },
    { id: 'backup' as SettingsTab, label: 'Backup & Data', labelMm: 'အရန်သိမ်းခြင်း', icon: Database },
    { id: 'appearance' as SettingsTab, label: 'Appearance', labelMm: 'အသွင်အပြင်', icon: Palette },
  ];

  const renderSchoolProfile = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-brand-50 to-violet-50 rounded-2xl border border-brand-100">
        <div 
          className="w-24 h-24 bg-brand-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden"
          style={schoolInfo.logo ? { backgroundImage: `url(${schoolInfo.logo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!schoolInfo.logo && (schoolInfo.nameEn || schoolInfo.nameMm || '?').charAt(0)}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{schoolInfo.nameEn}</h3>
          <p className="text-brand-600 font-burmese font-semibold">{schoolInfo.nameMm}</p>
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={() => logoInputRef.current?.click()}
            className="mt-2 text-sm text-brand-600 font-bold flex items-center gap-1 hover:underline"
          >
            <Upload size={14} /> {schoolInfo.logo ? 'Change Logo' : 'Upload Logo'}
          </button>
          {schoolInfo.logo && (
            <button 
              onClick={() => setSchoolInfo({ ...schoolInfo, logo: '' })}
              className="ml-3 text-sm text-red-600 font-bold hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">School Name (English)</label>
            <input
              type="text"
              value={schoolInfo.nameEn}
              onChange={e => setSchoolInfo({ ...schoolInfo, nameEn: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">School Name (Myanmar)</label>
            <input
              type="text"
              value={schoolInfo.nameMm}
              onChange={e => setSchoolInfo({ ...schoolInfo, nameMm: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-burmese focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Principal Name</label>
            <input
              type="text"
              value={schoolInfo.principalName}
              onChange={e => setSchoolInfo({ ...schoolInfo, principalName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Registration No.</label>
            <input
              type="text"
              value={schoolInfo.registrationNo}
              onChange={e => setSchoolInfo({ ...schoolInfo, registrationNo: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
            <textarea
              rows={2}
              value={schoolInfo.address}
              onChange={e => setSchoolInfo({ ...schoolInfo, address: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
              <input
                type="tel"
                value={schoolInfo.phone}
                onChange={e => setSchoolInfo({ ...schoolInfo, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Established Year</label>
              <input
                type="text"
                value={schoolInfo.establishedYear}
                onChange={e => setSchoolInfo({ ...schoolInfo, establishedYear: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={schoolInfo.email}
              onChange={e => setSchoolInfo({ ...schoolInfo, email: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Website</label>
            <input
              type="url"
              value={schoolInfo.website}
              onChange={e => setSchoolInfo({ ...schoolInfo, website: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAcademicSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Current Academic Year</label>
            <select
              value={academicSettings.currentAcademicYear}
              onChange={e => setAcademicSettings({ ...academicSettings, currentAcademicYear: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Term System</label>
            <select
              value={academicSettings.termSystem}
              onChange={e => setAcademicSettings({ ...academicSettings, termSystem: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="semester">Semester (2 terms)</option>
              <option value="trimester">Trimester (3 terms)</option>
              <option value="quarter">Quarter (4 terms)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Academic Year Start Month</label>
            <select
              value={academicSettings.startMonth}
              onChange={e => setAcademicSettings({ ...academicSettings, startMonth: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Class Start Time</label>
              <input
                type="time"
                value={academicSettings.classStartTime}
                onChange={e => setAcademicSettings({ ...academicSettings, classStartTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Class End Time</label>
              <input
                type="time"
                value={academicSettings.classEndTime}
                onChange={e => setAcademicSettings({ ...academicSettings, classEndTime: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Period Duration (min)</label>
              <input
                type="number"
                value={academicSettings.periodDuration}
                onChange={e => setAcademicSettings({ ...academicSettings, periodDuration: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Break Duration (min)</label>
              <input
                type="number"
                value={academicSettings.breakDuration}
                onChange={e => setAcademicSettings({ ...academicSettings, breakDuration: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Working Days</label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const days = academicSettings.workingDays.includes(day)
                      ? academicSettings.workingDays.filter(d => d !== day)
                      : [...academicSettings.workingDays, day];
                    setAcademicSettings({ ...academicSettings, workingDays: days });
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    academicSettings.workingDays.includes(day)
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGradingScale = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Configure the grading scale used for student assessments.</p>
        <button 
          onClick={() => openGradeModal()}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-700"
        >
          <Plus size={16} /> Add Grade
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[760px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Grade</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Min Score</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Max Score</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">GPA</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Description</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {gradingScale.map((grade) => (
              <tr key={grade.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    grade.grade.startsWith('A') ? 'bg-green-100 text-green-700' :
                    grade.grade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                    grade.grade.startsWith('C') ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {grade.grade}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{grade.minScore}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">{grade.maxScore}</td>
                <td className="px-6 py-4 text-sm font-bold text-brand-600">{grade.gpa.toFixed(1)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{grade.description}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openGradeModal(grade)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteGrade(grade.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
          <div>
            <p className="font-bold text-amber-800 text-sm">Pass Mark Configuration</p>
            <p className="text-amber-700 text-sm mt-1">Students scoring below {gradingScale.find(g => g.grade === 'F')?.maxScore || 39} marks will be marked as "Fail".</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">Notification Channels</h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Mail size={20} /></div>
              <div>
                <p className="font-bold text-slate-800">Email Notifications</p>
                <p className="text-xs text-slate-500">Send notifications via email</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={e => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Phone size={20} /></div>
              <div>
                <p className="font-bold text-slate-800">SMS Notifications</p>
                <p className="text-xs text-slate-500">Send notifications via SMS</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={e => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">Notification Types</h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg"><CreditCard size={20} /></div>
              <div>
                <p className="font-bold text-slate-800">Fee Reminders</p>
                <p className="text-xs text-slate-500">Remind parents about pending fees</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.feeReminders}
                onChange={e => setNotificationSettings({ ...notificationSettings, feeReminders: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg"><Clock size={20} /></div>
              <div>
                <p className="font-bold text-slate-800">Attendance Alerts</p>
                <p className="text-xs text-slate-500">Alert parents about absence</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.attendanceAlerts}
                onChange={e => setNotificationSettings({ ...notificationSettings, attendanceAlerts: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><FileText size={20} /></div>
              <div>
                <p className="font-bold text-slate-800">Exam Notifications</p>
                <p className="text-xs text-slate-500">Notify about exams and results</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings.examNotifications}
                onChange={e => setNotificationSettings({ ...notificationSettings, examNotifications: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 rounded-xl">
        <label className="block text-sm font-bold text-slate-700 mb-2">Send Fee Reminders (days before due date)</label>
        <input
          type="number"
          value={notificationSettings.reminderDaysBefore}
          onChange={e => setNotificationSettings({ ...notificationSettings, reminderDaysBefore: parseInt(e.target.value) || 0 })}
          className="w-32 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Manage user accounts and their access levels.</p>
        <button 
          onClick={() => openUserModal()}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-brand-700"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: 'Administrator', color: 'red', desc: 'Full system access' },
          { role: 'Teacher', color: 'blue', desc: 'Class & grade management' },
          { role: 'Accountant', color: 'green', desc: 'Finance access only' },
        ].map(item => {
          const count = users.filter(u => u.role === item.role).length;
          return (
            <div key={item.role} className={`p-5 bg-${item.color}-50 border border-${item.color}-100 rounded-2xl`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 bg-${item.color}-100 text-${item.color}-600 rounded-lg`}>
                  <Users size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800">{item.role}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{count} <span className="text-sm font-normal text-slate-500">users</span></p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[860px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">User</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Last Login</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center font-bold">
                      {(user.name || user.email || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    user.role === 'Administrator' ? 'bg-red-100 text-red-700' :
                    user.role === 'Teacher' ? 'bg-blue-100 text-blue-700' :
                    user.role === 'Accountant' ? 'bg-green-100 text-green-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleUserStatus(user.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.status}
                  </button>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{user.lastLogin}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => openUserModal(user)}
                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );

  const renderBackup = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Download size={24} /></div>
            <div>
              <h3 className="font-bold text-slate-900">Backup Data</h3>
              <p className="text-sm text-slate-600">Download a complete backup of your data</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">Includes: School info, settings, users, grading scale</p>
          <button 
            onClick={handleDownloadBackup}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} /> Download Backup (.json)
          </button>
        </div>

        <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl"><Upload size={24} /></div>
            <div>
              <h3 className="font-bold text-slate-900">Restore Data</h3>
              <p className="text-sm text-slate-600">Restore from a previous backup file</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4">Supported format: .json backup file</p>
          <input
            type="file"
            ref={backupInputRef}
            onChange={handleRestoreBackup}
            accept=".json"
            className="hidden"
          />
          <button 
            onClick={() => backupInputRef.current?.click()}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} /> Upload Backup File
          </button>
        </div>
      </div>

      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-red-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-bold text-red-800 text-sm">Danger Zone</p>
            <p className="text-red-700 text-sm mt-1 mb-3">Permanently delete all settings and data. This action cannot be undone.</p>
            <button 
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
            >
              Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  appearance.theme === 'light' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-full h-16 bg-white border border-slate-200 rounded-lg mb-2"></div>
                <p className="font-bold text-sm text-slate-700">Light</p>
              </button>
              <button
                type="button"
                onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                className={`p-4 rounded-xl border-2 transition-all ${
                  appearance.theme === 'dark' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-full h-16 bg-slate-800 rounded-lg mb-2"></div>
                <p className="font-bold text-sm text-slate-700">Dark</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Primary Color</label>
            <div className="flex gap-2">
              {['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'].map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAppearance({ ...appearance, primaryColor: color })}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    appearance.primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
            <select
              value={appearance.language}
              onChange={e => setAppearance({ ...appearance, language: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="en">English</option>
              <option value="mm">မြန်မာ (Myanmar)</option>
              <option value="both">Both (Bilingual)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Date Format</label>
            <select
              value={appearance.dateFormat}
              onChange={e => setAppearance({ ...appearance, dateFormat: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Currency</label>
            <select
              value={appearance.currency}
              onChange={e => setAppearance({ ...appearance, currency: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="MMK">MMK - Myanmar Kyat</option>
              <option value="USD">USD - US Dollar</option>
              <option value="THB">THB - Thai Baht</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'school': return renderSchoolProfile();
      case 'academic': return renderAcademicSettings();
      case 'grading': return renderGradingScale();
      case 'notifications': return renderNotifications();
      case 'users': return renderUsers();
      case 'backup': return renderBackup();
      case 'appearance': return renderAppearance();
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h2>
          <p className="text-slate-700 font-burmese mt-2 leading-relaxed text-lg font-semibold">ဆက်တင်များ</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${
            saveSuccess 
              ? 'bg-green-500 text-white shadow-green-500/30' 
              : 'bg-brand-600 text-white shadow-brand-600/30 hover:bg-brand-700'
          }`}
        >
          {isSaving ? (
            <><RefreshCw size={18} className="animate-spin" /> Saving...</>
          ) : saveSuccess ? (
            <><Check size={18} /> Saved!</>
          ) : (
            <><Save size={18} /> Save Changes</>
          )}
        </button>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-50 lg:sticky lg:top-6">
            <nav className="space-y-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} />
                    <div>
                      <p className="font-bold text-sm">{tab.label}</p>
                      <p className={`text-[10px] font-burmese ${activeTab === tab.id ? 'opacity-80' : 'text-slate-400'}`}>
                        {tab.labelMm}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              {React.createElement(tabs.find(t => t.id === activeTab)?.icon || SettingsIcon, { size: 24, className: 'text-brand-600' })}
              <div>
                <h3 className="font-bold text-xl text-slate-900">{tabs.find(t => t.id === activeTab)?.label}</h3>
                <p className="text-sm text-slate-500 font-burmese">{tabs.find(t => t.id === activeTab)?.labelMm}</p>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Grade Modal */}
      {isGradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900">{editingGrade ? 'Edit Grade' : 'Add Grade'}</h3>
              <button onClick={() => setIsGradeModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg pn-modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Grade</label>
                  <input
                    type="text"
                    value={gradeForm.grade || ''}
                    onChange={e => setGradeForm({ ...gradeForm, grade: e.target.value })}
                    placeholder="e.g. A+"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">GPA</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gradeForm.gpa || 0}
                    onChange={e => setGradeForm({ ...gradeForm, gpa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Min Score</label>
                  <input
                    type="number"
                    value={gradeForm.minScore || 0}
                    onChange={e => setGradeForm({ ...gradeForm, minScore: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Max Score</label>
                  <input
                    type="number"
                    value={gradeForm.maxScore || 100}
                    onChange={e => setGradeForm({ ...gradeForm, maxScore: parseInt(e.target.value) || 100 })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <input
                  type="text"
                  value={gradeForm.description || ''}
                  onChange={e => setGradeForm({ ...gradeForm, description: e.target.value })}
                  placeholder="e.g. Excellent"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsGradeModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGrade}
                  className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                >
                  {editingGrade ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900">{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg pn-modal-close">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={userForm.name || ''}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={userForm.email || ''}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Role</label>
                <select
                  value={userForm.role || 'Teacher'}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value as User['role'] })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password || ''}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="flex-1 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700"
                >
                  {editingUser ? 'Update' : 'Add User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto pn-modal-panel pn-modal-compact">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Reset All Data?</h3>
              <p className="text-sm text-slate-600 mt-2">
                This will permanently delete all settings, users, and configurations. This action cannot be undone.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Type "RESET" to confirm</label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={e => setResetConfirmText(e.target.value)}
                  placeholder="RESET"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm text-center font-mono"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsResetConfirmOpen(false);
                    setResetConfirmText('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  disabled={resetConfirmText !== 'RESET'}
                  className={`flex-1 py-3 rounded-xl font-bold ${
                    resetConfirmText === 'RESET'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Reset Everything
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
