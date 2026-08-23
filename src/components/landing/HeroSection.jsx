import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Users,
    Award,
    Clock,
    TrendingUp
} from "lucide-react";
import { useSiteData } from "@/contexts/SiteDataContext";
import { DEFAULT_HERO_BANNER_IMAGE, CURRENT_HERO_BANNER_IMAGE_DESKTOP } from "@/utils/siteContentDefaults";
import ConsultationModal from "@/components/landing/ConsultationModal";

// ─── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ words }) {
    const [wordIndex, setWordIndex] = useState(0);
    const [displayed, setDisplayed] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [pause, setPause] = useState(false);

    useEffect(() => {
        if (!words || !words.length) return;

        if (pause) {
            const t = setTimeout(() => {
                setPause(false);
                setDeleting(true);
            }, 1600);

            return () => clearTimeout(t);
        }

        const word = words[wordIndex % words.length];

        if (!deleting) {
            if (displayed.length < word.length) {
                const t = setTimeout(
                    () =>
                        setDisplayed(
                            word.slice(0, displayed.length + 1)
                        ),
                    80
                );

                return () => clearTimeout(t);
            } else {
                setPause(true);
            }
        } else {
            if (displayed.length > 0) {
                const t = setTimeout(
                    () =>
                        setDisplayed(
                            displayed.slice(0, -1)
                        ),
                    45
                );

                return () => clearTimeout(t);
            } else {
                setDeleting(false);

                setWordIndex(
                    (i) => (i + 1) % words.length
                );
            }
        }
    }, [
        displayed,
        deleting,
        pause,
        wordIndex,
        words
    ]);

    return (
        <span
            className="inline-block"
            style={{
                color: "#e71763",
                textShadow:
                    "0 0 40px rgba(231,23,99,0.5)"
            }}
        >
            {displayed}

            <motion.span
                animate={{
                    opacity: [1, 0, 1]
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity
                }}
                className="inline-block ml-1 w-1 rounded-full align-middle"
                style={{
                    height: "0.8em",
                    background: "#e71763",
                    verticalAlign: "middle"
                }}
            />
        </span>
    );
}

// ─── Dynamic stat icon lookup ─────────────────────────────────────────────────
const STAT_ICONS = {
    TrendingUp,
    Users,
    Clock,
    Award
};

// ─── Animated Stat Counter ────────────────────────────────────────────────────
function CountUp({ value, suffix, started }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!started || value === null) return;

        let start = 0;

        const duration = 1800;
        const steps = 60;
        const inc = value / steps;

        const timer = setInterval(() => {
            start += inc;

            if (start >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [started, value]);

    if (value === null) return null;

    return (
        <>
            {count}
            {suffix}
        </>
    );
}

// ─── Magnetic CTA Button ──────────────────────────────────────────────────────
function PulseButton({
    children,
    href,
    onClick,
    style
}) {
    const content = (
        <motion.div
            className="relative inline-flex"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
        >
            {/* Pulse rings */}
            <motion.span
                className="absolute inset-0 rounded-full"
                animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.2, 0]
                }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut"
                }}
                style={{
                    background:
                        "rgba(231,23,99,0.35)"
                }}
            />

            <motion.span
                className="absolute inset-0 rounded-full"
                animate={{
                    scale: [1, 1.3, 1.6],
                    opacity: [0.4, 0.15, 0]
                }}
                transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.6
                }}
                style={{
                    background:
                        "rgba(231,23,99,0.25)"
                }}
            />

            {/* Reduced px/py on mobile to prevent overflow at 320px */}
            <Button
                size="lg"
                className="relative text-sm sm:text-lg px-5 sm:px-8 py-4 sm:py-6 text-white font-bold group rounded-full"
                style={style}
                // No href → this is an in-page action (e.g. opening the
                // consultation modal). The click goes directly on this
                // Button (already a real <button>) rather than an extra
                // wrapping element, since a <button> can't legally nest
                // inside another <button>.
                onClick={!href ? onClick : undefined}
            >
                {children}
            </Button>
        </motion.div>
    );

    if (!href) {
        return content;
    }

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
        >
            {content}
        </a>
    );
}

