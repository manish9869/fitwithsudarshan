// src/pages/admin/diet/dietTemplates.js
import { isDurationBased, defaultExerciseCustom } from './dietCalc';
// Preset day-templates for the "Use Template" quick-start step. Ported from
// the reference app's templates.ts — but adapted so foods/exercises are
// looked up from the LIVE diet_foods/diet_exercises library (fetched from
// the DB by the wizard) instead of a static hardcoded array. The reference
// had food ids referenced by templates (chutney, sambar, peanut-butter)
// that were never defined in its own foods list, silently falling back to
// the first food in the array for those slots — those three are now real
// entries in seedDietData.js, so that bug doesn't carry over here.

export const fatLossVegTemplate = [
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['idli', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['banana'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'dal-fry', 'mix-sabzi', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['makhana', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'paneer-raw', 'cabbage-sabzi'] },
    ], exerciseIds: ['walking', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['oatmeal'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['apple'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'rajma', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['khichdi', 'buttermilk'] },
    ], exerciseIds: ['brisk-walking', 'plank', 'crunches'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['poha', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['almonds'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chole', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['dhokla'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['missi-roti', 'dal-tadka', 'bhindi'] },
    ], exerciseIds: ['cycling', 'surya-namaskar'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['upma'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['guava'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'dal-fry', 'palak-paneer'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['chana-roasted', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'paneer-raw', 'aloo-gobi'] },
    ], exerciseIds: ['jumping-jacks', 'mountain-climbers', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['dosa', 'chutney'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['orange'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'soya-chunks', 'mix-sabzi', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['walnuts', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'dal-tadka', 'baigan-bharta'] },
    ], exerciseIds: ['running', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['idli', 'sambar'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['papaya'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'rajma', 'cabbage-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['makhana', 'coconut-water'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['missi-roti', 'moong-dal', 'bhindi'] },
    ], exerciseIds: ['burpees', 'squats', 'lunges'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-plain', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['watermelon'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chole', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'tea-with-milk'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['khichdi', 'curd', 'papaya'] },
    ], restDay: true },
];

export const fatLossNonVegTemplate = [
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['bread-omelette'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['banana'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'chicken-curry', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['egg-boiled', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chicken-breast', 'curd'] },
    ], exerciseIds: ['running', 'push-ups', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['egg-bhurji', 'chapati'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['apple'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'fish-curry', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['almonds', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'dal-fry', 'chicken-breast'] },
    ], exerciseIds: ['brisk-walking', 'squats', 'crunches'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['egg-boiled', 'egg-boiled', 'chapati'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['orange'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'chicken-curry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'fish-fry', 'mix-sabzi'] },
    ], exerciseIds: ['jump-rope', 'lunges', 'mountain-climbers'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['poha', 'egg-boiled'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['guava'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'chicken-breast', 'dal-fry'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['makhana', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'fish-curry', 'curd'] },
    ], exerciseIds: ['cycling', 'push-ups', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['oatmeal', 'egg-boiled'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['banana'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'chicken-curry', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['walnuts', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'fish-curry', 'bhindi'] },
    ], exerciseIds: ['burpees', 'high-knees', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['egg-bhurji', 'chapati'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['papaya'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'chicken-breast', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'coconut-water'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'dal-fry', 'fish-curry'] },
    ], exerciseIds: ['running', 'squats', 'crunches', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['bread-omelette'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['watermelon'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['white-rice', 'fish-curry', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['almonds', 'tea-with-milk'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['khichdi', 'curd', 'papaya'] },
    ], restDay: true },
];

export const muscleGainVegTemplate = [
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-aloo', 'milk-full', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['almonds', 'whey-protein'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'paneer-butter-masala', 'dal-fry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'peanut-butter'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'rajma', 'paneer-raw', 'milk-full'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['push-ups', 'squats', 'plank', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['upma', 'milk-full', 'egg-boiled', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'almonds'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'chole', 'paneer-raw', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'milk-full'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'soya-chunks', 'dal-tadka'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['pull-ups', 'lunges', 'diamond-pushups', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-plain', 'paneer-raw', 'milk-full', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'walnuts'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'mutter-paneer', 'rajma', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'peanut-butter'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['brown-rice', 'dal-fry', 'paneer-raw', 'milk-full'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['cheese-slice', 'cheese-slice'] },
    ], exerciseIds: ['surya-namaskar', 'dumbbell-row', 'shoulder-press'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['oatmeal', 'milk-full', 'banana', 'whey-protein'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['almonds', 'mango'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'palak-paneer', 'chole'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'milk-full'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'soya-chunks', 'curd'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['squats', 'push-ups', 'bicep-curl', 'tricep-dips'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['masala-dosa', 'milk-full', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'pomogranate'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'paneer-butter-masala', 'dal-fry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['protein-bar'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['brown-rice', 'rajma', 'paneer-raw', 'milk-full'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['running', 'pull-ups', 'plank', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['bread-omelette', 'milk-full', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'almonds'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['white-rice', 'paneer-raw', 'chole', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'milk-full'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'soya-chunks', 'dal-tadka'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['lunges', 'push-ups', 'shoulder-press', 'crunches'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-aloo', 'milk-full', 'mango'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['walnuts', 'grapes'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'mutter-paneer', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'milk-full'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['khichdi', 'paneer-raw', 'curd', 'milk-full'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], restDay: true },
];

export const muscleGainNonVegTemplate = [
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['egg-boiled', 'egg-boiled', 'egg-boiled', 'egg-boiled', 'chapati', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'almonds'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'chicken-curry', 'dal-fry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['egg-boiled', 'egg-boiled', 'banana'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'chicken-breast', 'paneer-raw'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['bench-press', 'barbell-row', 'shoulder-press', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['egg-bhurji', 'paratha-plain', 'milk-full', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'walnuts'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'chicken-breast', 'rajma', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['egg-boiled', 'egg-boiled', 'mango'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'fish-curry', 'dal-fry'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['deadlift', 'dumbbell-press', 'bicep-curl', 'tricep-extension'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['egg-boiled', 'egg-boiled', 'bread-omelette', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'almonds'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'chicken-curry', 'chole', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['protein-bar'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['brown-rice', 'fish-fry', 'dal-fry', 'paneer-raw'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['barbell-squat', 'pull-ups', 'military-press', 'crunches'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-aloo', 'egg-boiled', 'egg-boiled', 'milk-full'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'pomogranate'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['biryani-chicken', 'curd', 'chicken-breast'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['egg-boiled', 'egg-boiled', 'banana'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'fish-curry', 'paneer-raw'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['leg-press', 'lat-pulldown', 'tricep-dips', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['oatmeal', 'egg-boiled', 'egg-boiled', 'egg-boiled', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'almonds'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'chicken-breast', 'dal-fry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'milk-full'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['brown-rice', 'fish-curry', 'paneer-raw', 'milk-full'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['bulgarian-lunges', 'dumbbell-row', 'lateral-raises', 'leg-raises'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['bread-omelette', 'bread-omelette', 'milk-full', 'mango'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['whey-protein', 'walnuts'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['white-rice', 'chicken-curry', 'chole', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['egg-boiled', 'egg-boiled', 'banana'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chapati', 'chicken-breast', 'paneer-raw'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], exerciseIds: ['leg-curl', 'skull-crushers', 'bicep-curl', 'dead-bug'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-plain', 'egg-boiled', 'egg-boiled', 'milk-full', 'banana'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['almonds', 'mango'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['biryani-chicken', 'curd', 'sprouts'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['milk-full', 'banana'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['khichdi', 'chicken-breast', 'curd', 'milk-full'] },
        { type: 'bedtime', label: 'Bedtime', foodIds: ['milk-full'] },
    ], restDay: true },
];

export const maintenanceTemplate = [
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['poha', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['apple'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'dal-fry', 'mix-sabzi', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['dhokla', 'tea-with-milk'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'paneer-raw', 'bhindi'] },
    ], exerciseIds: ['walking', 'yoga'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['idli', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['orange'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'rajma', 'mix-sabzi', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['makhana', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chole', 'curd'] },
    ], exerciseIds: ['cycling', 'plank'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['upma', 'milk-slim'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['banana'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'palak-paneer', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'tea-with-milk'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['khichdi', 'curd', 'papaya'] },
    ], exerciseIds: ['brisk-walking', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['dosa', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['guava'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['chapati', 'chapati', 'mutter-paneer', 'dal-fry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['chana-roasted', 'coconut-water'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'baigan-bharta', 'curd'] },
    ], exerciseIds: ['surya-namaskar'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['paratha-plain', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['watermelon'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['pulao', 'dal-fry', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['banana', 'tea-with-milk'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'chole', 'mix-sabzi'] },
    ], exerciseIds: ['walking', 'plank', 'crunches'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['oatmeal'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['papaya'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['brown-rice', 'dal-tadka', 'aloo-gobi', 'curd'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['makhana', 'green-tea'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['missi-roti', 'bhindi', 'curd'] },
    ], exerciseIds: ['yoga', 'stretching'] },
    { meals: [
        { type: 'breakfast', label: 'Breakfast', foodIds: ['uthappam', 'curd'] },
        { type: 'midMorning', label: 'Mid-Morning Snack', foodIds: ['grapes'] },
        { type: 'lunch', label: 'Lunch', foodIds: ['biryani-veg', 'curd', 'mix-sabzi'] },
        { type: 'evening', label: 'Evening Snack', foodIds: ['sprouts', 'tea-with-milk'] },
        { type: 'dinner', label: 'Dinner', foodIds: ['chapati', 'khichdi', 'curd', 'banana'] },
    ], restDay: true },
];

export const homeWorkoutExercises = [
    ['push-ups', 'squats', 'plank', 'jogging'],
    ['lunges', 'diamond-pushups', 'crunches', 'mountain-climbers'],
    ['burpees', 'high-knees', 'bicycle-crunches', 'stretching'],
    ['pike-pushups', 'glute-bridge', 'leg-raises', 'jumping-jacks'],
    ['pull-ups', 'tricep-dips', 'russian-twist', 'brisk-walking'],
    ['surya-namaskar', 'yoga'],
    [],
];

export const gymWorkoutExercises = [
    ['bench-press', 'lat-pulldown', 'shoulder-press', 'plank'],
    ['barbell-squat', 'leg-press', 'leg-curl', 'calf-raises'],
    ['deadlift', 'barbell-row', 'bicep-curl', 'tricep-extension'],
    ['military-press', 'lateral-raises', 'skull-crushers', 'crunches'],
    ['leg-extension', 'bulgarian-lunges', 'preacher-curl', 'hanging-leg-raise'],
    ['dumbbell-press', 'seated-row', 'reverse-fly', 'dead-bug'],
    [],
];

export const templates = [
    { id: 'fat-loss-veg', name: 'Fat Loss Indian Veg Plan', description: 'A balanced vegetarian diet for fat loss with moderate protein and controlled carbs', goal: 'Fat Loss', dietPreference: 'Vegetarian', days: fatLossVegTemplate },
    { id: 'fat-loss-nonveg', name: 'Fat Loss Indian Non-Veg Plan', description: 'High protein non-vegetarian diet for effective fat loss', goal: 'Fat Loss', dietPreference: 'Non-Vegetarian', days: fatLossNonVegTemplate },
    { id: 'muscle-gain-veg', name: 'Muscle Gain Indian Veg Plan', description: 'Calorie surplus vegetarian diet for muscle building with high protein', goal: 'Muscle Gain', dietPreference: 'Vegetarian', days: muscleGainVegTemplate },
    { id: 'muscle-gain-nonveg', name: 'Muscle Gain Indian Non-Veg Plan', description: 'High protein non-vegetarian diet with calorie surplus for muscle building', goal: 'Muscle Gain', dietPreference: 'Non-Vegetarian', days: muscleGainNonVegTemplate },
    { id: 'maintenance', name: 'Weight Maintenance Plan', description: 'Balanced diet for maintaining current weight with healthy Indian foods', goal: 'Weight Maintenance', dietPreference: 'Vegetarian', days: maintenanceTemplate },
];

export const workoutTemplates = [
    { id: 'home-workout', name: 'Beginner Home Workout Plan', description: 'Simple exercises you can do at home without equipment', exerciseDays: homeWorkoutExercises },
    { id: 'gym-workout', name: 'Gym Workout Plan', description: 'Complete gym workout with equipment for strength training', exerciseDays: gymWorkoutExercises },
];

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

// foodsById/exercisesById: Map keyed by id, built by the wizard from the
// fetched diet_foods/diet_exercises library (see DietPlanBuilder.jsx).
// dietPreference/targetCalories: the client's Step 1/2 selections — used to
// substitute diet-incompatible template foods and scale portions to hit
// the plan's calorie target, rather than always using the template's fixed
// generic foods/portions untouched.
export function generatePlanFromTemplate(templateId, duration, includeExercise, exerciseTemplateId, foodsById, exercisesById, dietPreference, targetCalories) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return null;

    const exerciseTemplate = workoutTemplates.find((t) => t.id === exerciseTemplateId);
    const templateDays = template.days;
    const exerciseDays = exerciseTemplate?.exerciseDays || [];

    const foodsByCategory = new Map();
    for (const food of foodsById.values()) {
        if (!foodsByCategory.has(food.category)) foodsByCategory.set(food.category, []);
        foodsByCategory.get(food.category).push(food);
    }

    const days = [];
    for (let i = 0; i < duration; i++) {
        const dayTemplate = templateDays[i % templateDays.length];
        const exerciseDayTemplate = exerciseDays.length ? exerciseDays[i % exerciseDays.length] : [];

        const meals = dayTemplate.meals.map((mealTemplate) => ({
            type: mealTemplate.type,
            label: mealTemplate.label,
            foods: mealTemplate.foodIds.map((id) => {
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
