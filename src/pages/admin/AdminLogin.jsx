/**
 * src/pages/admin/AdminLogin.jsx
 *
 * Simple hardcoded-credential admin login page.
 * No login table required — credentials stored in constants below.
 * Uses sessionStorage to persist auth across page refreshes.
 *
 * ⚠️  Change ADMIN_USERNAME and ADMIN_PASSWORD before deploying!
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, Dumbbell, Shield } from 'lucide-react';
import CustomCursor from '@/components/CustomCursor';

// ── Credentials — change these before deploying ────────────────────────────
const ADMIN_USERNAME = 'sudarshan';
const ADMIN_PASSWORD = 'Recode2025@Admin';
export const ADMIN_SESSION_KEY = 'recode_admin_auth';

export function isAdminLoggedIn() {
    try {
        const val = sessionStorage.getItem(ADMIN_SESSION_KEY);
        return val === 'true';
    } catch { return false; }
}

export function adminLogout() {
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* noop */ }
}

export default function AdminLogin() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAdminLoggedIn()) navigate('/admin/enrollments', { replace: true });
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        // Simulate a tiny delay so it doesn't feel instant (UX)
        setTimeout(() => {
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
                navigate('/admin/enrollments', { replace: true });
            } else {
                setError('Invalid username or password.');
                setLoading(false);
            }
        }, 500);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <CustomCursor />

            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
                    style={{ background: 'rgba(231,23,99,0.08)' }} />
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(231,23,99,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(231,23,99,0.03) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-md"
            >
                {/* Card */}
                <div className="rounded-3xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

                    {/* Header */}
                    <div className="px-8 pt-10 pb-8 text-center"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                            style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)' }}>
                            <Shield className="w-8 h-8" style={{ color: '#e71763' }} />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-1">Admin Portal</h1>
                        <p className="text-xs text-white/35">RECODE™ by FitWithSudarshan</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="px-8 py-8 space-y-4">
                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        {/* Username */}
                        <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Enter username"
                                autoComplete="username"
                                required
                                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(231,23,99,0.5)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/25 outline-none transition-all"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(231,23,99,0.5)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                                <button type="button" onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 rounded-xl font-bold text-sm text-white mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.35)' }}>
                            {loading ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                            ) : (
                                <><Lock className="w-4 h-4" />Sign In</>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer */}
                    <div className="px-8 pb-6 text-center">
                        <p className="text-xs text-white/20">
                            Admin access only · All activity is logged
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}