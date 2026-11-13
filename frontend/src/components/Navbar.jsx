import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, X, Menu } from 'lucide-react';

const getLastName = (fullName) => {
  if (!fullName) return 'Officer';
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : parts[0];
};

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Hide the global top navbar on standalone pages (Analytics and Login have their own UI)
  const isAnalytics = location.pathname === '/analytics';
  const isLogin = location.pathname === '/login';
  const isPrototype = location.pathname === '/prototype';

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 50);
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 150) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  if (isAnalytics || isLogin) {
    return null; // Standalone website experience
  }

  return (
    <nav 
      className={`fixed top-0 w-full z-50 py-3 md:py-4 px-4 sm:px-6 md:px-12 transition-all duration-300 ease-in-out transform ${
        isPrototype ? 'opacity-0 hover:opacity-100' : ''
      } ${
        scrolled || mobileMenuOpen
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
          : 'bg-white/90 backdrop-blur-sm border-b border-gray-100'
      } ${hidden && !mobileMenuOpen ? '-translate-y-full' : 'translate-y-0'}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <div className="flex items-center">
          <NavLink to="/" className="flex items-center hover:opacity-80 transition select-none">
            <img 
              src="/horizonx (1).svg"
              alt="HorizonX" 
              className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-all duration-300 mix-blend-multiply pointer-events-none select-none" 
              draggable={false}
              onError={(e) => e.target.style.display = 'none'} 
            />
          </NavLink>
        </div>
        
        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center space-x-8">
          <NavItem to="/" label="Home" />
          <NavItem to="/prototype" label="Prototype" />
          <NavItem to="/analytics" label="Analytics" />
          <NavItem to="/incidents" label="Incidents" />
        </div>

        {/* AUTH ACTION / CREW PROFILE & MOBILE HAMBURGER */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              {/* Clickable Profile Avatar Button: BLACK CIRCLE ONLY, NO GREEN, NO NAME BELOW */}
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center justify-center cursor-pointer group focus:outline-none"
                title="Click to view profile & sign out"
              >
                <div className="relative">
                  <img 
                    src={user?.avatar || "/sri_avatar_nav.png"} 
                    alt={user?.name || "Registered User"}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-black shadow-xs group-hover:ring-2 group-hover:ring-black transition" 
                    onError={(e) => {
                      if (user?.avatar) e.target.src = user.avatar;
                    }}
                  />
                </div>
              </button>

              {/* Profile Dropdown Popup (STRICTLY BLACK AND WHITE ONLY) */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] bg-black text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 z-50 animate-fade-in">
                  
                  {/* Close Button Row */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                      Account Profile
                    </span>
                    <button
                      onClick={() => setProfileOpen(false)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Profile Info Card: Registered Photo in Black Circle, Name, Role, Black/White Pro & Batch Badge */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img 
                        src={user?.avatar || "/sri_avatar_nav.png"} 
                        alt={user?.name || "Registered User"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md bg-neutral-900"
                        onError={(e) => {
                          if (user?.avatar) e.target.src = user.avatar;
                        }}
                      />
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">
                        {user?.name || "Crew Member"}
                      </h4>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {user?.role || "System Engineer"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-mono text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                          {user?.batch_id || "Bravo-0-6"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-3 border-t border-neutral-800" />

                  {/* Sign Out Action Button */}
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition text-xs font-semibold text-left group"
                  >
                    <LogOut className="w-4 h-4 text-neutral-400 group-hover:text-white transition" />
                    <span>Sign out</span>
                  </button>

                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition shadow-xs group border border-black"
            >
              <span>Login</span>
            </Link>
          )}

          {/* MOBILE HAMBURGER TOGGLE BUTTON WITH SMOOTH ROTATION */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-black hover:bg-gray-100 active:bg-gray-200 transition-colors focus:outline-none relative w-9 h-9 flex items-center justify-center cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <span className={`absolute transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-90 opacity-0 scale-75' : 'rotate-0 opacity-100 scale-100'}`}>
              <Menu className="w-5 h-5 text-black" />
            </span>
            <span className={`absolute transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-75'}`}>
              <X className="w-5 h-5 text-black" />
            </span>
          </button>
        </div>
        
      </div>

      {/* MOBILE EXPANDED MENU DRAWER WITH SMOOTH DROPDOWN ANIMATION */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-80 opacity-100 translate-y-0 pt-4 pb-2 mt-3 border-t border-gray-100' 
            : 'max-h-0 opacity-0 -translate-y-3 pointer-events-none'
        }`}
      >
        <div className="flex flex-col space-y-2">
          <MobileNavItem to="/" label="Home" onClick={() => setMobileMenuOpen(false)} open={mobileMenuOpen} delay="delay-[40ms]" />
          <MobileNavItem to="/prototype" label="Prototype" onClick={() => setMobileMenuOpen(false)} open={mobileMenuOpen} delay="delay-[80ms]" />
          <MobileNavItem to="/analytics" label="Analytics" onClick={() => setMobileMenuOpen(false)} open={mobileMenuOpen} delay="delay-[120ms]" />
          <MobileNavItem to="/incidents" label="Incidents" onClick={() => setMobileMenuOpen(false)} open={mobileMenuOpen} delay="delay-[160ms]" />
        </div>
      </div>
    </nav>
  );
};

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 relative group pb-1 ${
        isActive 
          ? 'text-black' 
          : 'text-gray-500 hover:text-black'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {label}
        <span 
          className={`absolute bottom-0 left-0 w-full h-[2px] bg-black transition-transform duration-200 ${
            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          }`}
        ></span>
      </>
    )}
  </NavLink>
);

const MobileNavItem = ({ to, label, onClick, open, delay }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `text-xs font-semibold uppercase tracking-[0.18em] px-4 py-2.5 rounded-xl transition-all duration-300 ease-out transform ${
        open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${delay || ''} ${
        isActive 
          ? 'bg-black text-white font-bold shadow-xs' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
      }`
    }
  >
    {label}
  </NavLink>
);

export default Navbar;
