/* ============================================================
   GL Insurance Brokers — Analytics & Conversion Tracking
   ============================================================

   >>> SETUP: PASTE YOUR TWO IDs BELOW, THEN RE-UPLOAD THIS FILE. <<<

   That is the only edit needed. Nothing else on the site has to change.

   1. GA4_ID     — Google Analytics 4 Measurement ID.
                   Get it at analytics.google.com →
                   Admin → Data Streams → your web stream → "Measurement ID".
                   Looks like: G-ABC1234XYZ

   2. CLARITY_ID — Microsoft Clarity Project ID.
                   Get it at clarity.microsoft.com →
                   Settings → Overview → "Project ID".
                   Looks like: abcd1234ef

   Until an ID is filled in, that tool simply stays off — the site keeps
   working normally and no broken requests are sent.

   WHAT THIS TRACKS
   ----------------
   phone_call_click  Someone tapped a phone number. This is the closest
                     thing to a "call" the website can see, and it is the
                     single most important number on this site.
   generate_lead     The quote form submitted successfully.
   form_start        Someone typed in the first form field. Compare against
                     generate_lead to measure form abandonment.
   ============================================================ */

(function () {
  "use strict";

  /* ---------- PASTE YOUR IDs HERE ---------- */
  var GA4_ID = "";      // e.g. "G-ABC1234XYZ"
  var CLARITY_ID = "";  // e.g. "abcd1234ef"
  /* ----------------------------------------- */

  var DEBUG = false; // set true to log every tracked event to the browser console

  /* ---------- gtag shim ----------
     Defined immediately so tracking calls elsewhere never throw,
     whether or not GA4 has been configured or has finished loading. */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  var gaEnabled = /^G-[A-Z0-9]+$/i.test(GA4_ID);
  var clarityEnabled = /^[a-z0-9]{5,}$/i.test(CLARITY_ID);

  /* ---------- Load GA4 ---------- */
  if (gaEnabled) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(ga);

    gtag("js", new Date());
    gtag("config", GA4_ID);
  }

  /* ---------- Load Microsoft Clarity ---------- */
  if (clarityEnabled) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  /* ---------- Event helper ---------- */
  function track(eventName, params) {
    params = params || {};
    if (DEBUG) {
      /* eslint-disable-next-line no-console */
      console.log("[analytics]", eventName, params);
    }
    if (gaEnabled) gtag("event", eventName, params);
    if (clarityEnabled && window.clarity) {
      try { window.clarity("event", eventName); } catch (e) {}
    }
  }

  /* ---------- Phone click tracking ----------
     Delegated from the document so it covers every tel: link on the page,
     including the sticky mobile call bar and any links added later. */
  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
    if (!link) return;

    /* Where on the page the tap came from, so we can tell which call
       button actually earns its place. */
    var source = link.getAttribute("data-call-source");
    if (!source) {
      if (link.closest(".mobile-call-bar")) source = "mobile_call_bar";
      else if (link.closest(".site-header")) source = "header";
      else if (link.closest(".site-footer") || link.closest("footer")) source = "footer";
      else if (link.closest(".photo-hero") || link.closest(".hero")) source = "hero";
      else if (link.closest(".cta-band")) source = "cta_band";
      else if (link.closest(".contact-sidebar")) source = "contact_sidebar";
      else if (link.closest(".form-success")) source = "post_submit";
      else source = "page_body";
    }

    track("phone_call_click", {
      call_source: source,
      page_path: window.location.pathname,
      link_text: (link.textContent || "").trim().slice(0, 60)
    });
  }, true);

  /* ---------- Quote form tracking ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    /* form_start — fires once, on first interaction with any field. */
    var started = false;
    form.addEventListener("input", function () {
      if (started) return;
      started = true;
      track("form_start", { page_path: window.location.pathname });
    }, true);

    /* generate_lead — watch the success panel instead of hooking the submit
       handler, so this file stays completely independent of main.js. */
    var successPanel = document.getElementById("form-success");
    if (successPanel && "MutationObserver" in window) {
      var seen = false;
      new MutationObserver(function () {
        if (seen) return;
        if (successPanel.classList.contains("show")) {
          seen = true;
          track("generate_lead", {
            page_path: window.location.pathname,
            form_name: "quote_request"
          });
        }
      }).observe(successPanel, { attributes: true, attributeFilter: ["class"] });
    }
  }
})();
