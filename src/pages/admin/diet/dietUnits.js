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
    'Plate',
    'Scoop',
    'Bar',
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

// A food can only be gram-converted if its OWN base serving is a real unit
// from the units table (serving_qty/serving_unit set — true for every food
// added via CMS since this feature shipped, and every CSV-imported food).
// Foods still on the old free-text serving_size ("1 cup" — no known gram
// weight) have no anchor to convert from: there's no way to know how many
// grams "1 cup of this specific food" is, so pretending to convert would
// silently produce nonsense (e.g. treating "100" as 100x the base serving
// instead of 100 grams). For those, amount is just a plain multiplier of
// the base serving, same as the old quantity stepper.
export function isConvertible(food) {
    return !!food?.serving_unit;
}

// food: a diet_foods row (serving_qty/serving_unit = its own base serving).
// amount/unit: what the admin is logging this occurrence as.
// Returns the multiplier to apply to the food's per-base-serving nutrition
// (i.e. what `quantity` has always meant in a day's meals JSONB).
export function convertToQuantity(food, amount, unit, units) {
    if (!isConvertible(food)) return Number(amount) || 0;
    const baseGrams = (Number(food?.serving_qty) || 1) * gramsForUnit(units, food?.serving_unit);
    const loggedGrams = (Number(amount) || 0) * gramsForUnit(units, unit);
    if (baseGrams <= 0) return 0;
    return loggedGrams / baseGrams;
}

// ── Category-aware unit filtering ───────────────────────────────────────
// A banana can't be measured in ml; tea can't be measured in slices. Each
// unit is tagged 'solid' | 'liquid' | 'both' (see DEFAULT_DIET_UNITS) —
// 'liquid' only makes sense for Beverages, 'solid' for everything else,
// 'both' always. The food's OWN base unit is always included even if its
// tag doesn't match (e.g. CSV-imported beverages are stored as "100 Grams
// (g)", not ml) so its base serving is never missing from its own dropdown.
function unitAppliesToCategory(unit, category) {
    const type = (unit.type || 'both').toLowerCase();
    if (type === 'both') return true;
    const isBeverage = category === 'Beverages';
    return type === 'liquid' ? isBeverage : !isBeverage;
}

export function getUnitsForFood(units, category, baseUnitLabel) {
    const list = units || [];
    const filtered = list.filter((u) => unitAppliesToCategory(u, category) || u.label === baseUnitLabel);
    return filtered.length ? filtered : list; // never leave the dropdown empty
}

// Backfills amount/unit on a meal's food entry saved before this per-entry
// unit control existed — old entries only had `quantity` (a plain multiplier
// of the food's base serving). For convertible foods, deriving
// amount = quantity × servingQty keeps the controls showing a value
// consistent with the calories already on screen. For non-convertible
// (legacy serving_size-only) foods, `unit` stays unset — amount is just the
// plain quantity — so the UI shows the safe servings-only control instead
// of implying gram conversion works when it can't.
export function normalizeFoodEntry(f) {
    if (f.unit !== undefined) return f;
    if (!f.servingUnit) return { ...f, unit: null, amount: Number(f.quantity) || 1 };
    return {
        ...f,
        unit: f.servingUnit,
        amount: (Number(f.quantity) || 1) * (Number(f.servingQty) || 1),
    };
}
