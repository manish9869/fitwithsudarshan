// src/pages/admin/diet/DietWorkoutTemplateEditor.jsx
// Visual day-by-day builder for a single diet_workout_templates row —
// same rationale as DietTemplateEditor.jsx: pick exercises from a list
// instead of hand-writing `[["push-ups","squats"], ...]` JSON.
//
// Template ID and Sort Order are intentionally NOT shown — same reasoning
// as the Diet Template editor: auto-slugged from the name (silent numeric
// suffix on a rare collision) and auto-appended after the current highest
// sort order.
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Search, Save, Repeat2, CalendarDays,
} from 'lucide-react';
import { listCmsRows, createCmsRow, updateCmsRow } from '../content/cmsApi';
import { TextInput, TextArea, ToggleField } from '../content/SettingsFields';
import { useToast } from '../ToastProvider';
import Modal from './DietModal';

const DAY_COUNT_PRESETS = [7, 10, 15, 30];

const card = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' };
const inputCard = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

function uniqueId(base, existingIds) {
    if (!base) return base;
    if (!existingIds.has(base)) return base;
    let n = 2;
    while (existingIds.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
}

export default function DietWorkoutTemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exercises, setExercises] = useState([]);
    const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
    const [existingTemplates, setExistingTemplates] = useState([]);

    const [templateId, setTemplateId] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(true);
    // true = exactly one day, which the rotation engine
    // (exerciseDays[i % exerciseDays.length]) already repeats forever.
    const [sameEveryDay, setSameEveryDay] = useState(true);
    // Each day is a plain array of exercise ids — an empty array is a
    // legitimate Rest Day in the rotation, not an error state.
    const [days, setDays] = useState([[]]);
    const [currentDay, setCurrentDay] = useState(0);

    const [exercisePicker, setExercisePicker] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [exerciseRows, templateRows] = await Promise.all([
                    listCmsRows('diet_exercises'),
                    listCmsRows('diet_workout_templates'),
                ]);
                setExercises(exerciseRows.filter((e) => e.active));

                if (!isNew) {
                    setExistingTemplates(templateRows.filter((r) => r.id !== id));
                    const row = templateRows.find((r) => r.id === id);
                    if (!row) { toast.error('Template not found'); navigate('/admin/workout-templates'); return; }
                    setTemplateId(row.id);
                    setSortOrder(row.sort_order || 0);
                    setName(row.name || '');
                    setDescription(row.description || '');
                    setActive(row.active !== false);
                    const loadedDays = (row.exercise_days || []).map((d) => (Array.isArray(d) ? d : []));
                    setDays(loadedDays.length ? loadedDays : [[]]);
                    setSameEveryDay(loadedDays.length <= 1);
                } else {
                    setExistingTemplates(templateRows);
                }
            } catch (e) {
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const setDayCount = (n) => {
        setDays((prev) => {
            const next = [];
            for (let i = 0; i < n; i++) next.push(i < prev.length ? prev[i] : []);
            return next;
        });
        setCurrentDay((c) => Math.min(c, n - 1));
    };
    const handleSameEveryDayChange = (val) => {
        setSameEveryDay(val);
        if (val) {
            setDays((prev) => [prev[currentDay] || prev[0] || []]);
            setCurrentDay(0);
        } else if (days.length <= 1) {
            setDayCount(7);
        }
    };

    const addDay = () => { setDays((d) => [...d, []]); setCurrentDay(days.length); };
    const removeDay = (idx) => {
        setDays((d) => d.filter((_, i) => i !== idx));
        setCurrentDay((c) => Math.max(0, Math.min(c, days.length - 2)));
    };
    const addExercise = (ex) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : [...d, ex.id]));
        toast.success(`Added ${ex.name}`);
    };
    const removeExercise = (idx) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : d.filter((_, ei) => ei !== idx)));
    };

    const filteredExercises = useMemo(() => {
        if (!exerciseSearch.trim()) return exercises;
        const q = exerciseSearch.trim().toLowerCase();
        return exercises.filter((e) => e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q));
    }, [exercises, exerciseSearch]);

    const activeDay = days[currentDay] || [];
    const dayExerciseCounts = useMemo(() => {
        const counts = new Map();
        activeDay.forEach((eid) => counts.set(eid, (counts.get(eid) || 0) + 1));
        return counts;
    }, [activeDay]);

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Template name is required'); return; }

        const existingIds = new Set(existingTemplates.map((t) => t.id));
        const baseId = isNew ? (templateId.trim() || slugify(name)) : id;
        const finalId = isNew ? uniqueId(baseId, existingIds) : baseId;
        if (!finalId) { toast.error('Could not generate a template ID from that name — try adding a letter or number'); return; }
        const finalSortOrder = isNew
            ? existingTemplates.reduce((max, t) => Math.max(max, t.sort_order || 0), 0) + 1
            : sortOrder;

        const payload = {
            name: name.trim(),
            description,
            sort_order: finalSortOrder,
            active,
            exercise_days: days,
        };

        setSaving(true);
        try {
            if (isNew) {
                let attemptId = finalId;
                let saved;
                for (let attempt = 0; attempt < 5; attempt++) {
                    try {
                        saved = await createCmsRow('diet_workout_templates', { id: attemptId, ...payload });
                        break;
                    } catch (e) {
                        if (attempt < 4 && /duplicate key/i.test(e.message || '')) { attemptId = `${finalId}-${attempt + 2}`; continue; }
                        throw e;
                    }
                }
                toast.success('Template created');
                navigate(`/admin/workout-templates/${saved.id}`, { replace: true });
            } else {
                await updateCmsRow('diet_workout_templates', id, payload);
                toast.success('Template saved');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to save template');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-10">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">{isNew ? 'New Workout Template' : `Editing: ${name || 'Template'}`}</h1>
                    <p className="text-xs text-white/35 mt-1">An exercise rotation used alongside a Diet Plan Template.</p>
                </div>
                <button onClick={() => navigate('/admin/workout-templates')} className="text-xs font-bold text-white/40 hover:text-white/70">← Back to Templates</button>
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <p className="text-sm font-black text-white">Template Details</p>
                <TextInput label="Template Name" value={name} onChange={setName} placeholder="e.g. Home Workout" />
                <TextArea label="Description" value={description} onChange={setDescription} rows={2} placeholder="A short summary shown to the admin when picking a template" />
                <ToggleField label="Active" checked={active} onChange={setActive} hint="Only active templates show up in the Diet Plan Builder" />
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <p className="text-sm font-black text-white">Days</p>

                <div className="grid sm:grid-cols-2 gap-3">
                    <button onClick={() => handleSameEveryDayChange(true)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={sameEveryDay ? { background: '#e71763', color: 'white' } : card}>
                        <Repeat2 className="w-5 h-5 mb-2" />
                        <p className="font-black text-sm mb-0.5">Same Workout Every Day</p>
                        <p className="text-xs opacity-75">One day repeats for the whole plan — simplest</p>
                    </button>
                    <button onClick={() => handleSameEveryDayChange(false)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={!sameEveryDay ? { background: '#e71763', color: 'white' } : card}>
                        <CalendarDays className="w-5 h-5 mb-2" />
                        <p className="font-black text-sm mb-0.5">Different Workout Each Day</p>
                        <p className="text-xs opacity-75">Plan several distinct days that rotate — e.g. push/pull/legs/rest</p>
                    </button>
                </div>

                {!sameEveryDay && (
                    <div>
                        <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">How Many Distinct Days?</label>
                        <div className="grid grid-cols-4 gap-2">
                            {DAY_COUNT_PRESETS.map((n) => (
                                <button key={n} onClick={() => setDayCount(n)}
                                    className="p-2.5 rounded-xl text-center font-black transition-all"
                                    style={days.length === n ? { background: '#e71763', color: 'white' } : { ...inputCard, color: 'rgba(255,255,255,0.6)' }}>
                                    <div className="text-base">{n}</div>
                                    <div className="text-[9px] opacity-70">Days</div>
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-white/25 mt-1.5">A plan longer than this rotates back to Day 1. An empty day is a Rest Day. Use +/- Day below for a number in between.</p>

                        <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
                            <button onClick={() => setCurrentDay((d) => Math.max(0, d - 1))} disabled={currentDay === 0}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                            {days.map((d, i) => (
                                <button key={i} onClick={() => setCurrentDay(i)}
                                    className="w-9 h-9 rounded-lg text-xs font-bold flex-shrink-0"
                                    style={currentDay === i ? { background: '#e71763', color: 'white' } : d.length === 0 ? { border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' } : { ...inputCard, color: 'rgba(255,255,255,0.6)' }}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentDay((d) => Math.min(days.length - 1, d + 1))} disabled={currentDay === days.length - 1}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                            <button onClick={addDay}
                                className="flex items-center gap-1 px-3 h-9 rounded-lg text-xs font-bold"
                                style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                                <Plus className="w-3 h-3" /> Add Day
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between rounded-xl p-4" style={inputCard}>
                    <div>
                        <p className="text-sm font-black text-white">{sameEveryDay ? 'Day Plan (repeats every day)' : `Day ${currentDay + 1} of ${days.length}`}</p>
                        <p className="text-xs text-white/35 mt-0.5">{activeDay.length === 0 ? 'Rest day — no exercises' : `${activeDay.length} exercise${activeDay.length === 1 ? '' : 's'}`}</p>
                    </div>
                    {!sameEveryDay && (
                        <button onClick={() => removeDay(currentDay)} disabled={days.length <= 1}
                            className="text-xs font-bold text-red-400/70 hover:text-red-400 disabled:opacity-20 flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Remove Day
                        </button>
                    )}
                </div>

                {activeDay.length === 0 ? (
                    <p className="text-xs text-white/25 italic text-center py-2">No exercises added — this day will be a rest day.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {activeDay.map((eid, ei) => {
                            const ex = exercisesById.get(eid);
                            return (
                                <span key={ei} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-semibold text-white"
                                    style={ex ? { background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.28)' } : { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                                    {ex ? ex.name : `Unknown exercise (${eid})`}
                                    <button onClick={() => removeExercise(ei)} className="w-4 h-4 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15">
                                        <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}
                <button onClick={() => { setExercisePicker(true); setExerciseSearch(''); }}
                    className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                    style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
                    <Plus className="w-3 h-3" /> Add Exercise
                </button>
            </div>

            <div className="flex items-center justify-between pt-2">
                <button onClick={() => navigate('/admin/workout-templates')}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/50" style={inputCard}>
                    Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: '#e71763' }}>
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {isNew ? 'Create Template' : 'Save Template'}
                </button>
            </div>

            {exercisePicker && (
                <Modal title="Add Exercise" onClose={() => setExercisePicker(false)} wide>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} autoFocus
                            placeholder="Search exercises…" className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto">
                        {filteredExercises.map((ex) => {
                            const addedCount = dayExerciseCounts.get(ex.id) || 0;
                            return (
                                <button key={ex.id} onClick={() => addExercise(ex)}
                                    className="flex items-center justify-between p-3 rounded-lg text-left hover:border-pink-500/40 transition-colors"
                                    style={addedCount > 0 ? { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.35)' } : inputCard}>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                            {ex.name}
                                            {addedCount > 0 && <span className="text-[10px] font-black flex-shrink-0" style={{ color: '#34d399' }}>{addedCount > 1 ? `×${addedCount}` : 'Added'}</span>}
                                        </p>
                                        <p className="text-xs text-white/35">{ex.duration || `${ex.sets} x ${ex.reps}`}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="text-sm font-bold" style={{ color: '#e71763' }}>~{ex.calories_burned}</p>
                                        <p className="text-xs text-white/35">kcal</p>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredExercises.length === 0 && <p className="text-sm text-white/30 text-center py-8 col-span-2">No exercises match.</p>}
                    </div>
                </Modal>
            )}
        </div>
    );
}
