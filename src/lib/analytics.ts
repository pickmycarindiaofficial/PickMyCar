/**
 * PickMyCar — Unified Ad Tracking Module
 * ========================================
 * Professional-grade Meta Pixel + Google Ads integration.
 *
 * HOW IT WORKS:
 * 1. Base scripts are loaded in index.html (async, non-blocking)
 * 2. This module provides a clean API to fire standard + custom events
 * 3. Every event gets a unique event_id for server-side deduplication
 * 4. If pixel IDs are missing or ad-blockers are active → zero errors
 *
 * USAGE:
 *   import { analytics } from '@/lib/analytics';
 *   analytics.pageView('/cars/123');
 *   analytics.viewContent({ id: '123', name: 'Hyundai i20', category: 'Hatchback', value: 450000 });
 *   analytics.lead({ id: '123', type: 'enquiry' });
 */

// ─── Type Declarations ──────────────────────────────────────────

declare global {
    interface Window {
        fbq: (...args: any[]) => void;
        _fbq: any;
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

// ─── Config ──────────────────────────────────────────────────────

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || '';
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || '';
const GOOGLE_ADS_LABELS = {
    lead: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL_LEAD || '',
    testDrive: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL_TEST_DRIVE || '',
    loan: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_LABEL_LOAN || '',
};

// ─── Helpers ─────────────────────────────────────────────────────

/** Generate a UUID v4 for event deduplication */
function generateEventId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/** SHA-256 hash for enhanced matching (email/phone) */
async function sha256(value: string): Promise<string> {
    try {
        const msgBuffer = new TextEncoder().encode(value.trim().toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return '';
    }
}

/** Safe wrapper — if fbq/gtag aren't loaded (ad-blocker), calls are silently ignored */
function safeFbq(...args: any[]): void {
    try {
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq(...args);
        }
    } catch {
        // Ad-blocker or script not loaded — silently ignore
    }
}

function safeGtag(...args: any[]): void {
    try {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag(...args);
        }
    } catch {
        // Ad-blocker or script not loaded — silently ignore
    }
}

/** Check if tracking is available (has pixel IDs and scripts loaded) */
function isMetaAvailable(): boolean {
    return !!META_PIXEL_ID && typeof window !== 'undefined' && typeof window.fbq === 'function';
}

function isGoogleAvailable(): boolean {
    return !!GOOGLE_ADS_ID && typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// ─── Core Analytics API ──────────────────────────────────────────

export const analytics = {
    /**
     * Initialize tracking pixels. Called once at app boot.
     * The base scripts are in index.html; this just verifies they're ready.
     */
    init(): void {
        if (META_PIXEL_ID) {
            console.log('[Analytics] Meta Pixel ready:', META_PIXEL_ID);
        }
        if (GOOGLE_ADS_ID) {
            console.log('[Analytics] Google Ads ready:', GOOGLE_ADS_ID);
        }
        if (!META_PIXEL_ID && !GOOGLE_ADS_ID) {
            console.log('[Analytics] No pixel IDs configured — tracking disabled');
        }
    },

    /**
     * Track a page view — call on every SPA route change.
     * Cars24/Spinny fire this on every navigation to build audiences.
     */
    pageView(url?: string): void {
        const pageUrl = url || window.location.pathname + window.location.search;

        // Meta Pixel: PageView
        if (isMetaAvailable()) {
            safeFbq('track', 'PageView', {}, { eventID: generateEventId() });
        }

        // Google Ads: page_view
        if (isGoogleAvailable()) {
            safeGtag('event', 'page_view', {
                page_path: pageUrl,
                page_title: document.title,
                send_to: GOOGLE_ADS_ID,
            });
        }
    },

    /**
     * Track car detail view — fires when user opens a car listing.
     * This is the most important event for retargeting.
     */
    viewContent(params: {
        id: string;
        name: string;
        category?: string;
        value?: number;
        currency?: string;
        brand?: string;
        model?: string;
        year?: number;
    }): void {
        const eventId = generateEventId();

        // Meta: ViewContent (standard event)
        if (isMetaAvailable()) {
            safeFbq('track', 'ViewContent', {
                content_ids: [params.id],
                content_name: params.name,
                content_category: params.category || 'Used Car',
                content_type: 'vehicle',
                value: params.value || 0,
                currency: params.currency || 'INR',
                // Custom data for car-specific retargeting
                brand: params.brand,
                model: params.model,
                year: params.year,
            }, { eventID: eventId });
        }

        // Google: view_item
        if (isGoogleAvailable()) {
            safeGtag('event', 'view_item', {
                items: [{
                    item_id: params.id,
                    item_name: params.name,
                    item_category: params.category || 'Used Car',
                    item_brand: params.brand,
                    price: params.value || 0,
                }],
                currency: params.currency || 'INR',
                value: params.value || 0,
                send_to: GOOGLE_ADS_ID,
            });
        }
    },

    /**
     * Track a lead — enquiry submitted, contact click, etc.
     * This is the primary conversion event for Meta & Google campaigns.
     */
    lead(params: {
        id?: string;
        type: 'enquiry' | 'contact_click' | 'whatsapp' | 'call';
        value?: number;
        carName?: string;
    }): void {
        const eventId = generateEventId();

        // Meta: Lead (standard event)
        if (isMetaAvailable()) {
            safeFbq('track', 'Lead', {
                content_ids: params.id ? [params.id] : [],
                content_name: params.carName || '',
                content_category: 'Used Car Lead',
                lead_type: params.type,
                value: params.value || 0,
                currency: 'INR',
            }, { eventID: eventId });
        }

        // Google: conversion (Lead)
        if (isGoogleAvailable() && GOOGLE_ADS_LABELS.lead) {
            safeGtag('event', 'conversion', {
                send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.lead}`,
                value: params.value || 0,
                currency: 'INR',
                transaction_id: eventId,
            });
        }
    },

    /**
     * Track test drive booking — high-intent signal.
     */
    scheduleTestDrive(params: {
        id?: string;
        carName?: string;
        dealerId?: string;
    }): void {
        const eventId = generateEventId();

        // Meta: Schedule (standard event)
        if (isMetaAvailable()) {
            safeFbq('track', 'Schedule', {
                content_ids: params.id ? [params.id] : [],
                content_name: params.carName || '',
                content_category: 'Test Drive',
            }, { eventID: eventId });
        }

        // Google: conversion (Test Drive)
        if (isGoogleAvailable() && GOOGLE_ADS_LABELS.testDrive) {
            safeGtag('event', 'conversion', {
                send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.testDrive}`,
                transaction_id: eventId,
            });
        }
    },

    /**
     * Track loan application — InitiateCheckout equivalent.
     */
    initiateCheckout(params: {
        id?: string;
        carName?: string;
        value?: number;
    }): void {
        const eventId = generateEventId();

        // Meta: InitiateCheckout
        if (isMetaAvailable()) {
            safeFbq('track', 'InitiateCheckout', {
                content_ids: params.id ? [params.id] : [],
                content_name: params.carName || '',
                content_category: 'Loan Application',
                value: params.value || 0,
                currency: 'INR',
                num_items: 1,
            }, { eventID: eventId });
        }

        // Google: conversion (Loan)
        if (isGoogleAvailable() && GOOGLE_ADS_LABELS.loan) {
            safeGtag('event', 'conversion', {
                send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_LABELS.loan}`,
                value: params.value || 0,
                currency: 'INR',
                transaction_id: eventId,
            });
        }
    },

    /**
     * Track search action — helps Meta/Google understand demand.
     */
    search(params: {
        query?: string;
        filters?: Record<string, any>;
        resultsCount?: number;
    }): void {
        const eventId = generateEventId();

        // Meta: Search
        if (isMetaAvailable()) {
            safeFbq('track', 'Search', {
                search_string: params.query || '',
                content_category: 'Used Cars',
                ...params.filters,
            }, { eventID: eventId });
        }

        // Google: search
        if (isGoogleAvailable()) {
            safeGtag('event', 'search', {
                search_term: params.query || '',
                send_to: GOOGLE_ADS_ID,
            });
        }
    },

    /**
     * Track wishlist / save car action.
     */
    addToWishlist(params: {
        id: string;
        name: string;
        value?: number;
        category?: string;
    }): void {
        const eventId = generateEventId();

        // Meta: AddToWishlist
        if (isMetaAvailable()) {
            safeFbq('track', 'AddToWishlist', {
                content_ids: [params.id],
                content_name: params.name,
                content_category: params.category || 'Used Car',
                value: params.value || 0,
                currency: 'INR',
            }, { eventID: eventId });
        }

        // Google: add_to_wishlist
        if (isGoogleAvailable()) {
            safeGtag('event', 'add_to_wishlist', {
                items: [{
                    item_id: params.id,
                    item_name: params.name,
                    item_category: params.category || 'Used Car',
                    price: params.value || 0,
                }],
                currency: 'INR',
                value: params.value || 0,
                send_to: GOOGLE_ADS_ID,
            });
        }
    },

    /**
     * Enhanced matching — send hashed user data for better attribution.
     * Call this after user logs in or provides contact info.
     * Cars24/Spinny do this to match 30% more conversions (especially iOS).
     */
    async setUserData(params: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        city?: string;
    }): Promise<void> {
        if (!isMetaAvailable()) return;

        const advancedMatching: Record<string, string> = {};

        if (params.email) {
            advancedMatching.em = await sha256(params.email);
        }
        if (params.phone) {
            // Remove +91 prefix and spaces for consistent hashing
            const cleanPhone = params.phone.replace(/[\s+\-()]/g, '').replace(/^91/, '');
            advancedMatching.ph = await sha256(cleanPhone);
        }
        if (params.firstName) {
            advancedMatching.fn = await sha256(params.firstName);
        }
        if (params.lastName) {
            advancedMatching.ln = await sha256(params.lastName);
        }
        if (params.city) {
            advancedMatching.ct = await sha256(params.city);
        }

        if (Object.keys(advancedMatching).length > 0) {
            safeFbq('init', META_PIXEL_ID, advancedMatching);
        }
    },

    /**
     * Fire a custom event (for anything not covered by standard events).
     */
    custom(eventName: string, params?: Record<string, any>): void {
        const eventId = generateEventId();

        if (isMetaAvailable()) {
            safeFbq('trackCustom', eventName, params || {}, { eventID: eventId });
        }

        if (isGoogleAvailable()) {
            safeGtag('event', eventName, {
                ...params,
                send_to: GOOGLE_ADS_ID,
            });
        }
    },
};

export default analytics;
