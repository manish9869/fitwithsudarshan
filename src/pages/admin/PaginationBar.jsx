import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const DEFAULT_SIZE_OPTIONS = [15, 25, 50, 100];

export default function PaginationBar({
    page, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange,
    pageSizeOptions = DEFAULT_SIZE_OPTIONS,
}) {
    const [customOpen, setCustomOpen] = useState(false);
    const [customValue, setCustomValue] = useState(String(pageSize));

    const applyCustom = () => {
        const n = Math.max(1, Math.min(500, parseInt(customValue, 10) || pageSize));
        onPageSizeChange(n);
        setCustomOpen(false);
    };

    if (!totalItems) return null;

    return (
        <div className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-white/30">
                Page {page} of {totalPages} · {totalItems} record{totalItems !== 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-white/30">Rows:</span>
                    {pageSizeOptions.map((n) => (
                        <button key={n} onClick={() => onPageSizeChange(n)}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all"
                            style={pageSize === n
                                ? { background: '#e71763', color: 'white' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                            {n}
                        </button>
                    ))}
                    <div className="relative">
                        <button onClick={() => { setCustomValue(String(pageSize)); setCustomOpen((o) => !o); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all"
                            style={!pageSizeOptions.includes(pageSize)
                                ? { background: '#e71763', color: 'white' }
                                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
                            Custom <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                        {customOpen && (
                            <div className="absolute right-0 bottom-full mb-2 z-50 flex items-center gap-1.5 p-2 rounded-xl"
                                style={{ background: '#13131f', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
                                <input type="number" min={1} max={500} value={customValue}
                                    onChange={(e) => setCustomValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
                                    className="w-16 rounded-lg px-2 py-1 text-xs text-white outline-none"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                                    autoFocus />
                                <button onClick={applyCustom}
                                    className="px-2 py-1 rounded-lg text-[11px] font-bold text-white"
                                    style={{ background: '#e71763' }}>
                                    Set
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        return (
                            <button key={p} onClick={() => onPageChange(p)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                                style={page === p ? { background: '#e71763', color: 'white' } : { color: 'rgba(255,255,255,0.35)' }}>
                                {p}
                            </button>
                        );
                    })}
                    <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-25 transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}