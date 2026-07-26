import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    HelpCircle,
    ChevronDown,
    MessageCircle,
} from 'lucide-react';
import { wa } from "@/utils/whatsapp";
import FooterSection from '@/components/landing/FooterSection';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSiteData } from "@/contexts/SiteDataContext";

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
                border: `1px solid ${isOpen
                    ? 'rgba(231,23,99,0.35)'
                    : 'rgba(255,255,255,0.07)'
                    }`,
                transition: 'border-color 0.25s',
            }}
        >
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
                <span className="font-semibold text-white text-sm sm:text-base">
                    {item.question}
                </span>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{
                        background: isOpen
                            ? 'rgba(231,23,99,0.15)'
                            : 'rgba(255,255,255,0.05)',
                    }}
                >
                    <ChevronDown
                        className="h-4 w-4"
                        style={{
                            color: isOpen
                                ? '#e71763'
                                : 'rgba(255,255,255,0.4)',
                        }}
                    />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{
                            height: 0,
                            opacity: 0,
                        }}
                        animate={{
                            height: 'auto',
                            opacity: 1,
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.2,
                        }}
                    >
                        <div
                            className="px-5 pb-5 text-sm text-white/50 leading-relaxed"
                            style={{
                                borderTop:
                                    '1px solid rgba(255,255,255,0.05)',
                                paddingTop: 16,
                            }}
                        >
                            {item.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FAQ() {
    const { faqs: faqRows } = useSiteData();

    const [openKey, setOpenKey] = useState(null);

    usePageMeta({
        title: 'FAQ',
        description:
            "Answers to common questions about RECODE™ coaching — pricing, results timeline, online vs in-person training, and more.",
        path: '/faq',
    });

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant',
        });
    }, []);

    // ── Group flat DB FAQ rows by category ────────────────────────────────
    const grouped = useMemo(() => {
        const map = {};

        for (const faq of faqRows || []) {
            if (!faq?.category) continue;

            map[faq.category] ??= {
                category: faq.category,
                items: [],
            };

            map[faq.category].items.push(faq);
        }

        return Object.values(map);
    }, [faqRows]);

    const toggle = (key) => {
        setOpenKey((prev) =>
            prev === key ? null : key
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Hero */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px]"
                        style={{
                            background:
                                'rgba(231,23,99,0.07)',
                        }}
                    />

                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(231,23,99,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(231,23,99,0.03) 1px, transparent 1px)',
                            backgroundSize:
                                '60px 60px',
                        }}
                    />
                </div>

                <div className="relative container mx-auto px-4 max-w-3xl">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>

                    <div className="flex items-center gap-3 mb-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background:
                                    'rgba(231,23,99,0.1)',
                                border:
                                    '1px solid rgba(231,23,99,0.25)',
                            }}
                        >
                            <HelpCircle
                                className="w-5 h-5"
                                style={{
                                    color: '#e71763',
                                }}
                            />
                        </div>

                        <span
                            className="text-xs font-black uppercase tracking-widest"
                            style={{
                                color: '#e71763',
                            }}
                        >
                            Support
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        Frequently Asked Questions
                    </h1>

                    <p className="text-white/50 leading-relaxed">
                        Everything you need to know before starting your
                        RECODE™ transformation journey. Can't find what
                        you're looking for? Reach out on WhatsApp.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="pb-24">
                <div className="container mx-auto px-4 max-w-3xl space-y-10">

                    {grouped.map((group) => (
                        <div key={group.category}>
                            <h2
                                className="text-xs font-black uppercase tracking-widest mb-4"
                                style={{
                                    color: '#e71763',
                                }}
                            >
                                {group.category}
                            </h2>

                            <div className="space-y-3">
                                {group.items.map((item) => (
                                    <FAQItem
                                        key={item.id}
                                        item={item}
                                        isOpen={
                                            openKey === item.id
                                        }
                                        onClick={() =>
                                            toggle(item.id)
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Contact CTA */}
                    <div
                        className="mt-10 rounded-2xl p-6 text-center"
                        style={{
                            background:
                                'rgba(231,23,99,0.05)',
                            border:
                                '1px solid rgba(231,23,99,0.18)',
                        }}
                    >
                        <MessageCircle
                            className="w-8 h-8 mx-auto mb-3"
                            style={{
                                color: '#e71763',
                            }}
                        />

                        <p className="text-white font-bold mb-1">
                            Still have questions?
                        </p>

                        <p className="text-white/40 text-sm mb-4">
                            Chat directly with Sudarshan — he personally
                            responds to every message.
                        </p>

                        <a
                            href={wa.contact}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
                            style={{
                                background: '#e71763',
                            }}
                        >
                            Chat on WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    );
}