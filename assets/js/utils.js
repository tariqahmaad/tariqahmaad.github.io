/**
 * Shared Utilities for Portfolio Site
 * Provides consistent helper functions across all JavaScript files
 */

// ==========================================================================
// DEVICE DETECTION
// ==========================================================================

/**
 * Check if device is mobile (width < 768px)
 * @returns {boolean}
 */
const isMobile = () => window.innerWidth < 768;

/**
 * Check if device is tablet (768px - 1024px)
 * @returns {boolean}
 */
const isTablet = () => window.innerWidth >= 768 && window.innerWidth < 1024;

/**
 * Check if device is mobile or tablet (width < 1024px or mobile user agent)
 * @returns {boolean}
 */
const isMobileOrTablet = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 1024;
};

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// ==========================================================================
// DOM HELPERS
// ==========================================================================

/**
 * Easy selector helper function
 * @param {string} el - CSS selector
 * @param {boolean} all - If true, returns all matching elements
 * @returns {Element|Element[]|null}
 */
const select = (el, all = false) => {
    el = el.trim();
    if (all) {
        return [...document.querySelectorAll(el)];
    } else {
        return document.querySelector(el);
    }
};

/**
 * Easy event listener function
 * @param {string} type - Event type
 * @param {string} el - CSS selector
 * @param {Function} listener - Event handler
 * @param {boolean} all - If true, attaches to all matching elements
 */
const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all);

    if (selectEl) {
        if (all) {
            selectEl.forEach(e => e.addEventListener(type, listener));
        } else {
            selectEl.addEventListener(type, listener);
        }
    }
};

/**
 * Scrolls to an element with header offset
 * @param {string} el - CSS selector for target element
 */
const scrollTo = (el) => {
    const target = select(el);
    if (target) {
        const headerOffset = select('#header').offsetHeight;
        const additionalOffset = 60;
        window.scrollTo({
            top: target.offsetTop - headerOffset - additionalOffset,
            behavior: 'smooth'
        });
    }
};

// ==========================================================================
// NON-MODULE EXPORTS (for non-module scripts)
// ==========================================================================

// Make utilities available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.PortfolioUtils = {
        isMobile,
        isTablet,
        isMobileOrTablet,
        prefersReducedMotion,
        select,
        on,
        scrollTo
    };
}