// ─── Floating energy particles ─────────────────────────────────────────────────
function Particles() {
    const particles = Array.from(
        { length: 18 },
        (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 6 + 4,
            delay: Math.random() * 4
        })
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        background:
                            "rgba(231,23,99,0.6)"
                    }}
                    animate={{
                        y: [0, -60, 0],
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1.2, 0.5]
                    }}
                    transition={{
                        duration: p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HeroSection() {
    const { hero } = useSiteData();
    // Falls back to the current desktop photo (not the generic default) so
    // a fresh/incognito visit doesn't flash the wrong image before
    // SiteDataContext's fetch resolves — see the constant's own comment.
    const heroBg = hero?.bannerImage || CURRENT_HERO_BANNER_IMAGE_DESKTOP;

    const [statsStarted, setStatsStarted] =
        useState(false);

    const [showConsultationModal, setShowConsultationModal] = useState(false);

    useEffect(() => {
        const t = setTimeout(
            () => setStatsStarted(true),
            900
        );

        return () => clearTimeout(t);
    }, []);

    // ── Dynamic hero content with safe fallbacks ──────────────────────────
    const words =
        hero?.typewriterWords?.length
            ? hero.typewriterWords
            : [
                "Recover.",
                "Regulate.",
                "Rebuild."
            ];

    const trailingLine =
        hero?.trailingLine ||
        "Your Life.";

    const badgeText =
        hero?.badgeText ||
        "Founding Member Pricing · Limited to First 20 Members";

    const brandTag =
        hero?.brandTag ||
        "RECODE™ · Recovery-Based Transformation";

    const subtext1 =
        hero?.subtext1 ||
        "A recovery-based transformation system designed to restore structure, regulate the body, and create sustainable physical transformation.";

    const subtext2 =
        hero?.subtext2 ||
        "Helping professionals, entrepreneurs, students & families through Online Coaching, Video Consultation & Personal Training in Mumbai.";

    const ctaPrimaryLabel =
        hero?.ctaPrimaryLabel ||
        "Apply For Coaching";

    const ctaSecondaryLabel =
        hero?.ctaSecondaryLabel ||
        "View Transformations";

    const stats =
        hero?.stats?.length
            ? hero.stats
            : [
                {
                    icon: "TrendingUp",
                    value: 29,
                    suffix: "kg",
                    label:
                        "Personal Transformation"
                },
                {
                    icon: "Users",
                    value: 200,
                    suffix: "+",
                    label: "Clients Guided"
                },
                {
                    icon: "Clock",
                    value: 8,
                    suffix: "+",
                    label:
                        "Years Experience"
                },
                {
                    icon: "Award",
                    value: null,
                    label: "ACSM Certified",
                    display: "ACSM"
                }
            ];

    return (
        <section
            id="home"
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
            {/* Mobile/tablet — deliberately stays on the default placeholder
                rather than reusing the admin's uploaded desktop photo. That
                photo is composed for the wide split layout (subject on the
                right, negative space on the left); object-cover has to scale
                it up hard to cover a much taller mobile viewport, which only
                ever shows a narrow vertical slice — fine for an ambient
                gym-texture shot with no single subject to miscrop, but a
                composed portrait doesn't survive that crop. */}
            <img
                src={DEFAULT_HERO_BANNER_IMAGE}
                alt="Fitness training background"
                className="lg:hidden absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="lg:hidden absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80" />

            {/* Desktop — the admin's actual uploaded photo, composed with
                the subject on the right for the split text/photo layout.
                Split composition: dark on the left where the text column
                sits, fading clear by ~78% so the subject reads on the
                right, plus a light top/bottom vignette for the navbar and
                stat cards. */}
            <img
                src={heroBg}
                alt="Fitness training background"
                className="hidden lg:block absolute inset-0 w-full h-full object-cover object-[72%_center]"
            />
            <div
                className="hidden lg:block absolute inset-0"
                style={{
                    background:
                        "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.82) 30%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.05) 78%)"
                }}
            />
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70" />

            {/* Animated glow orbs */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
                style={{
                    background:
                        "rgba(231,23,99,0.09)"
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.div
                className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full blur-3xl"
                style={{
                    background:
                        "rgba(231,23,99,0.07)"
                }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            <Particles />

            {/* Reduced pt on smallest screens (320px) */}
            <div className="relative container mx-auto px-4 pt-20 sm:pt-24 pb-14 sm:pb-20">
                <div className="max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">

                    {/* Badge */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20
                        }}
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.5
                        }}
                        className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full mb-6 md:mb-8"
                        style={{
                            background:
                                "rgba(255,255,255,0.05)",
                            border:
                                "1px solid rgba(231,23,99,0.3)",
                            backdropFilter:
                                "blur(12px)"
                        }}
                    >
                        <motion.span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                                background:
                                    "#e71763"
                            }}
                            animate={{
                                scale: [
                                    1,
                                    1.5,
                                    1
                                ],
                                opacity: [
                                    1,
                                    0.4,
                                    1
                                ]
                            }}
                            transition={{
                                duration: 1.4,
                                repeat: Infinity
                            }}
                        />

                        <span className="text-xs md:text-sm font-medium text-white/70 text-center">
                            {badgeText}
                        </span>
                    </motion.div>

                    {/* Brand tag */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20
                        }}
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.05
                        }}
                        className="mb-4"
                    >
                        <motion.span
                            className="text-sm font-bold uppercase tracking-[0.3em]"
                            style={{
                                color:
                                    "#e71763"
                            }}
                            animate={{
                                opacity: [
                                    0.7,
                                    1,
                                    0.7
                                ]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease:
                                    "easeInOut"
                            }}
                        >
                            {brandTag}
                        </motion.span>
                    </motion.div>

                    {/* Typewriter headline */}
                    <motion.h1
                        initial={{
                            opacity: 0,
                            y: 30
                        }}
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.6,
                            delay: 0.1
                        }}
                        className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-4 md:mb-6 text-white"
                    >
                        <Typewriter
                            words={words}
                        />

                        <br />

                        <span className="text-white">
                            {trailingLine}
                        </span>
                    </motion.h1>

                    {/* Subtext */}
                    <motion.p
                        initial={{
                            opacity: 0,
                            y: 30
                        }}
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.6,
                            delay: 0.2
                        }}
                        className="text-base md:text-xl text-white/60 max-w-3xl mx-auto lg:mx-0 mb-3 leading-relaxed px-2 lg:px-0"
                    >
                        {subtext1}
                    </motion.p>

                    <motion.p
                        initial={{
                            opacity: 0,
                            y: 20
                        }}
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.25
                        }}
                        className="text-xs md:text-sm text-white/40 max-w-2xl mx-auto lg:mx-0 mb-8 md:mb-10 px-2 lg:px-0"
                    >
                        {subtext2}
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 30
                        }}
                        animate={{
                            opacity: 1,
                            y: 0
                        }}
                        transition={{
                            duration: 0.6,
                            delay: 0.3
                        }}
                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4 mb-10 md:mb-16 px-4 lg:px-0"
                    >
                        <PulseButton
                            onClick={() => setShowConsultationModal(true)}
                            style={{
                                background:
                                    "#e71763",
                                boxShadow:
                                    "0 0 30px rgba(231,23,99,0.45)"
                            }}
                        >
                            {ctaPrimaryLabel}

                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </PulseButton>

                        <a
                            href="#transformations"
                            className="w-full sm:w-auto"
                        >
                            <motion.div
                                whileHover={{
                                    scale: 1.05
                                }}
                                whileTap={{
                                    scale: 0.97
                                }}
                            >
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto text-base md:text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-full"
                                >
                                    {ctaSecondaryLabel}
                                </Button>
                            </motion.div>
                        </a>
                    </motion.div>

                    {/* Dynamic Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {stats.map(
                            (stat, index) => {
                                const Icon =
                                    STAT_ICONS[
                                    stat.icon
                                    ] ||
                                    TrendingUp;

                                return (
                                    <motion.div
                                        key={
                                            stat.label ||
                                            index
                                        }
                                        initial={{
                                            opacity: 0,
                                            y: 50,
                                            scale: 0.8
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            scale: 1
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            delay:
                                                0.55 +
                                                index *
                                                0.12,
                                            ease: [
                                                0.22,
                                                1,
                                                0.36,
                                                1
                                            ]
                                        }}
                                        whileHover={{
                                            scale: 1.07,
                                            y: -4
                                        }}
                                        className="rounded-2xl p-3 sm:p-4 md:p-6 cursor-default relative overflow-hidden group"
                                        style={{
                                            background:
                                                "rgba(255,255,255,0.04)",
                                            border:
                                                "1px solid rgba(255,255,255,0.08)",
                                            backdropFilter:
                                                "blur(12px)",
                                            transition:
                                                "border-color 0.3s, box-shadow 0.3s"
                                        }}
                                        onMouseEnter={(
                                            e
                                        ) => {
                                            e.currentTarget.style.borderColor =
                                                "rgba(231,23,99,0.45)";

                                            e.currentTarget.style.boxShadow =
                                                "0 0 30px rgba(231,23,99,0.2), 0 10px 30px rgba(0,0,0,0.4)";
                                        }}
                                        onMouseLeave={(
                                            e
                                        ) => {
                                            e.currentTarget.style.borderColor =
                                                "rgba(255,255,255,0.08)";

                                            e.currentTarget.style.boxShadow =
                                                "none";
                                        }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 rounded-2xl pointer-events-none"
                                            initial={{
                                                opacity: 0
                                            }}
                                            animate={{
                                                opacity: [
                                                    0,
                                                    0.08,
                                                    0
                                                ]
                                            }}
                                            transition={{
                                                duration: 3,
                                                delay:
                                                    0.8 +
                                                    index *
                                                    0.15,
                                                repeat:
                                                    Infinity,
                                                repeatDelay: 4
                                            }}
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, rgba(231,23,99,0.3) 0%, transparent 60%)"
                                            }}
                                        />

                                        <div className="flex flex-col items-center gap-1.5 relative z-10">
                                            <motion.div
                                                initial={{
                                                    scale: 0,
                                                    rotate:
                                                        -20
                                                }}
                                                animate={{
                                                    scale: 1,
                                                    rotate: 0
                                                }}
                                                transition={{
                                                    type:
                                                        "spring",
                                                    stiffness: 260,
                                                    damping: 18,
                                                    delay:
                                                        0.7 +
                                                        index *
                                                        0.12
                                                }}
                                                whileHover={{
                                                    rotate: 15,
                                                    scale: 1.25
                                                }}
                                            >
                                                <Icon
                                                    className="h-5 w-5 mb-1"
                                                    style={{
                                                        color:
                                                            "#e71763"
                                                    }}
                                                />
                                            </motion.div>

                                            <motion.span
                                                className="text-2xl md:text-4xl font-bold"
                                                style={{
                                                    color:
                                                        "#e71763"
                                                }}
                                                initial={{
                                                    opacity: 0
                                                }}
                                                animate={{
                                                    opacity: 1
                                                }}
                                                transition={{
                                                    delay:
                                                        0.85 +
                                                        index *
                                                        0.12
                                                }}
                                            >
                                                {stat.display || (
                                                    <CountUp
                                                        value={
                                                            stat.value
                                                        }
                                                        suffix={
                                                            stat.suffix
                                                        }
                                                        started={
                                                            statsStarted
                                                        }
                                                    />
                                                )}
                                            </motion.span>

                                            <span className="text-[10px] md:text-xs text-white/50 text-center leading-tight">
                                                {
                                                    stat.label
                                                }
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            }
                        )}
                    </div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{
                        opacity: 0
                    }}
                    animate={{
                        opacity: 1
                    }}
                    transition={{
                        delay: 2
                    }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                >
                    <motion.div
                        animate={{
                            y: [0, 10, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="flex flex-col items-center gap-2 text-white/40"
                    >
                        <span className="text-xs uppercase tracking-widest">
                            Scroll
                        </span>

                        <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                    background:
                                        "#e71763"
                                }}
                                animate={{
                                    y: [
                                        0,
                                        12,
                                        0
                                    ],
                                    opacity: [
                                        1,
                                        0.3,
                                        1
                                    ]
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat:
                                        Infinity,
                                    ease:
                                        "easeInOut"
                                }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            <ConsultationModal
                open={showConsultationModal}
                onClose={() => setShowConsultationModal(false)}
            />
        </section>
    );
}