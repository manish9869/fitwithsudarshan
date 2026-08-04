// src/pages/admin/diet/dietCalc.js
// Macro totals (ported from the reference app's calcTotals) plus a BMR/TDEE
// estimate — new, not in the reference. The wizard already collects age/
// gender/height/weight/activity-level, so showing a suggested calorie
// target costs nothing and gives Sudarshan a real number to plan around
// instead of guessing.

export function calcDayTotals(day) {
    let calories = 0, protein = 0, carbs = 0, fats = 0, caloriesBurned = 0;
    (day.meals || []).forEach((m) => (m.foods || []).forEach((f) => {
        calories += f.calories * f.quantity;
        protein += f.protein * f.quantity;
        carbs += f.carbs * f.quantity;
        fats += f.fats * f.quantity;
    }));
    (day.exercises || []).forEach((e) => { caloriesBurned += e.caloriesBurned; });
    return {
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fats: Math.round(fats),
        caloriesBurned: Math.round(caloriesBurned),
    };
}

const ACTIVITY_MULTIPLIERS = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9,
};

const GOAL_ADJUSTMENT = {
    'Fat Loss': -500,
    'Muscle Gain': 300,
    'Weight Maintenance': 0,
    'General Fitness': 0,
};

// Mifflin-St Jeor. 'Other' gender uses the midpoint of the male/female
// offset — a reasonable approximation when the formula's two options don't fit.
export function estimateCalorieTarget({ gender, age, height, weight, activityLevel, goal }) {
    if (!age || !height || !weight) return null;

    const base = 10 * weight + 6.25 * height - 5 * age;
    const bmr = gender === 'Male' ? base + 5 : gender === 'Female' ? base - 161 : base - 78;

    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
    const tdee = bmr * multiplier;
    const target = tdee + (GOAL_ADJUSTMENT[goal] ?? 0);

    return {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        suggestedTarget: Math.round(target / 10) * 10,
    };
}

// ── Exercise calorie scaling ─────────────────────────────────────────────
// Each library exercise (diet_exercises) has reference sets/reps/duration +
// a calories_burned figure for THAT reference amount. When an admin
// customizes sets/reps/duration for a specific plan, calories scale
// proportionally from that reference — same model as food quantity scaling
// calories from a food's per-serving values.

// Pulls the first number out of a free-text field like "12-15" or "30 min".
// Returns null if the field has no number in it at all.
export function parseLeadingNumber(text) {
    if (text == null || text === '') return null;
    if (typeof text === 'number') return text;
    const match = String(text).match(/(\d+(\.\d+)?)/);
    return match ? Number(match[1]) : null;
}

// Cardio (duration-based) vs strength (sets/reps-based) — inferred from the
// library exercise's own shape: something with a parseable duration and no
// sets is cardio; everything else is treated as sets/reps-based.
export function isDurationBased(ex) {
    const hasDuration = parseLeadingNumber(ex?.duration) != null;
    const hasSets = Number(ex?.sets) > 0;
    return hasDuration && !hasSets;
}

// baseEx: the library diet_exercises row. custom: { sets, reps, durationMinutes }
// — whatever the admin has set for this exercise on this specific plan.
export function scaleExerciseCalories(baseEx, custom) {
    const baseCalories = Number(baseEx?.calories_burned) || 0;
    if (!baseEx) return baseCalories;

    if (isDurationBased(baseEx)) {
        const baseDuration = parseLeadingNumber(baseEx.duration) || 1;
        const customDuration = Number(custom?.durationMinutes) || 0;
        return Math.round(baseCalories * (customDuration / baseDuration));
    }

    const baseSets = Number(baseEx.sets) || 1;
    const baseReps = parseLeadingNumber(baseEx.reps) || 1;
    const customSets = Number(custom?.sets) || 0;
    const customReps = Number(custom?.reps) || 0;
    const baseVolume = baseSets * baseReps;
    const customVolume = customSets * customReps;
    if (baseVolume <= 0) return baseCalories;
    return Math.round(baseCalories * (customVolume / baseVolume));
}

// Best-effort starting point for the editable fields when an exercise is
// first added to a plan — defaults to the library's own reference values so
// calories start out matching the library figure exactly (ratio = 1)
// before the admin changes anything.
export function defaultExerciseCustom(ex) {
    if (isDurationBased(ex)) {
        return { sets: null, reps: null, durationMinutes: parseLeadingNumber(ex?.duration) || 0 };
    }
    return { sets: Number(ex?.sets) || 1, reps: parseLeadingNumber(ex?.reps) || 1, durationMinutes: null };
}

// Backfills base*/durationBased/durationMinutes fields on exercise entries
// saved before this scaling feature existed (old shape: just
// { exerciseId, name, muscleGroup, caloriesBurned, sets, reps, duration }).
// Without this, editing sets/reps/duration on an old plan would scale
// against an undefined base and zero the calories out. Looks the exercise
// up in the current library for its reference values; if that library item
// was since deleted, falls back to the plan's own saved snapshot as the
// base (ratio stays 1 — same displayed number — until the admin changes it).
export function normalizeExercise(ex, exerciseRows) {
    if (ex.baseCaloriesBurned != null) return ex; // already new-format

    const lib = (exerciseRows || []).find((e) => e.id === ex.exerciseId);
    const source = lib || { sets: ex.sets, reps: ex.reps, duration: ex.duration, calories_burned: ex.caloriesBurned };
    const durationBased = isDurationBased(source);

    return {
        ...ex,
        durationBased,
        baseSets: source.sets, baseReps: source.reps, baseDuration: source.duration, baseCaloriesBurned: source.calories_burned,
        sets: durationBased ? null : (Number(ex.sets) || Number(source.sets) || 1),
        reps: durationBased ? null : (parseLeadingNumber(ex.reps) || parseLeadingNumber(source.reps) || 1),
        durationMinutes: durationBased ? (parseLeadingNumber(ex.duration) || parseLeadingNumber(source.duration) || 0) : null,
        caloriesBurned: ex.caloriesBurned ?? source.calories_burned ?? 0,
    };
}
