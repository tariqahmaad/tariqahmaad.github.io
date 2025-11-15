(function () {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)

    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    const element = select(el);
    if (element) {
      const headerOffset = select('#header').offsetHeight;
      // Add 20px buffer to account for section top positioning
      const additionalBuffer = 60;
      window.scrollTo({
        top: element.offsetTop - headerOffset - additionalBuffer,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function (e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')

    // Prevent body scrolling when menu is open
    if (select('#navbar').classList.contains('navbar-mobile')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  })

  /**
   * Close mobile menu when clicking outside
   */
  document.addEventListener('click', function (e) {
    const navbar = select('#navbar');
    const toggle = select('.mobile-nav-toggle');

    if (!navbar || !toggle) return;

    // Check if menu is open
    if (navbar.classList.contains('navbar-mobile')) {
      const clickedInsideNavbar = navbar.contains(e.target);
      const clickedToggle = toggle.contains(e.target);
      const clickedNavLink = e.target.closest('.nav-link');
      const clickedSocialLink = e.target.closest('.mobile-social-links a');

      // Close if: outside navbar AND not on toggle
      // OR clicked on social links (even though they're in navbar)
      if ((!clickedInsideNavbar && !clickedToggle) || clickedSocialLink) {
        // Close the menu
        navbar.classList.remove('navbar-mobile');
        toggle.classList.remove('bi-x');
        toggle.classList.add('bi-list');
        document.body.style.overflow = '';
      }
    }
  })

  /**
   * Scroll with offset on links with a class name .scrollto
   */
  on('click', '#navbar .nav-link', function (e) {
    let section = select(this.hash)
    if (section) {
      e.preventDefault()

      let navbar = select('#navbar')
      let header = select('#header')
      let sections = select('section', true)
      let navlinks = select('#navbar .nav-link', true)

      navlinks.forEach((item) => {
        item.classList.remove('active')
      })

      this.classList.add('active')

      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
        document.body.style.overflow = ''; // Re-enable scrolling
      }

      if (this.hash == '#header') {
        header.classList.remove('header-top')
        sections.forEach((item) => {
          item.classList.remove('section-show')
        })
        return;
      }

      if (!header.classList.contains('header-top')) {
        header.classList.add('header-top')
        setTimeout(function () {
          sections.forEach((item) => {
            item.classList.remove('section-show')
          })
          section.classList.add('section-show')
        }, 350);
      } else {
        sections.forEach((item) => {
          item.classList.remove('section-show')
        })
        section.classList.add('section-show')
      }

      scrollto(this.hash)
    }
  }, true)

  /**
   * Activate/show sections on load with hash links
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      let initial_nav = select(window.location.hash)

      if (initial_nav) {
        let header = select('#header')
        let navlinks = select('#navbar .nav-link', true)

        header.classList.add('header-top')

        navlinks.forEach((item) => {
          if (item.getAttribute('href') == window.location.hash) {
            item.classList.add('active')
          } else {
            item.classList.remove('active')
          }
        })

        setTimeout(function () {
          initial_nav.classList.add('section-show')
        }, 350);

        scrollto(window.location.hash)
      }
    }
  });

  // Initialize common components on page load
  window.addEventListener('load', () => {
    // Components initialized on load
  });

  /**
   * Initialize components
   */
  // Testimonials slider
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 15
      },
      576: {
        slidesPerView: 1,
        spaceBetween: 15
      },
      768: {
        slidesPerView: 2,
        spaceBetween: 20
      },
      992: {
        slidesPerView: 2,
        spaceBetween: 25
      },
      1200: {
        slidesPerView: 3,
        spaceBetween: 30
      },
      1400: {
        slidesPerView: 3,
        spaceBetween: 35
      }
    }
  });

  // Initialize Pure Counter
  new PureCounter();

  // Optimized typing effect for role text
  const roles = ["Cybersecurity Analyst", "Security Consultant", "Penetration Tester", "Security Engineer", "Incident Response Specialist", "Ethical Hacker", "Computer Engineer"];
  const typeEffect = (() => {
    let currentRole = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimeout;
    let glitchInterval;
    let matrixChars = [];

    // Extended character set for matrix effect with special symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>{}[]|/\\:;.,~`░▒▓█▄▀■□▪▫▬▲►▼◄◊○●◘◙♠♣♥♦';
    const glitchChars = '!@#$%^&*<>{}[]|/\\:;░▒▓█▄▀■□▪▫';

    // Color variations for advanced matrix effect
    const colors = ['#00ff41', '#0f0', '#11ff00', '#22dd33', '#33cc33'];

    // Get random character for matrix effect
    const getRandomChar = (intensity = 1) => {
      // Just return the character itself - no HTML wrapping
      if (Math.random() > 0.92) return '█';
      if (Math.random() > 0.96) return '░';

      const visibleChars = Math.max(1, Math.floor(chars.length * (intensity * 0.8 + 0.2)));
      return chars[Math.floor(Math.random() * visibleChars)];
    };

    // Format a character with styling
    const formatChar = (char, isStable = false) => {
      if (char === ' ') return '<span style="opacity: 0.2"> </span>';

      // Stable characters are white
      if (isStable) return `<span style="color: white">${char}</span>`;

      // Random characters have matrix styling
      const color = colors[Math.floor(Math.random() * colors.length)];
      const opacity = 0.5 + (Math.random() * 0.5);
      return `<span class="matrix-char" style="color: ${color}; opacity: ${opacity}">${char}</span>`;
    };

    // Create glitch effect
    const glitchEffect = (element, text, duration = 500) => {
      // Clear any existing interval first
      if (glitchInterval) clearInterval(glitchInterval);

      // Add the glitch class temporarily
      element.classList.add('glitch');

      const originalText = text;
      let glitchText = text;
      let glitchCount = 0;
      const maxGlitches = 5;

      glitchInterval = setInterval(() => {
        if (glitchCount >= maxGlitches) {
          clearInterval(glitchInterval);
          element.classList.remove('glitch');

          // Restore original text with white color
          element.innerHTML = originalText.split('').map(char =>
            `<span style="color: white">${char}</span>`
          ).join('');
          return;
        }

        // Create glitch text by replacing random characters
        glitchText = originalText.split('').map(char => {
          if (Math.random() > 0.7) {
            const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
            return `<span style="color: #ff3300; text-shadow: 2px 0 #00ffff;">${glitchChar}</span>`;
          }
          return `<span style="color: white">${char}</span>`;
        }).join('');

        element.innerHTML = glitchText;
        glitchCount++;
      }, duration / maxGlitches);
    };

    // Initialize matrix character tracking
    const initMatrixChars = (length) => {
      matrixChars = [];
      for (let i = 0; i < length; i++) {
        matrixChars.push({
          char: getRandomChar(1),  // Just the character, no HTML
          stability: Math.random() * 0.5,  // Start with lower stability
          finalChar: '',  // Will be set later
          isFlickering: Math.random() > 0.8  // Some characters flicker
        });
      }
    };

    // Update matrix characters gradually
    const updateMatrixChars = (finalText) => {
      // Initialize if not already done
      if (matrixChars.length < finalText.length) {
        initMatrixChars(finalText.length);
      }

      for (let i = 0; i < finalText.length; i++) {
        // Set the target final character
        matrixChars[i].finalChar = finalText[i];

        // Increase stability of characters that match their final state
        if (matrixChars[i].char === matrixChars[i].finalChar) {
          matrixChars[i].stability += 0.2;
        } else {
          // Randomize characters with probability based on stability
          if (Math.random() > matrixChars[i].stability) {
            matrixChars[i].char = getRandomChar(matrixChars[i].stability + 0.3);
          } else {
            matrixChars[i].char = matrixChars[i].finalChar;
          }

          // Gradually increase stability
          matrixChars[i].stability = Math.min(1, matrixChars[i].stability + 0.1);
        }

        // Sometimes characters flicker
        matrixChars[i].isFlickering = Math.random() > 0.9;
      }
    };

    return function () {
      const roleSpan = document.getElementById('role');
      if (!roleSpan) return;

      const fullText = roles[currentRole];
      const baseSpeed = isDeleting ? 40 : 90;
      const timer = baseSpeed + Math.floor(Math.random() * 15);

      if (isDeleting) {
        charIndex--;
        roleSpan.classList.remove('completed');
        roleSpan.classList.add('typing');
      } else {
        charIndex++;
        if (charIndex === fullText.length) {
          roleSpan.classList.remove('typing');
          roleSpan.classList.add('completed');
          // Create glitch effect when text is complete
          glitchEffect(roleSpan, fullText);
        } else {
          roleSpan.classList.remove('completed');
          roleSpan.classList.add('typing');
        }
      }

      // Make sure matrix characters are initialized
      if (matrixChars.length === 0) {
        initMatrixChars(fullText.length);
      }

      // Update matrix characters
      updateMatrixChars(fullText);

      // Build matrix-like HTML
      let matrixHTML = "";

      // Add visible characters as stable
      for (let i = 0; i < charIndex; i++) {
        matrixHTML += formatChar(fullText[i], true);
      }

      // Add matrix effect for remaining characters
      if (charIndex < fullText.length) {
        const bufferSize = Math.min(8, fullText.length - charIndex);

        for (let i = 0; i < bufferSize; i++) {
          const position = charIndex + i;
          if (position < fullText.length && position < matrixChars.length) {
            const intensity = (bufferSize - i) / bufferSize;

            if (Math.random() > (0.3 + intensity * 0.6)) {
              // Use the character from our tracking array
              const flickerClass = matrixChars[position].isFlickering ? ' flicker' : '';
              matrixHTML += formatChar(matrixChars[position].char);
            } else {
              matrixHTML += '<span style="opacity: 0.2"> </span>';
            }
          }
        }
      }

      // Update text with HTML
      roleSpan.innerHTML = matrixHTML;

      // Set next state
      if (!isDeleting && charIndex === fullText.length) {
        isDeleting = true;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(typeEffect, 2000);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        currentRole = (currentRole + 1) % roles.length;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(typeEffect, 300);

        // Reset matrix characters for new role
        initMatrixChars(roles[currentRole].length);
      } else {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(typeEffect, timer);
      }
    };
  })();

  // Initialize components when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    // NOTE: Particles.js is initialized by particles-config.js
    // No need to load it here as particles-config.js handles initialization

    // Defer typing effect to improve LCP
    const roleSpan = document.getElementById('role');
    if (roleSpan) {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        // Show one role at a time with cycling
        let currentIndex = 0;
        roleSpan.textContent = roles[currentIndex];
        roleSpan.setAttribute('aria-live', 'polite');
        
        setInterval(() => {
          currentIndex = (currentIndex + 1) % roles.length;
          roleSpan.textContent = roles[currentIndex];
        }, 3000);
      } else {
        // Animated version
        roleSpan.textContent = roles[0];
        roleSpan.classList.add('completed');
        
        setTimeout(() => {
          roleSpan.classList.add('cursor', 'typing');
          roleSpan.textContent = "";
          typeEffect();
        }, 1500);
      }
    }
  });

  // Scroll animation
  function handleScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1
    });

    elements.forEach(element => {
      observer.observe(element);
    });
  }

  // Initialize scroll animations
  document.addEventListener('DOMContentLoaded', () => {
    handleScrollAnimations();
  });
})();
