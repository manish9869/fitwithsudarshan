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
//
// Template ID and Sort Order are intentionally NOT shown in this form —
// both confused a non-technical admin for no real benefit (the ID is never
// client-facing, and display order rarely matters enough to hand-tune).
// They're managed automatically: ID auto-slugs from the name (with a
// silent numeric suffix on a rare collision), sort order appends after
// whatever the highest existing template already has.
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Save, Repeat2, CalendarDays,
} from 'lucide-react';
import { listCmsRows, createCmsRow, updateCmsRow } from '../content/cmsApi';
import { TextInput, TextArea, ToggleField, SelectField } from '../content/SettingsFields';
import { useToast } from '../ToastProvider';
import { slugify, uniqueId } from '../adminUtils';
import { formatServing } from './dietUnits';
import { FOOD_REGIONS } from './dietRegions';
import { MEAL_TYPES, OPTIONAL_MEAL_TYPES } from './dietMealTypes';
import { filterFoodPicker } from './dietFoodFilters';
import FoodFilterBar from './FoodFilterBar';
import Modal from './DietModal';

const GOALS = ['Fat Loss', 'Muscle Gain', 'Weight Maintenance', 'General Fitness'];
const DIET_PREFERENCES = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'];
const DAY_COUNT_PRESETS = [7, 10, 15, 30];

