// src/pages/admin/diet/DietModal.jsx
// Shared modal shell — used by the Diet Plan Builder and the Diet/Workout
// Template editors for their food/exercise picker popups.
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[85vh] overflow-y-auto rounded-2xl`}
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 flex items-center justify-between px-5 py-4 z-10"
                    style={{ background: 'rgba(14,14,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="font-black text-white text-sm">{title}</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
                </div>
                <div className="p-5">{children}</div>
            </motion.div>
        </div>
    );
}
