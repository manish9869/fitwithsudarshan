import { useState, useRef, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Scale,
    Clock,
    TrendingDown,
    Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { wa } from "@/utils/whatsapp";
import { useSiteData } from "@/contexts/SiteDataContext";

function getInitials(name) {
    return name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

function NoImageCard({ transformation }) {
    return (
        <div
            className="rounded-2xl overflow-hidden aspect-[3/4] flex flex-col"
            style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(231,23,99,0.15)",
            }}
        >
            <div
                className="h-1 w-full flex-shrink-0"
                style={{ background: "rgba(231,23,99,0.6)" }}
            />

            <div className="flex flex-col flex-1 p-8 justify-between">
                <div>
                    <span
                        className="text-xs font-semibold uppercase tracking-widest"
                        style={{ color: "#e71763" }}
                    >
                        {transformation.category}
                    </span>
                </div>

                <div className="flex flex-col items-center text-center gap-4">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                            background: "rgba(231,23,99,0.1)",
                            border: "2px solid rgba(231,23,99,0.3)",
                        }}
                    >
                        <span
                            className="text-2xl font-bold"
                            style={{ color: "#e71763" }}
                        >
                            {getInitials(transformation.name)}
                        </span>
                    </div>

                    <div>
                        <p className="text-lg font-bold text-white">
                            {transformation.name}
                        </p>

                        <p className="text-sm text-muted-foreground mt-0.5">
                            {transformation.role}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div
                        className="rounded-xl p-3 text-center"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <p className="text-xs text-muted-foreground mb-1">
                            Result
                        </p>

                        <p
                            className="text-sm font-bold leading-tight"
                            style={{ color: "#e71763" }}
                        >
                            {transformation.weightLost}
                        </p>
                    </div>

                    <div
                        className="rounded-xl p-3 text-center"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        <p className="text-xs text-muted-foreground mb-1">
                            Duration
                        </p>

                        <p className="text-sm font-bold text-white leading-tight">
                            {transformation.duration}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <span
                        className="px-3 py-1 rounded-full text-xs text-muted-foreground"
                        style={{
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        📸 Photos coming soon
                    </span>
                </div>
            </div>
        </div>
    );
}

function BeforeAfterSlider({ transformation }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef(null);

    const hasBefore = Boolean(transformation.photoBefore);
    const hasAfter = Boolean(transformation.photoAfter);

    if (!hasBefore && !hasAfter) {
        return <NoImageCard transformation={transformation} />;
    }

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(
            0,
            Math.min(e.clientX - rect.left, rect.width)
        );

        setSliderPosition((x / rect.width) * 100);
    };

    const handleTouchMove = (e) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(
            0,
            Math.min(e.touches[0].clientX - rect.left, rect.width)
        );

        setSliderPosition((x / rect.width) * 100);
    };

    if (!hasBefore || !hasAfter) {
        const src = hasAfter
            ? transformation.photoAfter
            : transformation.photoBefore;

        const label = hasAfter ? "AFTER" : "BEFORE";

        return (
            <div
                className="relative aspect-[3/4] rounded-2xl overflow-hidden"
                style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <img
                    src={src}
                    alt={label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{
                        background: "rgba(231,23,99,0.8)",
                        backdropFilter: "blur(8px)",
                    }}
                >
                    {label}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden select-none cursor-ew-resize"
            style={{
                border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            <img
                src={transformation.photoAfter}
                alt="After"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-top"
                draggable={false}
            />

            <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={transformation.photoBefore}
                    alt="Before"
                    loading="lazy"
                    className="absolute inset-0 h-full object-cover object-top"
                    style={{
                        width: `${(100 / Math.max(sliderPosition, 0.1)) * 100}%`,
                        maxWidth: "none",
                    }}
                    draggable={false}
                />
            </div>

            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{
                    left: `${sliderPosition}%`,
                    boxShadow: "0 0 8px rgba(0,0,0,0.8)",
                }}
            />

            <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
                style={{ left: `${sliderPosition}%` }}
            >
                <ChevronLeft className="h-3.5 w-3.5 text-black" />
                <ChevronRight className="h-3.5 w-3.5 text-black" />
            </div>

            <div
                className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(8px)",
                }}
            >
                BEFORE
            </div>

            <div
                className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{
                    background: "rgba(231,23,99,0.8)",
                    backdropFilter: "blur(8px)",
                }}
            >
                AFTER
            </div>

            <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) =>
                    setSliderPosition(Number(e.target.value))
                }
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />
        </div>
    );
}

