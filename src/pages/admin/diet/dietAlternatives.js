// src/pages/admin/diet/dietAlternatives.js
// "OR" alternative food options within a single meal slot — e.g. a
// breakfast slot offering "2 Boiled Eggs OR 1 Cup Poha OR 1 Bowl Sprouts"
// so the client can pick whichever is convenient that day, instead of the
// admin needing a separate plan per preference. Lives entirely inside the
// existing meals JSONB shape (meal.foods[]) — an entry just gets an
// optional `altGroup` id; entries sharing a non-null altGroup within the
// same meal are alternatives to each other, everything else stays additive
// exactly as before. No DB migration needed — diet_plan_days.meals is
// already jsonb and round-trips whatever shape the frontend saves.

export function makeAltGroupId() {
    return `alt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// Groups a meal's flat foods[] into display/calc slots — either a plain
// `{ type: 'single', food, idx }` (idx = its real index in foods[], needed
// by callers to target remove/update actions against the right entry) or a
// `{ type: 'choice', altGroup, options: [{ food, idx }, ...] }` for foods
// sharing an altGroup. A choice slot's position is wherever its FIRST
// member appears in foods[], so an alternative added later (always
// appended to foods[]) still renders grouped with the original instead of
// trailing at the end of the meal.
export function groupMealFoods(foods) {
    const slots = [];
    const slotIndexByGroup = new Map();
    (foods || []).forEach((food, idx) => {
        if (food.altGroup) {
            if (slotIndexByGroup.has(food.altGroup)) {
                slots[slotIndexByGroup.get(food.altGroup)].options.push({ food, idx });
            } else {
                slotIndexByGroup.set(food.altGroup, slots.length);
                slots.push({ type: 'choice', altGroup: food.altGroup, options: [{ food, idx }] });
            }
        } else {
            slots.push({ type: 'single', food, idx });
        }
    });
    return slots;
}

// The list actually counted toward calorie/macro totals — one food per
// meal slot. A choice group only counts its first-listed option (the
// "default"); the client eats one alternative, not all of them, so summing
// every option would overstate the day's real intake. "First in foods[]"
// is whichever option the admin added first for that slot.
export function resolveMealForTotals(meal) {
    return groupMealFoods(meal?.foods).map((slot) => (slot.type === 'choice' ? slot.options[0].food : slot.food));
}

// Whether this plan uses OR-alternatives anywhere — gates the PDF's
// explanatory legend so plans that don't use the feature print identically
// to before.
export function planHasAlternatives(plan) {
    return (plan?.days || []).some((d) => (d.meals || []).some((m) => (m.foods || []).some((f) => f.altGroup)));
}
