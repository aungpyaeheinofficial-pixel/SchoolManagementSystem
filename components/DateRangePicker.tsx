import React, { useState, useEffect, useRef } from 'react';
import { 
  format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  subMonths, startOfYear, isSameDay, isWithinInterval, getDaysInMonth,
  setMonth, setYear, getYear, getMonth, subDays
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
}

const PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Yesterday', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) }) },
  { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }) },
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last Month', getValue: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'This Year', getValue: () => ({ from: startOfYear(new Date()), to: new Date() }) },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS = Array.from({ length: 21 }, (_, i) => 2015 + i); // 2015 to 2035

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ date, setDate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date()); // Controls the month currently being viewed
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePresetClick = (getValue: () => DateRange) => {
    const newRange = getValue();
    setDate(newRange);
    setViewDate(newRange.from || new Date());
    // Keep open or close? Usually keeping open is better for confirmation, but for speed let's close
    // setIsOpen(false); 
  };

  const handleDayClick = (day: Date) => {
    if (!date?.from || (date.from && date.to)) {
      // Start new range
      setDate({ from: day, to: undefined });
    } else {
      // Complete range
      if (day < date.from) {
        setDate({ from: day, to: date.from });
      } else {
        setDate({ from: date.from, to: day });
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setViewDate(setMonth(viewDate, newMonth));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setViewDate(setYear(viewDate, newYear));
  };

  const nextMonth = () => setViewDate(addDays(endOfMonth(viewDate), 1));
  const prevMonth = () => setViewDate(subDays(startOfMonth(viewDate), 1));

  // Calendar Grid Generation
  const generateGrid = () => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const daysInCurrentMonth = getDaysInMonth(viewDate);
    const startDayIndex = start.getDay(); // 0 = Sunday

    const grid = [];
    
    // Empty cells for padding
    for (let i = 0; i < startDayIndex; i++) {
      grid.push(<div key={`empty-${i}`} />);
    }

    // Days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const currentDay = new Date(getYear(viewDate), getMonth(viewDate), d);
      
      const isSelected = date?.from && isSameDay(currentDay, date.from) || date?.to && isSameDay(currentDay, date.to);
      const isInRange = date?.from && date?.to && isWithinInterval(currentDay, { start: date.from, end: date.to });
      const isToday = isSameDay(currentDay, new Date());

      // Styling logic for range ends
      const isRangeStart = date?.from && isSameDay(currentDay, date.from);
      const isRangeEnd = date?.to && isSameDay(currentDay, date.to);

      grid.push(
        <button
          key={d}
          onClick={() => handleDayClick(currentDay)}
          className={`
            h-9 w-full text-xs font-medium relative flex items-center justify-center transition-all
            ${isRangeStart ? 'rounded-l-lg' : ''}
            ${isRangeEnd ? 'rounded-r-lg' : ''}
            ${!isRangeStart && !isRangeEnd && isSelected ? 'rounded-lg' : ''}
            ${isInRange && !isSelected ? 'bg-brand-50 text-brand-700' : ''}
            ${isSelected ? 'bg-brand-600 text-white shadow-md z-10' : 'text-slate-700 hover:bg-slate-100'}
            ${isToday && !isSelected && !isInRange ? 'text-brand-600 font-bold border border-brand-200 rounded-lg' : ''}
          `}
        >
          {d}
        </button>
      );
    }
    return grid;
  };

  const getButtonLabel = () => {
    if (date?.from) {
      if (date.to) {
        return `${format(date.from, 'MMM dd, yyyy')} - ${format(date.to, 'MMM dd, yyyy')}`;
      }
      return format(date.from, 'MMM dd, yyyy');
    }
    return "Pick a date";
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700
          hover:bg-slate-50 transition-all shadow-sm
          ${isOpen ? 'ring-2 ring-brand-500/20 border-brand-500' : ''}
        `}
      >
        <CalendarIcon size={16} className="text-slate-400" />
        <span className="min-w-[140px] max-w-[60vw] sm:max-w-none text-left truncate">{getButtonLabel()}</span>
        <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Content */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-0 flex flex-col md:flex-row overflow-hidden animate-fade-in origin-top-right w-[320px] md:w-auto">
          
          {/* Sidebar Presets */}
          <div className="bg-slate-50/50 p-3 flex flex-row md:flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-100 overflow-x-auto md:overflow-visible">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePresetClick(preset.getValue)}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-white hover:text-brand-600 hover:shadow-sm rounded-lg text-left whitespace-nowrap transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar Area */}
          <div className="p-4 w-[320px]">
            {/* Header: Year/Month Dropdowns + Navigation */}
            <div className="flex items-center justify-between mb-4">
               <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                 <ChevronLeft size={18} />
               </button>

               <div className="flex items-center gap-1">
                 {/* Month Dropdown */}
                 <div className="relative group">
                   <select 
                      value={getMonth(viewDate)} 
                      onChange={handleMonthChange}
                      className="appearance-none bg-transparent hover:bg-slate-50 py-1 pl-2 pr-1 rounded-lg text-sm font-bold text-slate-800 cursor-pointer outline-none focus:ring-2 focus:ring-brand-500/20"
                   >
                      {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                   </select>
                 </div>
                 
                 {/* Year Dropdown */}
                 <div className="relative group">
                   <select 
                      value={getYear(viewDate)} 
                      onChange={handleYearChange}
                      className="appearance-none bg-transparent hover:bg-slate-50 py-1 pl-2 pr-1 rounded-lg text-sm font-bold text-slate-800 cursor-pointer outline-none focus:ring-2 focus:ring-brand-500/20"
                   >
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                   </select>
                 </div>
               </div>

               <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                 <ChevronRight size={18} />
               </button>
            </div>

            {/* Grid Headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {generateGrid()}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
               <button onClick={() => setIsOpen(false)} className="text-xs font-bold text-brand-600 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors">
                 Done
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
);