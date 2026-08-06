// src/pages/admin/diet/DietPlanBuilder.jsx
// The Diet Plan Generator wizard — create or edit a single plan. Mirrors the
// step shape of the client-facing Onboarding.jsx (array of sections + index
// state + Next/Back), the only stepper precedent in this app, rebuilt with
// the plain-form primitives from ../content/SettingsFields.jsx and the
// dark-admin theme instead of the reference app's shadcn components.
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Search, Save,
    User, Target, Sparkles, CalendarDays, FileDown, Check, Dumbbell, Salad, Edit2, Repeat2,
} from 'lucide-react';
import { listCmsRows, getSiteContentKey } from '../content/cmsApi';
import { fmtName } from '../adminUtils';
import { fetchAdminProfile } from '../adminApi';
import { TextInput, TextArea, ToggleField, SelectField } from '../content/SettingsFields';
import { useToast } from '../ToastProvider';
import {
    getDietPlan, createDietPlan, updateDietPlan, searchEnrollments, getDietPlanByEnrollment,
} from './dietPlanApi';
import { generatePlanFromTemplate } from './dietTemplates';
import { calcDayTotals, estimateCalorieTarget, scaleExerciseCalories, isDurationBased, defaultExerciseCustom, normalizeExercise } from './dietCalc';
import { formatServing, convertToQuantity, normalizeFoodEntry, isConvertible, getUnitsForFood } from './dietUnits';
import { makeAltGroupId, groupMealFoods, resolveMealForTotals } from './dietAlternatives';
import { FOOD_REGIONS } from './dietRegions';
import { MEAL_TYPES, OPTIONAL_MEAL_TYPES } from './dietMealTypes';
import { filterFoodPicker } from './dietFoodFilters';
import FoodFilterBar from './FoodFilterBar';
import { DEFAULT_DIET_UNITS, DEFAULT_DIET_GUIDELINES } from '@/utils/siteContentDefaults';
import { generateDietPlanPDF, buildDietPlanPreviewUrl } from './dietPdfGenerator';
import Modal from './DietModal';

const STEPS = [
    { id: 1, title: 'Client Info', icon: User },
    { id: 2, title: 'Plan Setup', icon: Target },
    { id: 3, title: 'Template', icon: Sparkles },
    { id: 4, title: 'Build Plan', icon: CalendarDays },
    { id: 5, title: 'Export', icon: FileDown },
];

const emptyDay = (dayNumber) => ({
    dayNumber,
    meals: MEAL_TYPES.map((m) => ({ type: m.type, label: m.label, foods: [] })),
    exercises: [],
    restDay: false,
    notes: '',
});

// Guarantees every current MEAL_TYPES slot exists on a day, adding any
// missing ones empty — needed for days that came from a source that
// predates a slot type (a template's own meal list, or a plan saved
// before Morning Drink/Before Bed Drink existed), not just brand-new days.
const normalizeDayMeals = (day) => ({
    ...day,
    meals: MEAL_TYPES.map((mt) => day.meals.find((m) => m.type === mt.type) || { type: mt.type, label: mt.label, foods: [] }),
});

const defaultClient = {
    name: '', age: 25, gender: 'Male', height: 170, weight: 70, targetWeight: 65,
    goal: 'Fat Loss', dietPreference: 'Vegetarian', activityLevel: 'Moderately Active', allergies: '', notes: '',
    cuisine: 'Any', budgetConscious: false,
};
const defaultTrainer = { name: '', qualification: '', contact: '' };

const card = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' };
const inputCard = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' };

// One food entry inside a meal's food list — used both for a plain
// (standalone, additive) item and for each option inside an OR-alternative
// choice group (isAlt just tints it to match the group's container).
// `onAddAlt` opens the food picker to add another OR-option starting from
// this specific entry.
// Quantity is a multiplier on a single serving — nothing realistic needs
// more than 4 digits, and an unclamped value (a stray extra digit while
// typing, e.g. "144655") blows up the kcal math and the pill's width.
const MAX_QUANTITY = 9999;
function clampQuantity(raw) {
    if (raw === '') return '';
    const n = Number(raw);
    if (Number.isNaN(n)) return '';
    return Math.min(Math.max(n, 0), MAX_QUANTITY);
}

function FoodEntryRow({ food, dietUnits, onAmountChange, onRemove, onAddAlt, isAlt }) {
    return (
        <div className="p-2.5 rounded-lg text-xs space-y-1.5" style={isAlt ? { background: 'rgba(144,133,233,0.05)', border: '1px solid rgba(144,133,233,0.18)' } : inputCard}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-white/80 font-semibold truncate">{food.name}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span style={{ color: '#e71763' }} className="font-bold">~{Math.round(food.calories * food.quantity)} kcal</span>
                    <button onClick={onAddAlt} title="Add an OR alternative to this item"
                        className="text-[10px] font-black px-1.5 py-0.5 rounded"
                        style={{ color: '#9085e9', border: '1px solid rgba(144,133,233,0.35)' }}>
                        + OR
                    </button>
                    <button onClick={onRemove} className="text-red-400/70 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                </div>
            </div>
            {isConvertible({ serving_unit: food.servingUnit }) ? (
                <div className="flex flex-wrap items-center gap-1.5">
                    <input type="number" min="0" max={MAX_QUANTITY} step="any" value={food.amount ?? ''}
                        onChange={(e) => onAmountChange({ amount: clampQuantity(e.target.value) })}
                        className="w-14 flex-shrink-0 px-2 py-1 rounded text-white text-xs outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <select value={food.unit || ''} onChange={(e) => onAmountChange({ unit: e.target.value })}
                        className="px-2 py-1 rounded text-white outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {getUnitsForFood(dietUnits, food.category, food.servingUnit).map((u) => <option key={u.label} value={u.label}>{u.label}</option>)}
                    </select>
                    <span className="text-white/25 text-[10px] basis-full sm:basis-auto">
                        base: {formatServing({ serving_qty: food.servingQty, serving_unit: food.servingUnit })}
                    </span>
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-white/35 flex-shrink-0">×</span>
                    <input type="number" min="0" max={MAX_QUANTITY} step="any" value={food.amount ?? ''}
                        onChange={(e) => onAmountChange({ amount: clampQuantity(e.target.value) })}
                        className="w-14 flex-shrink-0 px-2 py-1 rounded text-white text-xs outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <span className="text-white/25 text-[10px] basis-full sm:basis-auto sm:flex-1 min-w-0">
                        {food.servingSize || 'serving'} — no gram weight set, edit in Diet Foods for precise units
                    </span>
                </div>
            )}
        </div>
    );
}

