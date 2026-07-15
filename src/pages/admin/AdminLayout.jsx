/**
 * src/pages/admin/AdminLayout.jsx
 * Shared sidebar + topbar layout for all admin pages.
 */
import { useEffect, useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, ClipboardList, LogOut, Menu, X, Tag, UserPlus, BellRing } from 'lucide-react';

import { logout, getStoredAdmin } from './adminApi';
const NAV = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/enrollments', icon: Users, label: 'Enrollments' },
    { to: '/admin/manual-enrollment', icon: UserPlus, label: 'Manual Entry' },
    { to: '/admin/follow-ups', icon: BellRing, label: 'Follow-Ups' },
    { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments' },
    { to: '/admin/coupons', icon: Tag, label: 'Coupons' },
];
export default function AdminLayout() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [admin, setAdmin] = useState(getStoredAdmin());

    useEffect(() => { setAdmin(getStoredAdmin()); }, []);

    useEffect(() => {
        document.body.classList.add('admin-page');
        return () => document.body.classList.remove('admin-page');
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/admin', { replace: true });
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="px-6 py-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                    <img
                        src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png"
                        alt="FitWithSudarshan"
                        className="w-9 h-9 rounded-xl"
                    />
                    <div>
                        <p className="text-sm font-black text-white leading-tight">RECODE™</p>
                        <p className="text-[10px] text-white/35 uppercase tracking-widest">Admin</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                                ? 'text-white'
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`
                        }
                        style={({ isActive }) => isActive
                            ? { background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)' }
                            : {}}
                    >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {label}
                    </NavLink>
                ))}
            </nav>

            {/* Profile + logout */}
            <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {admin && (
                    <div className="flex items-center gap-2.5 px-4 py-2 mb-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(231,23,99,0.15)', border: '1px solid rgba(231,23,99,0.3)' }}>
                            <span className="text-[10px] font-black" style={{ color: '#e71763' }}>
                                {(admin.displayName || admin.username || '?').charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{admin.displayName || admin.username}</p>
                            <p className="text-[10px] text-white/30 capitalize">{admin.role || 'admin'}</p>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-red-400 hover:bg-red-500/8 w-full transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex">
            <style>
                {`
                body.admin-page input,
                body.admin-page select,
                body.admin-page textarea,
                body.admin-page button {
                    outline: none !important;
                }

                body.admin-page input:focus,
                body.admin-page select:focus,
                body.admin-page textarea:focus {
                    outline: none !important;
                    border-color: rgba(231,23,99,0.5) !important;
                    box-shadow: 0 0 0 3px rgba(231,23,99,0.12) !important;
                }

                body.admin-page button:focus-visible {
                    outline: none !important;
                    box-shadow: 0 0 0 3px rgba(231,23,99,0.18) !important;
                }
            `}
            </style>
            {/* Desktop sidebar */}
            <aside
                className="hidden lg:flex flex-col w-56 flex-shrink-0 sticky top-0 h-screen"
                style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
                <SidebarContent />
            </aside>

            {/* Mobile sidebar overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 z-50 w-56 lg:hidden"
                            style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header
                    className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14 flex-shrink-0"
                    style={{ background: 'rgba(10,10,10,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5"
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-white/30 font-medium hidden sm:block">
                            FitWithSudarshan Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                        <span className="text-xs text-white/40">{admin?.displayName || admin?.username || 'Signed in'}</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}