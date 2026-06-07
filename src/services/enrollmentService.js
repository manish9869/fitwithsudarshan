

// ─── Enrollment ID Generator ──────────────────────────────────────────────────
// Format: FIT-YYYY-XXXXXX  (6-digit zero-padded random number)
export function generateEnrollmentId() {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000); // 6-digit
    return `FIT-${year}-${random}`;
}

// ─── Build Enrollment Object ──────────────────────────────────────────────────
export function buildEnrollment({
    customerName,
    customerEmail,
    customerPhone,
    programName,
    planType,
    durationMonths,
    coachingType,
    amountPaid,
    razorpayOrderId,
    razorpayPaymentId,
}) {
    return {
        enrollmentId: generateEnrollmentId(),
        customerName,
        customerEmail,
        customerPhone,
        programName,
        planType,
        durationMonths,
        coachingType,
        amountPaid,
        razorpayOrderId,
        razorpayPaymentId,
        paymentDate: new Date().toISOString(),
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
    };
}
