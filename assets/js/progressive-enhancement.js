/**
 * Progressive Enhancement Utility
 * Adapts UI to user preferences (reduced motion, high contrast).
 *
 * Note: the old performance-metrics machinery (performanceUpdate listener,
 * deferNonCriticalFeatures re-injecting the ai-assistant script, particle
 * reduction events) was removed — none of its events were ever dispatched,
 * and the script re-injection could double-construct the assistant.
 */

class ProgressiveEnhancement {
    constructor() {
        this.enhancements = {
            animations: true,
            particles: true,
            blurEffects: true,
            shadows: true,
            complexTransitions: true,
            chatAnimations: true
        };

        this.checkUserPreferences();
    }

    /**
     * Check user preferences (reduced motion, high contrast)
     */
    checkUserPreferences() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.disableAnimations();
            this.simplifyTransitions();
        }

        // Check for high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.adjustForHighContrast();
        }
    }

    /**
     * Disable animations for better accessibility/performance
     */
    disableAnimations() {
        this.enhancements.animations = false;
        this.enhancements.chatAnimations = false;

        const style = document.createElement('style');
        style.id = 'disable-animations';
        style.textContent = `
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Simplify transitions for better performance
     */
    simplifyTransitions() {
        this.enhancements.complexTransitions = false;

        const style = document.createElement('style');
        style.id = 'simplify-transitions';
        style.textContent = `
            .chat-widget,
            .chat-fab,
            .message,
            .send-btn,
            .control-btn,
            .quick-action {
                transition: opacity 0.2s ease, transform 0.2s ease !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Adjust for high contrast mode
     */
    adjustForHighContrast() {
        const style = document.createElement('style');
        style.id = 'high-contrast';
        style.textContent = `
            .chat-widget {
                border: 2px solid #18d26e;
            }
            .message.assistant .message-content {
                border: 2px solid rgba(255, 255, 255, 0.5);
            }
            .control-btn,
            .send-btn {
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Get current enhancement state
     */
    getEnhancements() {
        return { ...this.enhancements };
    }

    /**
     * Check if feature is enabled
     */
    isEnabled(feature) {
        return this.enhancements[feature] === true;
    }

    /**
     * Enable a feature (useful for manual override)
     */
    enable(feature) {
        this.enhancements[feature] = true;

        // Remove corresponding style if exists
        const styleId = this.getStyleId(feature);
        if (styleId) {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        }
    }

    /**
     * Get style ID for a feature
     */
    getStyleId(feature) {
        const styleMap = {
            animations: 'disable-animations',
            blurEffects: 'disable-blur',
            shadows: 'reduce-shadows',
            complexTransitions: 'simplify-transitions'
        };
        return styleMap[feature];
    }
}

// Initialize progressive enhancement
const progressiveEnhancement = new ProgressiveEnhancement();
