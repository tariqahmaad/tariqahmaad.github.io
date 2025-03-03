/**
* Template Name: Personal
* Updated: Jan 09 2024 with Bootstrap v5.3.2
* Template URL: https://bootstrapmade.com/personal-free-resume-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
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
      window.scrollTo({
        top: element.offsetTop - headerOffset,
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
    // Skills animation
    let skillsContent = select('.skills-content');
    if (skillsContent) {
      new Waypoint({
        element: skillsContent,
        offset: '80%',
        handler: function (direction) {
          let progress = select('.progress .progress-bar', true);
          progress.forEach((el) => {
            el.style.width = el.getAttribute('aria-valuenow') + '%'
          });
        }
      })
    }

    // Portfolio isotope setup
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer) {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function (e) {
        e.preventDefault();
        portfolioFilters.forEach(function (el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
      }, true);
    }
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
        spaceBetween: 20
      },
      1200: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });

  // Portfolio lightbox
  const portfolioLightbox = GLightbox({
    selector: '.portfolio-lightbox'
  });

  // Portfolio details lightbox
  const portfolioDetailsLightbox = GLightbox({
    selector: '.portfolio-details-lightbox',
    width: '90%',
    height: '90vh'
  });

  // Portfolio details slider
  new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  // Initialize Pure Counter
  new PureCounter();

  // Optimized typing effect for role text
  const typeEffect = (() => {
    const roles = ["Computer Engineer", "Full-Stack Developer", "Backend Engineer", "Software Engineer", "DevOps Engineer", "Network Engineer", "UI/UX Designer"];
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
    // Initialize typing effect
    const roleSpan = document.getElementById('role');
    if (roleSpan) {
      roleSpan.classList.add('cursor', 'typing');
      typeEffect();
    }

    // Initialize particles.js
    if (typeof particlesJS !== 'undefined') {
      particlesJS.load('particles-js', 'assets/js/particles-config.js');
    }

    // Initialize skill cards animation
    animateOnScroll();

    // Toggle skill details view
    const toggleButton = document.getElementById('toggle-skills-view');
    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        const detailedSkills = document.getElementById('detailed-skills');
        detailedSkills.classList.toggle('show');
        detailedSkills.style.display = detailedSkills.style.display === 'none' ? 'block' : 'none';
        document.getElementById('toggle-text').textContent =
          detailedSkills.style.display === 'none' ? 'Show Skill Details' : 'Hide Skill Details';
      });
    }
  });

  // Check if element is in viewport
  function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // Animate elements on scroll
  function animateOnScroll() {
    const cards = document.querySelectorAll('.skill-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      if (isElementInViewport(card)) {
        card.classList.add('animate__animated', 'animate__fadeInUp');
      }
    });
  }

  window.addEventListener('scroll', animateOnScroll);
})();