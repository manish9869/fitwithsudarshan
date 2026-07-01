import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, MessageCircle } from 'lucide-react';
import { blogPosts } from '@/data/SiteData';
import { usePageMeta } from '@/hooks/usePageMeta';
import { wa } from '@/utils/whatsapp';
import FooterSection from '@/components/landing/FooterSection';

const categoryColors = {
    "Recovery": { bg: "rgba(96,165,250,0.12)", color: "#60a5fa" },
    "Fat Loss": { bg: "rgba(251,146,60,0.12)", color: "#fb923c" },
    "Mobility": { bg: "rgba(167,139,250,0.12)", color: "#a78bfa" },
    "Muscle Building": { bg: "rgba(248,113,113,0.12)", color: "#f87171" },
    "Mindset": { bg: "rgba(52,211,153,0.12)", color: "#34d399" },
    "Nutrition": { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
    "Workouts": { bg: "rgba(231,23,99,0.12)", color: "#e71763" },
};
const defaultCat = { bg: "rgba(231,23,99,0.12)", color: "#e71763" };

function renderContent(content) {
    if (!content) return null;
    const lines = content.trim().split('\n');
    const elements = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) { i++; continue; }
        if (line.startsWith('## ')) {
            elements.push(<h2 key={i} className="text-2xl font-black mt-10 mb-4 text-white">{line.replace('## ', '')}</h2>);
        } else if (line.startsWith('### ')) {
            elements.push(<h3 key={i} className="text-lg font-bold mt-6 mb-2" style={{ color: '#e71763' }}>{line.replace('### ', '')}</h3>);
        } else if (line.startsWith('- ')) {
            const items = [];
            while (i < lines.length && lines[i].trim().startsWith('- ')) { items.push(lines[i].trim().replace('- ', '')); i++; }
            elements.push(
                <ul key={`list-${i}`} className="space-y-2 mb-4 pl-2">
                    {items.map((item, idx) => {
                        const parts = item.split(/\*\*(.*?)\*\*/g);
                        return (
                            <li key={idx} className="flex items-start gap-2 text-white/60">
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
                <p key={i} className="text-white/60 leading-relaxed mb-4">
                    {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-white font-bold">{p}</strong> : p)}
                </p>
            );
        }
        i++;
    }
    return elements;
}

function injectArticleSchema(post) {
    const id = 'article-jsonld';
    let script = document.getElementById(id);
    if (!script) {
        script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": `https://fitwithsudarshan.com/blog/${post.slug}`,
        headline: post.title,
        description: post.excerpt,
        image: post.image,
        datePublished: post.date,
        dateModified: post.date,
        author: {
            "@type": "Person",
            name: "Sudarshan Chavan",
            "@id": "https://fitwithsudarshan.com/#sudarshan-chavan",
        },
        publisher: { "@id": "https://fitwithsudarshan.com/#business" },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://fitwithsudarshan.com/blog/${post.slug}`,
        },
        articleSection: post.category,
    });
    return () => { script?.remove(); };
}

export default function BlogPost() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const post = blogPosts.find((p) => p.slug === slug);
    const idx = blogPosts.findIndex((p) => p.slug === slug);
    const prevPost = idx > 0 ? blogPosts[idx - 1] : null;
    const nextPost = idx < blogPosts.length - 1 ? blogPosts[idx + 1] : null;

    usePageMeta({
        title: post ? post.title : 'Article Not Found',
        description: post ? post.excerpt : 'This article could not be found.',
        path: `/blog/${slug}`,
        image: post?.image,
        noindex: !post,
    });

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (post) return injectArticleSchema(post);
    }, [post]);

    if (!post) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-white mb-3" onClick={() => navigate('/#blog')}>Article Not Found</h1>
                    <p className="text-white/40 mb-6">This blog post doesn't exist or may have been moved.</p>
                    <Link to="/#blog" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Blog
                    </Link>
                </div>
            </div>
        );
    }

    const cat = categoryColors[post.category] || defaultCat;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Hero */}
            <section className="relative pt-8 pb-0 overflow-hidden">
                <div className="container mx-auto px-4 max-w-3xl">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Link>
                </div>

                <div className="relative h-64 sm:h-80 md:h-96 max-w-5xl mx-auto rounded-3xl overflow-hidden mx-4 sm:mx-auto">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
                    <span className="absolute top-5 left-5 px-3 py-1.5 rounded-full text-xs font-black"
                        style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.color}40`, backdropFilter: 'blur(8px)' }}>
                        {post.category}
                    </span>
                    <div className="absolute bottom-6 left-6 right-6">
                        <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-2">{post.title}</h1>
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-white/50">
                            <span>{post.date}</span><span>·</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readTime}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <article className="py-10 sm:py-14">
                <div className="container mx-auto px-4 max-w-3xl">
                    {post.content ? renderContent(post.content) : <p className="text-white/60 leading-relaxed">{post.excerpt}</p>}

                    {/* CTA */}
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                        className="mt-12 rounded-2xl p-6 sm:p-8 text-center"
                        style={{ background: 'rgba(231,23,99,0.06)', border: '1px solid rgba(231,23,99,0.2)' }}>
                        <p className="text-white font-black text-lg mb-2">Ready to apply this to your own transformation?</p>
                        <p className="text-white/40 text-sm mb-5">Chat directly with Sudarshan and get a plan built around your goals.</p>
                        <a href={wa.blog} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white"
                            style={{ background: '#e71763' }}>
                            <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                        </a>
                    </motion.div>

                    {/* Prev / Next */}
                    <div className="mt-10 grid sm:grid-cols-2 gap-4">
                        {prevPost && (
                            <Link to={`/blog/${prevPost.slug}`}
                                className="rounded-xl p-4 flex items-center gap-2 text-left transition-colors"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <ArrowLeft className="w-4 h-4 text-white/30 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Previous</p>
                                    <p className="text-sm text-white/70 font-semibold truncate">{prevPost.title}</p>
                                </div>
                            </Link>
                        )}
                        {nextPost && (
                            <Link to={`/blog/${nextPost.slug}`}
                                className="rounded-xl p-4 flex items-center justify-end gap-2 text-right transition-colors sm:col-start-2"
                                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Next</p>
                                    <p className="text-sm text-white/70 font-semibold truncate">{nextPost.title}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                            </Link>
                        )}
                    </div>
                </div>
            </article>

            <FooterSection />
        </div>
    );
}