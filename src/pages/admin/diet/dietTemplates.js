// src/pages/admin/diet/dietTemplates.js
import { isDurationBased, defaultExerciseCustom } from './dietCalc';
// Quick-start template ENGINE for the "Use a Template" step — the templates
// themselves are no longer hardcoded here. They live in diet_templates /
// diet_workout_templates (DB-backed, editable from Admin -> Diet Templates
// / Workout Templates; see FitWithSudarshan-Backend/src/scripts/
// seedDietTemplates.js for the original 5 + 2 this was migrated from), and
// the wizard fetches + passes them into generatePlanFromTemplate below.
// Ported from the reference app's templates.ts — but adapted so foods/
// exercises are looked up from the LIVE diet_foods/diet_exercises library
// instead of a static hardcoded array. The reference had food ids
// referenced by templates (chutney, sambar, peanut-butter) that were never
// defined in its own foods list, silently falling back to the first food
// in the array for those slots — those three are real library entries
// here, so that bug doesn't carry over.

// A template's foodIds are curated for a generic case — a specific client's
// diet_preference can conflict with individual items (e.g. a non-veg
// template's "chicken-curry" when this client is Vegetarian). Rather than
// including the mismatch as-is, this fills the same MEAL SLOT with a
// same-category food the client can actually eat.
function isDietCompatible(food, dietPreference) {
    if (!food) return false;
    if (dietPreference === 'Non-Vegetarian') return true;
    if (dietPreference === 'Eggetarian') return !!(food.is_veg || food.is_eggetarian);
    // Vegetarian and Vegan — no separate vegan flag in the data model, so
    // "strictly vegetarian" is the closest available approximation.
    return !!food.is_veg;
}

// Prefers a same-category substitute with the closest calorie value to the
// original, so swapping doesn't wildly change the meal's calorie weight
// before the day-level scaling pass below evens it out anyway.
function pickCompatibleFood(foodId, dietPreference, foodsById, foodsByCategory) {
    const original = foodsById.get(foodId);
    if (!original) return null;
    if (isDietCompatible(original, dietPreference)) return original;

    const pool = (foodsByCategory.get(original.category) || []).filter((f) => isDietCompatible(f, dietPreference));
    if (!pool.length) return original; // no compatible substitute exists — better to show it than drop the meal item

    return pool.reduce((best, f) => (
        Math.abs(f.calories - original.calories) < Math.abs(best.calories - original.calories) ? f : best
    ));
}

// Scales every food's quantity by a single day-level factor so the day's
// total lands on the plan's target calories, instead of just using
// whatever the template's fixed portions happen to add up to.
function scaleDayToTarget(day, targetCalories) {
    if (!targetCalories || targetCalories <= 0) return day;
    let rawTotal = 0;
    day.meals.forEach((m) => m.foods.forEach((f) => { rawTotal += f.calories * f.quantity; }));
    if (rawTotal <= 0) return day;

    // Clamped so a very stale/extreme target (e.g. picked before Plan Setup
    // was filled in) can't blow portions up or shrink them to nothing.
    const scale = Math.min(2, Math.max(0.5, targetCalories / rawTotal));

    return {
        ...day,
        meals: day.meals.map((m) => ({
            ...m,
            foods: m.foods.map((f) => {
                const quantity = Math.round(f.quantity * scale * 4) / 4; // nearest 0.25 serving
                const amount = f.servingUnit ? Math.round(quantity * (f.servingQty ?? 1) * 100) / 100 : quantity;
                return { ...f, quantity, amount };
            }),
        })),
    };
}

// templates/workoutTemplates: rows fetched from diet_templates /
// diet_workout_templates (see DietPlanBuilder.jsx) — no longer a static
// import, so any template an admin adds there is usable here immediately.
// foodsById/exercisesById: Map keyed by id, built by the wizard from the
// fetched diet_foods/diet_exercises library.
// dietPreference/targetCalories: the client's Step 1/2 selections — used to
// substitute diet-incompatible template foods and scale portions to hit
// the plan's calorie target, rather than always using the template's fixed
// generic foods/portions untouched.
export function generatePlanFromTemplate(templateId, duration, includeExercise, exerciseTemplateId, foodsById, exercisesById, dietPreference, targetCalories, templates, workoutTemplates) {
    const template = (templates || []).find((t) => t.id === templateId);
    if (!template) return null;

    const exerciseTemplate = (workoutTemplates || []).find((t) => t.id === exerciseTemplateId);
    const templateDays = template.days || [];
    if (!templateDays.length) return null; // admin-edited JSON with an empty days array — nothing to build from
    const exerciseDays = exerciseTemplate?.exercise_days || [];

    const foodsByCategory = new Map();
    for (const food of foodsById.values()) {
        if (!foodsByCategory.has(food.category)) foodsByCategory.set(food.category, []);
        foodsByCategory.get(food.category).push(food);
    }

    const days = [];
    for (let i = 0; i < duration; i++) {
        const dayTemplate = templateDays[i % templateDays.length];
        const exerciseDayTemplate = exerciseDays.length ? exerciseDays[i % exerciseDays.length] : [];

        const meals = (dayTemplate.meals || []).map((mealTemplate) => ({
            type: mealTemplate.type,
            label: mealTemplate.label,
            foods: (mealTemplate.foodIds || []).map((id) => {
                const food = dietPreference ? pickCompatibleFood(id, dietPreference, foodsById, foodsByCategory) : foodsById.get(id);
                if (!food) return null;
                return {
                    foodId: food.id, name: food.name, category: food.category, calories: food.calories, protein: food.protein,
                    carbs: food.carbs, fats: food.fats, fiber: food.fiber, sugar: food.sugar,
                    servingSize: food.serving_size, servingQty: food.serving_qty, servingUnit: food.serving_unit,
                    amount: food.serving_qty ?? 1, unit: food.serving_unit || null,
                    quantity: 1,
                };
            }).filter(Boolean),
        }));

        const exercises = includeExercise && exerciseDayTemplate?.length
            ? exerciseDayTemplate.map((id) => {
                const ex = exercisesById.get(id);
                if (!ex) return null;
                const custom = defaultExerciseCustom(ex);
                return {
                    exerciseId: id, name: ex.name, muscleGroup: ex.muscle_group,
                    durationBased: isDurationBased(ex),
                    baseSets: ex.sets, baseReps: ex.reps, baseDuration: ex.duration, baseCaloriesBurned: ex.calories_burned,
                    sets: custom.sets, reps: custom.reps, durationMinutes: custom.durationMinutes,
                    caloriesBurned: ex.calories_burned,
                };
            }).filter(Boolean)
            : [];

        const restDay = !!dayTemplate.restDay || (includeExercise && exercises.length === 0 && !!exerciseTemplateId);
        const day = { dayNumber: i + 1, meals, exercises, restDay, notes: '' };
        days.push(restDay ? day : scaleDayToTarget(day, targetCalories));
    }
    return days;
}
