/**
* EmailJS Contact Form Handling - v5.1
* - Validates input client-side
* - Honeypot spam trap (hidden "website" field)
* - Graceful fallback when the EmailJS CDN is unavailable
* - No visitor form data logged to the console
*/
(function () {
  "use strict";

  var RETRY_LIMIT = 20; // ~2s of retries before giving up on the CDN

  // Wait for EmailJS to be loaded, then initialize
  function initEmailJS(attempt) {
    attempt = attempt || 0;
    if (typeof emailjs !== 'undefined') {
      emailjs.init({
        publicKey: "4aq1DyE-SO5ZA9z08",
      });
    } else if (attempt < RETRY_LIMIT) {
      setTimeout(function () { initEmailJS(attempt + 1); }, 100);
    }
    // If the CDN never loads, the submit handler below shows a mailto fallback.
  }

  // Start initialization
  initEmailJS();

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('.php-email-form');

    forms.forEach(function (e) {
      e.addEventListener('submit', function (event) {
        // Always prevent default form submission
        event.preventDefault();
        event.stopPropagation();

        var thisForm = this;

        // Honeypot: real users never see or fill the hidden "website" field.
        // Pretend success so bots move on without sending anything.
        var honeypot = thisForm.querySelector('input[name="website"]');
        if (honeypot && honeypot.value) {
          thisForm.reset();
          thisForm.querySelector('.sent-message').classList.add('d-block');
          return;
        }

        if (thisForm.id === 'contact-form') {
          emailjs_submit(thisForm);
        }
      });
    });
  });

  // Form validation function
  function validateForm(thisForm) {
    const name = thisForm.querySelector('#name').value.trim();
    const email = thisForm.querySelector('#email').value.trim();
    const subject = thisForm.querySelector('#subject').value.trim();
    const messageElem = thisForm.querySelector('#message') || thisForm.querySelector('textarea[name="message"]');
    const message = messageElem ? messageElem.value.trim() : '';

    // Reset previous errors
    thisForm.querySelectorAll('.form-control').forEach(input => {
      input.classList.remove('is-invalid');
    });

    // Validate name
    if (name.length < 2) {
      thisForm.querySelector('#name').classList.add('is-invalid');
      return { valid: false, error: 'Name must be at least 2 characters long' };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      thisForm.querySelector('#email').classList.add('is-invalid');
      return { valid: false, error: 'Please enter a valid email address' };
    }

    // Validate subject
    if (subject.length < 3) {
      thisForm.querySelector('#subject').classList.add('is-invalid');
      return { valid: false, error: 'Subject must be at least 3 characters long' };
    }

    // Validate message
    if (message.length < 10) {
      const messageField = messageElem || thisForm.querySelector('textarea[name="message"]');
      messageField.classList.add('is-invalid');
      return { valid: false, error: 'Message must be at least 10 characters long' };
    }

    return { valid: true };
  }

  // EmailJS submission function
  function emailjs_submit(thisForm) {
    // Validate form first
    const validation = validateForm(thisForm);
    if (!validation.valid) {
      displayError(thisForm, validation.error);
      return;
    }

    // EmailJS SDK failed to load (blocked CDN, offline, etc.) — show a
    // usable fallback instead of dying silently.
    if (typeof emailjs === 'undefined') {
      displayError(thisForm,
        'The messaging service could not be loaded. Please email ' +
        '<a href="mailto:me@tariqahmad.dev">me@tariqahmad.dev</a> directly.');
      return;
    }

    thisForm.querySelector('.loading').classList.add('d-block');
    thisForm.querySelector('.error-message').classList.remove('d-block');
    thisForm.querySelector('.sent-message').classList.remove('d-block');

    // Prevent double submissions while a message is being sent
    const submitBtn = thisForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
    }
    const restoreBtn = function () {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText || 'Send Message';
      }
    };

    // Get form data
    const name = thisForm.querySelector('#name').value;
    const email = thisForm.querySelector('#email').value;
    const subject = thisForm.querySelector('#subject').value;
    const messageElem = thisForm.querySelector('#message') || thisForm.querySelector('textarea[name="message"]');
    const message = messageElem ? messageElem.value : '';

    // Prepare template parameters (matching your EmailJS template)
    const templateParams = {
      name: name,
      email: email,
      title: subject,
      message: message,
      to_email: 'me@tariqahmad.dev'
    };

    // Send email using EmailJS
    emailjs.send('portfolio-contact-form', 'template_nivqe7n', templateParams)
      .then((response) => {
        thisForm.querySelector('.loading').classList.remove('d-block');
        thisForm.querySelector('.sent-message').classList.add('d-block');
        thisForm.reset();
        restoreBtn();
      })
      .catch((error) => {
        thisForm.querySelector('.loading').classList.remove('d-block');
        displayError(thisForm, 'Failed to send message. Please try again later, or email ' +
          '<a href="mailto:me@tariqahmad.dev">me@tariqahmad.dev</a> directly.');
        restoreBtn();
      });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    thisForm.querySelector('.error-message').innerHTML = error;
    thisForm.querySelector('.error-message').classList.add('d-block');
  }

})();
