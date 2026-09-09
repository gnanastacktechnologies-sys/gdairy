import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-bg">
      {/* Fixed Sidebar for Desktop & Mobile Drawer */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area (Independent 100vh scroll container) */}
      <div className="flex-1 flex flex-col h-screen md:ml-64 overflow-y-auto main-scroll-container">
        {/* Sticky Topbar */}
        <Topbar onMenuClick={() => setMobileOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-20 sm:pb-12 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 text-center text-xs font-semibold text-slate-400 border-t border-slate-200/60 mt-auto">
          Copyright &copy; 2026 Gnanastack Technologies. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
