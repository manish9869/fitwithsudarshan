// src/pages/admin/cmsApi.js

const API_BASE = import.meta.env.VITE_API_URL ?? '';

import { getToken } from './adminApi';

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

// ── Generic CMS table CRUD ────────────────────────────────────────────────
export const listCmsRows = (table) =>
    req(`/content/${table}`).then((d) => d.rows);

export const createCmsRow = (table, payload) =>
    req(`/content/${table}`, {
        method: 'POST',
        body: payload,
    }).then((d) => d.row);

export const updateCmsRow = (table, id, payload) =>
    req(`/content/${table}/${id}`, {
        method: 'PATCH',
        body: payload,
    }).then((d) => d.row);

export const deleteCmsRow = (table, id) =>
    req(`/content/${table}/${id}`, {
        method: 'DELETE',
    });

// ── Legal pages ───────────────────────────────────────────────────────────
// Dedicated upsert endpoint because legal_pages uses `slug` as its key.
export const putLegalPage = (slug, payload) =>
    req(`/content/legal-pages/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        body: payload,
    }).then((d) => d.row);

// ── site_content singleton keys ───────────────────────────────────────────
export const getSiteContentKey = (key) =>
    req(`/content/site/${key}`).then((d) => d.value);

export const putSiteContentKey = (key, value) =>
    req(`/content/site/${key}`, {
        method: 'PUT',
        body: { value },
    }).then((d) => d.value);

// ── Basic consultation ────────────────────────────────────────────────────
export const getBasicConsultationAdmin = () =>
    req('/content/basic-consultation').then((d) => d.basicConsultation);

export const putBasicConsultationAdmin = (payload) =>
    req('/content/basic-consultation', {
        method: 'PUT',
        body: payload,
    }).then((d) => d.basicConsultation);

// ── Pricing ───────────────────────────────────────────────────────────────
export const getPricingAdmin = () =>
    req('/content/pricing').then((d) => d.pricingTable);

export const putPricingAdmin = (rows) =>
    req('/content/pricing', {
        method: 'PUT',
        body: { rows },
    }).then((d) => d.pricingTable);