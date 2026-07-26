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

// NOTE: coupon redemption happens server-side (inside confirm-payment / the
// Razorpay webhook) right after a real payment is verified — there's no
// client-triggered redeem call anymore. A redeemCouponRemote() helper used
// to live here calling a public POST /api/coupons/redeem, but nothing ever
// called it and the backend route let anyone burn down a coupon's usage
// limit without paying, so both were removed.