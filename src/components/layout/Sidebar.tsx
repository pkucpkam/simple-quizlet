import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logoutUser } from '../../service/authService';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const AdminIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const username = user?.username || 'Người dùng';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose();
  }, [location.pathname, onMobileClose]);

  const navItems: NavItem[] = [
    { to: '/', label: 'Trang chủ', icon: <HomeIcon /> },
    { to: '/my-lessons', label: 'Bài học của tôi', icon: <BookIcon /> },
    { to: '/create-lesson', label: 'Tạo bài học', icon: <PlusIcon /> },
    { to: '/study-history', label: 'Lịch sử học', icon: <HistoryIcon /> },
    { to: '/leaderboard', label: 'Bảng xếp hạng', icon: <TrophyIcon /> },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Console', icon: <AdminIcon />, adminOnly: true }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      sessionStorage.removeItem('user');
      navigate('/login');
    }
  };

  const initials = username.charAt(0).toUpperCase();

  const SidebarContent = ({ isDesktop = false }: { isDesktop?: boolean }) => {
    const collapsed = isDesktop && isCollapsed;

    return (
      <div className="flex flex-col h-full relative">
        {/* Brand */}
        <div className={`flex items-center border-b border-claude-border py-5 px-4 h-[73px] ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 overflow-hidden animate-fade-in">
              <img src="/logo/brain.png" alt="Logo" className="h-8 w-8 object-contain flex-shrink-0" />
              <div className="overflow-hidden">
                <span className="font-bold text-claude-text text-sm tracking-tight block">Simple Quizlet</span>
                <span className="text-[11px] text-claude-text-3 block">Học tiếng Anh</span>
              </div>
            </div>
          )}
          {collapsed && (
            <img src="/logo/brain.png" alt="Logo" className="h-8 w-8 object-contain flex-shrink-0 animate-fade-in" />
          )}

          {/* Desktop collapse button */}
          {isDesktop && (
            <button
              onClick={toggleCollapse}
              className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 bg-claude-surface border border-claude-border shadow-claude hover:shadow-claude-md text-claude-text-2 hover:text-claude-text transition-all duration-150 rounded-full p-1 z-[100] cursor-pointer"
              title={collapsed ? "Mở rộng" : "Thu gọn"}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2 flex flex-col items-center' : 'px-2'}`}>
          {navItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`claude-nav-item w-full ${active ? 'active' : ''} ${item.adminOnly ? 'text-claude-accent' : ''} ${collapsed ? 'justify-center p-0 h-10 w-10 mx-auto rounded-claude' : ''
                  }`}
              >
                <span className={`flex-shrink-0 ${active ? 'text-claude-accent' : 'text-claude-text-3'} ${item.adminOnly ? '!text-claude-accent' : ''}`}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate animate-fade-in">{item.label}</span>}
                {!collapsed && item.adminOnly && (
                  <span className="ml-auto text-[10px] font-bold bg-claude-accent-light text-claude-accent px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className={`border-t border-claude-border p-2 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center rounded-claude hover:bg-claude-sidebar-hover transition-colors duration-150 ${collapsed ? 'justify-center p-0 h-10 w-10 mx-auto' : 'gap-3 px-3 py-2.5'
              }`}
            title={collapsed ? username : undefined}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={username}
                className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-claude-border-strong"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-claude-accent flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                {initials}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 text-left overflow-hidden animate-fade-in">
                <div className="text-sm font-medium text-claude-text truncate">{username}</div>
                <div className="text-[11px] text-claude-text-3 truncate">{user?.email || ''}</div>
              </div>
            )}
            {!collapsed && <ChevronIcon open={userMenuOpen} />}
          </button>

          {userMenuOpen && (
            <div className={`mt-1 space-y-1 animate-fade-in ${collapsed ? 'w-full flex flex-col items-center' : ''}`}>
              <Link
                to="/profile"
                onClick={() => setUserMenuOpen(false)}
                title={collapsed ? "Hồ sơ cá nhân" : undefined}
                className={`claude-nav-item w-full ${collapsed ? 'justify-center p-0 h-10 w-10 mx-auto' : ''}`}
              >
                <ProfileIcon />
                {!collapsed && <span>Hồ sơ cá nhân</span>}
              </Link>
              <button
                onClick={handleLogout}
                title={collapsed ? "Đăng xuất" : undefined}
                className={`claude-nav-item w-full text-claude-error hover:bg-red-50 hover:text-claude-error ${collapsed ? 'justify-center p-0 h-10 w-10 mx-auto' : ''
                  }`}
              >
                <LogoutIcon />
                {!collapsed && <span>Đăng xuất</span>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`relative hidden md:flex flex-col ${isCollapsed ? 'w-16' : 'w-60'} bg-claude-sidebar border-r border-claude-border flex-shrink-0 sticky top-0 h-screen overflow-visible sidebar-transition`}>
        <SidebarContent isDesktop={true} />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 w-72 bg-claude-sidebar border-r border-claude-border z-50 flex flex-col transform transition-transform duration-200 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          className="absolute top-4 right-4 p-1.5 rounded-claude hover:bg-claude-sidebar-hover text-claude-text-2 transition-colors"
        >
          <CloseIcon />
        </button>
        <SidebarContent isDesktop={false} />
      </aside>
    </>
  );
};

export { MenuIcon };
export default Sidebar;
