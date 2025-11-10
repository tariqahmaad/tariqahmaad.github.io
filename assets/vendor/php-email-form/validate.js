/**
* EmailJS Contact Form Validation - v5.0
* Clean version for EmailJS integration
*/
(function () {
  "use strict";

  // Wait for EmailJS to be loaded, then initialize
  function initEmailJS() {
    if (typeof emailjs !== 'undefined') {
      emailjs.init({
        publicKey: "4aq1DyE-SO5ZA9z08",
      });
      console.log('EmailJS initialized successfully');
    } else {
      console.error('EmailJS library is not loaded yet, retrying in 100ms...');
      setTimeout(initEmailJS, 100);
    }
  }

  // Start initialization
  initEmailJS();

  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Check if EmailJS is loaded before proceeding
    if (typeof emailjs === 'undefined') {
      console.error('EmailJS library is not loaded! Please check the CDN link.');
      return;
    }

    console.log('EmailJS library is loaded, setting up form handlers...');

    let forms = document.querySelectorAll('.php-email-form');
    console.log('Found forms:', forms.length);

    forms.forEach( function(e) {
      console.log('Attaching event listener to form:', e.id);
      e.addEventListener('submit', function(event) {
        console.log('Form submitted!', e.id);
        // Always prevent default form submission
        event.preventDefault();
        event.stopPropagation();

        let thisForm = this;

        // Check if this is EmailJS form (has id="contact-form")
        if (thisForm.id === 'contact-form') {
          console.log('Handling EmailJS submission');
          emailjs_submit(thisForm);
          return false;
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
    console.log('Starting EmailJS submission...');
    thisForm.querySelector('.loading').classList.add('d-block');
    thisForm.querySelector('.error-message').classList.remove('d-block');
    thisForm.querySelector('.sent-message').classList.remove('d-block');

    // Get form data
    const name = thisForm.querySelector('#name').value;
    const email = thisForm.querySelector('#email').value;
    const subject = thisForm.querySelector('#subject').value;
    const messageElem = thisForm.querySelector('#message') || thisForm.querySelector('textarea[name="message"]');
    const message = messageElem ? messageElem.value : '';

    console.log('Form data:', { name, email, subject, message });

    // Prepare template parameters (matching your EmailJS template)
    const templateParams = {
      name: name,
      email: email,
      title: subject,
      message: message,
      to_email: 'tariq_muzamil@live.com'
    };

    console.log('Sending email via EmailJS...', { serviceID: 'portfolio-contact-form', templateID: 'template_nivqe7n' });

    // Send email using EmailJS
    emailjs.send('portfolio-contact-form', 'template_nivqe7n', templateParams)
      .then((response) => {
        console.log('EmailJS success:', response);
        thisForm.querySelector('.loading').classList.remove('d-block');
        thisForm.querySelector('.sent-message').classList.add('d-block');
        thisForm.reset();
      })
      .catch((error) => {
        console.error('EmailJS error details:', error);
        thisForm.querySelector('.loading').classList.remove('d-block');
        displayError(thisForm, 'Failed to send message. Please try again later.');
      });
  }

  function displayError(thisForm, error) {
    thisForm.querySelector('.loading').classList.remove('d-block');
    thisForm.querySelector('.error-message').innerHTML = error;
    thisForm.querySelector('.error-message').classList.add('d-block');
  }

})();
