import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import FooterSection from '@/components/landing/FooterSection';

const sections = [
    {
        title: '1. Information We Collect',
        content: `We may collect:\n• Name\n• Phone number\n• Email address\n• Age, Height, Weight\n• Fitness goals\n• Lifestyle information\n• Health history\n• Food habits\n• Training access\n• Payment details\n• Progress photos and updates`,
    },
    {
        title: '2. How We Use Information',
        content: `Your information may be used to:\n• Create your coaching plan\n• Track progress\n• Communicate with you\n• Process payments\n• Send updates\n• Improve services`,
    },
    {
        title: '3. Data Sharing',
        content: `We do not sell your personal data.

Information may be shared only with trusted service providers when required for payments, website forms, CRM, email, or service delivery.`,
    },
    {
        title: '4. Photos & Testimonials',
        content: `Progress photos, videos, and testimonials will only be used publicly with your explicit consent.

You may request that your identity not be shared publicly at any time.`,
    },
    {
        title: '5. Security',
        content: `We take reasonable steps to protect your information, but no digital platform is 100% risk-free.

We use industry-standard encryption and secure payment processing via Razorpay for all transactions.`,
    },
    {
        title: '6. Your Rights',
        content: `You have the right to:\n• Request access to your data\n• Request correction of inaccurate data\n• Request deletion of your data\n• Withdraw consent for marketing communications\n\nTo exercise these rights, contact us at the email below.`,
    },
    {
        title: '7. Contact',
        content: `For privacy questions, contact:\n\nEmail: Fitwithsudarshanofficial@gmail.com\nPhone: 9619708124\nLocation: Mumbai, Maharashtra, India`,
    },
];

export default function PrivacyPolicy() {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero */}
            <section className="relative pt-32 pb-16 overflow-hidden">
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
                            <Lock className="w-5 h-5" style={{ color: '#e71763' }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Legal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Privacy Policy</h1>
                    <p className="text-white/40 text-sm">Last Updated: January 2025</p>
                    <p className="text-white/50 mt-4 leading-relaxed">
                        FitWithSudarshan respects your privacy. We collect information only to provide better coaching, communication, and service.
                    </p>
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
                                className="rounded-2xl p-6"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <h2 className="text-base font-black text-white mb-3">{sec.title}</h2>
                                <div className="space-y-2">
                                    {sec.content.split('\n\n').map((para, pi) => (
                                        <p key={pi} className="text-sm text-white/50 leading-relaxed whitespace-pre-line">{para}</p>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 rounded-2xl p-6 text-center"
                        style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: '#e71763' }} />
                        <p className="text-white font-bold mb-1">Your privacy matters to us</p>
                        <p className="text-white/40 text-sm mb-4">Questions about how we handle your data? We'll respond within 24 hours.</p>
                        <a href="mailto:Fitwithsudarshanofficial@gmail.com"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
                            style={{ background: '#e71763' }}>
                            Contact Us
                        </a>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    );
}