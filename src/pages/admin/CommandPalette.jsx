/**
 * src/pages/admin/CommandPalette.jsx
 * ⌘K / Ctrl+K quick switcher for the admin panel: jump to any page, run a
 * common action, or find a client by name / phone / email / enrollment ID.
 *
 * Deliberately has no open/close animation — it's keyboard-triggered and
 * used many times a day, so any motion would just read as latency.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    CornerDownLeft,
    UserPlus,
    Salad,
    Tag,
    Wallet,
    BellRing,
    User,
    Loader2,
    MessageCircle,
    Megaphone,
} from 'lucide-react';

import { NAV_GROUPS, EXTRA_PAGES } from './adminNav';
import { searchEnrollments } from './adminApi';
import { useDebounce } from './useDebounce';

const QUICK_ACTIONS = [
    { to: '/admin/manual-enrollment', icon: UserPlus, label: 'Add a client / record offline payment', keywords: 'new enrollment manual cash upi' },
    { to: '/admin/diet-plans/new', icon: Salad, label: 'Create a diet plan', keywords: 'new nutrition meal' },
    { to: '/admin/whatsapp?tab=queue', icon: MessageCircle, label: "Send today's WhatsApp messages", keywords: 'queue whatsapp broadcast' },
    { to: '/admin/whatsapp?tab=broadcasts', icon: Megaphone, label: 'New WhatsApp broadcast', keywords: 'promotion offer campaign bulk' },
    { to: '/admin/coupons', icon: Tag, label: 'Create a coupon', keywords: 'discount promo' },
    { to: '/admin/balance-due', icon: Wallet, label: 'Collect a pending balance', keywords: 'payment due reminder' },
    { to: '/admin/follow-ups', icon: BellRing, label: 'Review due follow-ups', keywords: 'check-in' },
];

const PAGES = [
    ...NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.title }))),
    ...EXTRA_PAGES,
];

function matches(item, q) {
    if (!q) return true;
    const hay = `${item.label} ${item.group || ''} ${item.keywords || ''}`.toLowerCase();
    // Every typed word must appear somewhere — "bal due" finds Balance Due.
    return q.split(/\s+/).every((w) => hay.includes(w));
}

function titleCase(s) {
    return (s || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function useCommandPaletteShortcut(setOpen) {
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setOpen]);
}

export default function CommandPalette({ open, onClose }) {
    const navigate = useNavigate();
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const restoreFocusRef = useRef(null);

    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [clients, setClients] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    const q = query.trim().toLowerCase();
    const debouncedQ = useDebounce(q, 250);

    // Reset + focus on open; restore focus to the trigger on close.
    useEffect(() => {
        if (open) {
            restoreFocusRef.current = document.activeElement;
            setQuery('');
            setActive(0);
            setClients([]);
            setSearchError('');
            requestAnimationFrame(() => inputRef.current?.focus());
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
                restoreFocusRef.current?.focus?.();
            };
        }
    }, [open]);

    // Live client search. A request id guards against a slow earlier
    // response overwriting the results of a newer query.
    const reqIdRef = useRef(0);
    useEffect(() => {
        if (!open) return;
        if (debouncedQ.length < 2) {
            setClients([]);
            setSearching(false);
            setSearchError('');
            return;
        }
        const id = ++reqIdRef.current;
        setSearching(true);
        setSearchError('');
        searchEnrollments(debouncedQ)
            .then((rows) => {
                if (id === reqIdRef.current) setClients((rows || []).slice(0, 6));
            })
            .catch(() => {
                if (id === reqIdRef.current) {
                    setClients([]);
                    setSearchError('Client search failed. Check your connection and try again.');
                }
            })
            .finally(() => {
                if (id === reqIdRef.current) setSearching(false);
            });
    }, [debouncedQ, open]);

    const sections = useMemo(() => {
        const out = [];
        if (clients.length) {
            out.push({
                title: 'Clients',
                items: clients.map((c) => ({
                    key: `client-${c.id}`,
                    icon: User,
                    label: titleCase(c.customer_name) || c.customer_email || 'Unnamed client',
                    hint: [c.enrollment_id, c.customer_phone, c.coaching_type].filter(Boolean).join(' · '),
                    to: `/admin/enrollments?focus=${encodeURIComponent(c.id)}`,
                })),
            });
        }
        const actions = QUICK_ACTIONS.filter((a) => matches(a, q));
        if (actions.length) {
            out.push({ title: 'Quick actions', items: actions.map((a) => ({ ...a, key: `act-${a.label}` })) });
        }
        const pages = PAGES.filter((p) => matches(p, q));
        if (pages.length) {
            out.push({
                title: 'Go to',
                items: pages.map((p) => ({ ...p, key: `page-${p.to}`, hint: p.group })),
            });
        }
        return out;
    }, [clients, q]);

    const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);

    // Keep the highlighted row valid as results change underneath it.
    useEffect(() => {
        setActive((i) => Math.min(i, Math.max(flat.length - 1, 0)));
    }, [flat.length]);

    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-index="${active}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    if (!open) return null;

    const go = (item) => {
        if (!item) return;
        onClose();
        navigate(item.to);
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (flat.length ? (i + 1) % flat.length : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            go(flat[active]);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        } else if (e.key === 'Tab') {
            // Single-field dialog — keep focus inside it.
            e.preventDefault();
        }
    };

    let index = -1;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[12vh]"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
                className="w-full max-w-xl rounded-2xl overflow-hidden"
                style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(231,23,99,0.08)',
                }}
            >
                <div className="flex items-center gap-3 px-4 h-14" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {searching
                        ? <Loader2 className="w-4 h-4 text-white/40 animate-spin flex-shrink-0" aria-hidden="true" />
                        : <Search className="w-4 h-4 text-white/40 flex-shrink-0" aria-hidden="true" />}
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Search clients, pages, actions…"
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 !border-0 !shadow-none"
                        role="combobox"
                        aria-expanded="true"
                        aria-controls="cmdk-list"
                        aria-activedescendant={flat[active] ? `cmdk-${active}` : undefined}
                        aria-autocomplete="list"
                        data-cmdk-input=""
                        spellCheck={false}
                        autoComplete="off"
                    />
                    <kbd className="hidden sm:inline text-[10px] font-semibold text-white/30 px-1.5 py-0.5 rounded border border-white/10">
                        Esc
                    </kbd>
                </div>

                <div ref={listRef} id="cmdk-list" role="listbox" className="max-h-[55vh] overflow-y-auto py-2">
                    {searchError && (
                        <p className="px-4 py-2 text-xs text-red-400">{searchError}</p>
                    )}

                    {sections.map((section) => (
                        <div key={section.title} role="group" aria-label={section.title} className="pb-1">
                            <p className="px-4 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-white/25">
                                {section.title}
                            </p>
                            {section.items.map((item) => {
                                index += 1;
                                const i = index;
                                const isActive = i === active;
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.key}
                                        id={`cmdk-${i}`}
                                        data-index={i}
                                        role="option"
                                        aria-selected={isActive}
                                        onMouseMove={() => setActive(i)}
                                        onClick={() => go(item)}
                                        className="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm"
                                        style={isActive ? { background: 'rgba(231,23,99,0.12)' } : undefined}
                                    >
                                        <Icon
                                            className="w-4 h-4 flex-shrink-0"
                                            style={{ color: isActive ? '#e71763' : 'rgba(255,255,255,0.4)' }}
                                            aria-hidden="true"
                                        />
                                        <span className={`truncate font-medium ${isActive ? 'text-white' : 'text-white/75'}`}>
                                            {item.label}
                                        </span>
                                        {item.hint && (
                                            <span className="ml-auto pl-3 text-[11px] text-white/30 truncate max-w-[45%]">
                                                {item.hint}
                                            </span>
                                        )}
                                        {isActive && (
                                            <CornerDownLeft className={`w-3.5 h-3.5 text-white/40 flex-shrink-0 ${item.hint ? '' : 'ml-auto'}`} aria-hidden="true" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {!flat.length && !searching && (
                        <div className="px-4 py-10 text-center">
                            <p className="text-sm text-white/60">No matches for “{query.trim()}”</p>
                            <p className="text-xs text-white/30 mt-1">
                                Try a client's name, phone number, or enrollment ID.
                            </p>
                        </div>
                    )}
                </div>

                <div
                    className="hidden sm:flex items-center gap-4 px-4 h-10 text-[11px] text-white/30"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
                >
                    <span><kbd className="font-semibold text-white/50">↑↓</kbd> navigate</span>
                    <span><kbd className="font-semibold text-white/50">↵</kbd> open</span>
                    <span className="ml-auto">Type 2+ characters to search clients</span>
                </div>
            </div>
        </div>
    );
}
