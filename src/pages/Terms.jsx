import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import { wa } from "@/utils/whatsapp";
import FooterSection from '@/components/landing/FooterSection';

const sections = [
    {
        title: '1. Services',
        content: `FitWithSudarshan provides fitness coaching, nutrition guidance, online coaching, video consultation, personal training, and transformation support under the RECODE™ system.

Our services may include workout plans, nutrition guidance, progress tracking, check-ins, educational resources, consultation, and lifestyle support.`,
    },
    {
        title: '2. Health Disclaimer',
        content: `RECODE™ coaching is not medical treatment, medical diagnosis, or a replacement for professional medical advice.

Clients are responsible for consulting their doctor before starting any fitness, nutrition, or lifestyle program, especially if they have any medical condition, injury, pregnancy, recent surgery, medication use, or health concern.

By joining, the client confirms that they are physically fit to participate or have taken medical clearance where required.`,
    },
    {
        title: '3. Results Disclaimer',
        content: `Results vary from person to person.

Transformation depends on consistency, lifestyle, health status, nutrition adherence, training effort, sleep, stress, medical history, and other individual factors.

We do not guarantee a specific weight loss number, muscle gain amount, physique outcome, or timeline.`,
    },
    {
        title: '4. Client Responsibility',
        content: `The client agrees to provide accurate information about health history, lifestyle, food habits, injuries, medications, and goals.

The client is responsible for following the plan safely and informing the coach immediately about pain, discomfort, injury, illness, or any medical changes.`,
    },
    {
        title: '5. Payments',
        content: `All payments must be completed before the service starts.

Payment confirmation will be shared through email, receipt, or invoice.

Plans are activated from the agreed start date after payment confirmation.`,
    },
    {
        title: '6. Refund & Cancellation Policy',
        content: `Due to the personalized nature of coaching, payments are generally non-refundable once the plan, onboarding, consultation, or coaching process has started.

If a refund request is made before the plan begins, FitWithSudarshan may review the request on a case-by-case basis.

No refunds are applicable for lack of consistency, non-adherence, missed check-ins, change of mind, or unused days after activation.

For personal training, missed sessions must be informed in advance as per the agreed schedule. Uninformed missed sessions may be counted as completed.`,
    },
    {
        title: '7. Pause / Extension',
        content: `Any pause or extension request will be reviewed case-by-case.

Pauses may be considered for genuine medical emergencies, travel, or unavoidable situations, subject to approval.`,
    },
    {
        title: '8. Communication',
        content: `Official communication may happen through WhatsApp, email, phone, website forms, or scheduled calls.

Clients are expected to respond to check-ins and updates on time for best results.`,
    },
    {
        title: '9. Personal Training',
        content: `Personal Training in Mumbai is subject to location, availability, travel feasibility, schedule, and slot confirmation.

The coach reserves the right to accept or decline personal training requests depending on availability and feasibility.`,
    },
    {
        title: '10. Content & Intellectual Property',
        content: `All workout plans, nutrition guidance, PDF files, check-in systems, coaching methods, text, images, videos, and RECODE™ materials are the intellectual property of FitWithSudarshan.

Clients may not copy, resell, share, distribute, or use the content commercially without written permission.`,
    },
    {
        title: '11. Use of Transformation Photos / Testimonials',
        content: `Client photos, videos, testimonials, or progress data will only be used for marketing with client consent.

Clients may request not to share their identity publicly.`,
    },
    {
        title: '12. Privacy',
        content: `Client information is kept confidential and used only for coaching, communication, progress tracking, payment, and service improvement.

We do not sell client data.`,
    },
    {
        title: '13. Limitation of Liability',
        content: `FitWithSudarshan, RECODE™, and Sudarshan Chavan are not responsible for injuries, health issues, losses, or damages caused by incorrect exercise execution, undisclosed medical conditions, non-compliance, self-modification of plans, or failure to seek medical advice.`,
    },
    {
        title: '14. Changes to Services',
        content: `FitWithSudarshan may update plans, pricing, services, content, or terms at any time.

Existing paid services will continue as per the agreed plan unless mutually updated.`,
    },
    {
        title: '15. Governing Location',
        content: `These terms are intended for services operated from Mumbai, Maharashtra, India.`,
    },
    {
        title: '16. Contact',
        content: `For any questions, contact:\n\nFitWithSudarshan\nEmail: Fitwithsudarshanofficial@gmail.com\nPhone: 9619708124\nLocation: Mumbai, Maharashtra, India`,
    },
];

export default function Terms() {
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
                            <FileText className="w-5 h-5" style={{ color: '#e71763' }} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>Legal</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Terms &amp; Conditions</h1>
                    <p className="text-white/40 text-sm">Last Updated: January 2025</p>
                    <p className="text-white/50 mt-4 leading-relaxed">
                        Welcome to FitWithSudarshan and RECODE™. By accessing our website, submitting an application, making a payment, or using our coaching services, you agree to the terms below.
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="pb-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="space-y-6">
                        {sections.map((sec, i) => (
                            <motion.div
                                key={sec.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.03 }}
                                className="rounded-2xl p-6"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <h2 className="text-base font-black text-white mb-3">{sec.title}</h2>
                                <div className="space-y-2">
                                    {sec.content.split('\n\n').map((para, pi) => (
                                        <p key={pi} className="text-sm text-white/50 leading-relaxed">{para}</p>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Contact CTA */}
                    <div className="mt-10 rounded-2xl p-6 text-center"
                        style={{ background: 'rgba(231,23,99,0.05)', border: '1px solid rgba(231,23,99,0.18)' }}>
                        <Shield className="w-8 h-8 mx-auto mb-3" style={{ color: '#e71763' }} />
                        <p className="text-white font-bold mb-1">Have questions about these terms?</p>
                        <p className="text-white/40 text-sm mb-4">We're happy to clarify anything before you enroll.</p>
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