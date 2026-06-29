/**
 * src/pages/admin/AdminGuard.jsx
 *
 * Wraps protected admin routes. Unlike the old version, this doesn't just
 * check "is there a token in storage" — it asks the backend to verify the
 * token is still valid (GET /api/admin/me), so an expired/forged token
 * gets bounced immediately instead of silently rendering protected UI
 * until the first failed data call.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { isLoggedIn, fetchMe, clearSession } from './adminApi';

export default function AdminGuard({ children }) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function verify() {
            if (!isLoggedIn()) {
                navigate('/admin', { replace: true });
                return;
            }
            try {
                await fetchMe();
                if (!cancelled) {
                    setOk(true);
                    setChecking(false);
                }
            } catch {
                clearSession();
                if (!cancelled) navigate('/admin', { replace: true });
            }
        }

        verify();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (checking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
        );
    }

    if (!ok) return null;
    return children;
}