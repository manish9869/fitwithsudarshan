import { useRef, useState } from "react"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Clock, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { blogPosts } from "@/data/SiteData"

const categoryColors = {
    "Recovery": "bg-blue-500/20 text-blue-400",
    "Fat Loss": "bg-orange-500/20 text-orange-400",
    "Mobility": "bg-violet-500/20 text-violet-400",
    "Muscle Building": "bg-red-500/20 text-red-400",
    "Mindset": "bg-emerald-500/20 text-emerald-400",
    "Nutrition": "bg-green-500/20 text-green-400",
    "Workouts": "bg-primary/20 text-primary",
}

function BlogModal({ post, onClose, onPrev, onNext, hasPrev, hasNext }) {
    // Parse markdown-lite content into readable sections
    const renderContent = (content) => {
        if (!content) return null;
        const lines = content.trim().split('\n');
        const elements = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            if (!line) { i++; continue; }

            if (line.startsWith('## ')) {
                elements.push(
                    <h2 key={i} className="text-2xl font-bold mt-8 mb-4 text-foreground">
                        {line.replace('## ', '')}
                    </h2>
                );
            } else if (line.startsWith('### ')) {
                elements.push(
                    <h3 key={i} className="text-lg font-semibold mt-6 mb-3 text-primary">
                        {line.replace('### ', '')}
                    </h3>
                );
            } else if (line.startsWith('- ')) {
                // Collect consecutive list items
                const items = [];
                while (i < lines.length && lines[i].trim().startsWith('- ')) {
                    items.push(lines[i].trim().replace('- ', ''));
                    i++;
                }
                elements.push(
                    <ul key={`list-${i}`} className="space-y-2 mb-4 pl-4">
                        {items.map((item, idx) => {
                            // Handle bold within list items
                            const parts = item.split(/\*\*(.*?)\*\*/g);
                            return (
                                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                                    <span className="text-primary mt-1.5 text-xs">●</span>
                                    <span>{parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-foreground font-semibold">{p}</strong> : p)}</span>
                                </li>
                            );
                        })}
                    </ul>
                );
                continue;
            } else if (line.match(/^\d+\. /)) {
                // Numbered list
                const items = [];
                while (i < lines.length && lines[i].trim().match(/^\d+\. /)) {
                    items.push(lines[i].trim().replace(/^\d+\. /, ''));
                    i++;
                }
                elements.push(
                    <ol key={`ol-${i}`} className="space-y-2 mb-4 pl-4">
                        {items.map((item, idx) => {
                            const parts = item.split(/\*\*(.*?)\*\*/g);
                            return (
                                <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                                    <span className="text-primary font-bold text-sm min-w-[1.5rem]">{idx + 1}.</span>
                                    <span>{parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-foreground font-semibold">{p}</strong> : p)}</span>
                                </li>
                            );
                        })}
                    </ol>
                );
                continue;
            } else {
                // Regular paragraph — handle bold
                const parts = line.split(/\*\*(.*?)\*\*/g);
                elements.push(
                    <p key={i} className="text-muted-foreground leading-relaxed mb-4">
                        {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-foreground font-semibold">{p}</strong> : p)}
                    </p>
                );
            }
            i++;
        }
        return elements;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden glass-card border border-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Hero image */}
                    <div className="relative h-48 md:h-64 flex-shrink-0">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Category */}
                        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[post.category] || "bg-primary/20 text-primary"}`}>
                            {post.category}
                        </span>

                        {/* Close */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>

                        {/* Title overlay */}
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">{post.title}</h2>
                            <div className="flex items-center gap-3 text-xs text-white/60 mt-2">
                                <span>{post.date}</span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{post.readTime}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8">
                        {post.content
                            ? renderContent(post.content)
                            : <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
                        }
                    </div>

                    {/* Footer nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 flex-shrink-0 bg-black/20">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className="text-white disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <span className="text-xs text-muted-foreground">Read more articles</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onNext}
                            disabled={!hasNext}
                            className="text-white disabled:opacity-30"
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function BlogSection() {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })
    const [selectedIndex, setSelectedIndex] = useState(null)
    const [showAll, setShowAll] = useState(false)

    const visiblePosts = showAll ? blogPosts : blogPosts.slice(0, 6)

    const openPost = (index) => setSelectedIndex(index)
    const closePost = () => setSelectedIndex(null)
    const prevPost = () => setSelectedIndex(i => Math.max(0, i - 1))
    const nextPost = () => setSelectedIndex(i => Math.min(blogPosts.length - 1, i + 1))

    return (
        <>
            <section className="relative py-24 overflow-hidden" id="blog">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div ref={ref} className="relative container mx-auto px-4">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <span className="text-primary text-sm font-semibold uppercase tracking-widest">Blog</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
                            Fitness <span className="text-primary">Insights</span>
                        </h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                            Free educational content to help you on your fitness journey. Tips, guides, and science-backed advice from the RECODE™ system.
                        </p>
                    </motion.div>

                    {/* Blog Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visiblePosts.map((post, index) => (
                            <motion.article
                                key={post.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.4, delay: 0.1 + (index % 6) * 0.05 }}
                                className="group cursor-pointer"
                                onClick={() => openPost(blogPosts.findIndex(p => p.id === post.id))}
                            >
                                <div className="border border-white/10 bg-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all h-full flex flex-col hover:-translate-y-1 duration-300">
                                    {/* Thumbnail */}
                                    <div className="aspect-video relative overflow-hidden">
                                        <img
                                            src={post.image}
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[post.category] || "bg-primary/20 text-primary"}`}>
                                            {post.category}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                            <span>{post.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {post.readTime}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title}
                                        </h3>

                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                                            {post.excerpt}
                                        </p>

                                        <div className="flex items-center gap-1 text-primary text-sm font-medium group/btn w-fit">
                                            Read More
                                            <ArrowRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    {/* View All CTA */}
                    {!showAll && blogPosts.length > 6 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="text-center mt-12"
                        >
                            <Button
                                variant="outline"
                                size="lg"
                                className="group text-white"
                                onClick={() => setShowAll(true)}
                            >
                                View All Articles
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Blog Modal */}
            {selectedIndex !== null && (
                <BlogModal
                    post={blogPosts[selectedIndex]}
                    onClose={closePost}
                    onPrev={prevPost}
                    onNext={nextPost}
                    hasPrev={selectedIndex > 0}
                    hasNext={selectedIndex < blogPosts.length - 1}
                />
            )}
        </>
    )
}