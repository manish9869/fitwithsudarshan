const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function validateCouponRemote(code, coachingId, planType, durationMonths, originalPrice) {
    try {
        const res = await fetch(`${API_BASE}/api/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, coachingType: coachingId, planType, durationMonths, originalPrice }),
        });
        return await res.json();
    } catch {
        return { valid: false, error: 'Could not reach server. Please try again.' };
    }
}

export async function redeemCouponRemote(code) {
    if (!code) return;
    try {
        await fetch(`${API_BASE}/api/coupons/redeem`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
        });
    } catch { /* non-blocking */ }
}