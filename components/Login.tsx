import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Eye, EyeOff, Lock, Mail, User, 
  ArrowRight, BookOpen, Users, Award,
  Shield, ChevronDown
} from 'lucide-react';

interface LoginProps {
  onLogin: (user: { email: string; role: string; name: string }) => void;
}

type UserRole = 'admin' | 'teacher' | 'student';

const DEMO_USERS = {
  admin: { email: 'admin@pnnd.edu.mm', password: 'admin123', name: 'U Kyaw Zaw', role: 'admin' },
  teacher: { email: 'teacher@pnnd.edu.mm', password: 'teacher123', name: 'Daw Aye Aye', role: 'teacher' },
  student: { email: 'student@pnnd.edu.mm', password: 'student123', name: 'Mg Aung Ko', role: 'student' },
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Floating animation state
  const [floatingIndex, setFloatingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingIndex(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-fill demo credentials when role changes
  useEffect(() => {
    const user = DEMO_USERS[selectedRole];
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const user = DEMO_USERS[selectedRole];
    if (email === user.email && password === user.password) {
      if (rememberMe) {
        localStorage.setItem('pnsp_remembered_user', JSON.stringify({ email, role: selectedRole }));
      }
      onLogin({ email, role: user.role, name: user.name });
    } else {
      setError('Invalid email or password. Please try again.');
    }
    
    setIsLoading(false);
  };

  const roleConfig = {
    admin: { 
      icon: Shield, 
      label: 'Administrator', 
      labelMm: 'စီမံခန့်ခွဲသူ',
      color: 'from-violet-600 to-purple-600',
      bgColor: 'bg-violet-100',
      textColor: 'text-violet-700'
    },
    teacher: { 
      icon: BookOpen, 
      label: 'Teacher', 
      labelMm: 'ဆရာ/ဆရာမ',
      color: 'from-emerald-600 to-teal-600',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-700'
    },
    student: { 
      icon: GraduationCap, 
      label: 'Student', 
      labelMm: 'ကျောင်းသား/သူ',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
  };

  const currentRole = roleConfig[selectedRole];
  const RoleIcon = currentRole.icon;

  const floatingItems = [
    { icon: BookOpen, text: 'Learn', delay: '0s' },
    { icon: Users, text: 'Connect', delay: '1s' },
    { icon: Award, text: 'Achieve', delay: '2s' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className={`hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br ${currentRole.color} relative overflow-hidden`}>
        {/* Animated Background Patterns */}
        <div className="absolute inset-0">
          {/* Large circles */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          {/* Floating decorative shapes */}
          <div className="absolute top-20 right-20 w-4 h-4 bg-white/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute top-40 left-1/4 w-3 h-3 bg-white/40 rounded-full animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-white/20 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full px-12 xl:px-20">
          {/* Logo and School Name */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl mb-6 shadow-2xl border border-white/30">
              <GraduationCap size={48} className="text-white" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-3 tracking-tight">
              Pyin Nyar Nan Daw
            </h1>
            <p className="text-2xl text-white/80 font-burmese leading-relaxed">
              ပညာနန်းတော်
            </p>
          </div>

          {/* Floating Feature Cards */}
          <div className="flex gap-6 mb-12">
            {floatingItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = floatingIndex === index;
              return (
                <div 
                  key={index}
                  className={`flex flex-col items-center transition-all duration-700 ${
                    isActive ? 'transform -translate-y-4 scale-110' : 'opacity-70'
                  }`}
                  style={{ transitionDelay: item.delay }}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 ${
                    isActive ? 'bg-white text-violet-600 shadow-2xl' : 'bg-white/20 text-white'
                  }`}>
                    <Icon size={28} />
                  </div>
                  <span className={`text-sm font-bold transition-all duration-500 ${
                    isActive ? 'text-white' : 'text-white/60'
                  }`}>
                    {item.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tagline */}
          <div className="text-center max-w-md">
            <p className="text-lg text-white/90 leading-relaxed">
              Empowering education through innovation. 
              <br />
              <span className="font-burmese text-white/70">
                ပညာရေးကို နည်းပညာဖြင့် အားဖြည့်ပေးခြင်း
              </span>
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-12 pt-12 border-t border-white/20">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">500+</p>
              <p className="text-sm text-white/70 mt-1">Students</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">50+</p>
              <p className="text-sm text-white/70 mt-1">Teachers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">15+</p>
              <p className="text-sm text-white/70 mt-1">Years</p>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full">
            <path 
              d="M0,64 C480,120 960,0 1440,64 L1440,120 L0,120 Z" 
              fill="white" 
              fillOpacity="0.1"
            />
          </svg>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${currentRole.color} rounded-2xl mb-4 shadow-lg`}>
              <GraduationCap size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Pyin Nyar Nan Daw</h1>
            <p className="text-slate-500 font-burmese">ပညာနန်းတော်</p>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              Welcome Back! 👋
            </h2>
            <p className="text-slate-500">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-600 mb-2">
              Login as
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${
                  showRoleDropdown 
                    ? 'border-brand-500 bg-brand-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentRole.bgColor}`}>
                    <RoleIcon size={20} className={currentRole.textColor} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{currentRole.label}</p>
                    <p className="text-xs text-slate-500 font-burmese">{currentRole.labelMm}</p>
                  </div>
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${showRoleDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {showRoleDropdown && (
                <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    const isSelected = role === selectedRole;
                    
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSelectedRole(role);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                          isSelected ? 'bg-brand-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor}`}>
                          <Icon size={20} className={config.textColor} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-bold text-slate-800">{config.label}</p>
                          <p className="text-xs text-slate-500 font-burmese">{config.labelMm}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white border-2 border-slate-200 rounded-2xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                    rememberMe 
                      ? 'bg-brand-600 border-brand-600' 
                      : 'border-slate-300 group-hover:border-slate-400'
                  }`}>
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-600 font-medium">Remember me</span>
              </label>
              <button type="button" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium flex items-center gap-2 animate-shake">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r ${currentRole.color} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              © Powered by A7 System All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

