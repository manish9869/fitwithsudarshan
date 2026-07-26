// src/pages/admin/AdminCMSList.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Loader2, AlertCircle } from 'lucide-react';
import { CMS_CONFIGS } from './cmsConfigs';
import { listCmsRows, createCmsRow, updateCmsRow, deleteCmsRow } from './cmsApi';
import { useToast } from './ToastProvider';

function fieldDefault(field) {
    if (field.type === 'boolean') return field.default ?? false;
    if (field.type === 'number') return field.default ?? 0;
    if (field.type === 'list') return '';
    return field.default ?? '';
}

function rowToForm(config, row) {
    const form = {};
    for (const f of config.fields) {
        if (!row) { form[f.key] = fieldDefault(f); continue; }
        if (f.type === 'list') form[f.key] = Array.isArray(row[f.key]) ? row[f.key].join(', ') : '';
        else form[f.key] = row[f.key] ?? fieldDefault(f);
    }
    return form;
}

function formToPayload(config, form) {
    const payload = {};
    for (const f of config.fields) {
        if (f.type === 'list') payload[f.key] = form[f.key].split(',').map((s) => s.trim()).filter(Boolean);
        else if (f.type === 'number') payload[f.key] = Number(form[f.key]) || 0;
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
                            ) : f.type === 'textarea' ? (
                                <textarea rows={f.big ? 8 : 3} value={form[f.key]} onChange={set(f.key)}
                                    disabled={isEdit && f.lockOnEdit}
                                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 resize-none" />
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
    useEffect(() => { load(); }, [table]);

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
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-black text-white">{config.title}</h1>
                <button onClick={() => setCreating(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white"
                    style={{ background: '#e71763' }}>
                    <Plus className="w-3.5 h-3.5" /> New
                </button>
            </div>

            {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {rows.map((row) => (
                        <div key={row[config.idKey]} className="flex items-center justify-between gap-3 px-5 py-3.5"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{row.title || row.name || row.label || row[config.idKey]}</p>
                                <p className="text-xs text-white/35 truncate">{row.subtitle || row.role || row.description || ''}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => setEditing(row)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setDeleteTarget(row)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/8">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {rows.length === 0 && <p className="text-center py-12 text-sm text-white/25">No records yet.</p>}
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