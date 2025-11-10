/**
 * Performance Monitor Utility
 * Tracks performance metrics and adapts UI based on device capabilities
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: 0,
            memoryUsage: null,
            connectionSpeed: 'unknown',
            deviceType: this.detectDeviceType(),
            isLowEnd: false,
            frameDrops: 0,
            totalFrames: 0,
            startTime: performance.now()
        };

        this.thresholds = {
            lowFps: 24,
            highMemory: 50 * 1024 * 1024, // 50MB
            slowConnection: 1.5 * 1024 * 1024 // 1.5 Mbps
        };

        this.init();
    }

    init() {
        this.detectConnectionSpeed();
        this.detectMemory();
        this.detectLowEndDevice();
        this.startFPSMonitoring();
    }

    /**
     * Detect device type based on screen size and user agent
     */
    detectDeviceType() {
        const width = window.innerWidth;
        const userAgent = navigator.userAgent.toLowerCase();

        if (width < 480) {
            return 'phone';
        } else if (width < 1024) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    /**
     * Detect network connection speed
     */
    detectConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            const effectiveType = connection.effectiveType;
            const downlink = connection.downlink;

            // Map connection types to speeds
            if (effectiveType === '4g' && downlink > 10) {
                this.metrics.connectionSpeed = 'fast';
            } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 1.5)) {
                this.metrics.connectionSpeed = 'medium';
            } else {
                this.metrics.connectionSpeed = 'slow';
            }
        }
    }

    /**
     * Detect memory usage (Chrome only)
     */
    detectMemory() {
        if ('memory' in performance) {
            const memory = performance.memory;
            this.metrics.memoryUsage = memory.usedJSHeapSize;
        }
    }

    /**
     * Detect if device is low-end based on multiple factors
     */
    detectLowEndDevice() {
        const { memoryUsage, connectionSpeed } = this.metrics;
        const cores = navigator.hardwareConcurrency || 4;
        const isOldBrowser = !('requestAnimationFrame' in window);

        // Consider device low-end if:
        // - Less than 4 CPU cores
        // - High memory usage
        // - Slow connection
        // - Old browser

        this.metrics.isLowEnd = (
            cores < 4 ||
            (memoryUsage && memoryUsage > this.thresholds.highMemory) ||
            connectionSpeed === 'slow' ||
            isOldBrowser
        );
    }

    /**
     * Start FPS monitoring
     */
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        let lastFpsUpdate = lastTime;

        const measureFPS = (currentTime) => {
            frames++;
            this.metrics.totalFrames++;

            // Update FPS every second
            if (currentTime - lastFpsUpdate >= 1000) {
                this.metrics.fps = Math.round(frames * 1000 / (currentTime - lastFpsUpdate));
                lastFpsUpdate = currentTime;
                frames = 0;

                // Check for frame drops
                if (this.metrics.fps < this.thresholds.lowFps) {
                    this.metrics.frameDrops++;
                }

                // Emit performance event
                this.emitPerformanceEvent();
            }

            lastTime = currentTime;
            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);
    }

    /**
     * Emit performance event for other components to listen
     */
    emitPerformanceEvent() {
        const event = new CustomEvent('performanceUpdate', {
            detail: this.metrics
        });
        window.dispatchEvent(event);
    }

    /**
     * Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }

    /**
     * Check if performance is degraded
     */
    isPerformanceDegraded() {
        return (
            this.metrics.fps < this.thresholds.lowFps ||
            this.metrics.isLowEnd ||
            (this.metrics.memoryUsage && this.metrics.memoryUsage > this.thresholds.highMemory)
        );
    }

    /**
     * Get recommendations for optimizations
     */
    getRecommendations() {
        const recommendations = [];

        if (this.metrics.isLowEnd) {
            recommendations.push('low-end-device');
        }

        if (this.metrics.fps < this.thresholds.lowFps) {
            recommendations.push('low-fps');
        }

        if (this.metrics.connectionSpeed === 'slow') {
            recommendations.push('slow-connection');
        }

        if (this.metrics.memoryUsage && this.metrics.memoryUsage > this.thresholds.highMemory) {
            recommendations.push('high-memory');
        }

        return recommendations;
    }

    /**
     * Log metrics for debugging
     */
    logMetrics() {
        console.group('Performance Metrics');
        console.log('Device Type:', this.metrics.deviceType);
        console.log('FPS:', this.metrics.fps);
        console.log('Memory Usage:', this.formatBytes(this.metrics.memoryUsage));
        console.log('Connection Speed:', this.metrics.connectionSpeed);
        console.log('Is Low-End:', this.metrics.isLowEnd);
        console.log('Frame Drops:', this.metrics.frameDrops);
        console.log('Recommendations:', this.getRecommendations());
        console.groupEnd();
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (!bytes) return 'N/A';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Log metrics after 3 seconds
setTimeout(() => {
    performanceMonitor.logMetrics();
}, 3000);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
