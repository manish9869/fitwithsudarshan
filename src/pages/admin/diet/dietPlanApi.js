// src/pages/admin/diet/dietPlanApi.js
// Same req()-wrapper + Bearer-token pattern as ../content/cmsApi.js, pointed
// at the dedicated diet-plan endpoints (not the generic CMS ones — plans
// have their own service/controller since they're not a flat content list).
const API_BASE = import.meta.env.VITE_API_URL ?? '';

import { getToken } from '../adminApi';

async function req(path, opts = {}) {
    const token = getToken();

    const res = await fetch(`${API_BASE}/api/admin${path}`, {
        method: opts.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || 'Request failed');
    }

    return data;
}

export const listDietPlans = () =>
    req('/diet-plans').then((d) => d.plans);

export const getDietPlan = (id) =>
    req(`/diet-plans/${id}`).then((d) => d.plan);

export const createDietPlan = (payload) =>
    req('/diet-plans', { method: 'POST', body: payload }).then((d) => d.plan);

export const updateDietPlan = (id, payload) =>
    req(`/diet-plans/${id}`, { method: 'PATCH', body: payload }).then((d) => d.plan);

export const deleteDietPlan = (id) =>
    req(`/diet-plans/${id}`, { method: 'DELETE' });

// Reuses the existing enrollment search endpoint — an enrollment record
// already has name/age/weight/goals/coaching-type, so "autofill from
// enrollment" in the wizard doesn't need a new backend endpoint.
export const searchEnrollments = (query) =>
    req(`/enrollments/search?query=${encodeURIComponent(query)}`).then((d) => d.rows);
