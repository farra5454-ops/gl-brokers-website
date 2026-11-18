// GL Insurance Brokers — spam protection for the quote form (Home and Contact pages), added 2026-11-09.
// Shows Cloudflare's "Success!" security check (Turnstile) above the Send button. The message is held
// until the check passes; Formspree then verifies the token (the Secret Key lives only in Formspree,
// form Settings > CAPTCHA > Turnstile > Custom key — never in these files).
// The Site Key lives on the form (data-turnstile-sitekey) so it can be swapped in one place.
// This file only adds the check: the existing code in home.js / main.min.js still sends the form.
(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  var SITEKEY = form && form.getAttribute("data-turnstile-sitekey");
  if (!SITEKEY) return;

  var submit = form.querySelector('button[type="submit"]');
  var spot = document.createElement("div");
  spot.className = "cf-check";
  submit.parentNode.insertBefore(spot, submit);

  // a line for "please finish the check" (Home already has one under the button)
  var note = form.querySelector(".form-status");
  if (!note) {
    note = document.createElement("p");
    note.className = "form-status cf-note";
    note.setAttribute("role", "status");
    note.setAttribute("aria-live", "polite");
    submit.parentNode.insertBefore(note, submit.nextSibling);
  }

  var widget = null, token = "", unavailable = false, tries = 0;

  // Home on phones (form has data-turnstile-lazy): Cloudflare's script (about 1.7 MB) waits until the
  // form is close to the screen or someone touches it, so it doesn't slow the first screen.
  // Everywhere else it loads right away, as before. Added 2026-11-18.
  var API = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  function loadApi() {
    if (window.turnstile || document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/"]')) return;
    var s = document.createElement("script");
    s.src = API; s.async = true;
    document.head.appendChild(s);
  }

  // Cloudflare's script loads in the background; draw the box once it's ready
  function draw() {
    if (!window.turnstile) {
      // if it never loads (blocked or offline), don't trap the visitor: let the send try anyway
      if (++tries < 50) { setTimeout(draw, 200); } else { unavailable = true; }
      return;
    }
    widget = window.turnstile.render(spot, {
      sitekey: SITEKEY, theme: "light", size: "flexible", action: "quote",
      callback: function (t) { token = t; if (note.textContent.indexOf("security check") !== -1) note.textContent = ""; },
      "expired-callback": function () { token = ""; },
      "error-callback": function () { token = ""; }
    });
  }

  var started = false;
  function start() {
    if (started) return;
    started = true;
    loadApi();
    draw();
  }
  var lazy = form.hasAttribute("data-turnstile-lazy") && window.matchMedia("(max-width: 760px)").matches;
  if (!lazy || !("IntersectionObserver" in window)) {
    start();
  } else {
    var near = new IntersectionObserver(function (entries) {
      if (entries.some(function (en) { return en.isIntersecting; })) { near.disconnect(); start(); }
    }, { rootMargin: "600px 0px" });
    near.observe(form);
    ["focusin", "pointerdown", "touchstart"].forEach(function (ev) {
      form.addEventListener(ev, start, { capture: true, passive: true });
    });
  }

  // the token Cloudflare put in the form (read fresh each time, so a reset or expired check counts as "not done")
  function passed() {
    var field = form.querySelector('[name="cf-turnstile-response"]');
    return field ? !!field.value : !!token;
  }

  // Runs before the page's own send code (capture on document): hold the send until the check passes
  document.addEventListener("submit", function (e) {
    if (e.target !== form || passed() || unavailable) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    note.textContent = "Please finish the security check above the button, then press Send again.";
  }, true);

  // Each token works once. When a send fails, the page's code turns the button back on while the form
  // is still showing: give them a fresh check for the next try.
  var wasDisabled = false;
  new MutationObserver(function () {
    if (submit.disabled) { wasDisabled = true; return; }
    if (wasDisabled && form.style.display !== "none") {
      wasDisabled = false;
      token = "";
      if (widget !== null && window.turnstile) { try { window.turnstile.reset(widget); } catch (err) {} }
    }
  }).observe(submit, { attributes: true, attributeFilter: ["disabled"] });
})();
