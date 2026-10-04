/**
 * src/pages/admin/adminNav.js
 * Single source of truth for admin navigation — rendered by the sidebar
 * (AdminLayout) and searched by the ⌘K command palette (CommandPalette).
 */

import {
    LayoutDashboard,
    Users,
    ClipboardList,
    Tag,
    UserPlus,
    BellRing,
    Wallet,
    HelpCircle,
    FileText,
    Settings,
    Salad,
    ScrollText,
    Apple,
    Dumbbell,
    BarChart3,
    CalendarRange,
    Repeat2,
    ShieldCheck,
    Inbox,
    Filter,
    IndianRupee,
    MessageSquareQuote,
    Newspaper,
    Images,
    Layers,
    Timer,
    Flame,
    UserCircle,
    MessageCircle,
    Megaphone,
} from 'lucide-react';

// `keywords` are extra terms the command palette matches on, so typing
// "payment" finds Balance Due or "photos" finds Transformations.
export const NAV_GROUPS = [
    {
        title: 'Overview',
        items: [
            { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', keywords: 'home overview revenue kpi' },
            { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', keywords: 'ga4 traffic visitors' },
            { to: '/admin/funnel-audit', icon: Filter, label: 'Funnel Audit', keywords: 'conversion' },
            { to: '/admin/logs', icon: ScrollText, label: 'System Logs', keywords: 'transactions audit errors' },
        ],
    },
    {
        title: 'Clients',
        items: [
            { to: '/admin/enrollments', icon: Users, label: 'Enrollments', keywords: 'clients members crm' },
            { to: '/admin/manual-enrollment', icon: UserPlus, label: 'Manual Entry', keywords: 'add client cash upi renew extend' },
            { to: '/admin/balance-due', icon: Wallet, label: 'Balance Due', keywords: 'payment outstanding pending reminder' },
            { to: '/admin/follow-ups', icon: BellRing, label: 'Follow-Ups', keywords: 'check-in reminder' },
            { to: '/admin/data-audit', icon: ShieldCheck, label: 'Data Audit', keywords: 'duplicates integrity' },
            { to: '/admin/assessments', icon: ClipboardList, label: 'Assessments', keywords: 'consultation intake forms' },
            { to: '/admin/leads', icon: Inbox, label: 'Cold Enquiries', keywords: 'leads contact messages' },
            { to: '/admin/diet-plans', icon: Salad, label: 'Diet Plans', keywords: 'nutrition meal' },
        ],
    },
    {
        title: 'Master Data',
        items: [
            { to: '/admin/diet-foods', icon: Apple, label: 'Diet Foods', keywords: 'food library macros' },
            { to: '/admin/diet-exercises', icon: Dumbbell, label: 'Diet Exercises', keywords: 'exercise library workout' },
            { to: '/admin/diet-templates', icon: CalendarRange, label: 'Diet Templates', keywords: 'meal template' },
            { to: '/admin/workout-templates', icon: Repeat2, label: 'Workout Templates', keywords: 'training split program' },
        ],
    },
    {
        title: 'Sales',
        items: [
            { to: '/admin/promotions', icon: Megaphone, label: 'Promotions', keywords: 'offer festival diwali template promo popup broadcast campaign' },
            { to: '/admin/whatsapp', icon: MessageCircle, label: 'WhatsApp', keywords: 'broadcast promotion message campaign scheduler sequence drip bulk' },
            { to: '/admin/coupons', icon: Tag, label: 'Coupons', keywords: 'discount promo code' },
            { to: '/admin/content/pricing', icon: IndianRupee, label: 'Pricing', keywords: 'plans price matrix' },
        ],
    },
    {
        title: 'Website Content',
        items: [
            { to: '/admin/site-settings', icon: Settings, label: 'Site Settings', keywords: 'hero maintenance brand sections promo popup offer banner' },
            { to: '/admin/content/testimonials', icon: MessageSquareQuote, label: 'Testimonials', keywords: 'reviews' },
            { to: '/admin/content/blog_posts', icon: Newspaper, label: 'Blog Posts', keywords: 'articles' },
            { to: '/admin/content/transformations', icon: Images, label: 'Transformations', keywords: 'before after photos results' },
            { to: '/admin/content/coaching_types', icon: Layers, label: 'Coaching Types', keywords: 'online personal training' },
            { to: '/admin/content/durations', icon: Timer, label: 'Durations', keywords: 'months plan length' },
            { to: '/admin/content/recode_method', icon: Flame, label: 'RECODE Method', keywords: 'pillars features' },
            { to: '/admin/content/faqs', icon: HelpCircle, label: 'FAQs', keywords: 'questions' },
            { to: '/admin/content/legal-pages', icon: FileText, label: 'Legal Pages', keywords: 'terms privacy refund policy' },
        ],
    },
];

// Not in the sidebar (reached via the profile chip) but worth finding by search.
export const EXTRA_PAGES = [
    { to: '/admin/profile', icon: UserCircle, label: 'My Profile', group: 'Account', keywords: 'password trainer name' },
];
