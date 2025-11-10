/**
 * Progressive Enhancement Utility
 * Adapts UI and features based on device capabilities
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

        this.init();
    }

    init() {
        // Listen for performance updates
        window.addEventListener('performanceUpdate', (event) => {
            this.adaptToPerformance(event.detail);
        });

        // Check for user preferences
        this.checkUserPreferences();
    }

    /**
     * Adapt features based on performance metrics
     */
    adaptToPerformance(metrics) {
        const recommendations = metrics.recommendations || [];

        // Disable features based on performance
        if (recommendations.includes('low-end-device') || recommendations.includes('low-fps')) {
            this.disableAnimations();
            this.reduceParticles();
            this.disableBlurEffects();
            this.reduceShadows();
            this.simplifyTransitions();
        }

        if (recommendations.includes('slow-connection')) {
            this.deferNonCriticalFeatures();
        }

        if (recommendations.includes('high-memory')) {
            this.optimizeMemoryUsage();
        }
    }

    /**
     * Check user preferences (reduced motion, etc.)
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
     * Disable animations for better performance
     */
    disableAnimations() {
        this.enhancements.animations = false;
        this.enhancements.chatAnimations = false;

        // Add CSS to disable animations
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
     * Reduce particle count for better performance
     */
    reduceParticles() {
        this.enhancements.particles = false;

        // Dispatch event for particles config to listen
        window.dispatchEvent(new CustomEvent('reduceParticles'));
    }

    /**
     * Disable blur effects for better performance
     */
    disableBlurEffects() {
        this.enhancements.blurEffects = false;

        const style = document.createElement('style');
        style.id = 'disable-blur';
        style.textContent = `
            .chat-widget,
            .message-content,
            .input-container,
            .quick-actions {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Reduce shadow effects for better performance
     */
    reduceShadows() {
        this.enhancements.shadows = false;

        const style = document.createElement('style');
        style.id = 'reduce-shadows';
        style.textContent = `
            .chat-widget,
            .chat-fab,
            .message-content,
            .send-btn,
            .control-btn {
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
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
     * Defer non-critical features on slow connections
     */
    deferNonCriticalFeatures() {
        // Defer particles initialization
        setTimeout(() => {
            if (typeof particlesJS !== 'undefined') {
                window.dispatchEvent(new CustomEvent('initParticles'));
            }
        }, 2000);

        // Defer AI assistant initialization
        const assistantScript = document.querySelector('script[src*="ai-assistant"]');
        if (assistantScript && assistantScript.getAttribute('data-defer') !== 'true') {
            assistantScript.setAttribute('data-defer', 'true');
            // Re-initialize with defer attribute
            const newScript = document.createElement('script');
            newScript.src = assistantScript.src;
            newScript.defer = true;
            assistantScript.parentNode.replaceChild(newScript, assistantScript);
        }
    }

    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        // Clear chat history periodically
        if (window.aiAssistant) {
            setInterval(() => {
                if (window.aiAssistant.messageHistory.length > 50) {
                    window.aiAssistant.messageHistory = window.aiAssistant.messageHistory.slice(-50);
                }
            }, 30000);
        }

        // Reduce image quality
        const style = document.createElement('style');
        style.id = 'optimize-memory';
        style.textContent = `
            img {
                image-rendering: optimizeSpeed;
                image-rendering: -webkit-optimize-contrast;
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveEnhancement;
}
