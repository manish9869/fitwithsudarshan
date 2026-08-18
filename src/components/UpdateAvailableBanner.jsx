import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useBuildVersionCheck } from '@/hooks/useBuildVersionCheck';

// Never a forced/silent reload — someone mid-checkout on Enroll/Payment must
// never get yanked out from under themselves. Just a small, dismissible
// prompt; refreshing is entirely their call, whenever it's convenient.
export default function UpdateAvailableBanner() {
    const updateAvailable = useBuildVersionCheck();
    const [dismissed, setDismissed] = useState(false);

    return (
        <AnimatePresence>
            {updateAvailable && !dismissed && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[320px] shadow-2xl"
                    style={{ background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(231,23,99,0.3)', backdropFilter: 'blur(20px)' }}
                >
                    <p className="text-white text-xs font-semibold leading-relaxed flex-1">
                        A new version of this site is available.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white"
                        style={{ background: '#e71763' }}
                    >
                        <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-white/40 hover:text-white/80 flex-shrink-0"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
