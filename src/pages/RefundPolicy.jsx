import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

import FooterSection from '@/components/landing/FooterSection';

const sections = [
    {
        title: '1. Coaching Plans',
        icon: '📋',
        content: `Once a coaching plan is activated, the payment is non-refundable.

This is because coaching includes personalized onboarding, plan preparation, guidance, and support that begins immediately upon activation.`,
    },
    {
        title: '2. Before Activation',
        icon: '⏳',
        content: `If payment is completed but onboarding or coaching has not started, refund requests may be reviewed case-by-case.

Approval is not guaranteed. Please reach out within 24 hours of payment if you wish to discuss this.`,
    },
    {
        title: '3. Missed Check-Ins',
        icon: '📅',
        content: `Missed check-ins, lack of response, lack of consistency, or non-adherence to the plan will not qualify for a refund.

Your plan remains active throughout the purchased duration regardless of engagement level.`,
    },
    {
        title: '4. Personal Training Sessions',
        icon: '🏋️',
        content: `For personal training, cancellations or rescheduling must be informed in advance.

Uninformed missed sessions may be counted as completed. Please give at least 4 hours notice to reschedule a session.`,
    },
    {
        title: '5. Medical Emergency',
        icon: '🏥',
        content: `In case of genuine medical emergencies, plan pause or extension may be considered after review.

Documentation may be required. Please contact us immediately via WhatsApp or email.`,
    },
    {
        title: '6. Contact for Refund Queries',
        icon: '✉️',
        content: `For refund or cancellation questions, contact:\n\nEmail: Fitwithsudarshanofficial@gmail.com\nWhatsApp: 9619708124\n\nWe aim to respond within 24–48 hours on business days.`,
    },
];

export default function RefundPolicy() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

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
                            <RefreshCw className="w-5 h-5" style={{ color: '#e71763' }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Legal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Refund &amp; Cancellation Policy</h1>
                    <p className="text-white/40 text-sm">Last Updated: January 2025</p>
                    <div className="mt-6 flex items-start gap-3 p-4 rounded-xl"
                        style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#e71763' }} />
                        <p className="text-sm text-white/60 leading-relaxed">
                            At FitWithSudarshan / RECODE™, every coaching plan involves time, review, planning, and personalized guidance. Please read this policy carefully before enrolling.
                        </p>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="pb-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="space-y-5">
                        {sections.map((sec, i) => (
                            <motion.div
                                key={sec.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                                className="rounded-2xl p-6 flex gap-4"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <span className="text-2xl flex-shrink-0 mt-0.5">{sec.icon}</span>
                                <div>
                                    <h2 className="text-base font-black text-white mb-2">{sec.title}</h2>
                                    <div className="space-y-2">
                                        {sec.content.split('\n\n').map((para, pi) => (
                                            <p key={pi} className="text-sm text-white/50 leading-relaxed">{para}</p>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-2xl p-6 text-center"
                        style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <p className="text-white font-bold mb-1">Questions about cancellations?</p>
                        <p className="text-white/40 text-sm mb-4">Reach out before enrolling — we're happy to help you choose the right plan.</p>
                        <a href="mailto:Fitwithsudarshanofficial@gmail.com"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
                            style={{ background: '#e71763' }}>
                            Email Us
                        </a>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    );
}