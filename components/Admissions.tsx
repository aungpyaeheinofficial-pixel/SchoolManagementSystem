import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, 
  Upload, Camera, Save, FileText, Calendar, User, 
  MapPin, Phone, GraduationCap, Info 
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const STEPS = [
  { id: 1, label: 'Academic', labelMm: 'ပညာရေး' },
  { id: 2, label: 'Personal', labelMm: 'ကိုယ်ရေးအချက်အလက်' },
  { id: 3, label: 'Family & Contact', labelMm: 'မိသားစုနှင့်ဆက်သွယ်ရန်' },
  { id: 4, label: 'Documents', labelMm: 'စာရွက်စာတမ်း' }
];

const GRADES_LIST = [
  { id: 'kg', label: 'KG (သူငယ်တန်း)', fee: 30000 },
  { id: 'g1', label: 'Grade 1 (ပထမတန်း)', fee: 35000 },
  { id: 'g2', label: 'Grade 2 (ဒုတိယတန်း)', fee: 35000 },
  { id: 'g3', label: 'Grade 3 (တတိယတန်း)', fee: 35000 },
  { id: 'g4', label: 'Grade 4 (စတုတ္ထတန်း)', fee: 40000 },
  { id: 'g5', label: 'Grade 5 (ပဉ္စမတန်း)', fee: 40000 },
  { id: 'g6', label: 'Grade 6 (ဆဋ္ဌမတန်း)', fee: 45000 },
  { id: 'g7', label: 'Grade 7 (သတ္တမတန်း)', fee: 45000 },
  { id: 'g8', label: 'Grade 8 (အဋ္ဌမတန်း)', fee: 45000 },
  { id: 'g9', label: 'Grade 9 (နဝမတန်း)', fee: 50000 },
  { id: 'g10', label: 'Grade 10 (ဒသမတန်း - Old Curriculum)', fee: 50000 },
  { id: 'g11', label: 'Grade 11 (ဧကာဒသမတန်း)', fee: 55000 },
  { id: 'g12', label: 'Grade 12 (ဒွါဒသမတန်း)', fee: 60000 },
];

import type { Student } from '../types';

interface AdmissionsProps {
  onSubmitStudent?: (student: Student) => void;
  onClose?: () => void;
}

