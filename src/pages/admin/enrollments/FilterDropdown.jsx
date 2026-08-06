import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function FilterDropdown({
    value,
    onChange,
    options,
    minWidth = 150,
    placeholder = 'Select',
    getBadge,
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const activeOption =
        options.find((option) => option.value === value) || options[0];

    const activeBadge = getBadge
        ? getBadge(activeOption.value)
        : {
            bg: 'rgba(255,255,255,0.05)',
            border: 'rgba(255,255,255,0.1)',
            color: '#ffffff',
        };

    useEffect(() => {
        if (!open) return;

        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div ref={ref} className="relative" style={{ minWidth }}>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-all focus:outline-none"
                style={{
                    background: activeOption.value === 'all'
                        ? 'rgba(255,255,255,0.05)'
                        : activeBadge.bg,
                    border: activeOption.value === 'all'
                        ? '1px solid rgba(255,255,255,0.1)'
                        : `1px solid ${activeBadge.border}`,
                    color: activeOption.value === 'all'
                        ? 'rgba(255,255,255,0.72)'
                        : activeBadge.color,
                    boxShadow: open
                        ? '0 0 0 3px rgba(231,23,99,0.12)'
                        : 'none',
                }}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                        background:
                            activeOption.value === 'all'
                                ? 'rgba(255,255,255,0.35)'
                                : activeBadge.color,
                    }}
                />

                <span className="flex-1 text-left truncate">
                    {activeOption?.label || placeholder}
                </span>

                <ChevronDown
                    className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
                    style={{
                        opacity: 0.65,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute left-0 top-full mt-2 z-[120] rounded-xl overflow-hidden shadow-2xl"
                        style={{
                            background: '#13131f',
                            border: '1px solid rgba(255,255,255,0.12)',
                            minWidth,
                            width: '100%',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                        }}
                    >
                        {options.map((option) => {
                            const isActive = option.value === value;
                            const optionBadge = getBadge
                                ? getBadge(option.value)
                                : {
                                    color:
                                        option.value === 'all'
                                            ? 'rgba(255,255,255,0.45)'
                                            : '#e71763',
                                };

                            return (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-left transition-colors"
                                    style={{
                                        background: isActive
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.background =
                                                'rgba(255,255,255,0.04)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isActive
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'transparent';
                                    }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{
                                            background:
                                                option.value === 'all'
                                                    ? 'rgba(255,255,255,0.35)'
                                                    : optionBadge.color,
                                        }}
                                    />

                                    <span
                                        className="flex-1"
                                        style={{
                                            color: isActive
                                                ? option.value === 'all'
                                                    ? 'white'
                                                    : optionBadge.color
                                                : 'rgba(255,255,255,0.65)',
                                        }}
                                    >
                                        {option.label}
                                    </span>

                                    {isActive && (
                                        <Check
                                            className="w-3 h-3 flex-shrink-0"
                                            style={{
                                                color:
                                                    option.value === 'all'
                                                        ? 'white'
                                                        : optionBadge.color,
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