export default function DietPlanBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    // Tracks how far the wizard has actually been validated through, so tab
    // clicks can't skip ahead of data that was never filled in — only
    // "Next" (which validates) can push this forward. Editing an existing
    // plan starts with everything already filled, so all tabs are open.
    const [maxStepReached, setMaxStepReached] = useState(1);

    const [foods, setFoods] = useState([]);
    const [exercises, setExercises] = useState([]);
    // DB-backed (diet_templates / diet_workout_templates) — any template an
    // admin adds there shows up here immediately, no code change needed.
    const [templates, setTemplates] = useState([]);
    const [workoutTemplates, setWorkoutTemplates] = useState([]);
    const [dietUnits, setDietUnits] = useState(DEFAULT_DIET_UNITS.units);
    const [defaultGuidelines, setDefaultGuidelines] = useState(DEFAULT_DIET_GUIDELINES.tips);
    // Starts as a copy of the (site-wide or plan-saved) guidelines and is
    // freely editable in the Export step; buildPayload() only persists it
    // as a per-plan override if it actually diverges from the current
    // global default — otherwise this plan keeps following the global
    // setting even if that setting changes again later.
    const [guidelines, setGuidelines] = useState(DEFAULT_DIET_GUIDELINES.tips);
    const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);
    const exercisesById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

    const [enrollmentId, setEnrollmentId] = useState(null);
    const [client, setClient] = useState(defaultClient);
    const [trainer, setTrainer] = useState(defaultTrainer);
    const [planDuration, setPlanDuration] = useState(7);
    const [includeExercise, setIncludeExercise] = useState(true);
    const [targetCaloriesManual, setTargetCaloriesManual] = useState(false);
    const [targetCalories, setTargetCalories] = useState('');
    // For clients who can't cook fresh every day (hostel/PG students, tight
    // work schedules) — one day's meals/exercises apply to every day of the
    // plan instead of planning each day individually. Internally `days`
    // still holds planDuration entries (kept mirrored, below) so averages/
    // saving/loading all work unchanged; only Build Plan's UI and the PDF's
    // day-by-day sections special-case it to show/print just the one day.
    const [repeatDaily, setRepeatDaily] = useState(false);
    const [days, setDays] = useState([emptyDay(1)]);
    const [currentDay, setCurrentDay] = useState(0);

    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedWorkoutTemplate, setSelectedWorkoutTemplate] = useState('home-workout');
    const [useTemplate, setUseTemplate] = useState(null);
    // When editing a plan that already has real content, Step 3 shouldn't
    // silently pre-pick "Custom" (confusing — looks like an unexplained
    // choice) or let a stray click on "Build Custom" wipe existing days.
    // It shows a plain "already built" state instead, unless the admin
    // explicitly asks to regenerate from a template.
    const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);

    const [exportMode, setExportMode] = useState('full');
    const [exportInstructions, setExportInstructions] = useState(true);
    const [exportExercises, setExportExercises] = useState(true);
    const [exportCoverSnapshot, setExportCoverSnapshot] = useState(true);
    const [exportFiberSugar, setExportFiberSugar] = useState(true);
    const [exportAllergies, setExportAllergies] = useState(true);
    const [exportTrainerNotes, setExportTrainerNotes] = useState(true);
    const [exportServingColumn, setExportServingColumn] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // { mealType, altFor } | null. altFor is null for a plain "Add Food",
    // or the index (within that meal's foods[]) of the entry a newly-picked
    // food should become an OR-alternative to.
    const [foodPicker, setFoodPicker] = useState(null);
    const [foodSearch, setFoodSearch] = useState('');
    const [foodCategoryFilter, setFoodCategoryFilter] = useState('All');
    const [foodCuisineFilter, setFoodCuisineFilter] = useState('Any');
    const [foodBudgetFilter, setFoodBudgetFilter] = useState(false);
    const [exercisePicker, setExercisePicker] = useState(false);
    const [exerciseSearch, setExerciseSearch] = useState('');

    const [enrollSearch, setEnrollSearch] = useState('');
    const [enrollResults, setEnrollResults] = useState([]);
    const [enrollSearching, setEnrollSearching] = useState(false);
    const [linkedPlanWarning, setLinkedPlanWarning] = useState(null);

    // ── Load library + existing plan ──────────────────────────────────────
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [foodRows, exerciseRows, templateRows, workoutTemplateRows, unitsSetting, guidelinesSetting] = await Promise.all([
                    listCmsRows('diet_foods'),
                    listCmsRows('diet_exercises'),
                    listCmsRows('diet_templates'),
                    listCmsRows('diet_workout_templates'),
                    getSiteContentKey('diet_units').catch(() => null),
                    getSiteContentKey('diet_guidelines').catch(() => null),
                ]);
                setFoods(foodRows.filter((f) => f.active));
                setExercises(exerciseRows.filter((e) => e.active));
                setTemplates(templateRows.filter((t) => t.active));
                setWorkoutTemplates(workoutTemplateRows.filter((t) => t.active));
                setDietUnits(unitsSetting?.units?.length ? unitsSetting.units : DEFAULT_DIET_UNITS.units);
                const globalGuidelines = guidelinesSetting?.tips?.length ? guidelinesSetting.tips : DEFAULT_DIET_GUIDELINES.tips;
                setDefaultGuidelines(globalGuidelines);
                setGuidelines(globalGuidelines);

                if (!isNew) {
                    const plan = await getDietPlan(id);
                    setEnrollmentId(plan.enrollment_id || null);
                    setClient({
                        name: plan.client_name || '', age: plan.client_age || 25, gender: plan.client_gender || 'Male',
                        height: plan.client_height || 170, weight: plan.client_weight || 70, targetWeight: plan.target_weight || 65,
                        goal: plan.goal || 'Fat Loss', dietPreference: plan.diet_preference || 'Vegetarian',
                        activityLevel: plan.activity_level || 'Moderately Active', allergies: plan.allergies || '', notes: plan.client_notes || '',
                        cuisine: plan.client_cuisine || 'Any', budgetConscious: !!plan.client_budget_conscious,
                    });
                    setTrainer({ name: plan.trainer_name || '', qualification: plan.trainer_qualification || '', contact: plan.trainer_contact || '' });
                    setPlanDuration(plan.plan_duration || 7);
                    setIncludeExercise(!!plan.include_exercise);
                    setRepeatDaily(!!plan.repeat_daily);
                    setTargetCaloriesManual(!!plan.target_calories_manual);
                    setTargetCalories(plan.target_calories ?? '');
                    if (plan.guidelines?.length) setGuidelines(plan.guidelines);
                    if (plan.days?.length) {
                        setDays(plan.days.map((d) => ({
                            dayNumber: d.day_number,
                            // Plans saved before the amount/unit control existed only
                            // have `quantity` — backfill amount/unit so the controls
                            // show a value consistent with what's already on screen.
                            // Plans saved before Morning Drink/Before Bed Drink existed
                            // are missing those meal slots entirely — add them (empty)
                            // so they're editable here too, not just on brand-new plans.
                            meals: MEAL_TYPES.map((mt) => {
                                const existing = (d.meals || []).find((m) => m.type === mt.type);
                                return existing
                                    ? { ...existing, foods: (existing.foods || []).map(normalizeFoodEntry) }
                                    : { type: mt.type, label: mt.label, foods: [] };
                            }),
                            // Plans saved before the sets/reps/duration scaling feature
                            // existed are missing base*/durationBased fields — backfill
                            // them from the current library so editing an old plan's
                            // exercise doesn't scale against an undefined base.
                            exercises: (d.exercises || []).map((ex) => normalizeExercise(ex, exerciseRows)),
                            restDay: d.rest_day, notes: d.notes || '',
                        })));
                    }
                    setMaxStepReached(5);
                } else if (location.state?.prefill) {
                    // Arrived here via the "Diet Plan" action on an enrollment —
                    // carry over what we already know instead of retyping it.
                    const pf = location.state.prefill;
                    if (location.state.enrollmentId) setEnrollmentId(location.state.enrollmentId);
                    setClient((c) => ({
                        ...c,
                        name: pf.name || c.name,
                        age: pf.age || c.age,
                        weight: pf.weight || c.weight,
                        goal: pf.goal || c.goal,
                        allergies: pf.allergies || c.allergies,
                        notes: pf.notes || c.notes,
                    }));
                }
            } catch (e) {
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Trainer identity comes from the logged-in admin's own profile (Admin →
    // My Profile, click your name/avatar in the sidebar) — not the public
    // "Coach Bio" content, since this should reflect whoever is actually
    // signed in and building the plan. Only fills in on a brand-new plan,
    // and only while the fields are still untouched, so it never clobbers
    // what's saved on an existing plan.
    useEffect(() => {
        if (!isNew) return;
        if (trainer.name || trainer.qualification || trainer.contact) return;
        fetchAdminProfile()
            .then((p) => {
                if (!p.display_name && !p.qualification && !p.contact) return;
                setTrainer({ name: p.display_name || '', qualification: p.qualification || '', contact: p.contact || '' });
            })
            .catch(() => { /* non-blocking — admin can still fill it in manually */ });
    }, [isNew]);

    // ── Client detail helpers ──────────────────────────────────────────────
    const setClientField = (key) => (val) => setClient((c) => ({ ...c, [key]: val }));
    const setTrainerField = (key) => (val) => setTrainer((t) => ({ ...t, [key]: val }));

    const handleDurationChange = (d) => {
        setPlanDuration(d);
        setDays((prev) => {
            const next = [];
            for (let i = 0; i < d; i++) next.push(i < prev.length ? { ...prev[i], dayNumber: i + 1 } : emptyDay(i + 1));
            return next;
        });
        if (currentDay >= d) setCurrentDay(d - 1);
    };

    // Keeps every day slot an exact mirror of Day 1 whenever repeat-daily is
    // on — edits always happen on Day 1 (currentDay is pinned to 0 below),
    // this just fans that out to the rest of `days` so save/load/averages/
    // PDF all keep working against a normal planDuration-length array
    // without special-casing every one of them.
    useEffect(() => {
        if (!repeatDaily) return;
        setCurrentDay(0);
        setDays((prev) => {
            if (prev.length <= 1) return prev;
            const template = prev[0];
            const mirrored = prev.map((d, i) => (i === 0 ? d : { ...template, dayNumber: i + 1 }));
            const changed = mirrored.some((d, i) => d !== prev[i] && JSON.stringify(d) !== JSON.stringify(prev[i]));
            return changed ? mirrored : prev;
        });
    }, [repeatDaily, days]);

    // ── Enrollment autofill ─────────────────────────────────────────────
    const runEnrollSearch = useCallback(async (q) => {
        if (!q.trim()) { setEnrollResults([]); return; }
        setEnrollSearching(true);
        try { setEnrollResults(await searchEnrollments(q)); }
        catch { /* non-blocking */ }
        finally { setEnrollSearching(false); }
    }, []);

    const applyEnrollment = async (enr) => {
        // A plan already linked to this enrollment (that isn't the one we're
        // currently editing) means autofilling here would create a second,
        // duplicate plan for the same client — block it and point at the
        // existing one instead of silently letting it happen.
        try {
            const existing = await getDietPlanByEnrollment(enr.id);
            if (existing && existing.id !== id) {
                setLinkedPlanWarning({ clientName: fmtName(enr.customer_name), plan: existing });
                toast.error(`${fmtName(enr.customer_name)} already has a diet plan — edit that one instead of creating a duplicate.`);
                return;
            }
        } catch { /* non-blocking — don't let a failed check block a legitimate autofill */ }

        setLinkedPlanWarning(null);
        setEnrollmentId(enr.id);
        setClient((c) => ({
            ...c,
            name: fmtName(enr.customer_name) || c.name,
            weight: enr.weight || c.weight,
            allergies: enr.medical_note || enr.medical_issue || c.allergies,
        }));
        setEnrollSearch('');
        setEnrollResults([]);
        toast.success(`Autofilled from ${fmtName(enr.customer_name)}'s enrollment`);
    };

    // ── Template application ────────────────────────────────────────────
    const handleApplyTemplate = () => {
        if (!selectedTemplate) { toast.error('Select a template first'); return; }
        const generated = generatePlanFromTemplate(
            selectedTemplate, planDuration, includeExercise, includeExercise ? selectedWorkoutTemplate : undefined,
            foodsById, exercisesById, client.dietPreference, effectiveTargetCalories, templates, workoutTemplates
        );
        if (generated?.length) {
            setDays(generated.map(normalizeDayMeals));
            setCurrentDay(0);
            toast.success(`Generated ${generated.length} days — customize in the next step`);
            advanceTo(4);
        } else {
            toast.error('This template has no days defined — edit it from Admin → Diet Templates, or pick a different one.');
        }
    };
    const handleCustomPlan = () => {
        const fresh = [];
        for (let i = 0; i < planDuration; i++) fresh.push(emptyDay(i + 1));
        setDays(fresh);
        setCurrentDay(0);
        advanceTo(4);
    };

    // ── Food / exercise mutation ────────────────────────────────────────
    // amount/unit default to the food's own base serving (ratio = 1, so
    // calories start out matching the library figure exactly) but are fully
    // editable per meal-entry — pick any unit from the diet_units setting
    // and type any quantity; updateFoodAmount below converts both sides
    // through grams to work out the actual scaling ratio.
    const addFoodToMeal = (mealType, food) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d,
            meals: d.meals.map((m) => m.type !== mealType ? m : {
                ...m, foods: [...m.foods, {
                    foodId: food.id, name: food.name, category: food.category, calories: food.calories, protein: food.protein,
                    carbs: food.carbs, fats: food.fats, fiber: food.fiber, sugar: food.sugar,
                    servingSize: food.serving_size, servingQty: food.serving_qty, servingUnit: food.serving_unit,
                    amount: food.serving_qty ?? 1, unit: food.serving_unit || null,
                    quantity: 1,
                }],
            }),
        }));
        toast.success(`Added ${food.name}`);
    };
    // Adds `food` as an OR-alternative to the entry already at `targetIdx`
    // in this meal — both end up sharing an altGroup id (minted here if the
    // target wasn't already part of a choice), so the Build Plan UI and PDF
    // render them as "pick one" instead of both being eaten together.
    const addAlternativeToFood = (mealType, targetIdx, food) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d,
            meals: d.meals.map((m) => {
                if (m.type !== mealType) return m;
                const target = m.foods[targetIdx];
                if (!target) return m;
                const altGroup = target.altGroup || makeAltGroupId();
                const foods = m.foods.map((f, fi) => (fi === targetIdx ? { ...f, altGroup } : f));
                foods.push({
                    foodId: food.id, name: food.name, category: food.category, calories: food.calories, protein: food.protein,
                    carbs: food.carbs, fats: food.fats, fiber: food.fiber, sugar: food.sugar,
                    servingSize: food.serving_size, servingQty: food.serving_qty, servingUnit: food.serving_unit,
                    amount: food.serving_qty ?? 1, unit: food.serving_unit || null,
                    quantity: 1, altGroup,
                });
                return { ...m, foods };
            }),
        }));
        toast.success(`Added ${food.name} as an alternative`);
    };
    const removeFoodFromMeal = (mealType, idx) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d, meals: d.meals.map((m) => {
                if (m.type !== mealType) return m;
                const removed = m.foods[idx];
                let foods = m.foods.filter((_, fi) => fi !== idx);
                // A choice group of one option isn't a choice anymore —
                // ungroup the last remaining sibling so it renders (and
                // counts toward totals) as a plain standalone item again.
                if (removed?.altGroup) {
                    const siblings = foods.filter((f) => f.altGroup === removed.altGroup);
                    if (siblings.length === 1) {
                        foods = foods.map((f) => (f.altGroup === removed.altGroup ? { ...f, altGroup: null } : f));
                    }
                }
                return { ...m, foods };
            }),
        }));
    };
    const updateFoodAmount = (mealType, idx, patch) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d, meals: d.meals.map((m) => m.type !== mealType ? m : {
                ...m, foods: m.foods.map((f, fi) => {
                    if (fi !== idx) return f;
                    const next = { ...f, ...patch };
                    const quantity = convertToQuantity(
                        { serving_qty: f.servingQty, serving_unit: f.servingUnit },
                        next.amount, next.unit, dietUnits
                    );
                    return { ...next, quantity };
                }),
            }),
        }));
    };
    // Opens the food picker modal — either a plain "Add Food" (altFor
    // omitted) or, when opened from a food row's "+ OR" action, adding an
    // OR-alternative to the entry at that index within this meal.
    const openFoodPicker = (mealType, altFor = null) => {
        setFoodPicker({ mealType, altFor });
        setFoodSearch(''); setFoodCategoryFilter('All');
        setFoodCuisineFilter(client.cuisine || 'Any'); setFoodBudgetFilter(client.budgetConscious);
    };
    // Snapshots the library exercise's OWN reference sets/reps/duration/
    // calories as base* fields — scaling always happens against these, not
    // against whatever the library item looks like later (it could be
    // edited or deactivated after this plan was saved). custom* fields start
    // equal to the base (ratio = 1, so calories start matching the library
    // figure exactly) and are what the sets/reps/duration controls below edit.
    const addExercise = (ex) => {
        const custom = defaultExerciseCustom(ex);
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : {
            ...d, exercises: [...d.exercises, {
                exerciseId: ex.id, name: ex.name, muscleGroup: ex.muscle_group,
                durationBased: isDurationBased(ex),
                baseSets: ex.sets, baseReps: ex.reps, baseDuration: ex.duration, baseCaloriesBurned: ex.calories_burned,
                sets: custom.sets, reps: custom.reps, durationMinutes: custom.durationMinutes,
                caloriesBurned: ex.calories_burned,
            }],
        }));
        toast.success(`Added ${ex.name}`);
    };
    const removeExercise = (idx) => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : { ...d, exercises: d.exercises.filter((_, ei) => ei !== idx) }));
    };
    // Recomputes caloriesBurned proportionally from the exercise's own base
    // (library reference) values every time sets/reps/duration change here —
    // same "scale from a reference amount" model as food quantity.
    const updateExerciseParams = (idx, patch) => {
        setDays((prev) => prev.map((d, i) => {
            if (i !== currentDay) return d;
            return {
                ...d, exercises: d.exercises.map((ex, ei) => {
                    if (ei !== idx) return ex;
                    const next = { ...ex, ...patch };
                    const caloriesBurned = scaleExerciseCalories(
                        { sets: ex.baseSets, reps: ex.baseReps, duration: ex.baseDuration, calories_burned: ex.baseCaloriesBurned },
                        { sets: next.sets, reps: next.reps, durationMinutes: next.durationMinutes }
                    );
                    return { ...next, caloriesBurned };
                }),
            };
        }));
    };
    const toggleRestDay = () => {
        setDays((prev) => prev.map((d, i) => i !== currentDay ? d : { ...d, restDay: !d.restDay }));
    };

    // ── Save ─────────────────────────────────────────────────────────────
    const buildPayload = () => ({
        enrollment_id: enrollmentId,
        client_name: client.name, client_age: Number(client.age) || null, client_gender: client.gender,
        client_height: Number(client.height) || null, client_weight: Number(client.weight) || null,
        target_weight: Number(client.targetWeight) || null, goal: client.goal, diet_preference: client.dietPreference,
        activity_level: client.activityLevel, allergies: client.allergies, client_notes: client.notes,
        client_cuisine: client.cuisine && client.cuisine !== 'Any' ? client.cuisine : null,
        client_budget_conscious: client.budgetConscious,
        trainer_name: trainer.name, trainer_qualification: trainer.qualification, trainer_contact: trainer.contact,
        plan_duration: planDuration, include_exercise: includeExercise, repeat_daily: repeatDaily, status: 'draft',
        target_calories: targetCaloriesManual ? (Number(targetCalories) || null) : (calorieEstimate?.suggestedTarget ?? null),
        target_calories_manual: targetCaloriesManual,
        // Only saved as a per-plan override when it actually diverges from
        // the current global default — otherwise stays null, so this plan
        // keeps following Site Settings if the global tips are edited later.
        guidelines: JSON.stringify(guidelines) === JSON.stringify(defaultGuidelines) ? null : guidelines,
        days,
    });

    // Throws on failure (instead of swallowing the error) so callers that
    // need to know the save actually succeeded — like the PDF download,
    // which should never hand out a PDF for a plan that isn't in the DB —
    // can tell the difference. The direct "Save Draft" button click still
    // gets a toast either way since that happens before the rethrow.
    const handleSave = async () => {
        if (!client.name.trim()) { toast.error('Client name is required'); setStep(1); throw new Error('Client name is required'); }
        setSaving(true);
        try {
            if (isNew) {
                const plan = await createDietPlan(buildPayload());
                toast.success('Plan saved');
                navigate(`/admin/diet-plans/${plan.id}`, { replace: true });
            } else {
                await updateDietPlan(id, buildPayload());
                toast.success('Plan saved');
            }
        } catch (e) {
            toast.error(e.message || 'Failed to save plan — it was not added to your Diet Plans list.');
            throw e;
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!client.name.trim()) { toast.error('Client name is required'); setStep(1); return; }
        try {
            await handleSave();
        } catch {
            return; // handleSave already showed the real error — don't download an unsaved plan
        }
        await generateDietPlanPDF(buildPayload(), buildExportOptions());
        navigate('/admin/diet-plans');
    };

    const buildExportOptions = () => ({
        mode: exportMode,
        includeInstructions: exportInstructions,
        includeExercises: includeExercise && exportExercises,
        includeCoverSnapshot: exportCoverSnapshot,
        includeFiberSugar: exportFiberSugar,
        includeAllergies: exportAllergies,
        includeTrainerNotes: exportTrainerNotes,
        includeServingColumn: exportServingColumn,
        // Always the live, fully-resolved list (never null) — buildPayload's
        // own `guidelines` can be null (meaning "still following the global
        // default" for storage purposes), but the PDF always needs an
        // actual array of lines to print regardless of that distinction.
        guidelines,
    });

    // Live PDF preview for the Export step — regenerates (debounced, so
    // rapid toggle clicks don't fire a build per click) whenever the format
    // or any customization option changes, so the admin sees exactly what
    // they're about to download before committing to it. Only runs on Step
    // 5 — no point building a preview while still editing earlier steps.
    useEffect(() => {
        if (step !== 5) return;
        setPreviewLoading(true);
        let cancelled = false;
        const timer = setTimeout(async () => {
            try {
                const url = await buildDietPlanPreviewUrl(buildPayload(), buildExportOptions());
                if (!cancelled) setPreviewUrl(url);
            } catch {
                // non-blocking — the preview is a nicety; Save/Download still works independently
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        }, 500);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [
        step, exportMode, exportInstructions, exportExercises, exportCoverSnapshot,
        exportFiberSugar, exportAllergies, exportTrainerNotes, exportServingColumn, guidelines,
        days, client, trainer, planDuration, includeExercise, targetCaloriesManual, targetCalories,
    ]);

    // Revokes the previous blob URL whenever a new preview replaces it (and
    // the final one on unmount) — blob URLs otherwise leak for the life of
    // the tab, and a new one is minted on every regeneration above.
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    // Tab clicks can only revisit steps already validated through — they
    // can't skip ahead of data that was never filled in. Only advanceTo()
    // (reached via the validated "Next" flow) opens up a new step.
    const goStep = (s) => {
        if (s < 1 || s > 5) return;
        if (s > maxStepReached) { toast.error('Complete the current step first'); return; }
        setStep(s);
    };
    const advanceTo = (s) => {
        setMaxStepReached((m) => Math.max(m, s));
        setStep(s);
    };
    const nextStep = () => {
        if (step === 1 && !client.name.trim()) { toast.error('Enter client name'); return; }
        if (step === 3) {
            if (!isNew && planHasContent && !showRegenerateOptions) { advanceTo(4); return; }
            useTemplate === true ? handleApplyTemplate() : useTemplate === false ? handleCustomPlan() : toast.error('Choose an approach');
            return;
        }
        advanceTo(step + 1);
    };

    const calorieEstimate = useMemo(() => estimateCalorieTarget({
        gender: client.gender, age: Number(client.age), height: Number(client.height),
        weight: Number(client.weight), activityLevel: client.activityLevel, goal: client.goal,
    }), [client.gender, client.age, client.height, client.weight, client.activityLevel, client.goal]);

    // What the plan is actually aiming for — the admin's manual override
    // when set, otherwise the live auto-estimate above.
    const effectiveTargetCalories = targetCaloriesManual ? (Number(targetCalories) || 0) : (calorieEstimate?.suggestedTarget ?? 0);

    const planHasContent = days.some((d) => d.meals?.some((m) => m.foods?.length) || d.exercises?.length);
    const activeDay = days[currentDay];
    const dayTotals = activeDay ? calcDayTotals(activeDay) : { calories: 0, protein: 0, carbs: 0, fats: 0, caloriesBurned: 0 };

    // Clicking a food/exercise in the picker adds it in the background (the
    // modal stays open so several can be added in a row) — these give the
    // modal itself visible confirmation of what's already been added,
    // instead of it looking like the click did nothing.
    const mealFoodCounts = useMemo(() => {
        const counts = new Map();
        if (!foodPicker || !activeDay) return counts;
        const meal = activeDay.meals.find((m) => m.type === foodPicker.mealType);
        (meal?.foods || []).forEach((f) => counts.set(f.foodId, (counts.get(f.foodId) || 0) + 1));
        return counts;
    }, [foodPicker, activeDay]);

    const dayExerciseCounts = useMemo(() => {
        const counts = new Map();
        (activeDay?.exercises || []).forEach((e) => counts.set(e.exerciseId, (counts.get(e.exerciseId) || 0) + 1));
        return counts;
    }, [activeDay]);

    // Category/cuisine/budget start out matching the client's own settings
    // (set below whenever the picker opens) but are freely adjustable per
    // meal without leaving the modal — e.g. narrow to just "Beverages" for
    // Morning Drink, or peek outside the client's usual cuisine for one item.
    const filteredFoods = useMemo(() => filterFoodPicker(foods, {
        dietPreference: client.dietPreference, category: foodCategoryFilter, cuisine: foodCuisineFilter, budgetOnly: foodBudgetFilter, search: foodSearch,
    }), [foods, client.dietPreference, foodCategoryFilter, foodCuisineFilter, foodBudgetFilter, foodSearch]);

    const filteredExercises = useMemo(() => {
        if (!exerciseSearch.trim()) return exercises;
        const q = exerciseSearch.trim().toLowerCase();
        return exercises.filter((e) => e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q));
    }, [exercises, exerciseSearch]);

    if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>;

    // The whole page — header, stepper, form, and the Previous/Next bar —
    // shares one centered column so the buttons always land directly under
    // the form instead of drifting off to the far edge of a wide page. Step
    // 4 needs the extra room for its two-column meal/exercise layout.
    // Step 5 needs the most room of all — a fixed-width options column next
    // to a live PDF preview that should grow to fill whatever's left, not
    // sit cramped in the same narrow single-column width as the plain forms.
    const pageWidthClass = step === 5 ? 'max-w-7xl' : step === 4 ? 'max-w-4xl' : step === 3 ? 'max-w-3xl' : 'max-w-2xl';

    return (
        <div className={`${pageWidthClass} mx-auto space-y-6 pb-10`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">{isNew ? 'New Diet Plan' : `Editing: ${fmtName(client.name) || 'Plan'}`}</h1>
                    <p className="text-xs text-white/35 mt-1">Build a personalized diet & exercise plan and export it as a branded PDF.</p>
                </div>
                <button onClick={() => navigate('/admin/diet-plans')} className="text-xs font-bold text-white/40 hover:text-white/70">← Back to Plans</button>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1 flex-wrap">
                {STEPS.map((s, i) => {
                    const Icon = s.icon;
                    const active = step === s.id;
                    const done = step > s.id;
                    return (
                        <div key={s.id} className="flex items-center">
                            <button onClick={() => goStep(s.id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                style={active
                                    ? { background: '#e71763', color: 'white' }
                                    : done ? { background: 'rgba(52,211,153,0.1)', color: '#34d399' }
                                        : { background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)' }}>
                                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{s.title}</span>
                            </button>
                            {i < STEPS.length - 1 && <div className="w-4 h-px mx-1" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                        </div>
                    );
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                    {/* STEP 1: Client Info */}
                    {step === 1 && (
                        <div className="space-y-5 max-w-2xl">
                            <div className="rounded-2xl p-5" style={card}>
                                <p className="text-sm font-black text-white mb-1">Autofill from an Enrollment</p>
                                <p className="text-xs text-white/35 mb-3">Search an existing client to prefill their details — optional.</p>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                                    <input value={enrollSearch}
                                        onChange={(e) => { setEnrollSearch(e.target.value); runEnrollSearch(e.target.value); setLinkedPlanWarning(null); }}
                                        placeholder="Search by name, email, or phone…"
                                        className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
                                </div>
                                {enrollSearching && <p className="text-xs text-white/30 mt-2">Searching…</p>}
                                {enrollResults.length > 0 && (
                                    <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto">
                                        {enrollResults.map((r) => (
                                            <button key={r.id} onClick={() => applyEnrollment(r)}
                                                className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-white/5"
                                                style={inputCard}>
                                                <span className="font-bold text-white">{fmtName(r.customer_name)}</span>
                                                <span className="text-white/35 ml-2">{r.customer_phone || r.customer_email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {enrollmentId && <p className="text-[11px] font-bold mt-2" style={{ color: '#34d399' }}>Linked to enrollment ✓</p>}

                                {linkedPlanWarning && (
                                    <div className="mt-3 p-3 rounded-lg flex items-center justify-between gap-3 flex-wrap"
                                        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
                                        <p className="text-xs text-white/70">
                                            <span className="font-bold text-red-400">{linkedPlanWarning.clientName}</span> already has a diet plan
                                            ({linkedPlanWarning.plan.goal} · {linkedPlanWarning.plan.plan_duration} days).
                                        </p>
                                        <button onClick={() => navigate(`/admin/diet-plans/${linkedPlanWarning.plan.id}`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black text-white flex-shrink-0"
                                            style={{ background: '#e71763' }}>
                                            <Edit2 className="w-3 h-3" /> Edit That Plan
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl p-5 space-y-4" style={card}>
                                <p className="text-sm font-black text-white">Client Info</p>
                                <TextInput label="Client Name" value={client.name} onChange={setClientField('name')} placeholder="Client's full name" />
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Age" value={String(client.age)} onChange={setClientField('age')} />
                                    <SelectField label="Gender" value={client.gender} onChange={setClientField('gender')} options={['Male', 'Female', 'Other']} />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <TextInput label="Height (cm)" value={String(client.height)} onChange={setClientField('height')} />
                                    <TextInput label="Weight (kg)" value={String(client.weight)} onChange={setClientField('weight')} />
                                    <TextInput label="Target (kg)" value={String(client.targetWeight)} onChange={setClientField('targetWeight')} />
                                </div>
                                <TextInput label="Allergies / Restrictions" value={client.allergies} onChange={setClientField('allergies')} placeholder="e.g. Nuts, Dairy" />
                                <div>
                                    <SelectField label="Regional Cuisine Preference" value={client.cuisine} onChange={setClientField('cuisine')} options={['Any', ...FOOD_REGIONS]} />
                                    <p className="text-[11px] text-white/25 mt-1.5">Narrows the food picker in Build Plan to this cuisine (plus generic staples) — e.g. pick Gujarati and mostly Gujarati food shows up. "Any" shows the full library.</p>
                                </div>
                                <ToggleField label="Budget-Conscious Client" checked={client.budgetConscious} onChange={setClientField('budgetConscious')}
                                    hint="e.g. a hostel/PG student — narrows the food picker to foods marked Budget-Friendly (Admin → Diet Foods)" />

                                <div className="pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                                    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-1">Trainer Info</p>
                                    <p className="text-[11px] text-white/25 mb-3">Auto-filled from your Profile (click your name in the sidebar) — change it here for just this plan, or update your Profile to change the default for every new plan.</p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <TextInput label="Trainer Name" value={trainer.name} onChange={setTrainerField('name')} placeholder="Your name" />
                                        <TextInput label="Contact" value={trainer.contact} onChange={setTrainerField('contact')} placeholder="Email or phone" />
                                    </div>
                                    <div className="mt-4">
                                        <TextInput label="Qualification" value={trainer.qualification} onChange={setTrainerField('qualification')} placeholder="Certified Nutritionist" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Plan Setup */}
                    {step === 2 && (
                        <div className="space-y-5 max-w-2xl">
                            <div className="rounded-2xl p-5 space-y-4" style={card}>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <SelectField label="Goal" value={client.goal} onChange={setClientField('goal')}
                                        options={['Fat Loss', 'Muscle Gain', 'Weight Maintenance', 'General Fitness']} />
                                    <SelectField label="Diet Preference" value={client.dietPreference} onChange={setClientField('dietPreference')}
                                        options={['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan']} />
                                </div>
                                <SelectField label="Activity Level" value={client.activityLevel} onChange={setClientField('activityLevel')}
                                    options={['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extremely Active']} />

                                <div>
                                    <label className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-1.5 block">Plan Duration</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[7, 10, 15, 30].map((d) => (
                                            <button key={d} onClick={() => handleDurationChange(d)}
                                                className="p-3 rounded-xl text-center font-black transition-all"
                                                style={planDuration === d ? { background: '#e71763', color: 'white' } : { ...inputCard, color: 'rgba(255,255,255,0.6)' }}>
                                                <div className="text-lg">{d}</div>
                                                <div className="text-[10px] opacity-70">Days</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <ToggleField label="Include Exercise Plan" checked={includeExercise} onChange={setIncludeExercise} hint="Add a workout routine alongside the diet plan" />
                                <ToggleField label="Repeat Same Plan Every Day" checked={repeatDaily} onChange={setRepeatDaily}
                                    hint="For clients who can't cook fresh daily (hostel/PG students, tight schedules) — build one day once, it applies to the whole duration, and the export prints just that one day instead of repeating it." />
                                <TextArea label="Additional Notes" value={client.notes} onChange={setClientField('notes')} rows={3} placeholder="Special instructions or preferences…" />
                            </div>

                            {calorieEstimate && (
                                <div className="rounded-2xl p-5" style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.2)' }}>
                                    <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e71763' }}>Suggested Calorie Target</p>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div><p className="text-xl font-black text-white">{calorieEstimate.bmr}</p><p className="text-[10px] text-white/35 mt-0.5">BMR</p></div>
                                        <div><p className="text-xl font-black text-white">{calorieEstimate.tdee}</p><p className="text-[10px] text-white/35 mt-0.5">Maintenance</p></div>
                                        <div><p className="text-xl font-black" style={{ color: '#e71763' }}>{calorieEstimate.suggestedTarget}</p><p className="text-[10px] text-white/35 mt-0.5">Suggested (for {client.goal})</p></div>
                                    </div>
                                    <p className="text-[10px] text-white/25 mt-3">Estimate only — use it as a reference when building the plan, not a hard rule.</p>

                                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                        <ToggleField label="Manually Set Target Calories" checked={targetCaloriesManual}
                                            onChange={(v) => {
                                                setTargetCaloriesManual(v);
                                                if (v && !targetCalories) setTargetCalories(calorieEstimate.suggestedTarget);
                                            }}
                                            hint="Off = auto-calculated from BMR/TDEE above" />
                                        {targetCaloriesManual && (
                                            <div className="mt-3">
                                                <input type="number" value={targetCalories}
                                                    onChange={(e) => setTargetCalories(e.target.value)}
                                                    placeholder={String(calorieEstimate.suggestedTarget)}
                                                    className="w-full px-3 py-2.5 rounded-xl text-sm font-bold text-white outline-none"
                                                    style={inputCard} />
                                                <p className="text-[10px] text-white/25 mt-1.5">This target replaces the auto-estimate everywhere the plan shows a calorie goal.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: Template */}
                    {step === 3 && !isNew && planHasContent && !showRegenerateOptions && (
                        <div className="max-w-3xl space-y-4">
                            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
                                <Check className="w-6 h-6 mx-auto mb-2" style={{ color: '#34d399' }} />
                                <p className="text-sm font-black text-white mb-1">This plan already has content</p>
                                <p className="text-xs text-white/40 mb-4">Head to Build Plan to review or edit the existing days.</p>
                                <button onClick={() => advanceTo(4)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-black text-white"
                                    style={{ background: '#e71763' }}>
                                    Go to Build Plan <ChevronRight className="inline w-3.5 h-3.5 ml-1" />
                                </button>
                            </div>
                            <button onClick={() => setShowRegenerateOptions(true)} className="text-xs font-bold text-white/30 hover:text-white/60 mx-auto block">
                                Start over from a template instead (replaces all current days)
                            </button>
                        </div>
                    )}
                    {step === 3 && (isNew || !planHasContent || showRegenerateOptions) && (
                        <div className="max-w-3xl space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <button onClick={() => setUseTemplate(true)}
                                    className="p-5 rounded-2xl text-left transition-all"
                                    style={useTemplate === true ? { background: '#e71763', color: 'white' } : card}>
                                    <Sparkles className="w-6 h-6 mb-3" />
                                    <p className="font-black mb-1">Use a Template</p>
                                    <p className="text-xs opacity-75">Quick start with a pre-built plan matched to the client's goal</p>
                                </button>
                                <button onClick={() => setUseTemplate(false)}
                                    className="p-5 rounded-2xl text-left transition-all"
                                    style={useTemplate === false ? { background: '#e71763', color: 'white' } : card}>
                                    <CalendarDays className="w-6 h-6 mb-3" />
                                    <p className="font-black mb-1">Build Custom</p>
                                    <p className="text-xs opacity-75">Start from a blank plan — full control over every meal</p>
                                </button>
                            </div>

                            {useTemplate === true && (
                                <div className="rounded-2xl p-5 space-y-3" style={card}>
                                    <p className="text-sm font-black text-white mb-1">Choose a Diet Template</p>
                                    {templates.map((t) => (
                                        <button key={t.id} onClick={() => setSelectedTemplate(t.id)}
                                            className="w-full p-4 rounded-xl text-left transition-all"
                                            style={selectedTemplate === t.id ? { background: 'rgba(231,23,99,0.15)', border: '2px solid #e71763' } : inputCard}>
                                            <p className="font-bold text-white text-sm">{t.name}</p>
                                            <p className="text-xs text-white/40 mt-0.5">{t.description}</p>
                                        </button>
                                    ))}
                                    {includeExercise && (
                                        <div className="pt-2">
                                            <p className="text-[11px] font-bold text-white/45 uppercase tracking-widest mb-2">Workout Template</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {workoutTemplates.map((t) => (
                                                    <button key={t.id} onClick={() => setSelectedWorkoutTemplate(t.id)}
                                                        className="p-3 rounded-xl text-left"
                                                        style={selectedWorkoutTemplate === t.id ? { background: 'rgba(231,23,99,0.15)', border: '2px solid #e71763' } : inputCard}>
                                                        <p className="text-xs font-bold text-white">{t.name}</p>
                                                        <p className="text-[11px] text-white/35 mt-0.5">{t.description}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: Build Plan */}
                    {step === 4 && activeDay && (
                        <div className="space-y-5">
                            {repeatDaily ? (
                                <div className="flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl text-xs font-bold"
                                    style={{ background: 'rgba(231,23,99,0.08)', border: '1px solid rgba(231,23,99,0.25)', color: '#e71763' }}>
                                    <Repeat2 className="w-3.5 h-3.5 flex-shrink-0" />
                                    This plan repeats every day — build it once below, it applies to all {planDuration} days
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    <button onClick={() => setCurrentDay((d) => Math.max(0, d - 1))} disabled={currentDay === 0}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                                    {days.slice(0, 31).map((d, i) => (
                                        <button key={i} onClick={() => setCurrentDay(i)}
                                            className="w-9 h-9 rounded-lg text-xs font-bold flex-shrink-0"
                                            style={currentDay === i ? { background: '#e71763', color: 'white' } : d.restDay ? { border: '1px dashed rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.4)' } : { ...inputCard, color: 'rgba(255,255,255,0.6)' }}>
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentDay((d) => Math.min(days.length - 1, d + 1))} disabled={currentDay === days.length - 1}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="flex items-center justify-between rounded-2xl p-4" style={card}>
                                <div>
                                    <p className="text-sm font-black text-white">{repeatDaily ? 'Daily Plan' : `Day ${activeDay.dayNumber} of ${planDuration}`}</p>
                                    <p className="text-xs text-white/35 mt-0.5">
                                        {dayTotals.calories} kcal · P {dayTotals.protein}g · C {dayTotals.carbs}g · F {dayTotals.fats}g · Fiber {dayTotals.fiber}g{includeExercise ? ` · Burn ~${dayTotals.caloriesBurned}` : ''}
                                        {effectiveTargetCalories > 0 && <span className="text-white/25"> · Target {effectiveTargetCalories}{targetCaloriesManual ? ' (manual)' : ''}</span>}
                                    </p>
                                </div>
                                {!repeatDaily && <ToggleField label="Rest Day" checked={activeDay.restDay} onChange={toggleRestDay} />}
                            </div>

                            {!activeDay.restDay && (
                                <div className="grid lg:grid-cols-2 gap-5">
                                    <div className="rounded-2xl p-5 space-y-4" style={card}>
                                        <p className="text-sm font-black text-white flex items-center gap-2"><Salad className="w-4 h-4" style={{ color: '#e71763' }} /> Diet Plan</p>
                                        {activeDay.meals.map((meal) => {
                                            // Only the default option per OR-group counts toward the badge —
                                            // matches how dietCalc's calcDayTotals resolves the day total.
                                            const mealCal = resolveMealForTotals(meal).reduce((s, f) => s + f.calories * f.quantity, 0);
                                            const slots = groupMealFoods(meal.foods);
                                            return (
                                                <div key={meal.type} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-bold text-white/70">
                                                            {meal.label}
                                                            {OPTIONAL_MEAL_TYPES.has(meal.type) && <span className="text-white/25 font-normal"> (optional)</span>}
                                                        </p>
                                                        <span className="text-[11px] text-white/30">{Math.round(mealCal)} kcal</span>
                                                    </div>
                                                    {slots.length === 0 ? (
                                                        <p className="text-xs text-white/25 italic">No items</p>
                                                    ) : slots.map((slot) => slot.type === 'single' ? (
                                                        <FoodEntryRow key={slot.idx} food={slot.food} dietUnits={dietUnits}
                                                            onAmountChange={(patch) => updateFoodAmount(meal.type, slot.idx, patch)}
                                                            onRemove={() => removeFoodFromMeal(meal.type, slot.idx)}
                                                            onAddAlt={() => openFoodPicker(meal.type, slot.idx)} />
                                                    ) : (
                                                        <div key={slot.altGroup} className="rounded-lg p-2 space-y-1.5"
                                                            style={{ border: '1px dashed rgba(144,133,233,0.35)', background: 'rgba(144,133,233,0.03)' }}>
                                                            <p className="text-[9px] font-black uppercase tracking-widest px-0.5" style={{ color: '#9085e9' }}>Choose One</p>
                                                            {slot.options.map((opt, oi) => (
                                                                <div key={opt.idx}>
                                                                    {oi > 0 && (
                                                                        <div className="flex items-center gap-2 py-0.5">
                                                                            <div className="flex-1 h-px" style={{ background: 'rgba(144,133,233,0.25)' }} />
                                                                            <span className="text-[10px] font-black" style={{ color: '#9085e9' }}>OR</span>
                                                                            <div className="flex-1 h-px" style={{ background: 'rgba(144,133,233,0.25)' }} />
                                                                        </div>
                                                                    )}
                                                                    <FoodEntryRow food={opt.food} dietUnits={dietUnits} isAlt
                                                                        onAmountChange={(patch) => updateFoodAmount(meal.type, opt.idx, patch)}
                                                                        onRemove={() => removeFoodFromMeal(meal.type, opt.idx)}
                                                                        onAddAlt={() => openFoodPicker(meal.type, opt.idx)} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                    <button onClick={() => openFoodPicker(meal.type)}
                                                        className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                                                        style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
                                                        <Plus className="w-3 h-3" /> Add Food
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {includeExercise && (
                                        <div className="rounded-2xl p-5 space-y-3" style={card}>
                                            <p className="text-sm font-black text-white flex items-center gap-2"><Dumbbell className="w-4 h-4" style={{ color: '#e71763' }} /> Exercise Plan</p>
                                            {activeDay.exercises.length === 0 ? (
                                                <p className="text-xs text-white/25 italic">No exercises added</p>
                                            ) : activeDay.exercises.map((ex, ei) => (
                                                <div key={ei} className="p-3 rounded-lg text-xs space-y-2" style={inputCard}>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-white/80 font-bold">{ex.name}</p>
                                                        <div className="flex items-center gap-3">
                                                            <span style={{ color: '#e71763' }} className="font-bold">~{ex.caloriesBurned} kcal</span>
                                                            <button onClick={() => removeExercise(ei)} className="text-red-400/70 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                                        </div>
                                                    </div>
                                                    {ex.durationBased ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white/35">Duration:</span>
                                                            <button onClick={() => updateExerciseParams(ei, { durationMinutes: Math.max(1, (ex.durationMinutes || 0) - 1) })} className="w-5 h-5 text-white/40">-</button>
                                                            <span className="text-white/60 w-14 text-center">{ex.durationMinutes || 0} min</span>
                                                            <button onClick={() => updateExerciseParams(ei, { durationMinutes: (ex.durationMinutes || 0) + 1 })} className="w-5 h-5 text-white/40">+</button>
                                                            <span className="text-white/25 text-[10px] ml-auto">library ref: {ex.baseDuration || '—'}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/35">Sets:</span>
                                                                <button onClick={() => updateExerciseParams(ei, { sets: Math.max(1, (ex.sets || 0) - 1) })} className="w-5 h-5 text-white/40">-</button>
                                                                <span className="text-white/60 w-5 text-center">{ex.sets || 0}</span>
                                                                <button onClick={() => updateExerciseParams(ei, { sets: (ex.sets || 0) + 1 })} className="w-5 h-5 text-white/40">+</button>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white/35">Reps:</span>
                                                                <button onClick={() => updateExerciseParams(ei, { reps: Math.max(1, (ex.reps || 0) - 1) })} className="w-5 h-5 text-white/40">-</button>
                                                                <span className="text-white/60 w-5 text-center">{ex.reps || 0}</span>
                                                                <button onClick={() => updateExerciseParams(ei, { reps: (ex.reps || 0) + 1 })} className="w-5 h-5 text-white/40">+</button>
                                                            </div>
                                                            <span className="text-white/25 text-[10px] ml-auto">library ref: {ex.baseSets} × {ex.baseReps}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => { setExercisePicker(true); setExerciseSearch(''); }}
                                                className="w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                                                style={{ border: '1px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.4)' }}>
                                                <Plus className="w-3 h-3" /> Add Exercise
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="rounded-2xl p-5" style={card}>
                                <TextArea label="Day Notes" value={activeDay.notes} onChange={(v) => setDays((prev) => prev.map((d, i) => i !== currentDay ? d : { ...d, notes: v }))} rows={2} placeholder="Notes for this day…" />
                            </div>
                        </div>
                    )}

                    {/* STEP 5: Export */}
                    {step === 5 && (
                        <div className="grid lg:grid-cols-[440px_minmax(0,1fr)] gap-5 items-start">
                            <div className="space-y-5 min-w-0">
                                <div className="rounded-2xl p-5" style={card}>
                                    <p className="text-sm font-black text-white mb-4">Plan Summary</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Client', value: client.name || 'Not set' },
                                            { label: 'Goal', value: client.goal },
                                            { label: 'Duration', value: `${planDuration} Days` },
                                            { label: 'Diet', value: client.dietPreference },
                                            { label: 'Target Calories', value: effectiveTargetCalories > 0 ? `${effectiveTargetCalories}${targetCaloriesManual ? ' (manual)' : ' (auto)'}` : 'Not set' },
                                        ].map((it) => (
                                            <div key={it.label} className="p-3 rounded-xl text-center" style={inputCard}>
                                                <p className="text-[10px] text-white/30 mb-1">{it.label}</p>
                                                <p className="text-xs font-bold text-white">{it.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl p-5 space-y-3" style={card}>
                                    <p className="text-sm font-black text-white mb-1">Choose PDF Format</p>
                                    {[
                                        { id: 'full', title: 'Full Plan', desc: 'Every food item with macros, meal totals, and exercises.' },
                                        { id: 'macros-per-meal', title: 'Macros Per Meal', desc: 'Foods listed per meal with totals per meal and per day.' },
                                        { id: 'summary', title: 'Summary Only', desc: 'One row per day — quick overview table.' },
                                        { id: 'diet-only', title: 'Diet Plan Only', desc: 'Food names, servings, calories — no macro breakdown.' },
                                        { id: 'shopping-list', title: 'Shopping List', desc: 'Every food needed for the full plan, totaled and grouped by category — for clients doing their own groceries.' },
                                    ].map((m) => (
                                        <button key={m.id} onClick={() => setExportMode(m.id)}
                                            className="w-full p-3.5 rounded-xl text-left flex items-center justify-between"
                                            style={exportMode === m.id ? { background: 'rgba(231,23,99,0.15)', border: '2px solid #e71763' } : inputCard}>
                                            <div>
                                                <p className="text-sm font-bold text-white">{m.title}</p>
                                                <p className="text-xs text-white/35 mt-0.5">{m.desc}</p>
                                            </div>
                                            {exportMode === m.id && <Check className="w-4 h-4 flex-shrink-0" style={{ color: '#e71763' }} />}
                                        </button>
                                    ))}
                                </div>

                                <div className="rounded-2xl p-5 space-y-1" style={card}>
                                    <p className="text-sm font-black text-white mb-2">Customize What's Included</p>
                                    {includeExercise && (
                                        <ToggleField label="Exercise Tables" checked={exportExercises} onChange={setExportExercises} hint="Per-day exercise volume + calories burned" />
                                    )}
                                    <ToggleField label="Cover Page Health Snapshot" checked={exportCoverSnapshot} onChange={setExportCoverSnapshot} hint="BMI card, macro ratio bar, daily average stats" />
                                    <ToggleField label="Fiber & Sugar Figures" checked={exportFiberSugar} onChange={setExportFiberSugar} hint="Alongside calories/protein/carbs/fat in day summaries" />
                                    {client.allergies && (
                                        <ToggleField label="Allergies / Restrictions Note" checked={exportAllergies} onChange={setExportAllergies} hint="Callout box on the cover page" />
                                    )}
                                    <ToggleField label="Serving / Quantity Column" checked={exportServingColumn} onChange={setExportServingColumn} hint="Show each food's serving size and quantity, not just its name" />
                                    <ToggleField label="General Guidelines" checked={exportInstructions} onChange={setExportInstructions} hint="Hydration/sleep/consistency tips page" />
                                    {client.notes && (
                                        <ToggleField label="Trainer Notes" checked={exportTrainerNotes} onChange={setExportTrainerNotes} hint="Your notes for this client, printed on the guidelines page" />
                                    )}
                                </div>

                                {exportInstructions && (
                                    <div className="rounded-2xl p-5 space-y-2" style={card}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-black text-white">Guideline Text (this plan)</p>
                                            <button onClick={() => setGuidelines(defaultGuidelines)}
                                                className="text-[11px] font-bold text-white/40 hover:text-white/70">
                                                Reset to Default
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-white/25">
                                            Defaults to the global guidelines (Admin → Site Settings → Diet Plan Guidelines). Edit here to customize just for {client.name || 'this client'} — e.g. an injury or medical note.
                                        </p>
                                        <TextArea
                                            label=""
                                            value={guidelines.join('\n')}
                                            onChange={(val) => setGuidelines(val.split('\n'))}
                                            rows={8}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl p-3 lg:sticky lg:top-4 flex flex-col" style={{ ...card, height: 'min(85vh, 900px)' }}>
                                <div className="flex items-center justify-between px-2 pb-2 flex-shrink-0">
                                    <p className="text-xs font-black text-white/70 uppercase tracking-widest">Live Preview</p>
                                    {previewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />}
                                </div>
                                <div className="flex-1 min-h-0 rounded-xl overflow-hidden relative" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    {previewUrl ? (
                                        <iframe
                                            // Standard PDF viewer open-parameters (Chromium/PDFium honors these)
                                            // — hides the browser's own generic PDF toolbar/nav panel/scrollbar
                                            // chrome so the preview reads as part of this page, not an embedded
                                            // plugin. Download/print already exist as our own branded actions.
                                            src={`${previewUrl}#toolbar=0&navpanes=0&statusbar=0&messages=0&scrollbar=0`}
                                            title="PDF preview"
                                            className="w-full h-full border-0"
                                            style={{ opacity: previewLoading ? 0.4 : 1, transition: 'opacity 150ms' }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Bottom nav */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => goStep(step - 1)} disabled={step === 1}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/50 disabled:opacity-30" style={inputCard}>
                    <ChevronLeft className="inline w-3.5 h-3.5 mr-1" /> Previous
                </button>
                <div className="flex items-center gap-3">
                    <button onClick={() => handleSave().catch(() => {})} disabled={saving}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/70 flex items-center gap-1.5 disabled:opacity-50" style={inputCard}>
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
                    </button>
                    {step < 5 ? (
                        <button onClick={nextStep} disabled={step === 3 && useTemplate === null}
                            className="px-5 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-40" style={{ background: '#e71763' }}>
                            {step === 3 && useTemplate === true ? 'Apply Template' : 'Next'} <ChevronRight className="inline w-3.5 h-3.5 ml-1" />
                        </button>
                    ) : (
                        <button onClick={handleDownloadPDF} disabled={saving}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                            style={{ background: '#e71763', boxShadow: '0 0 20px rgba(231,23,99,0.35)' }}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                            Save & Download PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Food picker modal */}
            {foodPicker && (
                <Modal
                    title={`${foodPicker.altFor != null ? 'Add Alternative (OR)' : 'Add Food'} — ${MEAL_TYPES.find((m) => m.type === foodPicker.mealType)?.label}`}
                    onClose={() => setFoodPicker(null)} wide>
                    {foodPicker.altFor != null && (
                        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(144,133,233,0.08)', border: '1px solid rgba(144,133,233,0.25)', color: '#c4bdf5' }}>
                            The client will be shown this as an OR option — they pick one, not both.
                        </p>
                    )}
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
                                <button key={food.id}
                                    onClick={() => (foodPicker.altFor != null
                                        ? addAlternativeToFood(foodPicker.mealType, foodPicker.altFor, food)
                                        : addFoodToMeal(foodPicker.mealType, food))}
                                    className="flex items-center justify-between p-3 rounded-lg text-left hover:border-pink-500/40 transition-colors"
                                    style={addedCount > 0 ? { background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.35)' } : inputCard}>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                                            {food.name}
                                            {addedCount > 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black flex-shrink-0" style={{ color: '#34d399' }}>
                                                    <Check className="w-3 h-3" /> {addedCount > 1 ? `×${addedCount}` : 'Added'}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-white/35">
                                            {formatServing(food)}
                                            {food.region && food.region !== 'Generic / Pan-Indian' && (
                                                <span className="ml-1.5" style={{ color: '#9085e9' }}>· {food.region}</span>
                                            )}
                                            {food.is_budget_friendly && (
                                                <span className="ml-1.5" style={{ color: '#34d399' }}>· ₹ Budget</span>
                                            )}
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

            {/* Exercise picker modal */}
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
                                            {addedCount > 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] font-black flex-shrink-0" style={{ color: '#34d399' }}>
                                                    <Check className="w-3 h-3" /> {addedCount > 1 ? `×${addedCount}` : 'Added'}
                                                </span>
                                            )}
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