function smoothScrollTo(el, targetLeft, duration = 400) {
    const start = el.scrollLeft;
    const distance = targetLeft - start;
    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const ease =
            progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        el.scrollLeft = start + distance * ease;

        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }

    requestAnimationFrame(step);
}

export function TransformationsSection() {
    const { transformations, loading } = useSiteData();

    const ref = useRef(null);
    const thumbnailScrollRef = useRef(null);

    const isInView = useInView(ref, {
        once: true,
        margin: "-100px",
    });

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollState = () => {
        const el = thumbnailScrollRef.current;

        if (!el) return;

        setCanScrollLeft(el.scrollLeft > 4);

        setCanScrollRight(
            el.scrollLeft + el.clientWidth < el.scrollWidth - 4
        );
    };

    useEffect(() => {
        const el = thumbnailScrollRef.current;

        if (!el) return;

        updateScrollState();

        el.addEventListener("scroll", updateScrollState, {
            passive: true,
        });

        return () =>
            el.removeEventListener("scroll", updateScrollState);
    }, [transformations]);

    useEffect(() => {
        updateScrollState();
    }, [transformations]);

    useEffect(() => {
        if (
            transformations?.length &&
            selectedIndex >= transformations.length
        ) {
            setSelectedIndex(0);
        }
    }, [transformations, selectedIndex]);

    if (loading || !transformations?.length) {
        return null;
    }

    const selected = transformations[selectedIndex];

    const handleThumbnailClick = (index) => {
        setDirection(index > selectedIndex ? 1 : -1);
        setSelectedIndex(index);

        const container = thumbnailScrollRef.current;

        if (!container) return;

        const buttons = container.querySelectorAll("button");

        if (!buttons[index]) return;

        const btn = buttons[index];
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();

        const offset =
            btnRect.left -
            containerRect.left -
            containerRect.width / 2 +
            btnRect.width / 2;

        smoothScrollTo(
            container,
            container.scrollLeft + offset,
            450
        );
    };

    const nextSlide = () => {
        const next =
            (selectedIndex + 1) % transformations.length;

        setDirection(1);
        handleThumbnailClick(next);
    };

    const prevSlide = () => {
        const prev =
            (selectedIndex - 1 + transformations.length) %
            transformations.length;

        setDirection(-1);
        handleThumbnailClick(prev);
    };

    const scrollStrip = (dir) => {
        const el = thumbnailScrollRef.current;

        if (!el) return;

        smoothScrollTo(
            el,
            el.scrollLeft + dir * 200,
            400
        );
    };

    const variants = {
        enter: (dir) => ({
            opacity: 0,
            x: dir > 0 ? 40 : -40,
        }),

        center: {
            opacity: 1,
            x: 0,
        },

        exit: (dir) => ({
            opacity: 0,
            x: dir > 0 ? -40 : 40,
        }),
    };

    return (
        <section
            id="transformations"
            className="relative py-12 sm:py-20 md:py-24 overflow-hidden"
        >
            <style>{`
                .thumbnail-scroll::-webkit-scrollbar { display: none; }
                .thumbnail-scroll { scroll-behavior: auto; }

                .strip-arrow {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    z-index: 10;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: opacity 0.25s, transform 0.2s, background 0.2s;
                    background: rgba(20, 20, 20, 0.75);
                    border: 1px solid rgba(231,23,99,0.35);
                    backdrop-filter: blur(8px);
                    color: #fff;
                }

                .strip-arrow:hover {
                    background: rgba(231,23,99,0.18);
                    border-color: rgba(231,23,99,0.7);
                    transform: translateY(-50%) scale(1.1);
                }

                .strip-arrow:active {
                    transform: translateY(-50%) scale(0.95);
                }

                .strip-arrow svg {
                    width: 16px;
                    height: 16px;
                    stroke-width: 2.5;
                }

                .strip-fade-left {
                    background: linear-gradient(
                        to right,
                        var(--strip-fade-color, #000) 0%,
                        transparent 100%
                    );
                    pointer-events: none;
                }

                .strip-fade-right {
                    background: linear-gradient(
                        to left,
                        var(--strip-fade-color, #000) 0%,
                        transparent 100%
                    );
                    pointer-events: none;
                }
            `}</style>

            <div
                ref={ref}
                className="relative container mx-auto px-4"
            >
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                        isInView
                            ? { opacity: 1, y: 0 }
                            : {}
                    }
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8 sm:mb-12 md:mb-16"
                >
                    <span
                        className="text-sm font-semibold uppercase tracking-widest"
                        style={{ color: "#e71763" }}
                    >
                        Real Results
                    </span>

                    <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 sm:mb-6">
                        Client{" "}
                        <span style={{ color: "#e71763" }}>
                            RECODE Stories
                        </span>
                    </h2>

                    <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
                        Real people, real results. Sustainable
                        transformations built through structure, not
                        restriction.
                    </p>
                </motion.div>

                {/* Main card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                        isInView
                            ? { opacity: 1, y: 0 }
                            : {}
                    }
                    transition={{
                        duration: 0.5,
                        delay: 0.2,
                    }}
                    className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center max-w-5xl mx-auto mb-8 sm:mb-12 md:mb-16"
                >
                    <AnimatePresence
                        mode="wait"
                        custom={direction}
                    >
                        <motion.div
                            key={`${selected.id}-img`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                duration: 0.35,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        >
                            <BeforeAfterSlider
                                transformation={selected}
                            />
                        </motion.div>
                    </AnimatePresence>

                    <AnimatePresence
                        mode="wait"
                        custom={direction}
                    >
                        <motion.div
                            key={`${selected.id}-info`}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                duration: 0.35,
                                ease: [0.4, 0, 0.2, 1],
                                delay: 0.04,
                            }}
                            className="space-y-5 sm:space-y-6"
                        >
                            <div>
                                <span
                                    className="text-xs font-semibold uppercase tracking-widest"
                                    style={{
                                        color: "#e71763",
                                    }}
                                >
                                    {selected.category}
                                </span>

                                <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-white">
                                    {selected.name}
                                </h3>

                                <p className="text-muted-foreground text-sm mt-1">
                                    {selected.role}
                                </p>
                            </div>

                            <div className="relative">
                                <Quote
                                    className="absolute -top-2 -left-1 h-7 w-7"
                                    style={{
                                        color:
                                            "rgba(231,23,99,0.2)",
                                    }}
                                />

                                <blockquote className="text-muted-foreground italic leading-relaxed pl-5 text-sm sm:text-base">
                                    &quot;{selected.quote}&quot;
                                </blockquote>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                {[
                                    {
                                        icon: Scale,
                                        label: "Result",
                                        value:
                                            selected.weightLost,
                                    },
                                    {
                                        icon: Clock,
                                        label: "Duration",
                                        value:
                                            selected.duration,
                                    },
                                    {
                                        icon: TrendingDown,
                                        label: "Body Fat",
                                        value:
                                            selected.stats.bodyFat,
                                        highlight: true,
                                    },
                                ].map(
                                    ({
                                        icon: Icon,
                                        label,
                                        value,
                                        highlight,
                                    }) => (
                                        <div
                                            key={label}
                                            className="rounded-xl p-3 sm:p-4 text-center"
                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.03)",
                                                border:
                                                    "1px solid rgba(255,255,255,0.08)",
                                            }}
                                        >
                                            <Icon
                                                className="h-4 w-4 mx-auto mb-2"
                                                style={{
                                                    color:
                                                        "#e71763",
                                                }}
                                            />

                                            <p className="text-xs text-muted-foreground">
                                                {label}
                                            </p>

                                            <p
                                                className={`text-xs sm:text-sm font-bold mt-0.5 ${highlight
                                                    ? ""
                                                    : "text-white"
                                                    }`}
                                                style={
                                                    highlight
                                                        ? {
                                                            color:
                                                                "#e71763",
                                                        }
                                                        : {}
                                                }
                                            >
                                                {value}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>

                            {selected.stats.before &&
                                selected.stats.after && (
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex-1 rounded-xl p-3 text-center"
                                            style={{
                                                background:
                                                    "rgba(255,255,255,0.03)",
                                                border:
                                                    "1px solid rgba(255,255,255,0.08)",
                                            }}
                                        >
                                            <p className="text-xs text-muted-foreground">
                                                Before
                                            </p>

                                            <p className="text-lg sm:text-xl font-bold text-muted-foreground">
                                                {
                                                    selected
                                                        .stats
                                                        .before
                                                }
                                            </p>
                                        </div>

                                        <ChevronRight
                                            className="h-5 w-5 flex-shrink-0"
                                            style={{
                                                color:
                                                    "#e71763",
                                            }}
                                        />

                                        <div
                                            className="flex-1 rounded-xl p-3 text-center"
                                            style={{
                                                background:
                                                    "rgba(231,23,99,0.05)",
                                                border:
                                                    "1px solid rgba(231,23,99,0.2)",
                                            }}
                                        >
                                            <p className="text-xs text-muted-foreground">
                                                After
                                            </p>

                                            <p
                                                className="text-lg sm:text-xl font-bold"
                                                style={{
                                                    color:
                                                        "#e71763",
                                                }}
                                            >
                                                {
                                                    selected
                                                        .stats
                                                        .after
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <motion.button
                                    onClick={prevSlide}
                                    whileHover={{
                                        scale: 1.08,
                                    }}
                                    whileTap={{
                                        scale: 0.93,
                                    }}
                                    className="relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                                    style={{
                                        background:
                                            "rgba(255,255,255,0.04)",
                                        border:
                                            "1px solid rgba(231,23,99,0.3)",
                                        boxShadow:
                                            "0 0 0 0 rgba(231,23,99,0)",
                                        transition:
                                            "box-shadow 0.25s",
                                    }}
                                    onMouseEnter={(e) =>
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 14px rgba(231,23,99,0.35)")
                                    }
                                    onMouseLeave={(e) =>
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 0 0 rgba(231,23,99,0)")
                                    }
                                    aria-label="Previous"
                                >
                                    <ChevronLeft
                                        className="h-[18px] w-[18px]"
                                        style={{
                                            color:
                                                "#e71763",
                                        }}
                                    />
                                </motion.button>

                                <div className="flex-1 flex items-center justify-center gap-2">
                                    {transformations.map(
                                        (_, index) => (
                                            <motion.button
                                                key={index}
                                                onClick={() =>
                                                    handleThumbnailClick(
                                                        index
                                                    )
                                                }
                                                className="h-2 rounded-full"
                                                animate={{
                                                    width:
                                                        index ===
                                                            selectedIndex
                                                            ? 28
                                                            : 8,
                                                    background:
                                                        index ===
                                                            selectedIndex
                                                            ? "#e71763"
                                                            : "rgba(255,255,255,0.2)",
                                                }}
                                                transition={{
                                                    duration:
                                                        0.3,
                                                    ease: [
                                                        0.4,
                                                        0,
                                                        0.2,
                                                        1,
                                                    ],
                                                }}
                                                style={{
                                                    minWidth: 8,
                                                }}
                                                aria-label={`Show transformation ${index + 1
                                                    }`}
                                            />
                                        )
                                    )}
                                </div>

                                <motion.button
                                    onClick={nextSlide}
                                    whileHover={{
                                        scale: 1.08,
                                    }}
                                    whileTap={{
                                        scale: 0.93,
                                    }}
                                    className="relative flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                                    style={{
                                        background:
                                            "rgba(231,23,99,0.12)",
                                        border:
                                            "1px solid rgba(231,23,99,0.45)",
                                        boxShadow:
                                            "0 0 0 0 rgba(231,23,99,0)",
                                        transition:
                                            "box-shadow 0.25s",
                                    }}
                                    onMouseEnter={(e) =>
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 16px rgba(231,23,99,0.45)")
                                    }
                                    onMouseLeave={(e) =>
                                    (e.currentTarget.style.boxShadow =
                                        "0 0 0 0 rgba(231,23,99,0)")
                                    }
                                    aria-label="Next"
                                >
                                    <ChevronRight
                                        className="h-[18px] w-[18px]"
                                        style={{
                                            color:
                                                "#e71763",
                                        }}
                                    />
                                </motion.button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Thumbnail strip */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={
                        isInView
                            ? { opacity: 1, y: 0 }
                            : {}
                    }
                    transition={{
                        duration: 0.5,
                        delay: 0.4,
                    }}
                    className="max-w-2xl mx-auto"
                >
                    <div className="relative">
                        <motion.div
                            className="absolute left-0 top-0 bottom-0 w-16 strip-fade-left z-10 flex items-center"
                            animate={{
                                opacity:
                                    canScrollLeft ? 1 : 0,
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            style={{
                                pointerEvents:
                                    canScrollLeft
                                        ? "auto"
                                        : "none",
                            }}
                        >
                            <button
                                onClick={() =>
                                    scrollStrip(-1)
                                }
                                className="strip-arrow"
                                style={{ left: "2px" }}
                                aria-label="Scroll thumbnails left"
                            >
                                <ChevronLeft />
                            </button>
                        </motion.div>

                        <motion.div
                            className="absolute right-0 top-0 bottom-0 w-16 strip-fade-right z-10 flex items-center justify-end"
                            animate={{
                                opacity:
                                    canScrollRight ? 1 : 0,
                            }}
                            transition={{
                                duration: 0.2,
                            }}
                            style={{
                                pointerEvents:
                                    canScrollRight
                                        ? "auto"
                                        : "none",
                            }}
                        >
                            <button
                                onClick={() =>
                                    scrollStrip(1)
                                }
                                className="strip-arrow"
                                style={{ right: "2px" }}
                                aria-label="Scroll thumbnails right"
                            >
                                <ChevronRight />
                            </button>
                        </motion.div>

                        <div
                            ref={thumbnailScrollRef}
                            className="thumbnail-scroll flex gap-3 overflow-x-auto px-2 pb-2"
                            style={{
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                            }}
                        >
                            {transformations.map(
                                (t, index) => (
                                    <motion.button
                                        key={t.id}
                                        onClick={() =>
                                            handleThumbnailClick(
                                                index
                                            )
                                        }
                                        initial={{
                                            opacity: 0,
                                            scale: 0.88,
                                        }}
                                        animate={
                                            isInView
                                                ? {
                                                    opacity: 1,
                                                    scale: 1,
                                                }
                                                : {}
                                        }
                                        transition={{
                                            duration: 0.3,
                                            delay:
                                                0.5 +
                                                index *
                                                0.05,
                                        }}
                                        whileHover={{
                                            scale: 1.06,
                                            y: -2,
                                        }}
                                        whileTap={{
                                            scale: 0.96,
                                        }}
                                        className="relative rounded-xl overflow-hidden flex-shrink-0"
                                        style={{
                                            width: "80px",
                                            height: "80px",
                                            border:
                                                index ===
                                                    selectedIndex
                                                    ? "2px solid #e71763"
                                                    : "2px solid rgba(255,255,255,0.1)",
                                            boxShadow:
                                                index ===
                                                    selectedIndex
                                                    ? "0 0 0 3px rgba(231,23,99,0.18), 0 4px 20px rgba(231,23,99,0.3)"
                                                    : "0 2px 8px rgba(0,0,0,0.3)",
                                            transition:
                                                "border-color 0.25s, box-shadow 0.25s",
                                        }}
                                    >
                                        {t.photoAfter ? (
                                            <>
                                                <img
                                                    src={
                                                        t.photoAfter
                                                    }
                                                    alt={
                                                        t.name
                                                    }
                                                    loading="lazy"
                                                    className="w-full h-full object-cover object-top"
                                                />

                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 px-1">
                                                    <p className="text-[9px] text-white font-semibold text-center leading-tight truncate">
                                                        {
                                                            t.name.split(
                                                                " "
                                                            )[0]
                                                        }
                                                    </p>
                                                </div>

                                                {index ===
                                                    selectedIndex && (
                                                        <motion.div
                                                            className="absolute inset-0 rounded-xl"
                                                            style={{
                                                                border:
                                                                    "2px solid rgba(231,23,99,0.6)",
                                                            }}
                                                            animate={{
                                                                opacity:
                                                                    [
                                                                        0.6,
                                                                        0,
                                                                        0.6,
                                                                    ],
                                                            }}
                                                            transition={{
                                                                duration: 2,
                                                                repeat:
                                                                    Infinity,
                                                                ease:
                                                                    "easeInOut",
                                                            }}
                                                        />
                                                    )}
                                            </>
                                        ) : (
                                            <div
                                                className="w-full h-full flex flex-col items-center justify-center gap-1"
                                                style={{
                                                    background:
                                                        "rgba(255,255,255,0.05)",
                                                }}
                                            >
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                                    style={{
                                                        background:
                                                            "rgba(231,23,99,0.2)",
                                                        border:
                                                            "1px solid rgba(231,23,99,0.3)",
                                                    }}
                                                >
                                                    <span
                                                        className="text-[10px] font-bold"
                                                        style={{
                                                            color:
                                                                "#e71763",
                                                        }}
                                                    >
                                                        {getInitials(
                                                            t.name
                                                        )}
                                                    </span>
                                                </div>

                                                <p className="text-[8px] text-white/50 font-medium leading-tight px-1 text-center truncate w-full">
                                                    {
                                                        t.name.split(
                                                            " "
                                                        )[0]
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </motion.button>
                                )
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                        isInView
                            ? { opacity: 1, y: 0 }
                            : {}
                    }
                    transition={{
                        duration: 0.5,
                        delay: 0.6,
                    }}
                    className="text-center mt-8 sm:mt-12 md:mt-16"
                >
                    <p className="text-muted-foreground mb-4">
                        Ready to write your own success story?
                    </p>

                    <a
                        href={wa.transformations}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button
                            size="lg"
                            className="text-white font-bold"
                            style={{
                                background: "#e71763",
                                boxShadow:
                                    "0 0 25px rgba(231,23,99,0.35)",
                            }}
                        >
                            Start Your Transformation
                        </Button>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}