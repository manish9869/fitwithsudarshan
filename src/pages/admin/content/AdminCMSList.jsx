// src/pages/admin/AdminCMSList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Loader2, AlertCircle, Search, ImageIcon } from 'lucide-react';
import { CMS_CONFIGS } from './cmsConfigs';
import { listCmsRows, createCmsRow, updateCmsRow, deleteCmsRow } from './cmsApi';
import { ImageField } from './SettingsFields';
import { useToast } from '../ToastProvider';
import PaginationBar from '../PaginationBar';

function fieldDefault(field) {
    if (field.type === 'boolean') return field.default ?? false;
    if (field.type === 'number') return field.default ?? 0;
    if (field.type === 'list') return '';
    if (field.type === 'json') return field.default ?? '[]';
    return field.default ?? '';
}

function rowToForm(config, row) {
    const form = {};
    for (const f of config.fields) {
        if (!row) { form[f.key] = fieldDefault(f); continue; }
        if (f.type === 'list') form[f.key] = Array.isArray(row[f.key]) ? row[f.key].join(', ') : '';
        // JSONB columns come back from Supabase already parsed (array/object)
        // — pretty-print to a string for the textarea, falling back to the
        // field's default (also a JSON string) when the row has no value yet.
        else if (f.type === 'json') form[f.key] = row[f.key] != null ? JSON.stringify(row[f.key], null, 2) : fieldDefault(f);
        else form[f.key] = row[f.key] ?? fieldDefault(f);
    }
    return form;
}

function formToPayload(config, form) {
    const payload = {};
    for (const f of config.fields) {
        if (f.type === 'list') payload[f.key] = form[f.key].split(',').map((s) => s.trim()).filter(Boolean);
        else if (f.type === 'number') payload[f.key] = Number(form[f.key]) || 0;
        else if (f.type === 'json') {
            try { payload[f.key] = JSON.parse(form[f.key]); }
            catch { throw new Error(`"${f.label}" is not valid JSON — check for a missing comma or bracket.`); }
        }
        else payload[f.key] = form[f.key];
    }
    return payload;
}

