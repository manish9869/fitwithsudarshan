import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Camera, CheckCircle2, Loader2, AlertCircle, Upload, X, Flame, Lock, Home,
} from 'lucide-react';
import { wa } from '@/utils/whatsapp';
import { usePageMeta } from '@/hooks/usePageMeta';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// Same client-side compression used on the onboarding form — keeps upload
// sizes small over mobile connections.
async function compressImage(file, maxDim = 1200, quality = 0.78) {
    return new Promise((resolve) => {
        if (!file.type.startsWith('image/')) { resolve(file); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
                    'image/jpeg', quality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function PhotoSlot({ label, hint, alreadyUploaded, file, onChange }) {
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [compressing, setCompressing] = useState(false);

    const handleFile = useCallback(async (f) => {
        if (!f) return;
        setCompressing(true);
        try {
            const processed = await compressImage(f);
            onChange(processed);
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target.result);
            reader.readAsDataURL(processed);
        } finally {
            setCompressing(false);
        }
    }, [onChange]);

    const clear = () => {
        onChange(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-white/60 text-[11px] sm:text-xs font-semibold tracking-wide uppercase">{label}</span>
                {alreadyUploaded && !preview && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                        <CheckCircle2 className="w-3 h-3" /> Already uploaded
                    </span>
                )}
            </div>

            {preview ? (
                <div className="relative rounded-xl overflow-hidden group" style={{ border: '1px solid rgba(231,23,99,0.3)' }}>
                    <img src={preview} alt="Preview" className="w-full object-cover max-h-[220px]" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => inputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                            <Upload className="w-3 h-3" /> Change
                        </button>
                        <button type="button" onClick={clear}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                            style={{ background: 'rgba(239,68,68,0.45)', backdropFilter: 'blur(8px)' }}>
                            <X className="w-3 h-3" /> Remove
                        </button>
                    </div>
                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(52,211,153,0.9)', color: '#000' }}>
                        <CheckCircle2 className="w-3 h-3" /> Ready
                    </div>
                </div>
            ) : (
                <div onClick={() => !compressing && inputRef.current?.click()}
                    className="rounded-xl transition-all cursor-pointer"
                    style={{ border: '2px dashed rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.02)', padding: '20px 12px' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(231,23,99,0.4)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
                    <div className="flex flex-col items-center text-center gap-2">
                        {compressing ? (
                            <>
                                <Loader2 className="w-7 h-7 text-white/30 animate-spin" />
                                <p className="text-xs text-white/40">Processing…</p>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ background: 'rgba(231,23,99,0.08)', border: '1px solid rgba(231,23,99,0.15)' }}>
                                    <Camera className="w-5 h-5" style={{ color: '#e71763' }} />
                                </div>
                                <p className="text-sm font-semibold text-white/70">Click to {alreadyUploaded ? 'replace' : 'upload'}</p>
                                {hint && <p className="text-[11px] text-white/35">{hint}</p>}
                            </>
                        )}
                    </div>
                </div>
            )}

            <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFile(e.target.files?.[0])} />
        </div>
    );
}

export default function UploadPhotos() {
    const { token } = useParams();
    const navigate = useNavigate();

    usePageMeta({
        title: 'Upload Your Photos',
        description: 'Add your assessment photos to your RECODE™ submission.',
        path: '/upload-photos',
        noindex: true,
    });

    const [loading, setLoading] = useState(true);
    const [invalid, setInvalid] = useState(false);
    const [status, setStatus] = useState(null);
    const [photoFront, setPhotoFront] = useState(null);
    const [photoSide, setPhotoSide] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/api/upload-assessment-photos/${token}`);
                if (!res.ok) { setInvalid(true); return; }
                setStatus(await res.json());
            } catch (_) {
                setInvalid(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    const handleSubmit = async () => {
        if (!photoFront && !photoSide) {
            setError('Choose at least one photo to upload.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const fd = new FormData();
            if (photoFront) fd.append('photoFront', photoFront, photoFront.name);
            if (photoSide) fd.append('photoSide', photoSide, photoSide.name);

            const res = await fetch(`${API_BASE}/api/upload-assessment-photos/${token}`, { method: 'POST', body: fd });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Upload failed. Please try again.');
            }
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
            </div>
        );
    }

    if (invalid) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.25)' }}>
                        <AlertCircle className="w-8 h-8" style={{ color: '#f87171' }} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-3">Link Not Found</h1>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                        This upload link isn't valid. If you think this is a mistake, message Sudarshan on WhatsApp and he'll help you out.
                    </p>
                    <a href={wa.assessmentCompleted} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white"
                        style={{ background: '#25D366' }}>
                        Message Sudarshan on WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                        style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.3)' }}>
                        <CheckCircle2 className="w-8 h-8" style={{ color: '#34d399' }} />
                    </motion.div>
                    <h1 className="text-2xl font-black text-white mb-3">Photos Added!</h1>
                    <p className="text-white/50 text-sm leading-relaxed mb-6">
                        Sudarshan has been notified and will factor these into your RECODE&#8482; plan.
                    </p>
                    <div className="flex flex-col gap-3">
                        <a href={wa.assessmentCompleted} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white"
                            style={{ background: '#25D366' }}>
                            Message Sudarshan on WhatsApp
                        </a>
                        <button onClick={() => navigate('/')}
                            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm text-white/70"
                            style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                            <Home className="w-4 h-4" /> Go to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-white">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] max-w-[600px] h-[220px] rounded-full blur-[80px]"
                    style={{ background: 'rgba(231,23,99,0.06)' }} />
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 py-10 max-w-md">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <img src="https://vducmiggraxtqdgt.public.blob.vercel-storage.com/logo.png"
                        alt="FitWithSudarshan" className="h-10 mx-auto mb-4 rounded-xl" />
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Flame className="w-4 h-4" style={{ color: '#e71763' }} />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#e71763' }}>RECODE&#8482; Assessment</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-white mb-1">
                        {status?.firstName ? `Hi ${status.firstName}, add your photos` : 'Add Your Photos'}
                    </h1>
                    <p className="text-white/35 text-xs sm:text-sm">They help Sudarshan fine-tune your plan around your actual starting point.</p>
                </motion.div>

                <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="p-4 sm:p-5 space-y-5">
                        <div className="flex items-start gap-3 p-3.5 rounded-xl"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-white/30" />
                            <p className="text-[11px] text-white/35 leading-relaxed">
                                <strong className="text-white/55">100% Private.</strong> Used only for your personal assessment.
                            </p>
                        </div>

                        <PhotoSlot label="Front Photo" hint="Full body, front-facing, good lighting."
                            alreadyUploaded={status?.photoFrontUploaded} file={photoFront} onChange={setPhotoFront} />

                        <PhotoSlot label="Side Photo" hint="Full body, side-facing, good lighting."
                            alreadyUploaded={status?.photoSideUploaded} file={photoSide} onChange={setPhotoSide} />
                    </div>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm mb-4"
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit} disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                    style={{ background: '#e71763', boxShadow: '0 0 25px rgba(231,23,99,0.4)' }}>
                    {submitting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                        : <><CheckCircle2 className="w-4 h-4" /> Upload Photos</>
                    }
                </motion.button>
            </div>
        </div>
    );
}
