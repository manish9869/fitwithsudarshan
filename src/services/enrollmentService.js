/**
 * src/services/enrollmentService.js
 *
 * Handles enrollment ID generation, enrollment object construction,
 * and Supabase persistence.
 *
 * Supabase table: enrollments
 * Required columns (create via Supabase dashboard):
 *
 *   id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
 *   enrollment_id       text UNIQUE NOT NULL
 *   customer_name       text
 *   customer_email      text
 *   customer_phone      text
 *   program_name        text
 *   plan_type           text          -- 'individual' | 'couple'
 *   coaching_type       text          -- 'online' | 'video' | 'personal'
 *   duration_months     text
 *   amount_paid         numeric
 *   original_amount     numeric       -- before coupon
 *   coupon_code         text
 *   coupon_savings      numeric
 *   razorpay_order_id   text
 *   razorpay_payment_id text
 *   payment_date        timestamptz
 *   payment_status      text
 *   -- Person 1 details
 *   age                 text
 *   city                text
 *   weight              text
 *   goals               text[]        -- array of goal strings
 *   medical_issue       text
 *   medical_note        text
 *   -- Partner details (couple plans)
 *   partner_name        text
 *   partner_age         text
 *   partner_weight      text
 *   partner_goals       text[]
 *   partner_medical_issue text
 *   partner_medical_note  text
 *   created_at          timestamptz DEFAULT now()
 */

import { createClient } from '@supabase/supabase-js';

// ─── Supabase client (lazy init so missing env doesn't crash) ─────────────────
let _supabase = null;

function getSupabase() {
    if (_supabase) return _supabase;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.warn('[enrollmentService] Supabase env vars missing — DB persistence disabled.');
        return null;
    }
    _supabase = createClient(url, key);
    return _supabase;
}

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
    originalAmount,
    couponCode,
    couponSavings,
    razorpayOrderId,
    razorpayPaymentId,
    // Person 1
    age,
    city,
    weight,
    goals,
    medicalIssue,
    medicalNote,
    // Partner (couple)
    partnerName,
    partnerAge,
    partnerWeight,
    partnerGoals,
    partnerMedicalIssue,
    partnerMedicalNote,
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
        originalAmount: originalAmount ?? amountPaid,
        couponCode: couponCode || null,
        couponSavings: couponSavings || 0,
        razorpayOrderId,
        razorpayPaymentId,
        paymentDate: new Date().toISOString(),
        paymentStatus: 'paid',
        createdAt: new Date().toISOString(),
        // Person 1
        age,
        city,
        weight,
        goals: goals || [],
        medicalIssue,
        medicalNote,
        // Partner
        partnerName,
        partnerAge,
        partnerWeight,
        partnerGoals: partnerGoals || [],
        partnerMedicalIssue,
        partnerMedicalNote,
    };
}

// ─── Persist to Supabase ──────────────────────────────────────────────────────
export async function saveEnrollmentToSupabase(enrollment) {
    const supabase = getSupabase();

    console.log('[enrollmentService] Saving enrollment to Supabase:', supabase, enrollment);
    if (!supabase) {
        console.warn('[enrollmentService] Skipping Supabase save — client not initialized.');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const row = {
            enrollment_id: enrollment.enrollmentId,
            customer_name: enrollment.customerName,
            customer_email: enrollment.customerEmail,
            customer_phone: enrollment.customerPhone,
            program_name: enrollment.programName,
            plan_type: enrollment.planType,
            coaching_type: enrollment.coachingType,
            duration_months: enrollment.durationMonths,
            amount_paid: enrollment.amountPaid,
            original_amount: enrollment.originalAmount,
            coupon_code: enrollment.couponCode,
            coupon_savings: enrollment.couponSavings,
            razorpay_order_id: enrollment.razorpayOrderId,
            razorpay_payment_id: enrollment.razorpayPaymentId,
            payment_date: enrollment.paymentDate,
            payment_status: enrollment.paymentStatus,
            // Person 1
            age: enrollment.age,
            city: enrollment.city,
            weight: enrollment.weight,
            goals: enrollment.goals,
            medical_issue: enrollment.medicalIssue,
            medical_note: enrollment.medicalNote,
            // Partner
            partner_name: enrollment.partnerName || null,
            partner_age: enrollment.partnerAge || null,
            partner_weight: enrollment.partnerWeight || null,
            partner_goals: enrollment.partnerGoals?.length ? enrollment.partnerGoals : null,
            partner_medical_issue: enrollment.partnerMedicalIssue || null,
            partner_medical_note: enrollment.partnerMedicalNote || null,
        };

        const { data, error } = await supabase
            .from('enrollments')
            .insert([row])
            .select()
            .single();

        if (error) {
            console.error('[enrollmentService] Supabase insert error:', error);
            return { success: false, error: error.message };
        }

        console.log('[enrollmentService] ✅ Enrollment saved to Supabase:', data?.enrollment_id);
        return { success: true, data };
    } catch (err) {
        console.error('[enrollmentService] Unexpected error:', err);
        return { success: false, error: err.message };
    }
}