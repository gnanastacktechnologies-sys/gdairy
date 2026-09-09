import React from 'react';
import { FiMenu, FiPlusCircle, FiUser, FiLogOut } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.jpg';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/milk-entry':
        return "Today's Milk Collection";
      case '/milk-records':
        return 'Milk Records';
      case '/reports':
        return 'Reports & Billing Summary';
      case '/analytics':
        return 'Analytics & Graphs';
      case '/users':
        return 'User Management';
      case '/settings':
        return 'Application Settings';
      case '/profile':
        return 'My Profile';
      default:
        return 'GDairy System';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-2xs gap-2">
      {/* Left Title & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <FiMenu className="w-5 h-5 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <img
            src={logoImg}
            alt="GDairy Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-300 shadow-xs flex-shrink-0"
          />
          <h2 className="font-bold text-sm sm:text-lg text-text-main tracking-tight truncate">
            {getPageTitle(location.pathname)}
          </h2>
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('/milk-entry')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark shadow-xs transition-all active:scale-95"
        >
          <FiPlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Entry</span>
          <span className="sm:hidden text-[11px]">Add Entry</span>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          title="View Profile"
        >
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="hidden md:inline text-xs font-semibold text-text-main truncate max-w-[90px]">
            {user?.name}
          </span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-all"
          title="Logout"
        >
          <FiLogOut className="w-3.5 h-3.5 stroke-[2.2]" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
