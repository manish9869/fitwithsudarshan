// src/pages/admin/cmsConfigs.js
//
// `titleField`/`subtitleField`/`imageField` drive how each table renders in
// the admin list view (AdminCMSList) — which column shows as the row's main
// label, its secondary line, and its thumbnail. Without these, the list
// falls back to showing the raw database id, which means nothing to a
// non-technical user (this is why FAQ rows used to show a UUID).

export const CMS_CONFIGS = {
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

    // services and recode_method each have their own dedicated editor — see
    // AdminServices.jsx and AdminRecodeMethod.jsx — since their `color`/
    // `accent` fields need a safelisted color picker rather than raw
    // Tailwind class text, and their `features` need a chip input.

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
