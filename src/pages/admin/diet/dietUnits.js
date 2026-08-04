// src/pages/admin/diet/dietUnits.js
//
// Structured serving units for diet_foods, replacing the old ambiguous
// free-text serving_size ("1 cup" — but what size cup?). serving_qty +
// serving_unit are the new fields; serving_size is kept for backward
// compatibility with foods that haven't been re-edited yet, and as the
// display fallback for them.
export const SERVING_UNITS = [
    'Grams (g)',
    'Milliliters (ml)',
    'Ounce (oz)',
    'Tablespoon (tbsp)',
    'Teaspoon (tsp)',
    'Cup - Small',
    'Cup - Medium',
    'Cup - Large',
    'Bowl - Small',
    'Bowl - Medium',
    'Bowl - Large',
    'Katori',
    'Piece',
    'Slice',
    'Glass',
];

// Food display: prefer the structured qty+unit; fall back to the legacy
// free-text serving_size for foods that haven't been updated yet.
export function formatServing(food) {
    if (!food) return '—';
    if (food.serving_unit) {
        const qty = food.serving_qty ?? 1;
        return `${qty} ${food.serving_unit}`;
    }
    return food.serving_size || '—';
}

// ── Cross-unit conversion ────────────────────────────────────────────────
// Every unit (from the admin-editable diet_units site setting — see
// AdminSiteSettings.jsx's "Diet Serving Units" section) has an approximate
// gram weight. Converting BOTH a food's own base serving and whatever the
// admin logs it as into grams gives a common currency to scale nutrition
// from, so any food can be logged in any unit — not just the one it was
// defined with in the library.
export function gramsForUnit(units, unitLabel) {
    const match = (units || []).find((u) => u.label === unitLabel);
    const grams = Number(match?.grams);
    return Number.isFinite(grams) && grams > 0 ? grams : 1;
}

// food: a diet_foods row (serving_qty/serving_unit = its own base serving).
// amount/unit: what the admin is logging this occurrence as.
// Returns the multiplier to apply to the food's per-base-serving nutrition
// (i.e. what `quantity` has always meant in a day's meals JSONB).
export function convertToQuantity(food, amount, unit, units) {
    const baseGrams = (Number(food?.serving_qty) || 1) * gramsForUnit(units, food?.serving_unit);
    const loggedGrams = (Number(amount) || 0) * gramsForUnit(units, unit);
    if (baseGrams <= 0) return 0;
    return loggedGrams / baseGrams;
}

// Backfills amount/unit on a meal's food entry saved before this per-entry
// unit control existed — old entries only had `quantity` (a plain multiplier
// of the food's base serving). Deriving amount = quantity × servingQty keeps
// the amount/unit controls showing a value consistent with the calories
// already on screen, instead of blank inputs, without changing `quantity`
// itself (so nothing recalculates until the admin actually edits it).
export function normalizeFoodEntry(f) {
    if (f.unit) return f;
    return {
        ...f,
        unit: f.servingUnit || SERVING_UNITS[0],
        amount: (Number(f.quantity) || 1) * (Number(f.servingQty) || 1),
    };
}
