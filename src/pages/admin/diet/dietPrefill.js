// src/pages/admin/diet/dietPrefill.js
// Shared by EnrollmentDietPlanCard.jsx (drawer) and AdminEnrollments.jsx
// (row action) — both need the exact same enrollment → diet-plan-wizard
// prefill mapping, so it lives in one place instead of two.
import { fmtName } from '../adminUtils';

// Enrollment `goals` is free-text (e.g. "Lose Weight", "Build Muscle"), the
// diet plan's `goal` is a fixed set — best-effort match so the wizard opens
// with a sensible default instead of always defaulting to Fat Loss.
export function guessGoal(goals) {
    const text = (Array.isArray(goals) ? goals.join(' ') : String(goals || '')).toLowerCase();
    if (/muscle|gain|bulk|strength/.test(text)) return 'Muscle Gain';
    if (/maintain|maintenance/.test(text)) return 'Weight Maintenance';
    if (/fitness|general|health/.test(text)) return 'General Fitness';
    if (/loss|lean|fat|weight/.test(text)) return 'Fat Loss';
    return undefined;
}

export function buildDietPrefillFromEnrollment(enrollment) {
    return {
        enrollmentId: enrollment.id,
        prefill: {
            name: fmtName(enrollment.customer_name) || '',
            age: enrollment.age || undefined,
            weight: enrollment.weight || undefined,
            goal: guessGoal(enrollment.goals),
            allergies: enrollment.medical_issue === 'yes' ? (enrollment.medical_note || 'Has a medical condition — confirm details with client') : '',
            notes: Array.isArray(enrollment.goals) && enrollment.goals.length ? `Client goals from enrollment: ${enrollment.goals.join(', ')}` : '',
        },
    };
}