const card = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' };
const inputCard = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

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
    // Loaded once up front (not just when editing) so a brand-new template
    // can silently avoid an id collision and append after the current
    // highest sort_order, without showing either field to the admin.
    const [existingTemplates, setExistingTemplates] = useState([]);

    const [templateId, setTemplateId] = useState('');
    const [sortOrder, setSortOrder] = useState(0);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [goal, setGoal] = useState(GOALS[0]);
    const [dietPreference, setDietPreference] = useState(DIET_PREFERENCES[0]);
    const [region, setRegion] = useState(FOOD_REGIONS[0]);
    const [active, setActive] = useState(true);
    // true = the template is exactly one day, which the rotation engine
    // (templateDays[i % templateDays.length]) already repeats forever — no
    // schema change needed, just a friendlier way to reach that same state
    // than "add exactly one day and stop".
    const [sameEveryDay, setSameEveryDay] = useState(true);
    const [days, setDays] = useState([emptyDay()]);
    const [currentDay, setCurrentDay] = useState(0);

    const [foodPicker, setFoodPicker] = useState(null); // meal type string, or null
    const [foodSearch, setFoodSearch] = useState('');
    const [foodCategoryFilter, setFoodCategoryFilter] = useState('All');
    const [foodCuisineFilter, setFoodCuisineFilter] = useState('Any');
    const [foodBudgetFilter, setFoodBudgetFilter] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [foodRows, templateRows] = await Promise.all([
                    listCmsRows('diet_foods'),
                    listCmsRows('diet_templates'),
                ]);
                setFoods(foodRows.filter((f) => f.active));

                if (!isNew) {
                    setExistingTemplates(templateRows.filter((r) => r.id !== id));
                    const row = templateRows.find((r) => r.id === id);
                    if (!row) { toast.error('Template not found'); navigate('/admin/diet-templates'); return; }
                    setTemplateId(row.id);
                    setSortOrder(row.sort_order || 0);
                    setName(row.name || '');
                    setDescription(row.description || '');
                    setGoal(row.goal || GOALS[0]);
                    setDietPreference(row.diet_preference || DIET_PREFERENCES[0]);
                    setRegion(row.region || FOOD_REGIONS[0]);
                    setActive(row.active !== false);
                    const loadedDays = (row.days || []).map(normalizeDay);
                    setDays(loadedDays.length ? loadedDays : [emptyDay()]);
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
            for (let i = 0; i < n; i++) next.push(i < prev.length ? prev[i] : emptyDay());
            return next;
        });
        setCurrentDay((c) => Math.min(c, n - 1));
    };
    const handleSameEveryDayChange = (val) => {
        setSameEveryDay(val);
        if (val) {
            setDays((prev) => [prev[currentDay] || prev[0] || emptyDay()]);
            setCurrentDay(0);
        } else if (days.length <= 1) {
            setDayCount(7);
        }
    };

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

    // Category/cuisine/budget are picker-local (reset to sensible defaults
    // from this template's own Diet Preference / Regional Cuisine whenever
    // the modal opens) but freely adjustable per meal without leaving it —
    // same shared filter as the Diet Plan Builder's Add Food modal.
    const filteredFoods = useMemo(() => filterFoodPicker(foods, {
        dietPreference, category: foodCategoryFilter, cuisine: foodCuisineFilter, budgetOnly: foodBudgetFilter, search: foodSearch,
    }), [foods, dietPreference, foodCategoryFilter, foodCuisineFilter, foodBudgetFilter, foodSearch]);

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
            goal,
            diet_preference: dietPreference,
            region,
            sort_order: finalSortOrder,
            active,
            days: days.map((d) => ({
                restDay: d.restDay,
                meals: d.meals.filter((m) => m.foodIds.length > 0).map((m) => ({ type: m.type, label: m.label, foodIds: m.foodIds })),
            })),
        };

        setSaving(true);
        try {
            if (isNew) {
                let attemptId = finalId;
                let saved;
                // Proactive uniqueId() above already avoids the common case —
                // this retry is only a defensive fallback for a race against
                // another admin creating the same slug in between.
                for (let attempt = 0; attempt < 5; attempt++) {
                    try {
                        saved = await createCmsRow('diet_templates', { id: attemptId, ...payload });
                        break;
                    } catch (e) {
                        if (attempt < 4 && /duplicate key/i.test(e.message || '')) { attemptId = `${finalId}-${attempt + 2}`; continue; }
                        throw e;
                    }
                }
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
                <ToggleField label="Active" checked={active} onChange={setActive} hint="Only active templates show up in the Diet Plan Builder" />
            </div>

            <div className="rounded-2xl p-5 space-y-4" style={card}>
                <p className="text-sm font-black text-white">Days</p>

                <div className="grid sm:grid-cols-2 gap-3">
                    <button onClick={() => handleSameEveryDayChange(true)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={sameEveryDay ? { background: '#e71763', color: 'white' } : card}>
                        <Repeat2 className="w-5 h-5 mb-2" />
                        <p className="font-black text-sm mb-0.5">Same Plan Every Day</p>
                        <p className="text-xs opacity-75">One day repeats for the whole plan — simplest, good for students/hostel clients</p>
                    </button>
                    <button onClick={() => handleSameEveryDayChange(false)}
                        className="p-4 rounded-xl text-left transition-all"
                        style={!sameEveryDay ? { background: '#e71763', color: 'white' } : card}>
                        <CalendarDays className="w-5 h-5 mb-2" />
                        <p className="font-black text-sm mb-0.5">Different Plan Each Day</p>
                        <p className="text-xs opacity-75">Plan several distinct days that rotate — more variety</p>
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
                        <p className="text-[11px] text-white/25 mt-1.5">A plan longer than this rotates back to Day 1. Use +/- Day below for a number in between.</p>

                        <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
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
                    </div>
                )}

                {activeDay && (
                    <>
                        <div className="flex items-center justify-between rounded-xl p-4" style={inputCard}>
                            <div>
                                <p className="text-sm font-black text-white">{sameEveryDay ? 'Day Plan (repeats every day)' : `Day ${currentDay + 1} of ${days.length}`}</p>
                                <p className="text-xs text-white/35 mt-0.5">~{Math.round(dayRoughCalories(activeDay))} kcal at 1 serving each (real portions scale to target calories when applied)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <ToggleField label="Rest Day" checked={activeDay.restDay} onChange={toggleRestDay} />
                                {!sameEveryDay && (
                                    <button onClick={() => removeDay(currentDay)} disabled={days.length <= 1}
                                        className="text-xs font-bold text-red-400/70 hover:text-red-400 disabled:opacity-20 flex items-center gap-1">
                                        <Trash2 className="w-3.5 h-3.5" /> Remove Day
                                    </button>
                                )}
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
                                            <button onClick={() => {
                                                setFoodPicker(meal.type); setFoodSearch(''); setFoodCategoryFilter('All');
                                                setFoodCuisineFilter(region || 'Any'); setFoodBudgetFilter(false);
                                            }}
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
                    <FoodFilterBar
                        search={foodSearch} onSearch={setFoodSearch}
                        category={foodCategoryFilter} onCategory={setFoodCategoryFilter}
                        cuisine={foodCuisineFilter} onCuisine={setFoodCuisineFilter}
                        budgetOnly={foodBudgetFilter} onBudgetOnly={setFoodBudgetFilter}
                    />
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
                                            {food.is_budget_friendly && <span className="ml-1.5" style={{ color: '#34d399' }}>· ₹ Budget</span>}
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
                                No foods match{foodSearch.trim() ? ` "${foodSearch.trim()}"` : ''}
                                {[
                                    foodCategoryFilter !== 'All' ? foodCategoryFilter : null,
                                    foodCuisineFilter !== 'Any' ? foodCuisineFilter : null,
                                    foodBudgetFilter ? 'Budget-Friendly' : null,
                                ].filter(Boolean).length > 0
                                    ? ` for ${[foodCategoryFilter !== 'All' ? foodCategoryFilter : null, foodCuisineFilter !== 'Any' ? foodCuisineFilter : null, foodBudgetFilter ? 'Budget-Friendly' : null].filter(Boolean).join(' + ')} — try widening a filter above`
                                    : ''}.
                            </p>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}
