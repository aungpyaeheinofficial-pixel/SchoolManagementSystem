import React, { useMemo, useState, useEffect, useRef } from 'react';
import { GRADE_LEVELS_LIST } from '../constants';
import { ClassGroup, Room, Staff } from '../types';
import { 
  Users, LayoutGrid, DoorOpen, Plus, Search, Filter, 
  MoreHorizontal, PenSquare, Trash2, GraduationCap, 
  Building, Zap, Projector, Monitor, Beaker, CheckCircle2, X, BarChart3
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const AcademicClasses: React.FC = () => {
  const {
    classes,
    addClass,
    updateClass,
    deleteClass,
    rooms,
    addRoom,
    updateRoom,
    deleteRoom,
    staff,
  } = useData();
  
  // Modal States
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'classes' | 'rooms'>('classes');

  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [classFormData, setClassFormData] = useState<Partial<ClassGroup>>({
    name: '',
    gradeLevel: 'Grade 10',
    section: 'A',
    teacherId: '',
    teacherName: 'Unassigned',
    roomId: '',
    roomName: 'Unassigned',
    studentCount: 0,
    maxCapacity: 40
  });

  const [roomFormData, setRoomFormData] = useState<Partial<Room>>({
    number: '',
    building: '',
    type: 'Classroom',
    capacity: 40,
    isOccupied: false,
    facilities: [],
  });

  // Filters
  const [classSearch, setClassSearch] = useState('');
  const [classGradeFilter, setClassGradeFilter] = useState<'All' | string>('All');

  // Teacher workload (total classes & students)
  const teacherWorkload = useMemo(() => {
    const map = new Map<string, { name: string; classes: number; students: number }>();
    classes.forEach(cls => {
      const key = cls.teacherName || 'Unassigned';
      const entry = map.get(key) || { name: key, classes: 0, students: 0 };
      entry.classes += 1;
      entry.students += cls.studentCount ?? 0;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.students - a.students);
  }, [classes]);

  // Room utilization (capacity vs enrolled)
  const roomUtilization = useMemo(() => {
    return rooms.map(room => {
      const enrolled = classes
        .filter(c => c.roomId === room.id)
        .reduce((sum, c) => sum + (c.studentCount ?? 0), 0);
      const utilization = room.capacity ? Math.min(100, Math.round((enrolled / room.capacity) * 100)) : 0;
      return { room, enrolled, utilization };
    });
  }, [rooms, classes]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    const term = classSearch.toLowerCase();
    return classes.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(term) ||
        c.teacherName.toLowerCase().includes(term) ||
        c.roomName.toLowerCase().includes(term);
      const matchesGrade = classGradeFilter === 'All' || c.gradeLevel.includes(classGradeFilter);
      return matchesSearch && matchesGrade;
    });
  }, [classes, classSearch, classGradeFilter]);

  // Ref for modal overlay
  const modalOverlayRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when modal is open (both mobile and desktop)
  useEffect(() => {
    if (isAddClassOpen) {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      // Immediately scroll to top (multiple methods for cross-browser compatibility)
      window.scrollTo(0, 0);
      window.scrollTo(0, 0); // Call twice to ensure it works
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      
      // Lock body and html scroll immediately
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0px';
      document.body.style.width = '100%';
      document.body.classList.add('modal-open');
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('modal-open');
      
      // Ensure modal is visible after it renders
      const ensureVisible = () => {
        // Ensure viewport is at top
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        
        // If modal overlay exists, ensure it's at top of its scroll container
        if (modalOverlayRef.current) {
          modalOverlayRef.current.scrollTop = 0;
        }
      };
      
      // Call immediately and after a brief delay
      ensureVisible();
      const scrollCheck = setTimeout(ensureVisible, 50);
      const scrollCheck2 = setTimeout(ensureVisible, 100);
      
      return () => {
        clearTimeout(scrollCheck);
        clearTimeout(scrollCheck2);
        // Restore original styles
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.classList.remove('modal-open');
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.documentElement.classList.remove('modal-open');
        
        // Restore scroll position after styles are restored
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
          if (document.documentElement) document.documentElement.scrollTop = scrollY;
          if (document.body) document.body.scrollTop = scrollY;
        });
      };
    }
  }, [isAddClassOpen]);

  // --- Handlers ---
  const handleDeleteClass = (id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      deleteClass(id);
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name || !classFormData.gradeLevel || !classFormData.teacherId || !classFormData.roomId) {
      alert('Please fill in required fields (Class Name, Grade Level, Teacher, Room)');
      return;
    }

    if (editingClass) {
      updateClass(editingClass.id, {
        name: classFormData.name || editingClass.name,
        gradeLevel: classFormData.gradeLevel || editingClass.gradeLevel,
        section: classFormData.section || editingClass.section,
        teacherId: classFormData.teacherId || editingClass.teacherId,
        teacherName: classFormData.teacherName || editingClass.teacherName,
        roomId: classFormData.roomId || editingClass.roomId,
        roomName: classFormData.roomName || editingClass.roomName,
        studentCount: classFormData.studentCount ?? editingClass.studentCount,
        maxCapacity: classFormData.maxCapacity ?? editingClass.maxCapacity,
      });
    } else {
      const selectedTeacher = staff.find((t: Staff) => t.id === classFormData.teacherId);
      const selectedRoom = rooms.find((r: Room) => r.id === classFormData.roomId);
      
    const newClass: ClassGroup = {
        id: `CL-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        name: classFormData.name || 'New Grade',
        gradeLevel: classFormData.gradeLevel || 'Grade 10',
        section: classFormData.section || 'A',
        teacherId: classFormData.teacherId || '',
        teacherName: selectedTeacher?.name || 'Unassigned',
        roomId: classFormData.roomId || '',
        roomName: selectedRoom?.number || selectedRoom?.id || classFormData.roomName || 'Unassigned',
        studentCount: classFormData.studentCount ?? 0,
        maxCapacity: classFormData.maxCapacity ?? 40
      };
      addClass(newClass);
    }
    setIsAddClassOpen(false);
    setEditingClass(null);
    setClassFormData({
      name: '',
      gradeLevel: 'Grade 10',
      section: 'A',
      teacherId: '',
      teacherName: 'Unassigned',
      roomId: '',
      roomName: 'Unassigned',
      studentCount: 0,
      maxCapacity: 40
    });
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      deleteRoom(id);
    }
  };

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.number || !roomFormData.type) {
      alert('Please fill in required fields (Room Number, Type)');
      return;
    }

    const facilities =
      typeof (roomFormData as any).facilitiesText === 'string'
        ? String((roomFormData as any).facilitiesText)
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(roomFormData.facilities)
          ? roomFormData.facilities
          : [];

    if (editingRoom) {
      updateRoom(editingRoom.id, {
        number: roomFormData.number || editingRoom.number,
        building: roomFormData.building ?? editingRoom.building,
        type: (roomFormData.type as any) || editingRoom.type,
        capacity: roomFormData.capacity ?? editingRoom.capacity,
        isOccupied: roomFormData.isOccupied ?? editingRoom.isOccupied,
        facilities,
      });
    } else {
      const newRoom: Room = {
        id: `RM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
        number: roomFormData.number || '',
        building: roomFormData.building || '',
        type: (roomFormData.type as any) || 'Classroom',
        capacity: Number(roomFormData.capacity ?? 0),
        isOccupied: Boolean(roomFormData.isOccupied),
        facilities,
      };
      addRoom(newRoom);
    }

    setIsAddRoomOpen(false);
    setEditingRoom(null);
    setRoomFormData({
      number: '',
      building: '',
      type: 'Classroom',
      capacity: 40,
      isOccupied: false,
      facilities: [],
    });
  };

  // --- Render Functions ---

  const renderClassesTab = () => (
    <div className="space-y-6 animate-fade-in">
       {/* Filter & Actions */}
       <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by class, teacher, room..." 
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" 
                />
             </div>
             <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
               <Filter size={16} className="text-slate-400" />
               <select
                 value={classGradeFilter}
                 onChange={(e) => setClassGradeFilter(e.target.value)}
                 className="bg-transparent border-none text-sm font-bold text-slate-600 outline-none cursor-pointer"
               >
                 <option value="All">All Grades</option>
                 {[...new Set(classes.map(c => c.gradeLevel))].map(g => (
                   <option key={g} value={g}>{g}</option>
                 ))}
               </select>
             </div>
          </div>
          <button 
            onClick={() => {
              setEditingClass(null);
              setClassFormData({
                name: '',
                gradeLevel: 'Grade 10',
                section: 'A',
                teacherId: '',
                teacherName: 'Unassigned',
                roomId: '',
                roomName: 'Unassigned',
                studentCount: 0,
                maxCapacity: 40
              });
              setIsAddClassOpen(true);
            }}
            className="w-full md:w-auto px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
          >
             <Plus size={18} /> Add Class
          </button>
       </div>

       {/* Teacher Workload & Room Utilization */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <BarChart3 size={18} className="text-brand-600" />
               <h4 className="font-bold text-slate-800 text-sm">Teacher Workload</h4>
             </div>
             <span className="text-xs text-slate-500">{teacherWorkload.length} teachers</span>
           </div>
           <div className="space-y-2 max-h-52 overflow-auto pr-1">
             {teacherWorkload.map(t => (
               <div key={t.name} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                 <div>
                   <p className="text-sm font-bold text-slate-800">{t.name}</p>
                   <p className="text-[11px] text-slate-500">{t.classes} classes</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-bold text-slate-800">{t.students} students</p>
                 </div>
               </div>
             ))}
             {teacherWorkload.length === 0 && (
               <p className="text-xs text-slate-400">No teachers assigned</p>
             )}
           </div>
         </div>

         <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
               <DoorOpen size={18} className="text-brand-600" />
               <h4 className="font-bold text-slate-800 text-sm">Room Utilization</h4>
             </div>
             <span className="text-xs text-slate-500">{roomUtilization.length} rooms</span>
           </div>
           <div className="space-y-3 max-h-52 overflow-auto pr-1">
             {roomUtilization.map(({ room, enrolled, utilization }) => (
               <div key={room.id} className="bg-slate-50 rounded-xl p-3 space-y-1">
                 <div className="flex justify-between text-sm font-bold text-slate-800">
                   <span>{room.number} ({room.type})</span>
                   <span>{enrolled}/{room.capacity} students</span>
                 </div>
                 <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                   <div
                     className={`h-full rounded-full ${utilization > 90 ? 'bg-red-500' : utilization > 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                     style={{ width: `${utilization}%` }}
                   />
                 </div>
                 <p className="text-[11px] text-slate-500">Utilization {utilization}%</p>
               </div>
             ))}
             {roomUtilization.length === 0 && (
               <p className="text-xs text-slate-400">No rooms defined</p>
             )}
           </div>
         </div>
       </div>

       {/* Classes Table */}
       <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-slate-50">
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left min-w-[900px]">
             <thead className="bg-slate-50/50">
                <tr>
                   <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Class Name</th>
                   <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Class Teacher</th>
                   <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Room</th>
                   <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Students</th>
                   <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {filteredClasses.map((cls) => (
                   <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                               <GraduationCap size={20} />
                            </div>
                            <div>
                               <p className="font-bold text-slate-800 text-sm">{cls.name}</p>
                               <p className="text-xs text-slate-400 font-medium">{cls.gradeLevel} • Sec {cls.section}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                {cls.teacherName.charAt(0)}
                             </div>
                             <span className="text-sm font-medium text-slate-700">{cls.teacherName}</span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                           {cls.roomName}
                         </span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <div className="flex-1 w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-brand-500 rounded-full" 
                                 style={{ width: `${(cls.studentCount / cls.maxCapacity) * 100}%` }} 
                               />
                            </div>
                            <span className="text-xs font-bold text-slate-600">{cls.studentCount}/{cls.maxCapacity}</span>
                         </div>
                      </td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto md:pointer-events-none md:group-hover:pointer-events-auto">
                            <button 
                              onClick={() => { 
                                setEditingClass(cls); 
                                setClassFormData({
                                  name: cls.name,
                                  gradeLevel: cls.gradeLevel,
                                  section: cls.section,
                                  teacherId: cls.teacherId,
                                  teacherName: cls.teacherName,
                                  roomId: cls.roomId,
                                  roomName: cls.roomName,
                                  studentCount: cls.studentCount,
                                  maxCapacity: cls.maxCapacity
                                });
                                setIsAddClassOpen(true); 
                              }}
                              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                               <PenSquare size={16} />
                            </button>
                            <button 
                               onClick={() => handleDeleteClass(cls.id)}
                               className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
          </div>
       </div>
    </div>
  );

  const renderRoomsTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
            <DoorOpen size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-700">{rooms.length} rooms</span>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingRoom(null);
            setRoomFormData({
              number: '',
              building: '',
              type: 'Classroom',
              capacity: 40,
              isOccupied: false,
              facilities: [],
            });
            setIsAddRoomOpen(true);
          }}
          className="w-full md:w-auto px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-600/30 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add Room
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden border border-slate-50">
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Room</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Building</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Type</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Capacity</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                        <DoorOpen size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{r.number}</p>
                        <p className="text-xs text-slate-400 font-medium">{r.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-700">{r.building || '-'}</td>
                  <td className="px-8 py-5">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-700">{r.capacity}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-auto md:pointer-events-none md:group-hover:pointer-events-auto">
                      <button
                        onClick={() => {
                          setEditingRoom(r);
                          setRoomFormData({
                            number: r.number,
                            building: r.building,
                            type: r.type,
                            capacity: r.capacity,
                            isOccupied: r.isOccupied,
                            facilities: r.facilities,
                            ...(Array.isArray(r.facilities) ? { facilitiesText: r.facilities.join(', ') } : {}),
                          } as any);
                          setIsAddRoomOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <PenSquare size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(r.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td className="px-8 py-10 text-center text-slate-400" colSpan={5}>
                    No rooms yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Classes & Rooms</h2>
          <p className="text-slate-500 font-burmese mt-1 leading-loose">အတန်းများနှင့် စာသင်ခန်းများ စီမံခန့်ခွဲမှု</p>
        </div>
        
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-6 rounded-[24px] shadow-lg shadow-brand-500/20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><LayoutGrid size={100} /></div>
            <p className="font-medium opacity-90 mb-1">Total Classes</p>
            <h3 className="text-4xl font-bold">{classes.length}</h3>
            <p className="text-sm mt-2 opacity-80 font-medium">Active this term</p>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 text-slate-100"><DoorOpen size={100} /></div>
             <p className="text-slate-500 font-bold text-sm mb-1 uppercase tracking-wide">Room Utilization</p>
             <h3 className="text-4xl font-bold text-slate-800">
                {Math.round((rooms.filter(r => r.isOccupied).length / rooms.length) * 100)}%
             </h3>
             <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs font-bold text-slate-500">{rooms.filter(r => !r.isOccupied).length} Vacant</span>
             </div>
         </div>
         <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 text-slate-100"><Users size={100} /></div>
             <p className="text-slate-500 font-bold text-sm mb-1 uppercase tracking-wide">Total Capacity</p>
             <h3 className="text-4xl font-bold text-slate-800">
                {rooms.reduce((acc, r) => acc + r.capacity, 0)}
             </h3>
             <p className="text-sm mt-2 text-slate-400 font-medium">Across {rooms.length} rooms</p>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-100 p-1 flex gap-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'classes' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Classes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${activeTab === 'rooms' ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          Rooms
        </button>
      </div>

      {activeTab === 'classes' ? renderClassesTab() : renderRoomsTab()}

      {/* --- Modals --- */}
      {isAddClassOpen && (
         <div ref={modalOverlayRef} className="fixed top-0 left-0 right-0 bottom-0 z-50 flex items-start justify-center pt-8 sm:pt-12 md:items-center md:pt-4 p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsAddClassOpen(false)}>
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] pn-modal-panel md:my-4">
               {/* Fixed Header */}
               <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{editingClass ? 'Edit Class' : 'Add New Class'}</h3>
                  <button onClick={() => setIsAddClassOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors pn-modal-close"><X size={20} /></button>
               </div>
               
               {/* Scrollable Body */}
               <div className="flex-1 overflow-y-auto p-4 sm:p-6 pn-modal-compact" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <form onSubmit={handleAddClass} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Class Name *</label>
                     <input 
                        type="text" 
                           value={classFormData.name || ''}
                           onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                        placeholder="e.g. Grade 12 (A)"
                           required
                        autoFocus
                     />
                  </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Grade Level *</label>
                        <select
                           value={classFormData.gradeLevel || ''}
                           onChange={(e) => setClassFormData({ ...classFormData, gradeLevel: e.target.value })}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                           required
                        >
                           {GRADE_LEVELS_LIST.map(grade => (
                              <option key={grade} value={grade}>{grade}</option>
                           ))}
                        </select>
            </div>
         </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Section</label>
                     <input 
                        type="text" 
                           value={classFormData.section || ''}
                           onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                           placeholder="e.g. A, B, Sci, Arts"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Class Teacher *</label>
                        <select
                           value={classFormData.teacherId || ''}
                           onChange={(e) => {
                              const teacher = staff.find((t: Staff) => t.id === e.target.value);
                              setClassFormData({ 
                                 ...classFormData, 
                                 teacherId: e.target.value,
                                 teacherName: teacher?.name || 'Unassigned'
                              });
                           }}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                           required
                        >
                           <option value="">Select teacher</option>
                           {staff.map((teacher: Staff) => (
                              <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.department}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Room *</label>
                      <select
                        value={classFormData.roomId || ''}
                        onChange={(e) => {
                          const room = rooms.find((r: Room) => r.id === e.target.value);
                          setClassFormData({
                            ...classFormData,
                            roomId: e.target.value,
                            roomName: room?.number || room?.id || 'Unassigned',
                          });
                        }}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                        required
                      >
                        <option value="">Select room</option>
                        {rooms.map((room: Room) => (
                          <option key={room.id} value={room.id}>
                            {room.number} ({room.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 flex items-center">
                      <span className="font-bold mr-2">Selected:</span>
                      <span>{classFormData.roomName || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Max Capacity</label>
                        <input 
                           type="number" 
                           min="1"
                           value={classFormData.maxCapacity || 40}
                           onChange={(e) => setClassFormData({ ...classFormData, maxCapacity: parseInt(e.target.value) || 40 })}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                           placeholder="40"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Current Student Count</label>
                        <input 
                           type="number" 
                           min="0"
                           value={classFormData.studentCount || 0}
                           onChange={(e) => setClassFormData({ ...classFormData, studentCount: parseInt(e.target.value) || 0 })}
                           className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                           placeholder="0"
                        />
                        {classFormData.maxCapacity && (
                           <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                 <span className="text-slate-600">Capacity Usage:</span>
                                 <span className={`font-bold ${((classFormData.studentCount || 0) / classFormData.maxCapacity) * 100 > 90 ? 'text-red-600' : 'text-slate-600'}`}>
                                    {Math.round(((classFormData.studentCount || 0) / classFormData.maxCapacity) * 100)}%
                                 </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div
                                    className={`h-full rounded-full ${((classFormData.studentCount || 0) / classFormData.maxCapacity) * 100 > 90 ? 'bg-red-500' : 'bg-brand-500'}`}
                                    style={{ width: `${Math.min(100, ((classFormData.studentCount || 0) / classFormData.maxCapacity) * 100)}%` }}
                                 />
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  <button type="submit" className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all mt-6">
                     {editingClass ? 'Save Changes' : 'Create Class'}
                  </button>
                  </form>
               </div>
            </div>
         </div>
      )}

      {isAddRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in pn-modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsAddRoomOpen(false)}>
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] pn-modal-panel">
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-slate-100">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
              <button onClick={() => setIsAddRoomOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors pn-modal-close"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pn-modal-compact" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Room Number *</label>
                    <input
                      type="text"
                      value={roomFormData.number || ''}
                      onChange={(e) => setRoomFormData({ ...roomFormData, number: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g. 101, Lab-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Building</label>
                    <input
                      type="text"
                      value={roomFormData.building || ''}
                      onChange={(e) => setRoomFormData({ ...roomFormData, building: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                      placeholder="e.g. Main Building"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Type *</label>
                    <select
                      value={(roomFormData.type as any) || 'Classroom'}
                      onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                      required
                    >
                      <option value="Classroom">Classroom</option>
                      <option value="Laboratory">Laboratory</option>
                      <option value="Hall">Hall</option>
                      <option value="Office">Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Capacity</label>
                    <input
                      type="number"
                      min="0"
                      value={roomFormData.capacity ?? 0}
                      onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Facilities (comma separated)</label>
                  <input
                    type="text"
                    value={(roomFormData as any).facilitiesText || (Array.isArray(roomFormData.facilities) ? roomFormData.facilities.join(', ') : '')}
                    onChange={(e) => setRoomFormData({ ...(roomFormData as any), facilitiesText: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Projector, AC, Whiteboard"
                  />
                </div>

                <button type="submit" className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all mt-6">
                  {editingRoom ? 'Save Changes' : 'Create Room'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};