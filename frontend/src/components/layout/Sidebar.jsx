import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiPlusCircle,
  FiUsers,
  FiDatabase,
  FiFileText,
  FiPieChart,
  FiSettings,
  FiUser,
  FiLogOut,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.jpg';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout, isAdmin } = useAuth();

  const adminNavs = [
    { label: 'Dashboard', path: '/dashboard', icon: FiHome },
    { label: 'Milk Entry', path: '/milk-entry', icon: FiPlusCircle },
    { label: 'Users', path: '/users', icon: FiUsers },
    { label: 'Milk Records', path: '/milk-records', icon: FiDatabase },
    { label: 'Reports', path: '/reports', icon: FiFileText },
    { label: 'Analytics', path: '/analytics', icon: FiPieChart },
    { label: 'Settings', path: '/settings', icon: FiSettings },
    { label: 'Profile', path: '/profile', icon: FiUser }
  ];

  const userNavs = [
    { label: 'Dashboard', path: '/dashboard', icon: FiHome },
    { label: 'Milk Entry', path: '/milk-entry', icon: FiPlusCircle },
    { label: 'Milk Records', path: '/milk-records', icon: FiDatabase },
    { label: 'Reports', path: '/reports', icon: FiFileText },
    { label: 'Analytics', path: '/analytics', icon: FiPieChart },
    { label: 'Profile', path: '/profile', icon: FiUser }
  ];

  const navItems = isAdmin ? adminNavs : userNavs;

  const handleNavClick = () => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 border-r border-slate-800">
      {/* Branding Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoImg}
            alt="GDairy Logo"
            className="w-10 h-10 rounded-xl object-cover border border-amber-500/40 shadow-md shadow-amber-500/20 flex-shrink-0"
          />
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-wide text-white">GDairy</h1>
            <p className="text-[10px] font-medium text-amber-400/90 tracking-wide">Pure Milk • Healthy Tomorrow</p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close drawer"
          >
            <FiX className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* User Badge */}
      <div className="px-5 py-3.5 bg-slate-800/50 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="truncate">
          <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              {user?.role}
            </span>
            <span className="inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
              #{user?.userCode || (user?.role === 'admin' ? 'ADM-001' : 'FARM-001')}
            </span>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
              ● Active
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sidebar-scroll-container">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
            >
              <Icon className="w-5 h-5 stroke-[2]" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Button fixed at bottom of drawer */}
      <div className="p-3 border-t border-slate-800 mt-auto flex-shrink-0 space-y-2">
        <button
          onClick={() => {
            logout();
            handleNavClick();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition-all duration-150 active:scale-95"
        >
          <FiLogOut className="w-5 h-5 stroke-[2.2]" />
          <span>Logout</span>
        </button>
        <p className="text-[10px] text-center text-slate-500 font-medium pt-1">
          &copy; 2026 Gnanastack Technologies
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed / Sticky 100vh) */}
      <aside className="hidden md:block h-screen fixed left-0 top-0 z-30 sidebar-scroll-container">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay + Drawer Sidebar) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 h-full sidebar-scroll-container animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
