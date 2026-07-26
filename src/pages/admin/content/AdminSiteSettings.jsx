// src/pages/admin/AdminSiteSettings.jsx
// Plain-form editor for the site_content singleton keys (brand, coach,
// contact, hero, navbar, footer, why_recode, target_audience,
// plan_inclusions, whatsapp_templates, sticky_cta, floating_whatsapp).
// Each one is a single JSON blob in the DB, but the user never sees JSON —
// every field below is a normal text box, toggle, or "Add" list.
import { useState, useEffect } from 'react';
import { Loader2, Save, Sparkles, User, Phone, Home, Menu, PanelBottom, Scale, Users2, ListChecks, MessageCircle, ArrowUpCircle, Smartphone } from 'lucide-react';
import { getSiteContentKey, putSiteContentKey } from './cmsApi';
import { useToast } from '../ToastProvider';
import { FieldGroup, TextInput, TextArea, ToggleField, TagListEditor, Repeater, ImageField } from './SettingsFields';
import { DEFAULT_WHATSAPP_MESSAGES } from '@/utils/whatsapp';
import { DEFAULT_STICKY_CTA, DEFAULT_FLOATING_WHATSAPP, DEFAULT_HERO_BANNER_IMAGE, DEFAULT_COACH_PHOTO } from '@/utils/siteContentDefaults';

// Some site_content keys ship empty ({}) until an admin saves an override —
// without this, the editor below would show blank boxes even though the
// site is actively using real, hardcoded default copy. Merging these in on
// load means what you see here always matches what's live on the site.
const DEFAULTS_BY_KEY = {
    whatsapp_templates: DEFAULT_WHATSAPP_MESSAGES,
    sticky_cta: DEFAULT_STICKY_CTA,
    floating_whatsapp: DEFAULT_FLOATING_WHATSAPP,
};

const SECTIONS = [
    { key: 'brand', label: 'Brand', icon: Sparkles },
    { key: 'coach', label: 'Coach Bio', icon: User },
    { key: 'contact', label: 'Contact', icon: Phone },
    { key: 'hero', label: 'Hero Section', icon: Home },
    { key: 'navbar', label: 'Navbar', icon: Menu },
    { key: 'footer', label: 'Footer', icon: PanelBottom },
    { key: 'why_recode', label: 'Why RECODE', icon: Scale },
    { key: 'target_audience', label: 'Who It\'s For', icon: Users2 },
    { key: 'plan_inclusions', label: 'Plan Inclusions', icon: ListChecks },
    { key: 'whatsapp_templates', label: 'WhatsApp Messages', icon: MessageCircle },
    { key: 'sticky_cta', label: 'Sticky Bottom Bar', icon: ArrowUpCircle },
    { key: 'floating_whatsapp', label: 'Floating WhatsApp', icon: Smartphone },
];

const WHATSAPP_TEMPLATE_FIELDS = [
    { key: 'coaching', label: 'General Enquiry', hint: 'Used on the Hero section, Navbar, and the floating WhatsApp button.' },
    { key: 'pricing', label: 'Pricing Page', hint: 'Shown when someone clicks "Chat With Sudarshan" on the pricing section.' },
    { key: 'programs', label: 'Programs Page', hint: 'Used on the Programs / Services section.' },
    { key: 'transformations', label: 'Transformations Page', hint: 'Used on the client results / transformations section.' },
    { key: 'tools', label: 'Fitness Tools Page', hint: 'Used after someone uses a BMI/calorie calculator.' },
    { key: 'contact', label: 'Contact Page', hint: 'Used on the Contact section and FAQ page.' },
    { key: 'blog', label: 'Blog Article', hint: 'Shown at the bottom of every blog post.' },
    { key: 'testimonials', label: 'Testimonials Page', hint: 'Used on the testimonials section.' },
    { key: 'footer', label: 'Footer', hint: 'General footer WhatsApp link.' },
    { key: 'paymentFailed', label: 'Payment Failed Follow-up', hint: 'Shown to a client whose payment did not go through.' },
    { key: 'postPayment', label: 'Post-Payment Onboarding', hint: 'Shown right after a successful payment.' },
    { key: 'assessmentCompleted', label: 'Assessment Completed', hint: 'Shown after someone finishes the onboarding assessment form.' },
];

// ── Per-section forms — each receives (value, onChange) ──────────────────────

function BrandForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <FieldGroup title="Brand" description="Your business name and tagline, shown across the site and in the browser tab.">
            <TextInput label="Business Name" value={v.name} onChange={set('name')} placeholder="FitWithSudarshan" />
            <TextInput label="System / Program Name" value={v.system} onChange={set('system')} placeholder="RECODE™" />
            <TextInput label="Tagline" value={v.tagline} onChange={set('tagline')} placeholder="Recode Your Body. Recode Your Life." />
            <TextInput label="Positioning Statement" value={v.positioning} onChange={set('positioning')} placeholder="Recovery-Based Transformation System" />
        </FieldGroup>
    );
}

function CoachForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <>
            <FieldGroup title="Coach Profile">
                <ImageField
                    label="Profile Photo"
                    value={v.photo || ''}
                    onChange={set('photo')}
                    folder="coach"
                    defaultPreview={DEFAULT_COACH_PHOTO}
                    hint="Shown next to your bio on the homepage. Upload a new one anytime, or reset to go back to the original."
                />
                <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput label="Full Name" value={v.name} onChange={set('name')} placeholder="Sudarshan Chavan" />
                    <TextInput label="First Name" value={v.firstName} onChange={set('firstName')} placeholder="Sudarshan" />
                </div>
                <TagListEditor
                    label="Certifications"
                    value={v.certifications}
                    onChange={set('certifications')}
                    placeholder="e.g. American College of Sports Medicine (ACSM)"
                />
                <div className="grid sm:grid-cols-3 gap-4">
                    <TextInput label="Years of Experience" value={v.yearsExperience} onChange={set('yearsExperience')} placeholder="8+" />
                    <TextInput label="Clients Guided" value={v.clientsGuided} onChange={set('clientsGuided')} placeholder="200+" />
                    <TextInput label="Personal Transformation" value={v.personalTransformation} onChange={set('personalTransformation')} placeholder="29kg" />
                </div>
            </FieldGroup>
            <FieldGroup title="Bio">
                <TextArea label="Short Bio" value={v.shortBio} onChange={set('shortBio')} rows={4} hint="Shown near the top of the 'About' section." />
                <TextArea label="Long Bio" value={v.longBio} onChange={set('longBio')} rows={6} hint="Shown further down in the 'About' section." />
            </FieldGroup>
            <FieldGroup title="Stat Cards" description="The small stat cards next to your photo (e.g. 29kg, 200+ Clients).">
                <Repeater
                    value={v.stats}
                    onChange={set('stats')}
                    emptyItem={{ value: '', label: '' }}
                    addLabel="Add Stat"
                    fields={[
                        { key: 'value', label: 'Value', placeholder: '29kg' },
                        { key: 'label', label: 'Label', placeholder: 'Personal Transformation' },
                    ]}
                />
            </FieldGroup>
        </>
    );
}

function ContactForm({ value, onChange }) {
    const v = value || {};
    const social = v.social || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    const setSocial = (k) => (val) => onChange({ ...v, social: { ...social, [k]: val } });
    return (
        <FieldGroup title="Contact Details" description="Shown on the Contact section and Footer.">
            <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Phone Number" value={v.phone} onChange={set('phone')} placeholder="9619708124" />
                <TextInput label="Email" value={v.email} onChange={set('email')} placeholder="you@example.com" />
            </div>
            <TextInput label="Location" value={v.location} onChange={set('location')} placeholder="Mumbai, Maharashtra, India" />
            <div className="grid sm:grid-cols-2 gap-4">
                <TextInput label="Instagram URL" value={social.instagram} onChange={setSocial('instagram')} placeholder="https://instagram.com/..." />
                <TextInput label="YouTube URL" value={social.youtube} onChange={setSocial('youtube')} placeholder="https://youtube.com/..." />
            </div>
            <TextInput label="WhatsApp Link" value={social.whatsapp} onChange={setSocial('whatsapp')} placeholder="https://wa.me/91..." />
        </FieldGroup>
    );
}

const HERO_ICON_OPTIONS = ['TrendingUp', 'Users', 'Clock', 'Award'];

function HeroForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <>
            <FieldGroup title="Banner Image" description="The full-width background photo behind the homepage headline.">
                <ImageField
                    label="Banner Photo"
                    value={v.bannerImage || ''}
                    onChange={set('bannerImage')}
                    folder="hero"
                    defaultPreview={DEFAULT_HERO_BANNER_IMAGE}
                    hint="Upload a new one anytime, or reset to go back to the original."
                />
            </FieldGroup>
            <FieldGroup title="Headline" description="The big animated text at the top of the homepage.">
                <TagListEditor
                    label="Typewriter Words"
                    value={v.typewriterWords}
                    onChange={set('typewriterWords')}
                    placeholder="Recover."
                    hint="Each word types itself out one at a time, then deletes and moves to the next."
                />
                <TextInput label="Trailing Line" value={v.trailingLine} onChange={set('trailingLine')} placeholder="Your Life." hint="The line shown after the typewriter animation finishes." />
                <TextInput label="Badge Text" value={v.badgeText} onChange={set('badgeText')} placeholder="Founding Member Pricing · Limited to First 20 Members" />
                <TextInput label="Brand Tag" value={v.brandTag} onChange={set('brandTag')} placeholder="RECODE™ · Recovery-Based Transformation" />
            </FieldGroup>
            <FieldGroup title="Description">
                <TextArea label="Subtext Line 1" value={v.subtext1} onChange={set('subtext1')} rows={3} />
                <TextArea label="Subtext Line 2" value={v.subtext2} onChange={set('subtext2')} rows={2} />
            </FieldGroup>
            <FieldGroup title="Buttons">
                <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput label="Primary Button Text" value={v.ctaPrimaryLabel} onChange={set('ctaPrimaryLabel')} placeholder="Apply For Coaching" />
                    <TextInput label="Secondary Button Text" value={v.ctaSecondaryLabel} onChange={set('ctaSecondaryLabel')} placeholder="View Transformations" />
                </div>
            </FieldGroup>
            <FieldGroup title="Stat Cards" description="The 4 stat cards under the buttons.">
                <Repeater
                    value={v.stats}
                    onChange={set('stats')}
                    emptyItem={{ icon: 'TrendingUp', value: '', suffix: '', label: '', display: '' }}
                    addLabel="Add Stat"
                    fields={[
                        { key: 'icon', label: 'Icon', type: 'select', options: HERO_ICON_OPTIONS },
                        { key: 'label', label: 'Label', placeholder: 'Clients Guided' },
                        { key: 'value', label: 'Number', placeholder: '200 (leave blank for text like ACSM)' },
                        { key: 'suffix', label: 'Suffix', placeholder: '+ or kg' },
                        { key: 'display', label: 'Fixed Text (optional)', placeholder: 'e.g. ACSM — overrides the number' },
                    ]}
                />
            </FieldGroup>
        </>
    );
}

function NavbarForm({ value, onChange }) {
    const v = value || {};
    return (
        <FieldGroup title="Navigation Menu" description="The links shown in the top navigation bar.">
            <Repeater
                value={v.navItems}
                onChange={(val) => onChange({ ...v, navItems: val })}
                emptyItem={{ name: '', href: '' }}
                addLabel="Add Link"
                fields={[
                    { key: 'name', label: 'Label', placeholder: 'Home' },
                    { key: 'href', label: 'Link', placeholder: '#home' },
                ]}
            />
        </FieldGroup>
    );
}

function FooterForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <>
            <FieldGroup title="Navigate Links">
                <Repeater
                    value={v.navSections}
                    onChange={set('navSections')}
                    emptyItem={{ name: '', href: '' }}
                    addLabel="Add Link"
                    fields={[{ key: 'name', label: 'Label', placeholder: 'Home' }, { key: 'href', label: 'Link', placeholder: '#home' }]}
                />
            </FieldGroup>
            <FieldGroup title="Programs Links">
                <Repeater
                    value={v.programs}
                    onChange={set('programs')}
                    emptyItem={{ name: '', href: '' }}
                    addLabel="Add Link"
                    fields={[{ key: 'name', label: 'Label', placeholder: 'RECODE ONLINE' }, { key: 'href', label: 'Link', placeholder: '#pricing' }]}
                />
            </FieldGroup>
            <FieldGroup title="Resources Links">
                <Repeater
                    value={v.resources}
                    onChange={set('resources')}
                    emptyItem={{ name: '', href: '' }}
                    addLabel="Add Link"
                    fields={[{ key: 'name', label: 'Label', placeholder: 'Free Fitness Blog' }, { key: 'href', label: 'Link', placeholder: '#blog' }]}
                />
            </FieldGroup>
            <FieldGroup title="Legal Links" description="Usually left as-is — these point to the Terms, Privacy, Refund, and FAQ pages.">
                <Repeater
                    value={v.legalLinks}
                    onChange={set('legalLinks')}
                    emptyItem={{ name: '', to: '' }}
                    addLabel="Add Link"
                    fields={[{ key: 'name', label: 'Label', placeholder: 'Privacy Policy' }, { key: 'to', label: 'Page', placeholder: '/privacy-policy' }]}
                />
            </FieldGroup>
        </>
    );
}

function WhyRecodeForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <FieldGroup title="Why RECODE Is Different" description="The side-by-side comparison list. Row 1 in each list is compared against Row 1 in the other, and so on.">
            <TagListEditor label="What Other Programs Do (the bad side)" value={v.others} onChange={set('others')} placeholder="Restrictive diets" />
            <TagListEditor label="What RECODE Does Instead (the good side)" value={v.recode} onChange={set('recode')} placeholder="Recovery" />
        </FieldGroup>
    );
}

