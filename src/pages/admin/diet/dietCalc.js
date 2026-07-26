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
