import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';
import { wa } from "@/utils/whatsapp";
import FooterSection from '@/components/landing/FooterSection';
import { usePageMeta } from '@/hooks/usePageMeta';
const faqs = [
    {
        category: "Getting Started",
        items: [
            {
                question: "How do your coaching programs work?",
                answer: "After you sign up, we have an in-depth consultation to understand your goals, lifestyle, and any limitations. I then create a fully customized workout and nutrition plan. We check in weekly via chat or video call, and I adjust your program based on your progress.",
            },
            {
                question: "How quickly will I see results?",
                answer: "Most clients start seeing noticeable changes within 4-6 weeks. Significant transformations typically happen in 3-6 months. Results depend on consistency, adherence to the plan, and individual factors like starting point and genetics.",
            },
            {
                question: "Do I need a gym membership?",
                answer: "Not necessarily! I offer both gym-based and home workout programs. If you prefer to train at home, I'll design an effective program using minimal equipment like dumbbells, resistance bands, or just bodyweight.",
            },
        ],
    },
    {
        category: "Coaching & Nutrition",
        items: [
            {
                question: "What does the nutrition coaching involve?",
                answer: "Depending on your plan, I'll provide macro targets, meal templates, food swaps, and recipe suggestions. I focus on sustainable, flexible eating rather than restrictive diets. Premium and Elite plans include fully custom meal plans.",
            },
            {
                question: "How is online coaching different from in-person training?",
                answer: "Online coaching gives you the flexibility to train on your schedule, from anywhere. You get the same level of personalization and accountability — often at a lower cost. We stay connected via app, chat, and video calls.",
            },
        ],
    },
    {
        category: "Plans & Billing",
        items: [
            {
                question: "Can I cancel or change my plan anytime?",
                answer: "Yes. You can upgrade, downgrade, or cancel your plan at any time. If you're not satisfied within the first 7 days, I offer a full refund — no questions asked.",
            },
        ],
    },
];

function FAQItem({ item, isOpen, onClick }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${isOpen ? 'rgba(231,23,99,0.35)' : 'rgba(255,255,255,0.07)'}`,
                transition: 'border-color 0.25s',
            }}
        >
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
                <span className="font-semibold text-white text-sm sm:text-base">{item.question}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: isOpen ? 'rgba(231,23,99,0.15)' : 'rgba(255,255,255,0.05)' }}
                >
                    <ChevronDown className="h-4 w-4" style={{ color: isOpen ? '#e71763' : 'rgba(255,255,255,0.4)' }} />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="px-5 pb-5 text-sm text-white/50 leading-relaxed"
                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                            {item.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FAQ() {
    const [openKey, setOpenKey] = useState(null);

    usePageMeta({
        title: 'FAQ',
        description: "Answers to common questions about RECODE™ coaching — pricing, results timeline, online vs in-person training, and more.",
        path: '/faq',
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const toggle = (key) => setOpenKey((prev) => (prev === key ? null : key));

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Hero */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px]"
                        style={{ background: 'rgba(231,23,99,0.07)' }} />
                    <div className="absolute inset-0"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(231,23,99,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(231,23,99,0.03) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }} />
                </div>
                <div className="relative container mx-auto px-4 max-w-3xl">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(231,23,99,0.1)', border: '1px solid rgba(231,23,99,0.25)' }}>
                            <HelpCircle className="w-5 h-5" style={{ color: '#e71763' }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Support</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Frequently Asked Questions</h1>
                    <p className="text-white/50 leading-relaxed">
                        Everything you need to know before starting your RECODE™ transformation journey. Can't find what you're looking for? Reach out on WhatsApp.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="pb-24">
                <div className="container mx-auto px-4 max-w-3xl space-y-10">
                    {faqs.map((group) => (
                        <div key={group.category}>
                            <h2 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#e71763' }}>
                                {group.category}
                            </h2>
                            <div className="space-y-3">
                                {group.items.map((item) => {
                                    const key = `${group.category}-${item.question}`;
                                    return (
                                        <FAQItem
                                            key={key}
                                            item={item}
                                            isOpen={openKey === key}
                                            onClick={() => toggle(key)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Contact CTA */}
                    <div className="mt-10 rounded-2xl p-6 text-center"
                        style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <MessageCircle className="w-8 h-8 mx-auto mb-3" style={{ color: '#e71763' }} />
                        <p className="text-white font-bold mb-1">Still have questions?</p>
                        <p className="text-white/40 text-sm mb-4">Chat directly with Sudarshan — he personally responds to every message.</p>
                        <a href={wa.contact} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
                            style={{ background: '#e71763' }}>
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    );
}