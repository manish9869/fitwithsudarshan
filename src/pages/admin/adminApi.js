/**
 * src/pages/admin/adminApi.js
 *
 * All admin panel network calls go through here. Talks ONLY to our backend
 * (/api/admin/*) — never to Supabase directly from the browser. The backend
 * holds the service-role key and enforces auth; the frontend just carries
 * a JWT.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'recode_admin_token';
const ADMIN_KEY = 'recode_admin_profile';

// ── Token storage ─────────────────────────────────────────────────────────────
export function getToken() {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setSession(token, admin) {
    try {
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    } catch { /* storage unavailable — session won't persist across refresh */ }
}

export function clearSession() {
    try {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(ADMIN_KEY);
    } catch { /* noop */ }
}

export function getStoredAdmin() {
    try {
        const raw = sessionStorage.getItem(ADMIN_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function isLoggedIn() {
    return !!getToken();
}

// ── Core request helper ───────────────────────────────────────────────────────
class AdminApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function request(path, { method = 'GET', body, params } = {}) {
    let url = `${API_BASE}/api/admin${path}`;
    if (params) {
        const qs = new URLSearchParams(
            Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        ).toString();
        if (qs) url += `?${qs}`;
    }

    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
        clearSession();
        throw new AdminApiError('Session expired. Please log in again.', 401);
    }

    let data;
    try { data = await res.json(); } catch { data = {}; }

    if (!res.ok) {
        throw new AdminApiError(data.error || `Request failed (${res.status})`, res.status);
    }

    return data;
}

// ── Auth ───────────────────────────────────────────────────────────────────────
export async function login(username, password) {
    const data = await request('/login', { method: 'POST', body: { username, password } });
    setSession(data.token, data.admin);
    return data.admin;
}

export async function fetchMe() {
    const data = await request('/me');
    return data.admin;
}

export async function changePassword(currentPassword, newPassword) {
    return request('/change-password', { method: 'POST', body: { currentPassword, newPassword } });
}

export function logout() {
    clearSession();
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export async function fetchDashboard(rangeDays = 90) {
    return request('/dashboard', { params: { range: rangeDays } });
}

// ── Enrollments ────────────────────────────────────────────────────────────────
export async function fetchEnrollments(filters) {
    return request('/enrollments', { params: filters });
}

export async function fetchEnrollment(id) {
    const data = await request(`/enrollments/${id}`);
    return data.enrollment;
}

export async function setEnrollmentStatus(id, status) {
    const data = await request(`/enrollments/${id}/status`, { method: 'PATCH', body: { status } });
    return data.enrollment;
}

export async function exportEnrollmentsAll(filters) {
    const data = await request('/enrollments/export', { params: filters });
    return data.rows;
}

// ── Assessments ────────────────────────────────────────────────────────────────
export async function fetchAssessments(filters) {
    return request('/assessments', { params: filters });
}

export async function fetchAssessment(id) {
    const data = await request(`/assessments/${id}`);
    return data.assessment;
}

export async function setAssessmentStatus(id, status) {
    const data = await request(`/assessments/${id}/status`, { method: 'PATCH', body: { status } });
    return data.assessment;
}

// ── FIX: was missing — assessments export endpoint ───────────────────────────
export async function exportAssessmentsAll(filters) {
    const data = await request('/assessments/export', { params: filters });
    return data.rows;
}

// ── Notes (server-side, shared across admins) ───────────────────────────────────
export async function saveNote(recordType, recordId, note) {
    const data = await request('/notes', { method: 'PUT', body: { recordType, recordId, note } });
    return data.note;
}

export async function fetchCoupons() {
    const data = await request('/coupons');
    return data.coupons;
}
export async function createCouponAdmin(payload) {
    const data = await request('/coupons', { method: 'POST', body: payload });
    return data.coupon;
}
export async function updateCouponAdmin(id, payload) {
    const data = await request(`/coupons/${id}`, { method: 'PATCH', body: payload });
    return data.coupon;
}
export async function deleteCouponAdmin(id) {
    return request(`/coupons/${id}`, { method: 'DELETE' });
}

// ── Manual enrollment + on-demand email ─────────────────────────────────────
export async function createManualEnrollment(payload) {
    const data = await request('/enrollments/manual', { method: 'POST', body: payload });
    return data.enrollment;
}

// `template` should be one of: enrollment_customer | welcome | payment_reminder
// | payment_failed | enrollment_coach (see EmailSendMenu.jsx / backend
// ENROLLMENT_EMAIL_TEMPLATES for the canonical list).
export async function sendEnrollmentEmail(id, template = 'enrollment_customer') {
    return request(`/enrollments/${id}/send-email`, { method: 'POST', body: { template } });
}

// ── Follow-ups ────────────────────────────────────────────────────────────────
export async function fetchFollowUps(filters) {
    return request('/follow-ups', { params: filters });
}

export async function fetchFollowUpsDueCount() {
    const data = await request('/follow-ups/count');
    return data.count;
}

export async function markFollowUp(id, payload) {
    const data = await request(`/enrollments/${id}/followup`, { method: 'POST', body: payload });
    return data.enrollment;
}
export async function updateManualEnrollment(id, payload) {
    const data = await request(`/enrollments/manual/${id}`, { method: 'PATCH', body: payload });
    return data.enrollment;
}
export { AdminApiError };