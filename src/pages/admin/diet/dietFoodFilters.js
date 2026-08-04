// src/pages/admin/diet/dietFoodFilters.js
// Shared Add-Food-picker filtering — used by both DietPlanBuilder.jsx (a
// client's real plan) and DietTemplateEditor.jsx (a reusable template), so
// a coach gets the same fast narrow-down-the-list controls in both places.
//
// dietPreference is a hard constraint (never overridable from inside the
// picker — a Vegetarian client shouldn't be one click away from seeing
// chicken) set by the plan/template's own Diet Preference field. category,
// cuisine, and budgetOnly are soft, coach-adjustable filters local to the
// picker session — they start out matching the plan/template's own cuisine
// setting but can be widened or narrowed per meal without leaving the modal.
export function filterFoodPicker(foods, { dietPreference, category, cuisine, budgetOnly, search } = {}) {
    let list = foods;
    if (dietPreference === 'Vegetarian') list = list.filter((f) => f.is_veg);
    else if (dietPreference === 'Eggetarian') list = list.filter((f) => f.is_veg || f.is_eggetarian);
    else if (dietPreference === 'Vegan') list = list.filter((f) => f.is_veg && !/milk|curd|paneer|cheese|lassi|buttermilk/i.test(f.name));

    if (category && category !== 'All') list = list.filter((f) => f.category === category);

    // A cuisine filter narrows to that region PLUS generic/pan-Indian
    // staples (dal, rice, roti…) — not a hard exclusive filter, since even
    // a Gujarati-cuisine plan still eats plenty of those.
    if (cuisine && cuisine !== 'Any') list = list.filter((f) => f.region === cuisine || f.region === 'Generic / Pan-Indian' || !f.region);

    if (budgetOnly) list = list.filter((f) => f.is_budget_friendly);

    if (search?.trim()) list = list.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()));

    return list;
}