function RowModal({ config, editing, onClose, onSaved }) {
    const [form, setForm] = useState(() => rowToForm(config, editing));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const toast = useToast();
    const isEdit = !!editing;

    const set = (key) => (e) => {
        const val = e?.target?.type === 'checkbox' ? e.target.checked : e?.target ? e.target.value : e;
        setForm((f) => ({ ...f, [key]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            const payload = formToPayload(config, form);
            const saved = isEdit
                ? await updateCmsRow(config.table, editing[config.idKey], payload)
                : await createCmsRow(config.table, payload);
            toast.success(isEdit ? 'Updated' : 'Created');
            onSaved(saved);
        } catch (err) {
            setError(err.message); toast.error(err.message);
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl"
                style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.1)' }}
                onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 flex items-center justify-between px-6 py-4"
                    style={{ background: 'rgba(14,14,22,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <h3 className="font-black text-white">{isEdit ? 'Edit' : 'New'} {config.title.slice(0, -1)}</h3>
                    <button onClick={onClose}><X className="w-4 h-4 text-white/40" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                    {config.fields.map((f) => (
                        <div key={f.key}>
                            <label className="text-[10px] text-white/35 uppercase tracking-widest mb-1.5 block">{f.label}</label>
                            {f.type === 'boolean' ? (
                                <label className="flex items-center gap-2 text-sm text-white/70">
                                    <input type="checkbox" checked={!!form[f.key]} onChange={set(f.key)} className="accent-primary w-4 h-4" />
                                    {form[f.key] ? 'Yes' : 'No'}
                                </label>
                            ) : f.type === 'image' ? (
                                <ImageField
                                    value={form[f.key] || ''}
                                    onChange={(url) => setForm((s) => ({ ...s, [f.key]: url }))}
                                    folder={f.folder || 'uploads'}
                                />
                            ) : f.type === 'textarea' ? (
                                <textarea rows={f.big ? 8 : 3} value={form[f.key]} onChange={set(f.key)}
                                    disabled={isEdit && f.lockOnEdit}
                                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 resize-none" />
                            ) : f.type === 'json' ? (
                                <textarea rows={f.big ? 16 : 6} value={form[f.key]} onChange={set(f.key)}
                                    disabled={isEdit && f.lockOnEdit}
                                    spellCheck={false}
                                    className="w-full rounded-lg px-3 py-2.5 text-xs text-white bg-white/5 border border-white/10 resize-y font-mono" />
                            ) : f.type === 'select' ? (
                                <select value={form[f.key]} onChange={set(f.key)}
                                    disabled={isEdit && f.lockOnEdit}
                                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 disabled:opacity-50">
                                    {(f.options || []).map((opt) => (
                                        <option key={opt} value={opt} style={{ background: '#0e0e16' }}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={f.type === 'number' ? 'number' : 'text'}
                                    value={form[f.key]}
                                    onChange={set(f.key)}
                                    disabled={isEdit && f.lockOnEdit}
                                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 disabled:opacity-50" />
                            )}
                        </div>
                    ))}
                </form>
                <div className="sticky bottom-0 p-6 pt-4" style={{ background: 'rgba(14,14,22,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={handleSubmit} disabled={saving}
                        className="w-full py-3 rounded-xl text-sm font-black text-white disabled:opacity-40 flex items-center justify-center gap-2"
                        style={{ background: '#e71763' }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function AdminCMSList() {
    const { table } = useParams();
    const config = { ...CMS_CONFIGS[table], table };
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [editing, setEditing] = useState(null);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try { setRows(await listCmsRows(table)); }
        catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); setSearch(''); setPage(1); }, [table]);
    useEffect(() => { setPage(1); }, [search]);

    const hasActiveField = config.fields?.some((f) => f.key === 'active');

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.trim().toLowerCase();
        const fields = config.searchFields || [config.titleField, config.subtitleField].filter(Boolean);
        return rows.filter((row) =>
            fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q))
        );
    }, [rows, search, config.searchFields, config.titleField, config.subtitleField]);

    // Fetching everything in one shot and paginating client-side (rather
    // than teaching every CMS table's list endpoint limit/offset) is enough
    // headroom for how big these tables actually get — even diet_foods'
    // 1000+ rows is a sub-second JSON fetch, the DOM render is what needed
    // capping. Same PaginationBar (numbered pages + row-size picker) used
    // by Enrollments/Assessments/Logs, for a consistent admin-wide feel.
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageSafe = Math.min(page, totalPages);
    const paged = useMemo(() => {
        const start = (pageSafe - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, pageSafe, pageSize]);

    if (!config.fields) return <div className="text-white/40">Unknown content type: {table}</div>;

    const handleDelete = async () => {
        try {
            await deleteCmsRow(table, deleteTarget[config.idKey]);
            setRows((r) => r.filter((row) => row[config.idKey] !== deleteTarget[config.idKey]));
            toast.success('Deleted');
        } catch (e) { toast.error(e.message); }
        finally { setDeleteTarget(null); }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">{config.title}</h1>
                    <p className="text-xs text-white/35 mt-0.5">{rows.length} {rows.length === 1 ? 'entry' : 'entries'}</p>
                </div>
                <button onClick={() => setCreating(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763' }}>
                    <Plus className="w-3.5 h-3.5" /> New
                </button>
            </div>

            <div className="relative mb-4 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${config.title.toLowerCase()}…`}
                    className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {config.imageField && <th className="w-16 px-4 py-3"></th>}
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Name</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35 hidden sm:table-cell">Details</th>
                                    {hasActiveField && <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-white/35">Status</th>}
                                    <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-white/35">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map((row) => (
                                    <tr key={row[config.idKey]} className="transition-colors"
                                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}>
                                        {config.imageField && (
                                            <td className="px-4 py-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    {row[config.imageField] ? (
                                                        <img src={row[config.imageField]} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-3.5 h-3.5 text-white/15" />
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-white">
                                                {row[config.titleField] || row[config.idKey]}
                                            </p>
                                            <p className="text-xs text-white/35 sm:hidden">
                                                {row[config.subtitleField] || ''}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="text-xs text-white/45">{row[config.subtitleField] || '—'}</span>
                                        </td>
                                        {hasActiveField && (
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                                                    style={row.active
                                                        ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
                                                    {row.active ? 'Active' : 'Hidden'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <button onClick={() => setEditing(row)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(row)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <p className="text-center py-12 text-sm text-white/25">
                            {rows.length === 0 ? 'No records yet.' : 'No results match your search.'}
                        </p>
                    )}
                    {filtered.length > 0 && (
                        <PaginationBar
                            page={pageSafe}
                            totalPages={totalPages}
                            totalItems={filtered.length}
                            pageSize={pageSize}
                            onPageChange={setPage}
                            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
                        />
                    )}
                </div>
            )}

            <AnimatePresence>
                {(creating || editing) && (
                    <RowModal
                        config={config}
                        editing={editing}
                        onClose={() => { setCreating(false); setEditing(null); }}
                        onSaved={(saved) => {
                            setRows((r) => {
                                const exists = r.some((row) => row[config.idKey] === saved[config.idKey]);
                                return exists ? r.map((row) => (row[config.idKey] === saved[config.idKey] ? saved : row)) : [...r, saved];
                            });
                            setCreating(false); setEditing(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {deleteTarget && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
                    <div className="relative w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: '#0e0e16', border: '1px solid rgba(239,68,68,0.25)' }} onClick={(e) => e.stopPropagation()}>
                        <p className="font-bold text-white text-sm mb-4">Delete this record permanently?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl text-sm text-white/50" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#ef4444' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}