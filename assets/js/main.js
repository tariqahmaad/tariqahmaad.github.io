import { activeSectionId, nextHashForScroll } from './nav-hash.js'

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

  /**
   * One scrolling page. Sections are always in the flow (so the page works
   * without JS, indexes well and deep links just work); JS adds smooth scroll,
   * scroll-spy, a header that firms up on scroll and the mobile menu.
   */
  const header = select('#site-header')
  const siteNav = select('#site-nav')
  const navToggle = select('.site-nav-toggle')
  const mainEl = select('#main-content')
  const siteFooter = select('.site-footer')
  const headerHeight = () => (header ? header.offsetHeight : 0)

  // Lenis smooth scroll (self-hosted). Skipped for reduced motion and when the
  // vendor script failed to load; native scrolling then takes over.
  let lenis = null
  if (typeof Lenis !== 'undefined' && !reducedMotionQuery.matches) {
    lenis = new Lenis({ lerp: 0.1 })
    const scrollDetail = { scroll: 0 }
    lenis.on('scroll', ({ scroll }) => {
      scrollDetail.scroll = scroll
      window.dispatchEvent(new CustomEvent('ui:scroll', { detail: scrollDetail }))
    })
    const raf = (time) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }

  const scrollToSection = (target, { instant = false } = {}) => {
    if (!target) return
    const top = target.id === 'home'
      ? 0
      : Math.max(0, target.getBoundingClientRect().top + window.scrollY - headerHeight())
    if (lenis) lenis.scrollTo(top, { immediate: instant, force: instant })
    else window.scrollTo({ top, behavior: instant ? 'auto' : scrollBehavior() })
  }

  const setActiveNav = (hash) => {
    select('#site-nav .nav-link', true).forEach((link) => {
      const isActive = link.getAttribute('href') === hash
      link.classList.toggle('active', isActive)
      if (isActive) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
  }

  /**
   * Keep the address bar in sync so the Back button, bookmarks and shared
   * links work. An empty hash means the top of the page.
   */
  const updateUrl = (hash) => {
    if (hash === window.location.hash) return
    try {
      window.history.pushState(null, '', hash || window.location.pathname + window.location.search)
    } catch {
      // History API unavailable (sandboxed frame): navigation still works without it.
    }
  }

  const replaceUrl = (hash) => {
    if (hash === window.location.hash) return
    try {
      window.history.replaceState(null, '', hash || window.location.pathname + window.location.search)
    } catch {
      // History API unavailable (sandboxed frame): navigation still works without it.
    }
  }

  const pageSections = select('main > section', true)
  pageSections.forEach((section) => {
    if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1')
  })

  const resolveHashTarget = (hash) => {
    if (!pageSections.length) return null
    if (!hash || hash === '#home') {
      const home = select('#home')
      return home ? { target: home, sectionId: 'home' } : null
    }
    const el = safeSelect(hash)
    if (!el) return null
    const section = pageSections.includes(el) ? el : el.closest('main > section')
    if (!section) return null
    return { target: el, sectionId: section.id }
  }

  const revealFilteredTarget = (target) => {
    const hiddenCol = target && target.closest && target.closest('[data-category].is-filtered-out')
    if (!hiddenCol) return
    const allBtn = select('.project-filter[data-filter="all"]')
    if (allBtn) allBtn.click()
  }

  let lockSpyUntil = 0
  let userScrolled = false
  let deepLinkPending = Boolean(pageSections.length && window.location.hash && window.location.hash !== '#home')
  let lastLenisSpyTime = 0
  let spyFrame = 0

  const markUserScroll = () => {
    userScrolled = true
    lockSpyUntil = 0
  }
  window.addEventListener('wheel', markUserScroll, { passive: true })
  window.addEventListener('touchstart', markUserScroll, { passive: true })
  window.addEventListener('pointerdown', markUserScroll, { passive: true })
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
      markUserScroll()
    }
  })

  // Deterministic scroll-spy: syncs active nav item and keeps URL hash accurate.
  const syncScrollSpy = () => {
    if (!pageSections.length || deepLinkPending || performance.now() < lockSpyUntil) return
    const activeId = activeSectionId({
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      scrollHeight: document.documentElement.scrollHeight,
      headerHeight: headerHeight(),
      sections: pageSections.map((s) => ({ id: s.id, top: s.getBoundingClientRect().top }))
    })
    if (!activeId) return
    setActiveNav('#' + activeId)
    const currentResolved = window.location.hash ? resolveHashTarget(window.location.hash) : null
    replaceUrl(nextHashForScroll({
      activeId,
      currentHash: window.location.hash,
      currentTargetSectionId: currentResolved ? currentResolved.sectionId : null
    }))
  }

  if (pageSections.length) {
    window.addEventListener('ui:scroll', () => {
      lastLenisSpyTime = performance.now()
      syncScrollSpy()
    })
    window.addEventListener('scroll', () => {
      if (performance.now() - lastLenisSpyTime < 40) return
      if (spyFrame) return
      spyFrame = requestAnimationFrame(() => {
        spyFrame = 0
        syncScrollSpy()
      })
    }, { passive: true })
  }

  const alignToHash = ({ instant = true } = {}) => {
    const resolved = resolveHashTarget(window.location.hash)
    if (!resolved) return false
    revealFilteredTarget(resolved.target)
    setActiveNav('#' + resolved.sectionId)
    scrollToSection(resolved.target, { instant })
    syncHeader()
    return true
  }

  // Header gets a solid, blurred background once the page has scrolled.
  const syncHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8)
  }
  window.addEventListener('scroll', syncHeader, { passive: true })
  syncHeader()

  /**
   * Mobile menu: a full-screen overlay. While open the page behind it is
   * inert (not tabbable) and scrolling is locked.
   */
  const setMobileNav = (open) => {
    if (!siteNav || !navToggle) return
    siteNav.classList.toggle('is-open', open)
    const icon = navToggle.querySelector('i')
    if (icon) {
      icon.classList.toggle('bi-list', !open)
      icon.classList.toggle('bi-x', open)
    }
    navToggle.setAttribute('aria-expanded', String(open))
    navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu')
    // `nav-open` locks page scroll and hides the assistant button (see shell.css).
    document.documentElement.classList.toggle('nav-open', open)
    if (mainEl) mainEl.inert = open
    if (siteFooter) siteFooter.inert = open
    if (lenis) {
      if (open) lenis.stop()
      else lenis.start()
    }
  }

  const isMobileNavOpen = () => !!siteNav && siteNav.classList.contains('is-open')

  if (navToggle) navToggle.addEventListener('click', () => setMobileNav(!isMobileNavOpen()))

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !isMobileNavOpen()) return
    setMobileNav(false)
    if (navToggle) navToggle.focus()
  })

  // Leaving the mobile layout must never leave the page locked.
  window.matchMedia('(min-width: 992px)').addEventListener('change', (e) => {
    if (e.matches && isMobileNavOpen()) setMobileNav(false)
  })

  /**
   * In-page links (#about, #projects...): smooth-scroll, update the URL and move
   * focus to the section so keyboard and screen-reader users land there too.
   */
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]')
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const resolved = resolveHashTarget(link.hash)
    if (!resolved) return

    e.preventDefault()
    if (isMobileNavOpen()) setMobileNav(false)
    deepLinkPending = false
    lockSpyUntil = performance.now() + 950
    revealFilteredTarget(resolved.target)
    updateUrl(resolved.target.id === 'home' ? '' : link.hash)
    setActiveNav('#' + resolved.sectionId)
    scrollToSection(resolved.target)
    if (!resolved.target.hasAttribute('tabindex')) resolved.target.setAttribute('tabindex', '-1')
    resolved.target.focus({ preventScroll: true })
  })

  // Opening the command menu from the mobile overlay closes the overlay first.
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-palette]') && isMobileNavOpen()) setMobileNav(false)
  })

  // The command palette asks the page to scroll to any element by id.
  document.addEventListener('nav:goto', (e) => {
    const id = e.detail && e.detail.id
    const resolved = id ? resolveHashTarget('#' + id) : null
    if (!resolved) return
    deepLinkPending = false
    lockSpyUntil = performance.now() + 950
    revealFilteredTarget(resolved.target)
    updateUrl(resolved.target.id === 'home' ? '' : '#' + resolved.target.id)
    setActiveNav('#' + resolved.sectionId)
    scrollToSection(resolved.target)
    if (!resolved.target.hasAttribute('tabindex')) resolved.target.setAttribute('tabindex', '-1')
    resolved.target.focus({ preventScroll: true })
  })

  // Modals ask for the smooth-scroll engine to pause while they are open.
  document.addEventListener('ui:scroll-lock', (e) => {
    if (!lenis) return
    if (e.detail && e.detail.locked) lenis.stop()
    else if (!isMobileNavOpen()) lenis.start()
  })

  // Back/Forward and manual address-bar hash edits restore the exact target.
  const handleHistoryHash = () => {
    if (!pageSections.length) return
    const resolved = resolveHashTarget(window.location.hash) || resolveHashTarget('#home')
    if (!resolved) return
    deepLinkPending = false
    lockSpyUntil = performance.now() + 250
    revealFilteredTarget(resolved.target)
    setActiveNav('#' + resolved.sectionId)
    scrollToSection(resolved.target, { instant: true })
    syncHeader()
  }
  window.addEventListener('popstate', handleHistoryHash)
  window.addEventListener('hashchange', handleHistoryHash)

  /**
   * References carousel: a native scroll-snap track (see testimonials CSS) plus
   * dots and a gentle autoplay. No library; the browser does the scrolling.
   *
   * The track loops. A set of cloned slides sits at each end, so stepping past
   * the last slide lands on a copy of the first one (and the other way round);
   * a silent jump of exactly one set — a whole number of slide pitches, so the
   * picture before and after is identical — puts the track back in range. That
   * is why the autoplay never rewinds across the whole list.
   */
  const initCarousel = (root) => {
    const track = root.querySelector('.testimonials-track')
    const dotsEl = root.querySelector('.testimonials-dots')
    if (!track || !dotsEl) return
    const slides = [...track.children]
    const count = slides.length
    if (count < 2) return

    const AUTOPLAY_MS = 5000
    const PAUSE_AFTER_INTERACTION_MS = 10000
    const WRAP_SETTLE_MS = 160

    let dots = []
    let pausedUntil = 0
    let hovering = false
    let onScreen = false
    let clones = 0 // cloned slides currently sitting on each side
    let wrapTimer = 0

    // Distance between the start of two neighbouring slides (includes the gap).
    const step = () => slides[1].offsetLeft - slides[0].offsetLeft
    const perView = () => {
      const size = step()
      if (size <= 0) return 0
      return Math.max(1, Math.round((track.clientWidth - slides[0].offsetWidth) / size) + 1)
    }

    // The slide whose left edge sits closest to the scrollport's edge. Measuring
    // rectangles instead of scrollLeft keeps the track's padding out of the maths.
    const leftmost = () => {
      const edge = track.getBoundingClientRect().left
      let best = 0
      let distance = Infinity
      Array.from(track.children).forEach((slide, i) => {
        const gap = Math.abs(slide.getBoundingClientRect().left - edge)
        if (gap < distance) {
          distance = gap
          best = i
        }
      })
      return best
    }

    const current = () => (((leftmost() - clones) % count) + count) % count

    // This browser position and the target one are both snapped, so the move is
    // exactly a whole number of pitches — no padding or gap guesswork.
    const scrollToSlide = (domIndex, behavior = scrollBehavior()) => {
      const slide = track.children[domIndex]
      if (!slide) return
      const delta = slide.getBoundingClientRect().left - track.getBoundingClientRect().left
      track.scrollTo({ left: track.scrollLeft + delta, behavior })
    }

    const markActive = () => {
      const active = current()
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === active)))
    }

    const buildDots = () => {
      if (dots.length === count) return
      dotsEl.replaceChildren(...Array.from({ length: count }, (_, i) => {
        const dot = document.createElement('button')
        dot.type = 'button'
        dot.className = 'testimonials-dot'
        dot.setAttribute('aria-label', `Go to reference ${i + 1}`)
        dot.addEventListener('click', () => {
          pausedUntil = Date.now() + PAUSE_AFTER_INTERACTION_MS
          scrollToSlide(clones + i)
        })
        return dot
      }))
      dots = [...dotsEl.children]
      markActive()
    }

    // A clone is decoration: hidden from assistive tech and stripped of the
    // slide semantics, so the list is still announced once.
    const makeClone = (slide) => {
      const clone = slide.cloneNode(true)
      clone.setAttribute('data-loop-clone', '')
      clone.setAttribute('aria-hidden', 'true')
      clone.removeAttribute('role')
      clone.removeAttribute('aria-roledescription')
      clone.removeAttribute('aria-label')
      return clone
    }

    /* One cloned set per side. The trailing side gets one extra slide: a
       scroll-snap track cannot align its final slide to the start edge, so
       without it the last step of the loop would stop short of the wrap. */
    const sync = () => {
      const perSide = perView()
      if (!perSide) return // deferred CSS has not laid the track out yet
      if (perSide === clones) {
        markActive()
        return
      }
      const at = current()
      track.querySelectorAll('[data-loop-clone]').forEach((node) => node.remove())
      track.prepend(...slides.slice(-perSide).map(makeClone))
      track.append(...slides.slice(0, perSide).map(makeClone), makeClone(slides[0]))
      clones = perSide
      scrollToSlide(clones + at, 'auto')
      buildDots()
      markActive()
    }

    // A step that landed on a cloned stretch: jump back one set, invisibly.
    const normalize = () => {
      if (!clones) return
      const index = leftmost()
      if (index >= clones && index < clones + count) return
      scrollToSlide(index + (index < clones ? count : -count), 'auto')
    }

    let scrollFrame = 0
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(scrollFrame)
      scrollFrame = requestAnimationFrame(markActive)
      clearTimeout(wrapTimer)
      wrapTimer = setTimeout(normalize, WRAP_SETTLE_MS)
    }, { passive: true })

    // Any manual interaction pauses autoplay for a while.
    const userPause = () => { pausedUntil = Date.now() + PAUSE_AFTER_INTERACTION_MS }
    track.addEventListener('pointerdown', userPause)
    track.addEventListener('keydown', userPause)
    root.addEventListener('pointerenter', () => { hovering = true })
    root.addEventListener('pointerleave', () => { hovering = false })

    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track)
    sync()

    // Autoplay runs only while the carousel is on screen (the section is hidden
    // until visited) and never for users who asked for reduced motion.
    if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) return
    new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting }, { threshold: 0.3 }).observe(root)

    // Persistent pause/play control (WCAG 2.2.2): only exists when autoplay does.
    let userPaused = false
    const controls = document.createElement('div')
    controls.className = 'testimonials-controls'
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.className = 'testimonials-toggle'
    const syncToggle = () => {
      toggle.setAttribute('aria-pressed', String(userPaused))
      toggle.setAttribute('aria-label', userPaused ? 'Resume automatic rotation of references' : 'Pause automatic rotation of references')
    }
    toggle.addEventListener('click', () => { userPaused = !userPaused; syncToggle() })
    syncToggle()
    dotsEl.replaceWith(controls)
    controls.append(toggle, dotsEl)

    setInterval(() => {
      if (userPaused || !onScreen || hovering || document.hidden || Date.now() < pausedUntil) return
      if (root.contains(document.activeElement)) return
      const index = leftmost()
      if (index + 1 < track.children.length) scrollToSlide(index + 1)
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

  /**
   * Project category filters (#projects .project-filters)
   */
  const initProjectFilters = () => {
    const bar = select('.project-filters');
    if (!bar) return;
    const buttons = select('.project-filter', true);
    const items = select('#projects [data-category]', true);
    const status = select('.project-filter-status');
    if (!buttons.length || !items.length) return;

    // Keep badge counts in sync with the live DOM tiles automatically.
    const counts = items.reduce((acc, item) => {
      const cat = item.dataset.category;
      if (cat) acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    buttons.forEach((btn) => {
      const badge = btn.querySelector('.project-filter__count');
      if (!badge) return;
      const key = btn.dataset.filter;
      badge.textContent = String(key === 'all' ? items.length : (counts[key] || 0));
    });

    const applyFilter = (category) => {
      let visible = 0;
      items.forEach((item) => {
        const show = category === 'all' || item.dataset.category === category;
        item.classList.toggle('is-filtered-out', !show);
        item.hidden = !show;
        if (show) visible += 1;
      });
      buttons.forEach((btn) => {
        const active = btn.dataset.filter === category;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      if (status) {
        status.textContent = `Showing ${visible} ${visible === 1 ? 'project' : 'projects'}`;
      }
    };

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.project-filter');
      if (!btn || !btn.dataset.filter) return;
      applyFilter(btn.dataset.filter);
    });

    // If navigation targets a filtered-out project tile (e.g. command palette or hash), reveal all.
    const revealTarget = (id) => {
      if (!id || !id.startsWith('project-')) return;
      const tile = document.getElementById(id);
      const col = tile && tile.closest('[data-category]');
      if (col && col.classList.contains('is-filtered-out')) applyFilter('all');
    };
    window.addEventListener('nav:goto', (e) => revealTarget(e.detail && e.detail.id));
    window.addEventListener('hashchange', () => revealTarget(location.hash.slice(1)));
  };

  /**
   * One-click copy email button in Contact section
   */
  const initCopyEmail = () => {
    const buttons = select('[data-copy-email]', true);
    if (!buttons.length) return;

    const fallbackCopy = (text) => {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        return document.execCommand('copy');
      } catch {
        return false;
      } finally {
        area.remove();
      }
    };

    buttons.forEach((btn) => {
      let resetTimer = null;
      const defaultLabel = btn.textContent.trim();

      btn.addEventListener('click', async () => {
        const email = btn.dataset.copyEmail;
        if (!email) return;
        let copied = false;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(email);
            copied = true;
          } catch {
            copied = fallbackCopy(email);
          }
        } else {
          copied = fallbackCopy(email);
        }

        if (copied) {
          btn.textContent = 'Copied!';
          btn.classList.add('is-copied');
          btn.setAttribute('aria-label', 'Email address copied to clipboard');
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => {
            btn.textContent = defaultLabel;
            btn.classList.remove('is-copied');
            btn.setAttribute('aria-label', 'Copy email address');
          }, 2000);
        }
      });
    });
  };

  // Initialize components when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    const year = String(Math.max(2026, new Date().getFullYear()));
    select('[data-year]', true).forEach((el) => { el.textContent = year; });
    initProjectFilters();
    initCopyEmail();
    if (pageSections.length) {
      if (window.location.hash) {
        if (!alignToHash({ instant: true })) {
          deepLinkPending = false;
          syncScrollSpy();
        }
      } else {
        syncScrollSpy();
      }
    }
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
  });

  if (pageSections.length) {
    window.addEventListener('load', () => {
      if (window.location.hash && !userScrolled) {
        alignToHash({ instant: true });
      }
      deepLinkPending = false;
    });
  }
})();
