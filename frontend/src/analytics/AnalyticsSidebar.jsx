import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Sliders,
  Waves,
  Layers,
  HeartPulse,
  ChevronLeft
} from 'lucide-react';

export const AnalyticsSidebar = ({ activePage, onSelectPage, isOpen = true, onToggle }) => {
  // Professional, clean, and simple navigation labels matching user specification
  const navPages = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'topography', label: 'Topography', icon: Activity },
    { id: 'sensors', label: 'Sensors', icon: Sliders },
    { id: 'dynamics', label: 'Gas Drift', icon: Waves },
    { id: 'concentration', label: 'Concentration', icon: Layers },
    { id: 'diagnostics', label: 'Diagnostics', icon: HeartPulse },
  ];

  const handleNavClick = (pageId) => {
    onSelectPage(pageId);
    // On mobile devices, automatically close the drawer after selection
    if (typeof window !== 'undefined' && window.innerWidth < 768 && onToggle) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden animate-fade-in"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* STRICTLY PURE BLACK SIDEBAR - RESPONSIVE SLIDE-OVER ON MOBILE, STICKY ON DESKTOP */}
      <aside 
        className={`bg-black text-white flex flex-col justify-between h-screen fixed inset-y-0 left-0 md:sticky md:top-0 border-r border-neutral-900 shrink-0 select-none font-sans z-40 transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'w-64 opacity-100 translate-x-0' 
            : 'w-0 border-r-0 overflow-hidden opacity-0 -translate-x-full md:translate-x-0 pointer-events-none'
        }`}
      >
        
        {/* Top Header with BIG LOGO IN TOP CENTRE & CLOSE BUTTON */}
        <div>
          <div className="p-5 border-b border-neutral-900 relative flex flex-col items-center justify-center">
            {/* Close Sidebar Toggle Button in top right */}
            {onToggle && (
              <button
                onClick={onToggle}
                className="absolute top-3 right-3 p-1.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 transition shrink-0"
                title="Close Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {/* BIG LOGO IN TOP CENTRE */}
            <Link 
              to="/" 
              title="Return to Spacecraft Home Page"
              className="flex items-center justify-center group transition py-1"
            >
              <img 
                src="/horizonx (1).svg" 
                alt="HorizonX" 
                className="h-14 sm:h-16 md:h-18 w-auto object-contain filter invert contrast-200 pointer-events-none select-none group-hover:opacity-80 transition transform group-hover:scale-105"
                draggable={false}
              />
            </Link>
          </div>

          {/* Simplified Navigation */}
          <nav className="p-4 space-y-2">
            <div className="text-[10px] font-mono font-semibold text-neutral-500 uppercase px-3 py-1.5 tracking-wider">
              Dashboards
            </div>

            {navPages.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id ||
                (item.id === 'topography' && activePage === 'telemetry') ||
                (item.id === 'dynamics' && activePage === 'drift') ||
                (item.id === 'concentration' && (activePage === 'composition' || activePage === 'distribution')) ||
                (item.id === 'diagnostics' && activePage === 'health');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs transition text-left group ${
                    isActive 
                      ? 'bg-white text-black font-bold shadow-lg' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-neutral-400 group-hover:text-white'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </aside>
    </>
  );
};

export default AnalyticsSidebar;
