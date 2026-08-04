// src/pages/admin/cmsConfigs.js
//
// `titleField`/`subtitleField`/`imageField` drive how each table renders in
// the admin list view (AdminCMSList) — which column shows as the row's main
// label, its secondary line, and its thumbnail. Without these, the list
// falls back to showing the raw database id, which means nothing to a
// non-technical user (this is why FAQ rows used to show a UUID).
import { SERVING_UNITS } from '../diet/dietUnits';

const FOOD_CATEGORIES = ['Breakfast', 'Grains & Roti', 'Rice & Dal', 'Vegetables', 'Dairy & Paneer', 'Proteins', 'Snacks', 'Fruits', 'Beverages', 'Supplements'];
const MUSCLE_GROUPS = ['Cardio', 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body', 'Flexibility'];
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const EXERCISE_LOCATIONS = ['Home', 'Gym', 'Both'];

export const CMS_CONFIGS = {
    diet_foods: {
        title: 'Diet Plan Foods',
        idKey: 'id',
        titleField: 'name',
        subtitleField: 'category',
        searchFields: ['name', 'category'],
        fields: [
            { key: 'id', label: 'ID (e.g. paneer-tikka)', type: 'text', required: true, lockOnEdit: true },
            { key: 'name', label: 'Food Name', type: 'text', required: true },
            { key: 'category', label: 'Category', type: 'select', options: FOOD_CATEGORIES, default: FOOD_CATEGORIES[0] },
            // Nutrition values below (calories/protein/carbs/fats) are "per
            // this amount" — e.g. 1 × "Cup - Medium". Precise, structured
            // unit instead of a free-text guess like "1 cup".
            { key: 'serving_qty', label: 'Serving Amount', type: 'number', default: 1 },
            { key: 'serving_unit', label: 'Serving Unit', type: 'select', options: SERVING_UNITS, default: SERVING_UNITS[0] },
            { key: 'serving_size', label: 'Legacy Serving Label (old plans only — leave blank for new foods)', type: 'text' },
            { key: 'calories', label: 'Calories', type: 'number', default: 0 },
            { key: 'protein', label: 'Protein (g)', type: 'number', default: 0 },
            { key: 'carbs', label: 'Carbs (g)', type: 'number', default: 0 },
            { key: 'fats', label: 'Fats (g)', type: 'number', default: 0 },
            { key: 'is_veg', label: 'Vegetarian', type: 'boolean', default: true },
            { key: 'is_eggetarian', label: 'Eggetarian-Safe', type: 'boolean', default: true },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    diet_exercises: {
        title: 'Diet Plan Exercises',
        idKey: 'id',
        titleField: 'name',
        subtitleField: 'muscle_group',
        searchFields: ['name', 'muscle_group'],
        fields: [
            { key: 'id', label: 'ID (e.g. bicep-curl)', type: 'text', required: true, lockOnEdit: true },
            { key: 'name', label: 'Exercise Name', type: 'text', required: true },
            { key: 'muscle_group', label: 'Muscle Group', type: 'select', options: MUSCLE_GROUPS, default: MUSCLE_GROUPS[0] },
            { key: 'duration', label: 'Duration (e.g. 5 min)', type: 'text' },
            { key: 'sets', label: 'Sets', type: 'number', default: 0 },
            { key: 'reps', label: 'Reps (e.g. 12 or 30 sec)', type: 'text' },
            { key: 'calories_burned', label: 'Calories Burned', type: 'number', default: 0 },
            { key: 'difficulty', label: 'Difficulty', type: 'select', options: DIFFICULTY_LEVELS, default: DIFFICULTY_LEVELS[0] },
            { key: 'location', label: 'Location', type: 'select', options: EXERCISE_LOCATIONS, default: EXERCISE_LOCATIONS[2] },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    testimonials: {
        title: 'Testimonials',
        idKey: 'id',
        titleField: 'name',
        subtitleField: 'role',
        imageField: 'avatar',
        searchFields: ['name', 'role', 'quote', 'transformation'],
        fields: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'transformation', label: 'Transformation (e.g. 80kg → 56kg)', type: 'text' },
            { key: 'weight_lost', label: 'Weight Lost Label', type: 'text' },
            { key: 'quote', label: 'Quote', type: 'textarea' },
            { key: 'rating', label: 'Rating (1-5)', type: 'number', default: 5 },
            { key: 'avatar', label: 'Avatar Photo', type: 'image', folder: 'testimonials' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    blog_posts: {
        title: 'Blog Posts',
        idKey: 'id',
        titleField: 'title',
        subtitleField: 'category',
        imageField: 'image',
        searchFields: ['title', 'excerpt', 'category', 'slug'],
        fields: [
            { key: 'slug', label: 'Slug', type: 'text', required: true },
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'read_time', label: 'Read Time', type: 'text' },
            { key: 'post_date', label: 'Date', type: 'text' },
            { key: 'image', label: 'Cover Photo', type: 'image', folder: 'blog' },
            { key: 'content', label: 'Content (markdown-ish)', type: 'textarea', big: true },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    // recode_method has its own dedicated editor — see AdminRecodeMethod.jsx —
    // since its `accent` field needs a safelisted color picker rather than
    // raw Tailwind class text. (services/ProgramsSection was removed: it was
    // an orphaned page nothing on the site linked to, and duplicated what
    // Coaching Types + Pricing already show.)

    transformations: {
        title: 'Transformations',
        idKey: 'id',
        titleField: 'name',
        subtitleField: 'category',
        imageField: 'photo_after',
        searchFields: ['name', 'role', 'category', 'quote'],
        fields: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'duration', label: 'Duration (e.g. 3 Months)', type: 'text' },
            { key: 'weight_lost', label: 'Weight Lost Label', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'quote', label: 'Quote', type: 'textarea' },
            { key: 'photo_before', label: 'Before Photo', type: 'image', folder: 'transformations' },
            { key: 'photo_after', label: 'After Photo', type: 'image', folder: 'transformations' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    // coaching_types has its own dedicated editor — see AdminCoachingTypes.jsx —
    // since it's a small, fixed set that drives core site behavior (pricing,
    // routing), not a growing list that needs the generic table+modal CMS.

    durations: {
        title: 'Durations',
        idKey: 'months',
        titleField: 'label',
        subtitleField: 'sublabel',
        searchFields: ['label', 'sublabel', 'description'],
        fields: [
            { key: 'months', label: 'Months (e.g. 3)', type: 'text', required: true, lockOnEdit: true },
            { key: 'label', label: 'Label (e.g. 3 Months)', type: 'text', required: true },
            { key: 'sublabel', label: 'Sublabel (e.g. Foundation)', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
        ],
    },

    // ── FAQ ───────────────────────────────────────────────────────────────
    faqs: {
        title: 'FAQ',
        idKey: 'id',
        titleField: 'question',
        subtitleField: 'category',
        searchFields: ['question', 'answer', 'category'],
        fields: [
            { key: 'category', label: 'Category', type: 'text', required: true },
            { key: 'question', label: 'Question', type: 'text', required: true },
            { key: 'answer', label: 'Answer', type: 'textarea', required: true, big: true },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    // ── Legal pages ───────────────────────────────────────────────────────
    legal_pages: {
        title: 'Legal Pages',
        idKey: 'slug',
        titleField: 'title',
        subtitleField: 'slug',
        searchFields: ['title', 'slug'],
        fields: [
            { key: 'slug', label: 'Slug', type: 'text', required: true, lockOnEdit: true },
            { key: 'title', label: 'Page Title', type: 'text', required: true },
            { key: 'last_updated', label: 'Last Updated', type: 'text' },
            { key: 'intro', label: 'Introduction', type: 'textarea', big: true },
            { key: 'sections', label: 'Sections (JSON)', type: 'json', required: true, big: true },
        ],
    },
};
