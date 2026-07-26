import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import FooterSection from '@/components/landing/FooterSection';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useSiteData } from '@/contexts/SiteDataContext';

export default function PrivacyPolicy() {
    const { legalPages } = useSiteData();

    const page = legalPages?.['privacy-policy'] || {
        title: 'Privacy Policy',
        last_updated: '',
        intro: '',
        sections: [],
    };

    usePageMeta({
        title: 'Privacy Policy',
        description: 'How FitWithSudarshan collects, uses, and protects your personal information.',
        path: '/privacy-policy',
        noindex: true,
    });

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: 'instant',
        });
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Hero */}
            <section className="relative pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[100px]"
                        style={{
                            background: 'rgba(231,23,99,0.07)',
                        }}
                    />

                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage:
                                'linear-gradient(rgba(231,23,99,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(231,23,99,0.03) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
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
                                background: 'rgba(231,23,99,0.1)',
                                border: '1px solid rgba(231,23,99,0.25)',
                            }}
                        >
                            <Lock
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
                            Legal
                        </span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                        {page.title}
                    </h1>

                    {page.last_updated && (
                        <p className="text-white/40 text-sm">
                            Last Updated: {page.last_updated}
                        </p>
                    )}

                    {page.intro && (
                        <p className="text-white/50 mt-4 leading-relaxed">
                            {page.intro}
                        </p>
                    )}
                </div>
            </section>

            {/* Content */}
            <section className="pb-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="space-y-5">
                        {(page.sections || []).map((sec, i) => (
                            <motion.div
                                key={sec.title || i}
                                initial={{
                                    opacity: 0,
                                    y: 16,
                                }}
                                whileInView={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                viewport={{
                                    once: true,
                                }}
                                transition={{
                                    duration: 0.4,
                                    delay: i * 0.05,
                                }}
                                className="rounded-2xl p-6"
                                style={{
                                    background: 'rgba(255,255,255,0.025)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                }}
                            >
                                <h2 className="text-base font-black text-white mb-3">
                                    {sec.title}
                                </h2>

                                <div className="space-y-2">
                                    {(sec.content || '')
                                        .split('\n\n')
                                        .map((para, pi) => (
                                            <p
                                                key={pi}
                                                className="text-sm text-white/50 leading-relaxed whitespace-pre-line"
                                            >
                                                {para}
                                            </p>
                                        ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <div
                        className="mt-10 rounded-2xl p-6 text-center"
                        style={{
                            background: 'rgba(231,23,99,0.05)',
                            border: '1px solid rgba(231,23,99,0.18)',
                        }}
                    >
                        <Lock
                            className="w-8 h-8 mx-auto mb-3"
                            style={{
                                color: '#e71763',
                            }}
                        />

                        <p className="text-white font-bold mb-1">
                            Your privacy matters to us
                        </p>

                        <p className="text-white/40 text-sm mb-4">
                            Questions about how we handle your data? We'll
                            respond within 24 hours.
                        </p>

                        <a
                            href="mailto:Fitwithsudarshanofficial@gmail.com"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
                            style={{
                                background: '#e71763',
                            }}
                        >
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    );
}