// src/pages/admin/ToastProvider.jsx
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const remove = useCallback((id) => {
        setToasts((t) => t.filter((x) => x.id !== id));
        clearTimeout(timers.current[id]);
        delete timers.current[id];
    }, []);

    const push = useCallback((message, type = 'success', duration = 3500) => {
        const id = ++idCounter;
        setToasts((t) => [...t, { id, message, type }]);
        timers.current[id] = setTimeout(() => remove(id), duration);
        return id;
    }, [remove]);

    const api = {
        success: (msg, duration) => push(msg, 'success', duration),
        error: (msg, duration) => push(msg, 'error', duration ?? 5000),
        info: (msg, duration) => push(msg, 'info', duration),
    };

    const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
    const COLORS = {
        success: { color: '#34d399', border: 'rgba(52,211,153,0.3)' },
        error: { color: '#f87171', border: 'rgba(239,68,68,0.3)' },
        info: { color: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
    };

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                <AnimatePresence>
                    {toasts.map((t) => {
                        const Icon = ICONS[t.type];
                        const c = COLORS[t.type];
                        return (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="pointer-events-auto flex items-center gap-2.5 pl-3.5 pr-3 py-3 rounded-xl max-w-sm shadow-2xl"
                                style={{
                                    background: '#13131f',
                                    border: `1px solid ${c.border}`,
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                                }}
                            >
                                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: c.color }} />
                                <p className="text-xs font-medium text-white/85 leading-snug">{t.message}</p>
                                <button
                                    onClick={() => remove(t.id)}
                                    className="text-white/25 hover:text-white flex-shrink-0 ml-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}