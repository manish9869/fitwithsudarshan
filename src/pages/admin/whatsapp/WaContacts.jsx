/**
 * Contacts & groups — who can receive WhatsApp messages.
 */
import { useCallback, useEffect, useState } from 'react';
import { Plus, Upload, RefreshCw, Loader2, Users, Search, Trash2, BellOff, Bell, UserPlus, UserMinus, Pencil, X, Contact } from 'lucide-react';
import { waApi } from '../adminApi';
import { useToast } from '../ToastProvider';
import { useDebounce } from '../useDebounce';
import PaginationBar from '../PaginationBar';
import { card, btnGhost, btnPrimary, labelCls, inputCls, formatPhone, EmptyState, PINK } from './waShared';

function Modal({ title, onClose, children }) {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl p-5" style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white">{title}</h3>
                    <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function WaContacts({ groups, tags, reloadMeta }) {
    const toast = useToast();
    const [groupId, setGroupId] = useState('');
    const [search, setSearch] = useState('');
    const [tag, setTag] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [data, setData] = useState({ rows: [], total: 0, size: 50 });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(new Set());
    const [modal, setModal] = useState(null); // 'add' | 'import' | 'group' | {edit: contact} | {editGroup: group}
    const [form, setForm] = useState({});
    const [busy, setBusy] = useState(false);
    const dSearch = useDebounce(search.trim(), 300);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await waApi.contacts({ search: dSearch, tag, groupId, page, size: pageSize });
            setData(r);
            setSelected(new Set());
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    }, [dSearch, tag, groupId, page, pageSize, toast]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [dSearch, tag, groupId, pageSize]);

    const refreshAll = () => { load(); reloadMeta(); };

    const run = async (fn, okMsg) => {
        setBusy(true);
        try {
            const r = await fn();
            if (okMsg) toast.success(typeof okMsg === 'function' ? okMsg(r) : okMsg);
            setModal(null);
            setForm({});
            refreshAll();
        } catch (e) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const sync = () => run(() => waApi.syncContacts(), (r) => `Synced from website: ${r.added} new, ${r.updated} updated`);

    const toggleOptOut = (c) => run(
        () => waApi.updateContact(c.id, { opted_out: !c.opted_out }),
        c.opted_out ? `${c.name || 'Contact'} will receive messages again` : `${c.name || 'Contact'} won't be messaged again`,
    );

    const removeContact = (c) => {
        if (!window.confirm(`Delete ${c.name || formatPhone(c.phone)}? Prefer "Stop messages" if they just don't want promotions.`)) return;
        run(() => waApi.deleteContact(c.id), 'Contact deleted');
    };

    const addSelectedToGroup = (gid) => run(() => waApi.addMembers(gid, { contactIds: [...selected] }), (r) => `Added ${r.added} to group`);
    const removeSelectedFromGroup = () => run(() => waApi.removeMembers(groupId, [...selected]), (r) => `Removed ${r.removed} from group`);

    const deleteGroup = (g) => {
        if (!window.confirm(`Delete group "${g.name}"? Contacts are kept; sequences using it will stop.`)) return;
        if (groupId === g.id) setGroupId('');
        run(() => waApi.deleteGroup(g.id), 'Group deleted');
    };

    const allChecked = data.rows.length > 0 && data.rows.every((r) => selected.has(r.id));
    const groupName = (id) => groups.find((g) => g.id === id)?.name;

    return (
        <div className="grid lg:grid-cols-[220px_1fr] gap-5 items-start">
            {/* Groups */}
            <aside className="rounded-2xl p-2" style={card}>
                <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Groups</p>
                    <button onClick={() => { setForm({}); setModal('group'); }} aria-label="New group" className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={() => setGroupId('')} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left"
                    style={!groupId ? { background: 'rgba(231,23,99,0.12)', color: '#fff' } : { color: 'rgba(255,255,255,0.55)' }}>
                    <Contact className="w-4 h-4" /> All contacts
                </button>
                {groups.map((g) => (
                    <div key={g.id} className="group flex items-center rounded-xl" style={groupId === g.id ? { background: 'rgba(231,23,99,0.12)' } : undefined}>
                        <button onClick={() => setGroupId(g.id)} className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 text-sm text-left"
                            style={{ color: groupId === g.id ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{g.name}</span>
                            <span className="ml-auto text-xs text-white/30 tabular-nums">{g.memberCount}</span>
                        </button>
                        <button onClick={() => { setForm({ name: g.name, description: g.description || '' }); setModal({ editGroup: g }); }} aria-label={`Rename ${g.name}`} className="p-1.5 text-white/25 hover:text-white opacity-0 group-hover:opacity-100 focus:opacity-100"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteGroup(g)} aria-label={`Delete ${g.name}`} className="p-1.5 mr-1 text-white/25 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
                {!groups.length && <p className="px-3 py-2 text-xs text-white/30">Make lists like “Diwali leads” or “Jan challenge batch”.</p>}
            </aside>

            <div className="space-y-3 min-w-0">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone" className={inputCls + ' pl-8'} />
                    </div>
                    <select value={tag} onChange={(e) => setTag(e.target.value)} className={inputCls + ' !w-auto'} aria-label="Filter by tag">
                        <option value="">All tags</option>
                        {tags.map((t) => <option key={t.tag} value={t.tag}>{t.tag} ({t.count})</option>)}
                    </select>
                    <button onClick={sync} disabled={busy} className={btnGhost} title="Pull clients, leads and assessments from the website">
                        <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Sync
                    </button>
                    <button onClick={() => { setForm({ groupId }); setModal('import'); }} className={btnGhost}><Upload className="w-4 h-4" /> Import</button>
                    <button onClick={() => { setForm({ groupIds: groupId ? [groupId] : [] }); setModal('add'); }} className={btnPrimary} style={{ background: PINK }}><Plus className="w-4 h-4" /> Add</button>
                </div>

                {selected.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(231,23,99,0.08)', border: '1px solid rgba(231,23,99,0.25)' }}>
                        <span className="text-sm text-white font-semibold">{selected.size} selected</span>
                        <div className="flex-1" />
                        <select defaultValue="" onChange={(e) => { if (e.target.value) addSelectedToGroup(e.target.value); e.target.value = ''; }} className={inputCls + ' !w-auto !py-1.5'} aria-label="Add selected to group">
                            <option value="">Add to group…</option>
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        {groupId && (
                            <button onClick={removeSelectedFromGroup} className={btnGhost + ' !py-1.5'}><UserMinus className="w-4 h-4" /> Remove from {groupName(groupId)}</button>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 text-white/30 animate-spin" /></div>
                ) : data.rows.length === 0 ? (
                    <EmptyState icon={UserPlus}
                        title={dSearch || tag ? 'No contacts match' : groupId ? 'This group is empty' : 'No contacts yet'}
                        text={groupId ? 'Select contacts under “All contacts” and use “Add to group”, or import a list straight into this group.' : 'Pull every client, lead and assessment from your website in one click, or import a list.'}
                        action={!groupId && !dSearch && !tag && <button onClick={sync} className={btnPrimary} style={{ background: PINK }}><RefreshCw className="w-4 h-4" /> Sync from website</button>} />
                ) : (
                    <div className="rounded-2xl overflow-x-auto" style={card}>
                        <table className="w-full text-sm min-w-[640px]">
                            <thead>
                                <tr className="text-left text-[10px] uppercase tracking-wider text-white/30" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <th className="pl-4 py-2.5 w-8">
                                        <input type="checkbox" aria-label="Select all" checked={allChecked} className="accent-primary w-4 h-4"
                                            onChange={(e) => setSelected(e.target.checked ? new Set(data.rows.map((r) => r.id)) : new Set())} />
                                    </th>
                                    <th className="px-3 py-2.5">Name</th>
                                    <th className="px-3 py-2.5">Phone</th>
                                    <th className="px-3 py-2.5">Tags & groups</th>
                                    <th className="px-3 py-2.5 text-right pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.rows.map((c) => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: c.opted_out ? 0.55 : 1 }}>
                                        <td className="pl-4 py-2.5">
                                            <input type="checkbox" aria-label={`Select ${c.name}`} className="accent-primary w-4 h-4" checked={selected.has(c.id)}
                                                onChange={(e) => setSelected((s) => { const n = new Set(s); e.target.checked ? n.add(c.id) : n.delete(c.id); return n; })} />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <p className="text-white font-medium">{c.name || <span className="text-white/30">Unnamed</span>}</p>
                                            {c.opted_out && <p className="text-[11px] text-amber-400">Stopped messages</p>}
                                        </td>
                                        <td className="px-3 py-2.5 text-white/60 tabular-nums whitespace-nowrap">{formatPhone(c.phone)}</td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-wrap gap-1">
                                                {(c.tags || []).map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded text-white/55" style={{ background: 'rgba(255,255,255,0.06)' }}>{t}</span>)}
                                                {(c.groupIds || []).map((g) => groupName(g) && <span key={g} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(231,23,99,0.12)', color: '#ff7aa8' }}>{groupName(g)}</span>)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 pr-4">
                                            <div className="flex justify-end gap-0.5">
                                                <button onClick={() => { setForm({ name: c.name, phone: c.phone, tags: (c.tags || []).join(', '), notes: c.notes || '' }); setModal({ edit: c }); }} title="Edit" aria-label="Edit" className="p-1.5 rounded-lg text-white/35 hover:text-white hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => toggleOptOut(c)} title={c.opted_out ? 'Allow messages again' : 'Stop messages (opt out)'} aria-label={c.opted_out ? 'Allow messages' : 'Stop messages'} className="p-1.5 rounded-lg text-white/35 hover:text-amber-400 hover:bg-white/5">
                                                    {c.opted_out ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={() => removeContact(c)} title="Delete" aria-label="Delete" className="p-1.5 rounded-lg text-white/35 hover:text-red-400 hover:bg-white/5"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <PaginationBar
                    page={page}
                    pageSize={pageSize}
                    totalItems={data.total}
                    totalPages={Math.max(1, Math.ceil(data.total / pageSize))}
                    onPageChange={setPage}
                    onPageSizeChange={(n) => setPageSize(Math.min(100, n))}
                    pageSizeOptions={[25, 50, 100]}
                />
            </div>

            {/* ── Modals ── */}
            {modal === 'add' && (
                <Modal title="Add contact" onClose={() => setModal(null)}>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => waApi.createContact({ ...form, tags: (form.tags || '').split(',') }), 'Contact added'); }}>
                        <div><label className={labelCls}>Name</label><input autoFocus className={inputCls} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Riya Mehta" /></div>
                        <div><label className={labelCls}>WhatsApp number</label><input required inputMode="tel" className={inputCls} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98765 43210" /></div>
                        <div><label className={labelCls}>Tags (comma separated)</label><input className={inputCls} value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="lead, diwali" /></div>
                        {groups.length > 0 && (
                            <div><label className={labelCls}>Add to groups</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {groups.map((g) => {
                                        const on = (form.groupIds || []).includes(g.id);
                                        return <button type="button" key={g.id} onClick={() => setForm({ ...form, groupIds: on ? form.groupIds.filter((x) => x !== g.id) : [...(form.groupIds || []), g.id] })}
                                            className="px-2.5 py-1 rounded-lg text-xs" style={{ background: on ? 'rgba(231,23,99,0.15)' : 'rgba(255,255,255,0.04)', color: on ? '#fff' : 'rgba(255,255,255,0.55)', border: `1px solid ${on ? 'rgba(231,23,99,0.4)' : 'rgba(255,255,255,0.08)'}` }}>{g.name}</button>;
                                    })}
                                </div>
                            </div>
                        )}
                        <button disabled={busy} className={btnPrimary + ' w-full'} style={{ background: PINK }}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Add contact</button>
                    </form>
                </Modal>
            )}

            {modal === 'import' && (
                <Modal title="Import contacts" onClose={() => setModal(null)}>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => waApi.importContacts({ text: form.text || '', tags: (form.tags || '').split(','), groupId: form.groupId || undefined }), (r) => `Imported ${r.added} new · ${r.skippedExisting} already existed${r.invalid ? ` · ${r.invalid} invalid numbers skipped` : ''}`); }}>
                        <div>
                            <label className={labelCls}>Paste one contact per line</label>
                            <textarea autoFocus rows={8} required className={inputCls + ' font-mono text-xs'} value={form.text || ''} onChange={(e) => setForm({ ...form, text: e.target.value })}
                                placeholder={'Riya Mehta, 9876543210\nArjun Patil, +91 98200 11223\n9123456780'} />
                            <p className="text-[11px] text-white/30 mt-1">Copy two columns (name and number) straight from Excel or Google Sheets. Existing numbers are left as they are.</p>
                        </div>
                        <div><label className={labelCls}>Tag them as</label><input className={inputCls} value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="gym-walkins" /></div>
                        <div><label className={labelCls}>Put them in group</label>
                            <select className={inputCls} value={form.groupId || ''} onChange={(e) => setForm({ ...form, groupId: e.target.value })}>
                                <option value="">No group</option>
                                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                        <button disabled={busy} className={btnPrimary + ' w-full'} style={{ background: PINK }}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Import</button>
                    </form>
                </Modal>
            )}

            {(modal === 'group' || modal?.editGroup) && (
                <Modal title={modal.editGroup ? 'Rename group' : 'New group'} onClose={() => setModal(null)}>
                    <form className="space-y-3" onSubmit={(e) => {
                        e.preventDefault();
                        run(() => (modal.editGroup ? waApi.updateGroup(modal.editGroup.id, form) : waApi.createGroup(form)), modal.editGroup ? 'Group updated' : 'Group created');
                    }}>
                        <div><label className={labelCls}>Group name</label><input autoFocus required className={inputCls} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="January challenge batch" /></div>
                        <div><label className={labelCls}>Note (optional)</label><input className={inputCls} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                        {!modal.editGroup && tags.length > 0 && (
                            <p className="text-[11px] text-white/30">Tip: after creating it, filter contacts by a tag, select all, then “Add to group”.</p>
                        )}
                        <button disabled={busy} className={btnPrimary + ' w-full'} style={{ background: PINK }}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Save</button>
                    </form>
                </Modal>
            )}

            {modal?.edit && (
                <Modal title="Edit contact" onClose={() => setModal(null)}>
                    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(() => waApi.updateContact(modal.edit.id, { ...form, tags: (form.tags || '').split(',') }), 'Contact updated'); }}>
                        <div><label className={labelCls}>Name</label><input className={inputCls} value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div><label className={labelCls}>WhatsApp number</label><input inputMode="tel" className={inputCls} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                        <div><label className={labelCls}>Tags</label><input className={inputCls} value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
                        <div><label className={labelCls}>Notes</label><textarea rows={2} className={inputCls} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                        <button disabled={busy} className={btnPrimary + ' w-full'} style={{ background: PINK }}>{busy && <Loader2 className="w-4 h-4 animate-spin" />} Save</button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
