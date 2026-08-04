// src/pages/admin/diet/DietTemplateEditor.jsx
// Visual day-by-day builder for a single diet_templates row — replaces
// raw JSON editing (AdminCMSList's generic form) with the same kind of
// pick-a-food-from-a-list interaction the Diet Plan Builder already uses,
// since the admin using this isn't from a technical background and can't
// be expected to hand-write `{ "meals": [...] }` JSON.
//
// A template only stores WHICH foods go in each meal slot (foodIds) — no
// quantities, no macros. Quantities/scaling only happen once a template is
// applied to a real plan (see dietTemplates.js's generatePlanFromTemplate),
// so this editor is deliberately simpler than DietPlanBuilder's Build Plan
// step: pick foods, not amounts.
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Search, Save,
} from 'lucide-react';
import { listCmsRows, createCmsRow, updateCmsRow } from '../content/cmsApi';
import { TextInput, TextArea, ToggleField, SelectField } from '../content/SettingsFields';
import { useToast } from '../ToastProvider';
import { formatServing } from './dietUnits';
import { FOOD_REGIONS } from './dietRegions';
import { MEAL_TYPES, OPTIONAL_MEAL_TYPES } from './dietMealTypes';
import Modal from './DietModal';

const GOALS = ['Fat Loss', 'Muscle Gain', 'Weight Maintenance', 'General Fitness'];
const DIET_PREFERENCES = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'];

const card = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' };
const inputCard = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

const emptyDay = () => ({
    restDay: false,
    meals: MEAL_TYPES.map((m) => ({ type: m.type, label: m.label, foodIds: [] })),
});

// Guarantees every current MEAL_TYPES slot exists — needed for templates
// saved before Morning Drink/Before Bed Drink existed, and for a template
// whose admin-edited JSON (from before this editor existed) is missing a
// slot entirely.
const normalizeDay = (day) => ({
    restDay: !!day?.restDay,
    meals: MEAL_TYPES.map((mt) => {
        const existing = (day?.meals || []).find((m) => m.type === mt.type);
        return { type: mt.type, label: mt.label, foodIds: existing?.foodIds || [] };
    }),
});

