// src/pages/admin/diet/dietMealTypes.js
// Shared meal-slot list — used by both the Diet Plan Builder (per-client
// plans) and the Diet Template / Workout Template editors (reusable
// starting points), so a new slot only ever needs adding in one place.
export const MEAL_TYPES = [
    { type: 'morningDrink', label: 'Morning Drink' },
    { type: 'breakfast', label: 'Breakfast' },
    { type: 'midMorning', label: 'Mid-Morning Snack' },
    { type: 'lunch', label: 'Lunch' },
    { type: 'evening', label: 'Evening Snack' },
    { type: 'dinner', label: 'Dinner' },
    { type: 'bedtime', label: 'Bedtime Snack' },
    { type: 'beforeBedDrink', label: 'Before Bed Drink' },
];

// A day always has all MEAL_TYPES slots, but an empty "No items" slot in
// every view would clutter plans/templates that don't use e.g. a morning
// drink — these are the ones that start with 0 foods and just stay out of
// the way instead of forcing themselves into view.
export const OPTIONAL_MEAL_TYPES = new Set(['morningDrink', 'beforeBedDrink']);
