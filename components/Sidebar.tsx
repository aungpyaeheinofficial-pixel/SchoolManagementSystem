import React, { useState, useRef, useEffect } from 'react';
import { NAV_ITEMS, APP_NAME_EN, APP_NAME_MM } from '../constants';
import { ViewState } from '../types';
import { School, LogOut, ChevronDown, ChevronRight, X, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  isMobileOpen, 
  setIsMobileOpen,
  isCollapsed = false,
  setIsCollapsed
}) => {
  // State to track expanded parent groups
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['HR_GROUP', 'ACADEMIC_GROUP', 'FINANCE_GROUP']);
  // State to track active popover
  const [activePopover, setActivePopover] = useState<string | null>(null);
  // Popover position state for smart positioning
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  // Ref for popover container
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  // Smart positioning for popover
  const calculatePopoverPosition = (buttonId: string) => {
    const button = buttonRefs.current[buttonId];
    if (!button) return {};

    const buttonRect = button.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const popoverHeight = 300; // Estimated height

    let top = buttonRect.top;
    
    // Check if popover would go below viewport
    if (top + popoverHeight > viewportHeight - 20) {
      // Position from bottom instead
      top = Math.max(20, viewportHeight - popoverHeight - 20);
    }

    return {
      top: `${top}px`,
      left: `${buttonRect.right + 8}px`,
    };
  };

  // Update popover position when active
  useEffect(() => {
    if (activePopover && isCollapsed) {
      setPopoverStyle(calculatePopoverPosition(activePopover));
    }
  }, [activePopover, isCollapsed]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        const button = buttonRefs.current[activePopover || ''];
        if (button && !button.contains(event.target as Node)) {
          setActivePopover(null);
        }
      }
    };

    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopover]);

  const renderNavItem = (item: any, isChild = false) => {
    const Icon = item.icon;
    const isParent = item.children && item.children.length > 0;
    const isExpanded = expandedGroups.includes(item.id);
    
    // Check if this item is active or if one of its children is active
    const isActive = currentView === item.id;
    const isChildActive = isParent && item.children.some((child: any) => child.id === currentView);
    const isGroupActive = isChildActive;
    const isPopoverOpen = activePopover === item.id;

    return (
      <div 
        key={item.id} 
        className="w-full mb-1 relative"
      >
        <button
          ref={(el) => { buttonRefs.current[item.id] = el; }}
          onClick={() => {
            if (isParent) {
              if (isCollapsed) {
                // In collapsed mode, toggle popover on click
                setActivePopover(activePopover === item.id ? null : item.id);
              } else {
              toggleGroup(item.id);
              }
            } else {
              onNavigate(item.id as ViewState);
              setIsMobileOpen(false);
              setActivePopover(null);
            }
          }}
          className={`
            w-full flex items-center ${isCollapsed && !isChild ? 'lg:justify-center' : 'justify-between'} px-4 py-3 rounded-2xl transition-all duration-200 group relative select-none
            ${isCollapsed && !isChild ? 'lg:px-3 lg:py-3' : ''}
            ${isActive && !isParent 
              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' 
              : isGroupActive || (isCollapsed && isPopoverOpen)
                ? 'bg-brand-50 text-brand-700 ring-2 ring-brand-200'
                : 'text-slate-700 hover:bg-slate-100 hover:text-brand-600'
            }
            ${isChild ? 'pl-11 py-2.5' : ''}
            ${isCollapsed && isChild ? 'lg:hidden' : ''}
            ${isCollapsed && isParent ? 'lg:hover:bg-brand-50 lg:hover:text-brand-600 lg:hover:ring-2 lg:hover:ring-brand-200' : ''}
          `}
          title={isCollapsed && !isParent ? `${item.labelEn} (${item.labelMm})` : undefined}
        >
          <div className={`flex items-center ${isCollapsed && !isChild ? 'lg:justify-center' : 'gap-3'} min-w-0 flex-1`}>
             <Icon 
              className={`flex-shrink-0 transition-all duration-200 
                ${isActive && !isParent ? 'text-white' : isGroupActive || isPopoverOpen ? 'text-brand-600' : 'text-slate-600 group-hover:text-brand-600'}
                ${isChild ? 'w-4 h-4' : 'w-5 h-5'}
                ${isCollapsed && isParent ? 'group-hover:scale-110' : ''}
              `} 
              strokeWidth={isChild ? 2.5 : 2} 
            />
            {(!isCollapsed || isChild) && (
            <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span className={`truncate w-full leading-none ${isChild ? 'text-[13px]' : 'text-sm'} ${isActive || isGroupActive ? 'font-bold' : 'font-semibold'}`}>
                  {item.labelEn}
                </span>
                <span 
                  className={`font-burmese truncate w-full text-[10px] mt-1.5 ${isActive && !isParent ? 'text-brand-100' : 'text-slate-600 group-hover:text-brand-500'} opacity-90`}
                  style={{ lineHeight: '1.2' }} 
                >
                  {item.labelMm}
                </span>
            </div>
            )}
          </div>

          {isParent && !isCollapsed && (
             <div className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-0' : ''} ${isGroupActive ? 'text-brand-600' : 'text-slate-600 group-hover:text-slate-700'}`}>
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
             </div>
          )}
          
          {/* Submenu Indicator for collapsed parent items */}
          {isCollapsed && isParent && (
            <div className={`absolute -right-0.5 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center transition-all duration-200 ${isPopoverOpen ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isPopoverOpen ? 'bg-brand-600' : 'bg-slate-300 group-hover:bg-brand-500'}`}>
                <ChevronRight size={10} className="text-white" strokeWidth={3} />
              </div>
            </div>
          )}
          
          {/* Dot indicator for submenu */}
          {isCollapsed && isParent && (
            <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 hidden lg:flex gap-0.5 transition-opacity duration-200 ${isPopoverOpen ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'}`}>
              <div className={`w-1 h-1 rounded-full ${isPopoverOpen || isGroupActive ? 'bg-brand-500' : 'bg-slate-400'}`}></div>
              <div className={`w-1 h-1 rounded-full ${isPopoverOpen || isGroupActive ? 'bg-brand-500' : 'bg-slate-400'}`}></div>
              <div className={`w-1 h-1 rounded-full ${isPopoverOpen || isGroupActive ? 'bg-brand-500' : 'bg-slate-400'}`}></div>
             </div>
          )}
        </button>

        {/* Render Children if Expanded (normal mode) */}
        {isParent && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1 animate-fade-in origin-top">
            {item.children.map((child: any) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  // Render popover outside of nav items for proper positioning
  const renderPopover = () => {
    if (!isCollapsed || !activePopover) return null;

    // Handle profile popover
    if (activePopover === 'profile') {
      return (
        <div 
          ref={popoverRef}
          className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden min-w-[220px] animate-in fade-in slide-in-from-left-2 duration-200"
          style={popoverStyle}
        >
          <div className="px-4 py-3 bg-gradient-to-r from-brand-50 to-violet-50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-brand-200 shadow-sm">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">U Kyaw Gyi</p>
                <p className="text-xs text-slate-700 font-medium">Headmaster</p>
              </div>
            </div>
          </div>
          <div className="py-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to logout?')) {
                  alert('Logout functionality');
                }
                setActivePopover(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 font-medium hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={18} className="text-red-500" />
              <span className="text-sm font-medium">Logout / ထွက်မည်</span>
            </button>
          </div>
        </div>
      );
    }

    // Find the parent item with children
    const parentItem = NAV_ITEMS.find((nav: any) => nav.id === activePopover && nav.children);
    if (!parentItem || !parentItem.children) return null;

    const Icon = parentItem.icon;

    return (
      <div 
        ref={popoverRef}
        className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden min-w-[260px] max-w-[320px] animate-in fade-in slide-in-from-left-2 duration-200"
        style={popoverStyle}
      >
        {/* Popover Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-brand-50 to-violet-50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 rounded-xl">
              <Icon size={20} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{parentItem.labelEn}</p>
              <p className="text-[11px] text-brand-600 font-burmese font-semibold">{parentItem.labelMm}</p>
            </div>
          </div>
        </div>
        
        {/* Popover Menu Items */}
        <div className="py-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {parentItem.children.map((child: any) => {
            const ChildIcon = child.icon;
            const isChildActive = currentView === child.id;
            return (
              <button
                key={child.id}
                onClick={() => {
                  onNavigate(child.id as ViewState);
                  setIsMobileOpen(false);
                  setActivePopover(null);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                  ${isChildActive 
                    ? 'bg-brand-50 text-brand-700 border-l-4 border-brand-600' 
                    : 'text-slate-700 font-medium hover:bg-slate-50 hover:text-brand-600 border-l-4 border-transparent hover:border-brand-300'
                  }
                `}
              >
                <div className={`p-1.5 rounded-lg ${isChildActive ? 'bg-brand-100' : 'bg-slate-100 group-hover:bg-brand-50'}`}>
                  <ChildIcon size={16} className={isChildActive ? 'text-brand-600' : 'text-slate-600'} />
                </div>
                <div className="flex flex-col items-start text-left min-w-0 flex-1">
                  <span className={`text-sm ${isChildActive ? 'font-bold' : 'font-medium'}`}>
                    {child.labelEn}
                  </span>
                  <span className="text-[10px] text-slate-600 font-burmese mt-0.5">
                    {child.labelMm}
                  </span>
                </div>
                {isChildActive && (
                  <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Footer hint */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-500 text-center">Click item to navigate</p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* Sidebar Content */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        bg-white border-r border-slate-200 text-slate-700 flex flex-col
        transform transition-all duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-[76px]' : 'lg:w-[280px]'}
        w-[280px]
        shadow-xl lg:shadow-none
      `}>
        {/* Brand Header */}
        <div className={`p-6 pb-4 flex items-center justify-between ${isCollapsed ? 'lg:justify-center lg:px-3' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'lg:justify-center' : 'space-x-3'} flex-1 min-w-0`}>
            <div className={`bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl shadow-lg shadow-brand-600/30 flex-shrink-0 transition-all duration-200 ${isCollapsed ? 'p-2' : 'p-2.5'}`}>
              <School className={`text-white transition-all duration-200 ${isCollapsed ? 'w-6 h-6' : 'w-7 h-7'}`} />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 hidden lg:block">
                <h1 className="font-bold text-base leading-tight tracking-tight text-slate-800 truncate">{APP_NAME_EN}</h1>
                <h2 className="font-burmese text-[10px] text-brand-600 font-bold mt-0.5 truncate" style={{ lineHeight: '1.2' }}>{APP_NAME_MM}</h2>
              </div>
            )}
            {/* Mobile header text */}
            <div className="min-w-0 flex-1 lg:hidden">
              <h1 className="font-bold text-base leading-tight tracking-tight text-slate-800 truncate">{APP_NAME_EN}</h1>
              <h2 className="font-burmese text-[10px] text-brand-600 font-bold mt-0.5 truncate" style={{ lineHeight: '1.2' }}>{APP_NAME_MM}</h2>
          </div>
          </div>
          {/* Close Button (Mobile) */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar ${isCollapsed ? 'lg:px-2 px-4' : 'px-4'}`}>
          {!isCollapsed && (
          <p className="px-4 text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 mt-2">Main Menu</p>
          )}
          {isCollapsed && (
            <div className="hidden lg:flex justify-center mb-2">
              <MoreHorizontal size={16} className="text-slate-300" />
            </div>
          )}
          {NAV_ITEMS.map((item) => renderNavItem(item))}
        </nav>

        {/* Bottom Card / Profile */}
        <div className={`p-4 border-t border-slate-100 ${isCollapsed ? 'lg:px-2' : ''}`}>
          <button
            ref={(el) => { buttonRefs.current['profile'] = el; }}
            onClick={() => {
              if (isCollapsed) {
                setActivePopover(activePopover === 'profile' ? null : 'profile');
              }
            }}
            className={`w-full p-2.5 bg-slate-50 rounded-xl flex items-center ${isCollapsed ? 'lg:justify-center' : 'space-x-3'} group cursor-pointer hover:bg-white hover:shadow-md transition-all border border-slate-100 hover:border-slate-200 relative ${isCollapsed && activePopover === 'profile' ? 'ring-2 ring-brand-200 bg-brand-50' : ''}`}
          >
            <div className={`rounded-full bg-white flex items-center justify-center text-brand-600 font-bold shadow-sm overflow-hidden border border-slate-200 flex-shrink-0 transition-all duration-200 ${isCollapsed ? 'w-9 h-9' : 'w-10 h-10'} ${isCollapsed ? 'group-hover:ring-2 group-hover:ring-brand-200' : ''}`}>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0 text-left hidden lg:block">
                  <p className="text-sm font-bold text-slate-900 truncate">U Kyaw Gyi</p>
                  <p className="text-xs text-slate-700 font-medium truncate">Headmaster</p>
                </div>
                {/* Mobile user info */}
                <div className="flex-1 min-w-0 text-left lg:hidden">
              <p className="text-sm font-bold text-slate-900 truncate">U Kyaw Gyi</p>
              <p className="text-xs text-slate-700 font-medium truncate">Headmaster</p>
            </div>
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Are you sure you want to logout?')) {
                      alert('Logout functionality');
                    }
                  }}
                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 p-1 rounded hover:bg-red-50"
                >
              <LogOut size={18} />
                </div>
              </>
            )}
            
            {/* Indicator for collapsed profile */}
            {isCollapsed && (
              <div className={`absolute -right-0.5 top-1/2 -translate-y-1/2 hidden lg:flex transition-opacity duration-200 ${activePopover === 'profile' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className={`w-3 h-3 rounded-full flex items-center justify-center ${activePopover === 'profile' ? 'bg-brand-600' : 'bg-slate-400'}`}>
                  <ChevronRight size={8} className="text-white" strokeWidth={3} />
                </div>
              </div>
            )}
            </button>
          
          {/* Powered by A7 System - Show in both collapsed and expanded states */}
          <div className={`text-center pt-3 pb-1 ${isCollapsed ? 'lg:block hidden' : 'hidden lg:block'}`}>
            <p className="text-[10px] text-slate-600 font-semibold tracking-wide">
              Powered by A7 System
            </p>
          </div>
        </div>
      </aside>

      {/* Render Popover (Fixed Position) */}
      {renderPopover()}

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .fade-in {
          animation-name: fadeIn;
        }
        
        .slide-in-from-left-2 {
          --tw-enter-translate-x: -0.5rem;
        }
      `}</style>
    </>
  );
};
