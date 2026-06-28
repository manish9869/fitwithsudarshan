

export const COUPONS = {
    // Old client coupon — Mumbai PT only, fixed price override
    RECODE2026: {
        code: 'RECODE2026',
        label: 'Old Client Discount',
        description: 'Special rate for returning RECODE™ clients',
        type: 'FIXED_PRICE',
        applicableTo: ['personal'], // coachingType IDs
        fixedPrices: {
            individual: {
                "1": 15000,
                "3": 50000,
                "6": 100000,
                "12": 195000,
            },
            couple: {
                "1": 30000,
                "3": 65000,
                "6": 115000,
                "12": 215000,
            },
        },
        active: true,
    },

    // Example general discount coupon (10% off anything)
    WELCOME10: {
        code: 'WELCOME10',
        label: '10% Welcome Discount',
        description: '10% off any RECODE™ plan',
        type: 'PERCENT',
        applicableTo: ['online', 'video', 'personal'],
        percent: 10,
        active: true,
    },
};

/**
 * Validate a coupon code and return result.
 * @param {string} code
 * @param {string} coachingId  - 'online' | 'video' | 'personal'
 * @param {string} planType    - 'individual' | 'couple'
 * @param {string} durationMonths - '1' | '3' | '6' | '12'
 * @param {number} originalPrice  - price in ₹ before discount
 * @returns {{ valid: boolean, error?: string, discountedPrice?: number, savings?: number, coupon?: object }}
 */
export function validateCoupon(code, coachingId, planType, durationMonths, originalPrice) {
    if (!code || !code.trim()) {
        return { valid: false, error: 'Please enter a coupon code.' };
    }

    const coupon = COUPONS[code.trim().toUpperCase()];

    if (!coupon) {
        return { valid: false, error: 'Invalid coupon code. Please check and try again.' };
    }

    if (!coupon.active) {
        return { valid: false, error: 'This coupon has expired.' };
    }

    if (!coupon.applicableTo.includes(coachingId)) {
        const planNames = { online: 'Online Coaching', video: 'Video Coaching', personal: 'Mumbai Personal Training' };
        const applicable = coupon.applicableTo.map(id => planNames[id] || id).join(', ');
        return {
            valid: false,
            error: `This coupon is only valid for: ${applicable}.`,
        };
    }

    let discountedPrice = originalPrice;

    if (coupon.type === 'FIXED_PRICE') {
        const planPrices = coupon.fixedPrices?.[planType];
        if (!planPrices) {
            return { valid: false, error: 'Coupon not applicable to this plan type.' };
        }
        discountedPrice = planPrices[durationMonths] ?? originalPrice;
    } else if (coupon.type === 'PERCENT') {
        discountedPrice = Math.round(originalPrice * (1 - coupon.percent / 100));
    } else if (coupon.type === 'FLAT') {
        discountedPrice = Math.max(0, originalPrice - coupon.flat);
    }

    const savings = originalPrice - discountedPrice;

    return {
        valid: true,
        discountedPrice,
        savings,
        coupon,
    };
}

/**
 * Format currency in INR
 */
export function formatPrice(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}