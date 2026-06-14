import React, { useState } from 'react';
import Sidebar, { MenuIcon } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-claude-bg overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-claude-sidebar border-b border-claude-border flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-claude hover:bg-claude-sidebar-hover text-claude-text-2 transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo/brain.png" alt="Logo" className="h-6 w-6 object-contain" />
            <span className="font-bold text-claude-text text-sm">Simple Quizlet</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
