import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Clock, ArrowRight, X, ChevronLeft, ChevronRight, BookOpen, Zap, Activity, Flame } from "lucide-react"
import { blogPosts } from "@/data/SiteData"

const categoryColors = {
    "Recovery": { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" },
    "Fat Loss": { bg: "rgba(251,146,60,0.12)", color: "#fb923c" },
    "Mobility": { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
    "Muscle Building": { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
    "Mindset": { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
    "Nutrition": { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
    "Workouts": { bg: "rgba(231,23,99,0.12)", color: "#e71763" },
}
const defaultCat = { bg: "rgba(231,23,99,0.12)", color: "#e71763" }

function renderContent(content) {
    if (!content) return null;
    const lines = content.trim().split('\n');
    const elements = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) { i++; continue; }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-xl font-black mt-8 mb-4 text-white">{line.replace('## ', '')}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-base font-bold mt-5 mb-2" style={{ color: '#e71763' }}>{line.replace('### ', '')}</h3>);
        } else if (line.startsWith('- ')) {
            const items = [];
            while (i < lines.length && lines[i].trim().startsWith('- ')) { items.push(lines[i].trim().replace('- ', '')); i++; }
            elements.push(
                <ul key={`list-${i}`} className="space-y-2 mb-4 pl-2">
                    {items.map((item, idx) => {
                        const parts = item.split(/\*\*(.*?)\*\*/g);
                        return (
                            <li key={idx} className="flex items-start gap-2 text-white/50">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#e71763' }} />
                                <span>{parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-white font-bold">{p}</strong> : p)}</span>
                            </li>
                        );
                    })}
                </ul>
            );
            continue;
        } else {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            elements.push(
                <p key={i} className="text-white/50 leading-relaxed mb-4 text-sm">
                    {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-white font-bold">{p}</strong> : p)}
                </p>
            );
        }
        i++;
    }
    return elements;
}

function BlogModal({ post, onClose, onPrev, onNext, hasPrev, hasNext }) {
    const cat = categoryColors[post.category] || defaultCat;
    return (
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
                <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
                <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 30 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
                    style={{ background: 'rgba(8,8,8,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 60px rgba(231,23,99,0.15), 0 40px 80px rgba(0,0,0,0.8)' }}
                    onClick={(e) => e.stopPropagation()}>

                    {/* Hero image */}
                    <div className="relative h-52 md:h-72 flex-shrink-0">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
                        {/* Category badge */}
                        <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black"
                            style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}40` }}>
                            {post.category}
                        </span>
                        <button onClick={onClose}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all"
                            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                            <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="absolute bottom-4 left-6 right-6">
                            <h2 className="text-xl md:text-2xl font-black text-white leading-tight mb-2">{post.title}</h2>
                            <div className="flex items-center gap-3 text-xs text-white/40">
                                <span>{post.date}</span><span>·</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {post.content ? renderContent(post.content) : <p className="text-white/50 leading-relaxed text-sm">{post.excerpt}</p>}
                    </div>

                    <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.5)' }}>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={onPrev} disabled={!hasPrev}
                            className="flex items-center gap-1.5 text-sm font-bold text-white/50 hover:text-white disabled:opacity-20 transition-colors">
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </motion.button>
                        <span className="text-xs text-white/25">RECODE™ Knowledge Base</span>
                        <motion.button whileHover={{ scale: 1.05 }} onClick={onNext} disabled={!hasNext}
                            className="flex items-center gap-1.5 text-sm font-bold text-white/50 hover:text-white disabled:opacity-20 transition-colors">
                            Next <ChevronRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Featured large card (first post)
function FeaturedCard({ post, onClick }) {
    const cat = categoryColors[post.category] || defaultCat;
    return (
        <motion.article
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            className="cursor-pointer col-span-full lg:col-span-2 rounded-3xl overflow-hidden relative group"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', minHeight: 380 }}
            onClick={onClick}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(231,23,99,0.35)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(231,23,99,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>

            <div className="absolute inset-0">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)' }} />
            </div>

            <div className="absolute top-5 left-5 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}40`, backdropFilter: 'blur(8px)' }}>
                    {post.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-black text-white"
                    style={{ background: 'rgba(231,23,99,0.9)', boxShadow: '0 0 15px rgba(231,23,99,0.5)' }}>
                    Featured
                </span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                    <span>{post.date}</span><span>·</span>
                    <Clock className="w-3 h-3" /><span>{post.readTime}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight group-hover:text-primary transition-colors">{post.title}</h3>
                <p className="text-white/50 text-sm mb-4 line-clamp-2 max-w-lg">{post.excerpt}</p>
                <div className="flex items-center gap-2 font-black text-sm" style={{ color: '#e71763' }}>
                    Read Full Article <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
            </div>
        </motion.article>
    );
}

// Regular small card
function BlogCard({ post, onClick, index }) {
    const cat = categoryColors[post.category] || defaultCat;
    return (
        <motion.article
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="cursor-pointer rounded-2xl overflow-hidden flex flex-col group relative"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
            onClick={onClick}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(231,23,99,0.35)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(231,23,99,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}>

            {/* Top accent line */}
            <motion.div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />

            <div className="aspect-video relative overflow-hidden flex-shrink-0">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black"
                    style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}30`, backdropFilter: 'blur(8px)' }}>
                    {post.category}
                </span>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-[10px] text-white/30 mb-3">
                    <span>{post.date}</span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                    <Clock className="w-2.5 h-2.5" /><span>{post.readTime}</span>
                </div>
                <h3 className="font-black text-base text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">{post.title}</h3>
                <p className="text-xs text-white/40 mb-4 line-clamp-2 flex-1 leading-relaxed">{post.excerpt}</p>
                <div className="flex items-center gap-1 text-xs font-black" style={{ color: '#e71763' }}>
                    Read More <ArrowRight className="w-3 h-3 group-hover:translate-x-1.5 transition-transform" />
                </div>
            </div>
        </motion.article>
    );
}

export default function BlogSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [showAll, setShowAll] = useState(false);
    const visiblePosts = showAll ? blogPosts : blogPosts.slice(0, 7);

    return (
        <>
            <section className="relative py-28 overflow-hidden" id="blog">
                {/* Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div className="absolute inset-0"
                        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(231,23,99,0.05) 0%, transparent 70%)' }}
                        animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 7, repeat: Infinity }} />
                    {[BookOpen, Activity, Flame].map((Icon, i) => (
                        <motion.div key={i} className="absolute"
                            style={{ left: `${20 + i * 30}%`, top: `${10 + i * 15}%`, opacity: 0.03 }}
                            animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
                            transition={{ duration: 9 + i * 2, repeat: Infinity, delay: i * 1.5 }}>
                            <Icon className="w-20 h-20 text-primary" />
                        </motion.div>
                    ))}
                </div>

                <div ref={ref} className="relative container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="text-center mb-14">
                        <motion.span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] px-4 py-2 rounded-full mb-6"
                            style={{ color: '#e71763', border: '1px solid rgba(231,23,99,0.28)', background: 'rgba(231,23,99,0.07)' }}
                            animate={{ boxShadow: ['0 0 0px transparent', '0 0 22px rgba(231,23,99,0.35)', '0 0 0px transparent'] }}
                            transition={{ duration: 3, repeat: Infinity }}>
                            <Zap className="w-3 h-3" /> Knowledge Hub
                        </motion.span>
                        <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
                            Fitness <motion.span style={{ color: '#e71763' }}
                                animate={{ textShadow: ['0 0 20px rgba(231,23,99,0.3)', '0 0 55px rgba(231,23,99,0.65)', '0 0 20px rgba(231,23,99,0.3)'] }}
                                transition={{ duration: 3, repeat: Infinity }}>Insights</motion.span>
                        </h2>
                        <p className="text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
                            Science-backed tips from the RECODE™ system — recovery, nutrition, training & mindset.
                        </p>
                    </motion.div>

                    {/* Grid — Featured (large) + regular cards */}
                    <div className="grid lg:grid-cols-3 gap-5">
                        {visiblePosts.map((post, index) => {
                            const realIndex = blogPosts.findIndex(p => p.id === post.id);
                            if (index === 0) {
                                return <FeaturedCard key={post.id} post={post} onClick={() => setSelectedIndex(realIndex)} />;
                            }
                            return <BlogCard key={post.id} post={post} onClick={() => setSelectedIndex(realIndex)} index={index} />;
                        })}
                    </div>

                    {/* Load more */}
                    {!showAll && blogPosts.length > 7 && (
                        <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.5, delay: 0.6 }} className="text-center mt-12">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                                onClick={() => setShowAll(true)}
                                className="group flex items-center gap-2 mx-auto px-8 py-3.5 rounded-full font-black text-sm text-white"
                                style={{ border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(231,23,99,0.4)'; e.currentTarget.style.background = 'rgba(231,23,99,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                                View All Articles <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </section>

            {selectedIndex !== null && (
                <BlogModal post={blogPosts[selectedIndex]} onClose={() => setSelectedIndex(null)}
                    onPrev={() => setSelectedIndex(i => Math.max(0, i - 1))}
                    onNext={() => setSelectedIndex(i => Math.min(blogPosts.length - 1, i + 1))}
                    hasPrev={selectedIndex > 0} hasNext={selectedIndex < blogPosts.length - 1} />
            )}
        </>
    );
}