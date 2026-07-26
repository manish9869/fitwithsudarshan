// src/pages/admin/cmsConfigs.js

export const CMS_CONFIGS = {
    testimonials: {
        title: 'Testimonials',
        idKey: 'id',
        fields: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'transformation', label: 'Transformation (e.g. 80kg → 56kg)', type: 'text' },
            { key: 'weight_lost', label: 'Weight Lost Label', type: 'text' },
            { key: 'quote', label: 'Quote', type: 'textarea' },
            { key: 'rating', label: 'Rating (1-5)', type: 'number', default: 5 },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    blog_posts: {
        title: 'Blog Posts',
        idKey: 'id',
        fields: [
            { key: 'slug', label: 'Slug', type: 'text', required: true },
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'read_time', label: 'Read Time', type: 'text' },
            { key: 'post_date', label: 'Date', type: 'text' },
            { key: 'image', label: 'Image URL', type: 'text' },
            { key: 'content', label: 'Content (markdown-ish)', type: 'textarea', big: true },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    services: {
        title: 'Services',
        idKey: 'id',
        fields: [
            { key: 'id', label: 'ID (e.g. online)', type: 'text', required: true, lockOnEdit: true },
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'subtitle', label: 'Subtitle', type: 'text' },
            { key: 'features', label: 'Features (comma separated)', type: 'list' },
            { key: 'badge', label: 'Badge', type: 'text' },
            { key: 'color', label: 'Color gradient class', type: 'text' },
            { key: 'accent', label: 'Accent class', type: 'text' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    recode_method: {
        title: 'RECODE Method Steps',
        idKey: 'id',
        fields: [
            { key: 'step', label: 'Step (e.g. 01)', type: 'text' },
            { key: 'title', label: 'Title', type: 'text', required: true },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'color', label: 'Color gradient class', type: 'text' },
            { key: 'accent', label: 'Accent class', type: 'text' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
        ],
    },

    transformations: {
        title: 'Transformations',
        idKey: 'id',
        fields: [
            { key: 'name', label: 'Name', type: 'text', required: true },
            { key: 'role', label: 'Role', type: 'text' },
            { key: 'duration', label: 'Duration (e.g. 3 Months)', type: 'text' },
            { key: 'weight_lost', label: 'Weight Lost Label', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'quote', label: 'Quote', type: 'textarea' },
            { key: 'photo_before', label: 'Before Photo URL', type: 'text' },
            { key: 'photo_after', label: 'After Photo URL', type: 'text' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    coaching_types: {
        title: 'Coaching Types',
        idKey: 'id',
        fields: [
            { key: 'id', label: 'ID (e.g. online)', type: 'text', required: true, lockOnEdit: true },
            { key: 'name', label: 'Full Name', type: 'text', required: true },
            { key: 'short_name', label: 'Short Name (tab label)', type: 'text', required: true },
            { key: 'tagline', label: 'Tagline', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'features', label: 'Features (comma separated)', type: 'list' },
            { key: 'note', label: 'Note', type: 'textarea' },
            { key: 'cta', label: 'CTA text', type: 'text' },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },
            { key: 'active', label: 'Active', type: 'boolean', default: true },
        ],
    },

    durations: {
        title: 'Durations',
        idKey: 'months',
        fields: [
            { key: 'months', label: 'Months (e.g. 3)', type: 'text', required: true, lockOnEdit: true },
            { key: 'label', label: 'Label (e.g. 3 Months)', type: 'text', required: true },
            { key: 'sublabel', label: 'Sublabel (e.g. Foundation)', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'popular', label: 'Popular', type: 'boolean', default: false }, { key: 'on_sale', label: 'On Sale', type: 'boolean', default: false },
            { key: 'sort_order', label: 'Sort Order', type: 'number', default: 0 },

        ],
    },

    // ── FAQ ───────────────────────────────────────────────────────────────
    faqs: {
        title: 'FAQ',
        idKey: 'id',
        fields: [
            {
                key: 'category',
                label: 'Category',
                type: 'text',
                required: true,
            },
            {
                key: 'question',
                label: 'Question',
                type: 'text',
                required: true,
            },
            {
                key: 'answer',
                label: 'Answer',
                type: 'textarea',
                required: true,
                big: true,
            },
            {
                key: 'sort_order',
                label: 'Sort Order',
                type: 'number',
                default: 0,
            },
            {
                key: 'active',
                label: 'Active',
                type: 'boolean',
                default: true,
            },
        ],
    },

    // ── Legal pages ───────────────────────────────────────────────────────
    legal_pages: {
        title: 'Legal Pages',
        idKey: 'slug',
        fields: [
            {
                key: 'slug',
                label: 'Slug',
                type: 'text',
                required: true,
                lockOnEdit: true,
            },
            {
                key: 'title',
                label: 'Page Title',
                type: 'text',
                required: true,
            },
            {
                key: 'last_updated',
                label: 'Last Updated',
                type: 'text',
            },
            {
                key: 'intro',
                label: 'Introduction',
                type: 'textarea',
                big: true,
            },
            {
                key: 'sections',
                label: 'Sections (JSON)',
                type: 'json',
                required: true,
                big: true,
            },
        ],
    },
};