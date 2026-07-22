import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { LayoutDashboard, Users, Download, LogOut, Menu, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/students', icon: Users },
    ...(user?.role === 'admin' ? [{ name: 'Export Data', href: '/export', icon: Download }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 flex font-sans text-gray-900 antialiased">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-sm">W</span>
            <span className="text-base font-semibold tracking-tight text-gray-900">Wish2Care</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive 
                    ? "bg-gray-900 text-white shadow-sm" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-gray-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-950 truncate leading-none">{user?.name}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                {user?.role === 'admin' && <ShieldAlert className="h-3 w-3 text-red-500" />}
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-3 flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:h-screen">
        {/* Mobile Header / Navigation */}
        <header className="lg:hidden flex h-16 items-center justify-between px-6 border-b border-gray-100 bg-white shadow-sm">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-sm">W</span>
            <span className="text-base font-semibold tracking-tight text-gray-900">Wish2Care</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
