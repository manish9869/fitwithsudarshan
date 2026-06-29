// src/pages/admin/ExportMenu.jsx
import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, Loader2, Calendar } from 'lucide-react';
import { DATE_PRESETS, presetToDateRange } from './adminUtils';

export default function ExportMenu({ onExport, label = 'Export' }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preset, setPreset] = useState('All time');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const getRange = () => {
        if (customFrom && customTo) return { from: customFrom, to: customTo };
        const p = DATE_PRESETS.find((p) => p.label === preset);
        return p ? presetToDateRange(p.days) : { from: undefined, to: undefined };
    };

    const run = async (format) => {
        setLoading(true);
        try {
            const range = getRange();
            await onExport(format, range);
        } finally {
            setLoading(false);
            setOpen(false);
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                {label}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl p-3"
                    style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Date Range
                    </p>
                    <select value={preset} onChange={(e) => { setPreset(e.target.value); setCustomFrom(''); setCustomTo(''); }}
                        className="w-full mb-2 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {DATE_PRESETS.map((p) => (
                            <option key={p.label} value={p.label} style={{ background: '#0a0a0a' }}>{p.label}</option>
                        ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                        <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                            className="rounded-lg px-2 py-1.5 text-[11px] text-white outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                            className="rounded-lg px-2 py-1.5 text-[11px] text-white outline-none"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">Format</p>
                    <div className="space-y-1.5">
                        <button onClick={() => run('csv')} disabled={loading}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <FileDown className="w-3.5 h-3.5" /> CSV
                        </button>
                        <button onClick={() => run('excel')} disabled={loading}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
                        </button>
                        <button onClick={() => run('pdf')} disabled={loading}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}