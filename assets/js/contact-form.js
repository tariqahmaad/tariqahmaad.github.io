/**
 * Contact form (EmailJS)
 * - Client-side validation with accessible error reporting (aria-invalid, focus)
 * - Spam traps: hidden honeypot field + minimum fill time
 * - Graceful mailto fallback when the EmailJS SDK is unavailable
 * - Never logs visitor form data
 */
(function () {
  "use strict";

  var CONFIG = {
    formId: "contact-form",
    contactEmail: "me@tariqahmad.dev",
    serviceId: "portfolio-contact-form",
    templateId: "template_nivqe7n",
    // EmailJS public keys are designed to be client-side; restrict allowed
    // origins and set rate limits in the EmailJS dashboard instead.
    publicKey: "4aq1DyE-SO5ZA9z08",
    honeypotName: "company_site",
    minFillMs: 1500, // humans take longer than this to fill the form
    sdkRetryLimit: 20, // x100ms before giving up on the SDK
    messages: {
      name: "Name must be at least 2 characters long",
      email: "Please enter a valid email address",
      subject: "Subject must be at least 3 characters long",
      message: "Message must be at least 10 characters long",
      sdkMissing: "The messaging service could not be loaded.",
      sendFailed: "Failed to send message. Please try again later."
    }
  };

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var VALIDATORS = [
    { field: "name", test: function (v) { return v.length >= 2; } },
    { field: "email", test: function (v) { return EMAIL_PATTERN.test(v); } },
    { field: "subject", test: function (v) { return v.length >= 3; } },
    { field: "message", test: function (v) { return v.length >= 10; } }
  ];

  var emailjsReady = false;

  /** Initialise the SDK once it has loaded (it is deferred, so poll briefly). */
  function initEmailJS(attempt) {
    if (emailjsReady) return true;
    if (typeof emailjs !== "undefined") {
      emailjs.init({ publicKey: CONFIG.publicKey });
      emailjsReady = true;
      return true;
    }
    if (attempt < CONFIG.sdkRetryLimit) {
      setTimeout(function () { initEmailJS(attempt + 1); }, 100);
    }
    return false;
  }

  function field(form, name) {
    return form.querySelector('[name="' + name + '"]');
  }

  function statusEl(form, selector) {
    return form.querySelector(selector);
  }

  function setVisible(el, visible) {
    if (el) el.classList.toggle("d-block", visible);
  }

  function clearInvalid(form) {
    form.querySelectorAll(".form-control").forEach(function (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
  }

  /** Shows an error without using innerHTML; optionally appends a mailto link. */
  function showError(form, text, withMailto) {
    var box = statusEl(form, ".error-message");
    setVisible(statusEl(form, ".loading"), false);
    if (!box) return;

    box.textContent = text;
    if (withMailto) {
      box.appendChild(document.createTextNode(" Please email "));
      var link = document.createElement("a");
      link.href = "mailto:" + CONFIG.contactEmail;
      link.textContent = CONFIG.contactEmail;
      box.appendChild(link);
      box.appendChild(document.createTextNode(" directly."));
    }
    setVisible(box, true);
  }

  /** Returns the first failing field's name, or null when the form is valid. */
  function validate(form) {
    clearInvalid(form);
    for (var i = 0; i < VALIDATORS.length; i++) {
      var rule = VALIDATORS[i];
      var input = field(form, rule.field);
      if (!input || !rule.test(input.value.trim())) {
        if (input) {
          input.classList.add("is-invalid");
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", "form-error");
          input.focus();
        }
        return rule.field;
      }
    }
    return null;
  }

  function setSending(form, sending) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (sending) {
      button.dataset.originalText = button.textContent;
      button.textContent = "Sending...";
    } else {
      button.textContent = button.dataset.originalText || "Send Message";
    }
    button.disabled = sending;
  }

  function submit(form) {
    var invalidField = validate(form);
    if (invalidField) {
      showError(form, CONFIG.messages[invalidField], false);
      return;
    }

    // SDK blocked or offline: give the visitor a way to reach out anyway.
    if (!initEmailJS(CONFIG.sdkRetryLimit)) {
      showError(form, CONFIG.messages.sdkMissing, true);
      return;
    }

    setVisible(statusEl(form, ".loading"), true);
    setVisible(statusEl(form, ".error-message"), false);
    setVisible(statusEl(form, ".sent-message"), false);
    setSending(form, true);

    var params = {
      name: field(form, "name").value,
      email: field(form, "email").value,
      title: field(form, "subject").value,
      message: field(form, "message").value,
      to_email: CONFIG.contactEmail
    };

    emailjs.send(CONFIG.serviceId, CONFIG.templateId, params, { publicKey: CONFIG.publicKey })
      .then(function () {
        setVisible(statusEl(form, ".loading"), false);
        setVisible(statusEl(form, ".sent-message"), true);
        form.reset();
      })
      .catch(function () {
        showError(form, CONFIG.messages.sendFailed, true);
      })
      .then(function () {
        setSending(form, false);
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById(CONFIG.formId);
    if (!form) return;

    var shownAt = Date.now();
    initEmailJS(0);

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      // Bots fill the hidden field or submit instantly. Pretend success so they
      // move on, but send nothing.
      var trap = field(form, CONFIG.honeypotName);
      var tooFast = Date.now() - shownAt < CONFIG.minFillMs;
      if ((trap && trap.value) || tooFast) {
        form.reset();
        setVisible(statusEl(form, ".sent-message"), true);
        return;
      }

      submit(form);
    });
  });
})();
