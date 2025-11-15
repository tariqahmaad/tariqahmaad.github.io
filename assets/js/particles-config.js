/**
 * Adaptive particle configuration based on device capabilities
 * Optimized for performance across different devices
 */

// Wait for DOM and particlesJS to be available
document.addEventListener('DOMContentLoaded', function() {
  // Check if particlesJS is available
  if (typeof particlesJS === 'undefined') {
    console.warn('particlesJS not loaded yet, retrying...');
    setTimeout(initParticles, 100);
    return;
  }

  initParticles();
});

function initParticles() {
  try {
    // Device detection
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;
    const isIPad = /iPad|iPadOS/.test(navigator.userAgent);

    // iPad needs fewer particles for better performance
    const particleCount = isMobile ? 30 : (isTablet ? 25 : 85);

    // Configure particles based on device type
    const particleConfig = {
      particles: {
        number: {
          value: particleCount,
          density: { enable: true, value_area: 800 }
        },
        color: { value: "#18d26e" },
        shape: {
          type: "circle",
          stroke: { width: 0, color: "#000000" }
        },
        opacity: {
          value: 0.5,
          random: false,
          anim: { enable: false, speed: 1 }
        },
        size: {
          value: 3,
          random: true,
          anim: { enable: false }
        },
        line_linked: {
          enable: true,
          distance: isMobile ? 120 : 150,
          color: "#18d26e",
          opacity: 0.4,
          width: 1
        },
        move: {
          enable: true,
          speed: isMobile ? 2 : (isTablet ? 2.5 : 3),
          direction: "none",
          random: false,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: { enable: false, rotateX: 600, rotateY: 1200 }
        }
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: !isMobile, // Disable hover effects on mobile for better performance
            mode: "repulse"
          },
          onclick: {
            enable: true,
            mode: "push"
          },
          resize: true
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4
          },
          grab: {
            distance: 180,
            line_linked: { opacity: 0.8 }
          },
          push: {
            particles_nb: 0,
            quantity: isMobile ? 2 : 4
          },
          remove: { particles_nb: 2 },
          bubble: {
            distance: 200,
            size: 6,
            duration: 2,
            opacity: 8,
            speed: 3
          }
        }
      },
      retina_detect: true,
      fps_limit: isMobile ? 20 : (isTablet ? 25 : 30)
    };

    // Initialize particles if element exists and particlesJS is available
    const particlesElement = document.getElementById('particles-js');
    if (particlesElement && typeof particlesJS !== 'undefined') {
      particlesJS("particles-js", particleConfig);
    } else {
      console.warn('Particles element or particlesJS not available');
    }
  } catch (error) {
    console.error('Error initializing particles:', error);
  }
}