function SimpleListForm({ title, description, placeholder, value, onChange }) {
    return (
        <FieldGroup title={title} description={description}>
            <TagListEditor value={Array.isArray(value) ? value : []} onChange={onChange} placeholder={placeholder} />
        </FieldGroup>
    );
}

function WhatsAppTemplatesForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <FieldGroup title="WhatsApp Message Templates" description="What gets pre-filled when someone taps a 'Chat on WhatsApp' button anywhere on the site. Each box below already shows the exact message that's live right now — edit and save to change it.">
            {WHATSAPP_TEMPLATE_FIELDS.map((f) => (
                <TextArea key={f.key} label={f.label} value={v[f.key]} onChange={set(f.key)} rows={4} hint={f.hint} />
            ))}
        </FieldGroup>
    );
}

function StickyCtaForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <FieldGroup title="Sticky Bottom Bar" description="The bar that slides up from the bottom of the screen once a visitor scrolls partway down the homepage.">
            <ToggleField label="Show this bar" checked={v.enabled !== false} onChange={set('enabled')} />
            <TextInput label="Title" value={v.title} onChange={set('title')} placeholder="Not sure where to start?" />
            <TextInput label="Subtitle" value={v.subtitle} onChange={set('subtitle')} placeholder="Chat directly with Sudarshan, Founder of RECODE™" />
            <TextInput label="Button Text" value={v.ctaLabel} onChange={set('ctaLabel')} placeholder="Enroll Now" />
        </FieldGroup>
    );
}

function FloatingWhatsappForm({ value, onChange }) {
    const v = value || {};
    const set = (k) => (val) => onChange({ ...v, [k]: val });
    return (
        <FieldGroup title="Floating WhatsApp Button" description="The round green button that stays in the bottom-right corner of every page.">
            <ToggleField label="Show this button" checked={v.enabled !== false} onChange={set('enabled')} />
            <TextArea label="Tooltip Message" value={v.tooltipText} onChange={set('tooltipText')} rows={2} placeholder="💬 Speak Directly With The Founder - Get clarity on your transformation journey." />
        </FieldGroup>
    );
}

const FORM_COMPONENTS = {
    brand: BrandForm,
    coach: CoachForm,
    contact: ContactForm,
    hero: HeroForm,
    navbar: NavbarForm,
    footer: FooterForm,
    why_recode: WhyRecodeForm,
    whatsapp_templates: WhatsAppTemplatesForm,
    sticky_cta: StickyCtaForm,
    floating_whatsapp: FloatingWhatsappForm,
};

export default function AdminSiteSettings() {
    const [active, setActive] = useState('brand');
    const [value, setValue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getSiteContentKey(active)
            .then((v) => {
                if (cancelled) return;
                const defaults = DEFAULTS_BY_KEY[active];
                setValue(defaults ? { ...defaults, ...(v || {}) } : v);
            })
            .catch((e) => { if (!cancelled) toast.error(e.message || 'Failed to load'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const saved = await putSiteContentKey(active, value);
            setValue(saved);
            toast.success('Saved — live on the site immediately.');
        } catch (e) {
            toast.error(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const activeMeta = SECTIONS.find((s) => s.key === active);
    const FormComponent = FORM_COMPONENTS[active];

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-white">Site Settings</h1>
                    <p className="text-xs text-white/35 mt-1">
                        Text, links, and messages used across the site. Changes go live as soon as you hit save.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white disabled:opacity-50"
                    style={{ background: '#e71763' }}
                >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-[180px_1fr] gap-6 items-start">
                <nav className="space-y-1 sticky top-0">
                    {SECTIONS.map((s) => (
                        <button
                            key={s.key}
                            onClick={() => setActive(s.key)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all"
                            style={active === s.key
                                ? { background: 'rgba(231,23,99,0.12)', border: '1px solid rgba(231,23,99,0.25)', color: 'white' }
                                : { color: 'rgba(255,255,255,0.4)' }}
                        >
                            <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                            {s.label}
                        </button>
                    ))}
                </nav>

                <div className="space-y-4 min-w-0">
                    {loading ? (
                        <div className="py-24 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/25" /></div>
                    ) : activeMeta.key === 'target_audience' ? (
                        <SimpleListForm
                            title="Who RECODE Is For"
                            description="The pills shown in the 'Built for you' section."
                            placeholder="Busy Professionals"
                            value={value}
                            onChange={setValue}
                        />
                    ) : activeMeta.key === 'plan_inclusions' ? (
                        <SimpleListForm
                            title="What's Included In Every Plan"
                            description="Shown in the checklist above the pricing cards."
                            placeholder="Personalized workout structure"
                            value={value}
                            onChange={setValue}
                        />
                    ) : FormComponent ? (
                        <FormComponent value={value} onChange={setValue} />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
