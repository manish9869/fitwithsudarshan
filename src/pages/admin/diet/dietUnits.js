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