export default function DietTemplateEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [foods, setFoods] = useState([]);
    const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);

    const [templateId, setTemplateId] = useState('');
    const [idTouched, setIdTouched] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState(GOALS[0]);
    const [dietPreference, setDietPreference] = useState(DIET_PREFERENCES[0]);
    const [region, setRegion] = useState(FOOD_REGIONS[0]);
    const [sortOrder, setSortOrder] = useState(0);
    const [active, setActive] = useState(true);
    const [days, setDays] = useState([emptyDay()]);
    const [currentDay, setCurrentDay] = useState(0);

    const [foodPicker, setFoodPicker] = useState(null); // meal type string, or null
    const [foodSearch, setFoodSearch] = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const foodRows = await listCmsRows('diet_foods');
                setFoods(foodRows.filter((f) => f.active));

                if (!isNew) {
                    const rows = await listCmsRows('diet_templates');
                    const row = rows.find((r) => r.id === id);
                    if (!row) { toast.error('Template not found'); navigate('/admin/diet-templates'); return; }
                    setTemplateId(row.id);
                    setName(row.name || '');
                    setDescription(row.description || '');
                    setGoal(row.goal || GOALS[0]);
                    setDietPreference(row.diet_preference || DIET_PREFERENCES[0]);
                    setRegion(row.region || FOOD_REGIONS[0]);
                    setSortOrder(row.sort_order || 0);
                    setActive(row.active !== false);
                    const loadedDays = (row.days || []).map(normalizeDay);
                    setDays(loadedDays.length ? loadedDays : [emptyDay()]);
                }
            } catch (e) {
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Auto-slugs the ID from the name for a brand-new template — editable
    // right up until the admin types their own ID directly, or the
    // template is saved (then it's locked, like every other CMS id).
    useEffect(() => {
        if (!isNew || idTouched) return;
        setTemplateId(slugify(name));
    }, [name, isNew, idTouched]);

    const addDay = () => { setDays((d) => [...d, emptyDay()]); setCurrentDay(days.length); };
    const removeDay = (idx) => {
        setDays((d) => d.filter((_, i) => i !== idx));
        setCurrentDay((c) => Math.max(0, Math.min(c, days.length - 2)));
    };
    const toggleRestDay = () => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : { ...d, restDay: !d.restDay }));
    };
    const addFoodToMeal = (mealType, food) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d,
            meals: d.meals.map((m) => m.type !== mealType ? m : { ...m, foodIds: [...m.foodIds, food.id] }),
        }));
        toast.success(`Added ${food.name}`);
    };
    const removeFoodFromMeal = (mealType, idx) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d, meals: d.meals.map((m) => m.type !== mealType ? m : { ...m, foodIds: m.foodIds.filter((_, fi) => fi !== idx) }),
        }));
    };

    // A template's own Diet Preference / Regional Cuisine narrow the food
    // picker to what's actually relevant — same behavior as the Diet Plan
    // Builder's client-cuisine filter (region match OR generic staples),
    // so admins aren't hunting through 1000+ foods for the right one.
    const filteredFoods = useMemo(() => {
        let list = foods;
        if (dietPreference === 'Vegetarian') list = list.filter((f) => f.is_veg);
        else if (dietPreference === 'Eggetarian') list = list.filter((f) => f.is_veg || f.is_eggetarian);
        else if (dietPreference === 'Vegan') list = list.filter((f) => f.is_veg && !/milk|curd|paneer|cheese|lassi|buttermilk/i.test(f.name));
        if (region && region !== 'Generic / Pan-Indian') {
            list = list.filter((f) => f.region === region || f.region === 'Generic / Pan-Indian' || !f.region);
        }
        if (foodSearch.trim()) list = list.filter((f) => f.name.toLowerCase().includes(foodSearch.trim().toLowerCase()));
        return list;
    }, [foods, dietPreference, region, foodSearch]);

    const activeDay = days[currentDay];
    const mealFoodCounts = useMemo(() => {
        const counts = new Map();
        if (!foodPicker || !activeDay) return counts;
        const meal = activeDay.meals.find((m) => m.type === foodPicker);
        (meal?.foodIds || []).forEach((id_) => counts.set(id_, (counts.get(id_) || 0) + 1));
        return counts;
    }, [foodPicker, activeDay]);

    // Rough guide only — real portions are scaled to the client's target
    // calories when the template is applied (scaleDayToTarget), so this is
    // just "roughly how big is this day" at 1 serving of everything, not a
    // promise of the final plan's numbers.
    const dayRoughCalories = (day) => (day?.meals || []).reduce((sum, m) => (
        sum + m.foodIds.reduce((s, fid) => s + (foodsById.get(fid)?.calories || 0), 0)
    ), 0);

    const handleSave = async () => {
        if (!name.trim()) { toast.error('Template name is required'); return; }
        const finalId = isNew ? (templateId.trim() || slugify(name)) : id;
        if (!finalId) { toast.error('Could not generate a template ID from that name — try adding a letter or number'); return; }

        const payload = {
            name: name.trim(),
            description,
            goal,
            diet_preference: dietPreference,
            region,
            sort_order: Number(sortOrder) || 0,
            active,
            days: days.map((d) => ({
                restDay: d.restDay,
                meals: d.meals.filter((m) => m.foodIds.length > 0).map((m) => ({ type: m.type, label: m.label, foodIds: m.foodIds })),
            })),
        };

        setSaving(true);
        try {
            if (isNew) {
                const saved = await createCmsRow('diet_templates', { id: finalId, ...payload });
                toast.success('Template created');
                navigate(`/admin/diet-templates/${saved.id}`, { replace: true });
            } else {
                await updateCmsRow('diet_templates', id, payload);
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
                    <h1 className="text-xl font-black text-white">{isNew ? 'New Diet Plan Template' : `Editing: ${name || 'Template'}`}</h1>
                    <p className="text-xs text-white/35 mt-1">A reusable starting point — pick foods for each day, then admins can quick-start a real plan from it.</p>
                </div>
                <button onClick={() => navigate('/admin/diet-templates')} className="text-xs font-bold text-white/40 hover:text-white/70">← Back to Templates</button>
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <p className="text-sm font-black text-white">Template Details</p>
                <TextInput label="Template Name" value={name} onChange={setName} placeholder="e.g. Fat Loss Indian Veg Plan" />
                <TextArea label="Description" value={description} onChange={setDescription} rows={2} placeholder="A short summary shown to the admin when picking a template" />
                <div className="grid sm:grid-cols-2 gap-4">
                    <SelectField label="Goal" value={goal} onChange={setGoal} options={GOALS} />
                    <SelectField label="Diet Preference" value={dietPreference} onChange={setDietPreference} options={DIET_PREFERENCES} />
                </div>
                <div>
                    <SelectField label="Regional Cuisine" value={region} onChange={setRegion} options={FOOD_REGIONS} />
                    <p className="text-[11px] text-white/25 mt-1.5">Narrows the food picker below to this cuisine (plus generic staples) — doesn't restrict who the template can be applied to.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <TextInput label="Sort Order" type="number" value={String(sortOrder)} onChange={setSortOrder} />
                    <ToggleField label="Active" checked={active} onChange={setActive} hint="Only active templates show up in the Diet Plan Builder" />
                </div>
                {isNew && (
                    <TextInput label="Template ID (internal, not shown to clients)" value={templateId}
                        onChange={(v) => { setIdTouched(true); setTemplateId(slugify(v)); }}
                        placeholder="auto-generated-from-name" />
                )}
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-sm font-black text-white">Days</p>
                    <p className="text-xs text-white/35">A plan longer than this rotates back to Day 1</p>
                </div>

                <div className="flex items-center justify-center gap-2 flex-wrap">
                    <button onClick={() => setCurrentDay((d) => Math.max(0, d - 1))} disabled={currentDay === 0}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                    {days.map((d, i) => (
                        <button key={i} onClick={() => setCurrentDay(i)}
                            className="w-9 h-9 rounded-lg text-xs font-bold flex-shrink-0"
                            style={currentDay === i ? { background: '#e71763', color: 'white' } : d.restDay ? { border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' } : { ...inputCard, color: 'rgba(255,255,255,0.6)' }}>
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

                {activeDay && (
                    <>
                        <div className="flex items-center justify-between rounded-xl p-4" style={inputCard}>
                            <div>
                                <p className="text-sm font-black text-white">Day {currentDay + 1} of {days.length}</p>
                                <p className="text-xs text-white/35 mt-0.5">~{Math.round(dayRoughCalories(activeDay))} kcal at 1 serving each (real portions scale to target calories when applied)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <ToggleField label="Rest Day" checked={activeDay.restDay} onChange={toggleRestDay} />
                                <button onClick={() => removeDay(currentDay)} disabled={days.length <= 1}
                                    className="text-xs font-bold text-red-400/70 hover:text-red-400 disabled:opacity-20 flex items-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5" /> Remove Day
                                </button>
                            </div>
                        </div>

                        {!activeDay.restDay && (
                            <div className="space-y-4">
                                {activeDay.meals.map((meal) => {
                                    const mealCal = meal.foodIds.reduce((s, fid) => s + (foodsById.get(fid)?.calories || 0), 0);
                                    return (
                                        <div key={meal.type} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-white/70">
                                                    {meal.label}
                                                    {OPTIONAL_MEAL_TYPES.has(meal.type) && <span className="text-white/25 font-normal"> (optional)</span>}
                                                </p>
                                                <span className="text-[11px] text-white/30">~{Math.round(mealCal)} kcal</span>
                                            </div>
                                            {meal.foodIds.length === 0 ? (
                                                <p className="text-xs text-white/25 italic">No items</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {meal.foodIds.map((fid, fi) => {
                                                        const food = foodsById.get(fid);
                                                        return (
                                                            <span key={fi} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-semibold text-white"
                                                                style={food ? { background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.28)' } : { background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171' }}>
                                                                {food ? food.name : `Unknown food (${fid})`}
                                                                <button onClick={() => removeFoodFromMeal(meal.type, fi)} className="w-4 h-4 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15">
                                                                    <Trash2 className="w-2.5 h-2.5" />
                                                                </button>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <button onClick={() => { setFoodPicker(meal.type); setFoodSearch(''); }}
                                                className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                                                style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
                                                <Plus className="w-3 h-3" /> Add Food
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="flex items-center justify-between pt-2">
                <button onClick={() => navigate('/admin/diet-templates')}
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

            {foodPicker && (
                <Modal title={`Add Food — ${MEAL_TYPES.find((m) => m.type === foodPicker)?.label}`} onClose={() => setFoodPicker(null)} wide>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} autoFocus
                            placeholder="Search foods…" className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto">
                        {filteredFoods.map((food) => {
                            const addedCount = mealFoodCounts.get(food.id) || 0;
                            return (
                                <button key={food.id} onClick={() => addFoodToMeal(foodPicker, food)}
                                    className="flex items-center justify-between p-3 rounded-lg text-left hover:border-pink-500/40 transition-colors"
                                    style={addedCount > 0 ? { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.35)' } : inputCard}>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                            {food.name}
                                            {addedCount > 0 && <span className="text-[10px] font-black flex-shrink-0" style={{ color: '#34d399' }}>{addedCount > 1 ? `×${addedCount}` : 'Added'}</span>}
                                        </p>
                                        <p className="text-xs text-white/35">
                                            {formatServing(food)}
                                            {food.region && food.region !== 'Generic / Pan-Indian' && <span className="ml-1.5" style={{ color: '#9085e9' }}>· {food.region}</span>}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="text-sm font-bold" style={{ color: '#e71763' }}>{food.calories}</p>
                                        <p className="text-xs text-white/35">kcal</p>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredFoods.length === 0 && (
                            <p className="text-sm text-white/30 text-center py-8 col-span-2">
                                No foods match{region !== 'Generic / Pan-Indian' ? ` for ${region} — try Generic / Pan-Indian cuisine above` : ''}.
                            </p>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