export const Admissions: React.FC<AdmissionsProps> = ({ onSubmitStudent, onClose }) => {
  const { addStudent } = useData();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Photo Preview State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Academic
    academicYear: '2024-2025',
    admissionNo: 'ADM-25-001', // Auto-generated simulation
    grade: '',
    section: '',

    // Step 2: Personal
    nameEn: '',
    nameMm: '',
    nrc: '',
    dob: '',
    gender: 'Male',
    bloodGroup: '',
    nationality: 'Myanmar',
    religion: 'Buddhism',
    
    // Step 3: Contact & Family
    phone: '',
    address: '',
    fatherName: '',
    fatherPhone: '',
    fatherJob: '',
    motherName: '',
    motherPhone: '',
    motherJob: '',

    // Step 4: Previous School
    prevSchool: '',
    prevGrade: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(c => c + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call (UI feedback) but still persist via DataContext/localStorage
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSubmitting(false);
    setSuccess(true);
    // Map form data to Student shape and persist
    const newStudent: Student = {
      id: formData.admissionNo || `ST-${Date.now()}`,
      nameEn: formData.nameEn || 'New Student',
      nameMm: formData.nameMm || '',
      fatherName: formData.fatherName || '',
      grade: formData.grade || '',
      nrc: formData.nrc || '',
      dob: formData.dob || '',
      status: 'Active',
      attendanceRate: 100,
      feesPending: 0,
      phone: formData.phone || formData.fatherPhone || ''
    };
    if (onSubmitStudent) onSubmitStudent(newStudent);
    else addStudent(newStudent);
    setTimeout(() => setSuccess(false), 3000);
    if (onClose) onClose();
  };

  // --- Render Steps ---

  const renderStep1 = () => {
    const selectedGradeInfo = GRADES_LIST.find(g => g.label === formData.grade);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <GraduationCap className="text-brand-600" size={20} />
            Academic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Academic Year <span className="font-burmese font-normal text-slate-400 text-xs ml-1">(ပညာသင်နှစ်)</span></label>
              <select 
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all"
              >
                <option>2024-2025</option>
                <option>2025-2026</option>
              </select>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Admission Number <span className="text-xs text-brand-600 font-normal bg-brand-50 px-2 py-0.5 rounded-full ml-2">Auto-Generated</span></label>
               <input 
                  type="text" 
                  readOnly
                  value={formData.admissionNo}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono"
               />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Grade / Class <span className="font-burmese font-normal text-slate-400 text-xs ml-1">(အတန်း)</span></label>
              <select 
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all"
              >
                <option value="">Select Grade</option>
                {GRADES_LIST.map((grade) => (
                  <option key={grade.id} value={grade.label}>
                    {grade.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Section <span className="font-burmese font-normal text-slate-400 text-xs ml-1">(အခန်း)</span></label>
               <select 
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                disabled={!formData.grade}
                className={`w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 outline-none transition-all ${
                  !formData.grade ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="">Select Section</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
              </select>
            </div>
          </div>
          
          {selectedGradeInfo && (
            <div className="mt-6 flex items-start gap-3 p-4 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-100 animate-fade-in">
               <div className="p-1 bg-white rounded-full text-indigo-600 shadow-sm mt-0.5">
                 <Info size={16} />
               </div>
               <div>
                  <p className="text-sm font-bold text-indigo-900">Tuition Fee Info</p>
                  <p className="text-sm opacity-90 mt-1">
                     Monthly fee for <span className="font-bold">{selectedGradeInfo.label}</span> is <span className="font-bold text-lg ml-1 font-mono">{selectedGradeInfo.fee.toLocaleString()} MMK</span>.
                  </p>
               </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-8 animate-fade-in">
       {/* Photo Upload Section */}
       <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
           <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                 {photoPreview ? (
                   <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                 ) : (
                   <User size={48} className="text-slate-400" />
                 )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 bg-brand-600 rounded-full text-white shadow-lg cursor-pointer hover:bg-brand-700 transition-colors">
                 <Camera size={16} />
                 <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
           </div>
           <p className="mt-3 text-sm text-slate-500 font-medium">Student Photo</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Full Name (English)</label>
             <input type="text" name="nameEn" value={formData.nameEn} onChange={handleInputChange} className="input-field w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600" placeholder="e.g. Mg Aung Kyaw" />
          </div>
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Name (Myanmar)</label>
             <input type="text" name="nameMm" value={formData.nameMm} onChange={handleInputChange} className="input-field w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-burmese leading-loose" placeholder="မောင်အောင်ကျော်" />
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Date of Birth</label>
             <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="input-field w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 text-slate-500" />
          </div>
          
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">NRC / ID Number</label>
             <input type="text" name="nrc" value={formData.nrc} onChange={handleInputChange} className="input-field w-full px-5 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600" placeholder="12/KaMaYa(N)000000" />
          </div>

           <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Gender</label>
            <div className="flex gap-4 mt-1">
               {['Male', 'Female'].map(g => (
                 <label key={g} className={`flex-1 py-3 px-4 rounded-xl border cursor-pointer flex items-center justify-center gap-2 transition-all ${formData.gender === g ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                    <input type="radio" name="gender" value={g} checked={formData.gender === g} onChange={handleInputChange} className="hidden" />
                    <span className="font-bold text-sm">{g}</span>
                 </label>
               ))}
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Blood Group</label>
             <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600">
                <option value="">Select...</option>
                <option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
             </select>
          </div>

           <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Nationality</label>
             <select name="nationality" value={formData.nationality} onChange={handleInputChange} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600">
                <option>Myanmar</option>
                <option>Foreigner</option>
             </select>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Religion</label>
             <select name="religion" value={formData.religion} onChange={handleInputChange} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600">
                <option>Buddhism</option>
                <option>Christianity</option>
                <option>Islam</option>
                <option>Hinduism</option>
             </select>
          </div>
       </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 animate-fade-in">
       {/* Primary Contact */}
       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <MapPin className="text-brand-600" size={20} />
            Address & Contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Primary Phone (Required)</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600" placeholder="09-xxxxxxxxx" />
                </div>
             </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700">Residential Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600" placeholder="House No, Street, Township..." />
             </div>
          </div>
       </div>

       {/* Parent Info Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Father */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Father's Information</h4>
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">Name</label>
                   <input type="text" name="fatherName" value={formData.fatherName} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600" placeholder="U ..." />
                </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">Phone</label>
                   <input type="text" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600" />
                </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">Occupation</label>
                   <input type="text" name="fatherJob" value={formData.fatherJob} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600" />
                </div>
             </div>
          </div>

          {/* Mother */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Mother's Information</h4>
             <div className="space-y-4">
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">Name</label>
                   <input type="text" name="motherName" value={formData.motherName} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600" placeholder="Daw ..." />
                </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">Phone</label>
                   <input type="text" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600" />
                </div>
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500">Occupation</label>
                   <input type="text" name="motherJob" value={formData.motherJob} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600" />
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 animate-fade-in">
       {/* Previous School */}
       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
           <h3 className="font-bold text-slate-800 mb-4">Previous Education History</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Previous School Name</label>
                 <input type="text" name="prevSchool" value={formData.prevSchool} onChange={handleInputChange} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600" placeholder="e.g. B.E.H.S (1) Dagon" />
              </div>
               <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700">Previous Grade Passed</label>
                 <input type="text" name="prevGrade" value={formData.prevGrade} onChange={handleInputChange} className="w-full px-5 py-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600" placeholder="e.g. Grade 9" />
              </div>
           </div>
       </div>

       {/* Documents */}
       <div>
          <h3 className="font-bold text-slate-800 mb-4">Required Documents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {['Birth Certificate', 'Transfer Certificate (TC)', 'Previous Report Card', 'Medical Record'].map((doc) => (
                <div key={doc} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-300 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                         <FileText size={20} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{doc}</span>
                   </div>
                   <button type="button" className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100">
                      Upload
                   </button>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
       {/* Header */}
       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">New Admission</h2>
            <p className="text-slate-500 font-burmese mt-1 leading-loose">ကျောင်းအပ်လက်ခံပုံစံ | Enrollment Wizard</p>
          </div>
          <div className="hidden md:block">
             <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">{formData.admissionNo}</span>
          </div>
       </div>

       {/* Success Message */}
       {success && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center text-green-700 animate-fade-in shadow-sm">
            <CheckCircle2 className="mr-3" size={24} />
            <div>
               <p className="font-bold">Success!</p>
               <p className="text-sm">Student application submitted successfully.</p>
            </div>
          </div>
        )}

       {/* Stepper */}
       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between relative">
             {/* Connector Line */}
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-10" />
             
             {STEPS.map((step) => {
               const isActive = step.id === currentStep;
               const isCompleted = step.id < currentStep;

               return (
                 <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4 
                        ${isActive ? 'bg-brand-600 text-white border-brand-100' : 
                          isCompleted ? 'bg-green-500 text-white border-green-100' : 'bg-slate-100 text-slate-400 border-white'}`}
                    >
                       {isCompleted ? <CheckCircle2 size={20} /> : step.id}
                    </div>
                    <div className="text-center hidden md:block">
                       <p className={`text-xs font-bold ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                       <p className="text-[10px] text-slate-400 font-burmese leading-loose">{step.labelMm}</p>
                    </div>
                 </div>
               )
             })}
          </div>
       </div>

       {/* Form Content */}
       <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 min-h-[500px]">
          <form onSubmit={handleSubmit}>
             {currentStep === 1 && renderStep1()}
             {currentStep === 2 && renderStep2()}
             {currentStep === 3 && renderStep3()}
             {currentStep === 4 && renderStep4()}
          </form>
       </div>

       {/* Navigation Buttons (sticky so it behaves correctly inside modals and on mobile) */}
       <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-3 sm:p-4 z-40">
          <div className="max-w-4xl mx-auto flex justify-between items-center gap-3">
             <button 
               onClick={prevStep}
               disabled={currentStep === 1}
               className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-colors ${currentStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                <ChevronLeft size={20} /> Back
             </button>
             
             <div className="flex items-center gap-3">
                <button type="button" className="hidden sm:flex items-center gap-2 px-4 sm:px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">
                   <Save size={18} /> Save Draft
                </button>
                
                {currentStep < 4 ? (
                   <button 
                     onClick={nextStep}
                     className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all active:scale-95"
                   >
                      Next Step <ChevronRight size={20} />
                   </button>
                ) : (
                   <button 
                     onClick={handleSubmit}
                     disabled={isSubmitting}
                     className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all active:scale-95 disabled:bg-slate-400"
                   >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'} <CheckCircle2 size={20} />
                   </button>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};