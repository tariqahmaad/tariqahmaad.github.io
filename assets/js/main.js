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
   * Selector lookup that tolerates invalid selectors (e.g. location.hash "#1")
   */
  const safeSelect = (selector) => {
    try {
      return selector ? select(selector) : null
    } catch {
      return null
    }
  }

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  const scrollBehavior = () => (reducedMotionQuery.matches ? 'auto' : 'smooth')

  /** Fade-out duration of a section; header collapse/expand waits for it. */
  const SECTION_FADE_MS = 200
  /** Extra space between the collapsed header and the section top. */
  const SCROLL_BUFFER_PX = 60

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    const element = safeSelect(el);
    if (element) {
      const headerOffset = select('#header').offsetHeight;
      window.scrollTo({
        top: element.offsetTop - headerOffset - SCROLL_BUFFER_PX,
        behavior: scrollBehavior()
      });
    }
  }

  /**
   * Single owner of the "which section is visible" state. Hidden sections are
   * made `inert` so they stay out of the tab order and accessibility tree.
   */
  let pendingSectionTimer = null

  const showSection = (target, { focus = false } = {}) => {
    select('section', true).forEach((section) => {
      const visible = section === target
      section.classList.toggle('section-show', visible)
      section.inert = !visible
      section.setAttribute('aria-hidden', String(!visible))
      if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1')
    })
    if (target && focus) target.focus({ preventScroll: true })
  }

  const setActiveNav = (hash) => {
    select('#navbar .nav-link', true).forEach((link) => {
      const isActive = link.getAttribute('href') === hash
      link.classList.toggle('active', isActive)
      if (isActive) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
  }

  /**
   * Open a section: collapse the header into its compact "top" form first (if
   * needed), then fade the section in. Cancels any pending transition so rapid
   * clicks can't leave an older section on top.
   */
  const openSection = (target, options) => {
    clearTimeout(pendingSectionTimer)
    const header = select('#header')
    if (!header.classList.contains('header-top')) {
      header.classList.add('header-top')
      pendingSectionTimer = setTimeout(() => showSection(target, options), SECTION_FADE_MS)
    } else {
      showSection(target, options)
    }
  }

  /**
   * Navigate back to the home/header view.
   * Hides all sections, expands the header, and scrolls to top.
   */
  const navigateHome = () => {
    clearTimeout(pendingSectionTimer)
    showSection(null)

    // Wait for section fade out animation to complete
    pendingSectionTimer = setTimeout(() => {
      select('#header').classList.remove('header-top')
    }, SECTION_FADE_MS);

    window.scrollTo({
      top: 0,
      behavior: scrollBehavior()
    });
  }

  /**
   * Keep the address bar in sync with the visible section so the Back button,
   * bookmarks and shared links work. An empty hash means the home view.
   */
  const updateUrl = (hash) => {
    if (hash === window.location.hash) return
    try {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search)
    } catch {
      // History API unavailable (sandboxed frame): navigation still works without it.
    }
  }

  /** Show whatever the current URL points at (used for Back/Forward). */
  const syncFromLocation = () => {
    const hash = window.location.hash
    const target = safeSelect(hash)
    if (target && target.tagName === 'SECTION') {
      setActiveNav(hash)
      openSection(target)
      scrollto(hash)
    } else {
      setActiveNav('#header')
      navigateHome()
    }
  }

  window.addEventListener('popstate', syncFromLocation)

  // Hidden sections must not be reachable before the first navigation either.
  showSection(null)
  /**
   * Mobile nav toggle
   */
  const setMobileNav = (open) => {
    const navbar = select('#navbar');
    const toggle = select('.mobile-nav-toggle');
    if (!navbar || !toggle) return;

    navbar.classList.toggle('navbar-mobile', open);
    toggle.classList.toggle('bi-list', !open);
    toggle.classList.toggle('bi-x', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };

  on('click', '.mobile-nav-toggle', function () {
    setMobileNav(!select('#navbar').classList.contains('navbar-mobile'));
  })

  /**
   * Close mobile menu with Escape key and restore focus to the toggle
   */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const navbar = select('#navbar');
    if (navbar && navbar.classList.contains('navbar-mobile')) {
      setMobileNav(false);
      const toggle = select('.mobile-nav-toggle');
      if (toggle) toggle.focus();
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
      const clickedSocialLink = e.target.closest('.mobile-social-links a');

      // Close if: outside navbar AND not on toggle
      // OR clicked on social links (even though they're in navbar)
      if ((!clickedInsideNavbar && !clickedToggle) || clickedSocialLink) {
        setMobileNav(false);
      }
    }
  })

  /**
   * Scroll with offset on links with a class name .scrollto
   */
  on('click', '#navbar .nav-link', function (e) {
    const section = safeSelect(this.hash)
    if (!section) return
    e.preventDefault()

    setActiveNav(this.hash)

    if (select('#navbar').classList.contains('navbar-mobile')) {
      setMobileNav(false); // Also re-enables scrolling
    }

    if (this.hash === '#header') {
      updateUrl('')
      navigateHome();
      return;
    }

    updateUrl(this.hash)
    openSection(section, { focus: true })
    scrollto(this.hash)
  }, true)

  /**
   * Handle clicks on "Tariq Ahmad" name and logo to return home smoothly
   */
  on('click', '#header h1 a, #header a.mr-auto', function (e) {
    // Only if we are currently looking at a section (header is in top mode)
    if (select('#header').classList.contains('header-top')) {
      e.preventDefault();

      setActiveNav('#header');
      updateUrl('')
      navigateHome();
    }
  }, true)

  /**
   * Activate/show sections on load with hash links
   */
  window.addEventListener('load', () => {
    const hash = window.location.hash
    const initial = safeSelect(hash)
    if (!initial || initial.tagName !== 'SECTION') return

    setActiveNav(hash)
    openSection(initial)
    scrollto(hash)
  });

  /**
   * References carousel: a native scroll-snap track (see testimonials CSS) plus
   * dots and a gentle autoplay. No library; the browser does the scrolling.
   */
  const initCarousel = (root) => {
    const track = root.querySelector('.testimonials-track')
    const dotsEl = root.querySelector('.testimonials-dots')
    const slides = track ? [...track.children] : []
    if (slides.length < 2 || !dotsEl) return

    const AUTOPLAY_MS = 5000
    const PAUSE_AFTER_INTERACTION_MS = 10000
    let dots = []
    let pausedUntil = 0
    let hovering = false
    let onScreen = false

    // Distance between the start of two neighbouring slides (includes the gap).
    const step = () => slides[1].offsetLeft - slides[0].offsetLeft
    const perView = () => (slides[0].offsetWidth ? Math.max(1, Math.round(track.clientWidth / slides[0].offsetWidth)) : 1)
    const positions = () => Math.max(1, slides.length - perView() + 1)
    const current = () => (step() ? Math.min(positions() - 1, Math.round(track.scrollLeft / step())) : 0)

    const goTo = (index, behavior = scrollBehavior()) => {
      track.scrollTo({ left: index * step(), behavior })
    }

    const markActive = () => {
      const active = current()
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)))
    }

    const buildDots = () => {
      const count = positions()
      if (count === dots.length) return
      dotsEl.replaceChildren(...Array.from({ length: count }, (_, i) => {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className = 'testimonials-dot'
        dot.setAttribute('aria-label', `Go to reference ${i + 1}`)
        dot.addEventListener('click', () => {
          pausedUntil = Date.now() + PAUSE_AFTER_INTERACTION_MS
          goTo(i)
        })
        return dot
      }))
      dots = [...dotsEl.children]
      markActive()
    }

    let scrollFrame = 0
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = requestAnimationFrame(markActive)
    }, { passive: true })

    // Any manual interaction pauses autoplay for a while.
    const userPause = () => { pausedUntil = Date.now() + PAUSE_AFTER_INTERACTION_MS }
    track.addEventListener('pointerdown', userPause)
    track.addEventListener('keydown', userPause)
    root.addEventListener('pointerenter', () => { hovering = true })
    root.addEventListener('pointerleave', () => { hovering = false })

    if ('ResizeObserver' in window) new ResizeObserver(buildDots).observe(track)
    buildDots()

    // Autoplay runs only while the carousel is on screen (the section is hidden
    // until visited) and never for users who asked for reduced motion.
    if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) return
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting }, { threshold: 0.3 }).observe(root)
    setInterval(() => {
      if (!onScreen || hovering || document.hidden || Date.now() < pausedUntil) return
      if (root.contains(document.activeElement)) return
      goTo((current() + 1) % positions())
    }, AUTOPLAY_MS)
  }

  const referencesSlider = select('.testimonials-slider')
  if (referencesSlider) initCarousel(referencesSlider)

  // Initialize Pure Counter (disabled on mobile and iPad)
  const isMobileOrTablet = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 1024;
  };

  if (!isMobileOrTablet() && typeof PureCounter !== 'undefined') {
    new PureCounter();
  } else {
    // Set static values for mobile and iPad
    const counters = document.querySelectorAll('.purecounter');
    counters.forEach(counter => {
      const endValue = parseInt(counter.getAttribute('data-purecounter-end'));
      counter.textContent = endValue;
    });
  }

  // Optimized typing effect for role text
  const roles = ["Full-Stack Developer", "Software Engineer", "Computer Engineer", "Python Developer", "React Developer"];
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
      const roll = Math.random();
      if (roll > 0.96) return '░';
      if (roll > 0.92) return '█';

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

      // Don't burn CPU rewriting the DOM in a background tab; poll until visible.
      if (document.hidden) {
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(typeEffect, 500);
        return;
      }

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

        const roleInterval = setInterval(() => {
          if (document.hidden) return;
          currentIndex = (currentIndex + 1) % roles.length;
          roleSpan.textContent = roles[currentIndex];
        }, 3000);

        // Cleanup interval if element is removed
        const observer = new MutationObserver(() => {
          if (!document.getElementById('role')) {
            clearInterval(roleInterval);
            observer.disconnect();
          }
        });
        observer.observe(roleSpan.parentNode, { childList: true });
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

    // Scroll animations
    const elements = document.querySelectorAll('.animate-on-scroll');
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    elements.forEach(element => {
      scrollObserver.observe(element);
    });
  });
})();
