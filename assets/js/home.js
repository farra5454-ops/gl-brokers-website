// GL Insurance Brokers — reimagined homepage behavior
(function () {
  "use strict";

  /* Header: transparent over the hero, solid once you scroll */
  var header = document.querySelector(".site-header");
  var onScroll = function () { header.classList.toggle("is-solid", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Hero video on every screen: a light vertical cut for phones, a widescreen cut for desktops */
  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo) {
    var isPhone = window.matchMedia("(max-width: 760px)").matches;
    heroVideo.src = heroVideo.getAttribute(isPhone ? "data-mobile" : "data-desktop");
    heroVideo.muted = true;
    var reveal = function () { heroVideo.classList.add("is-playing"); };
    heroVideo.addEventListener("playing", reveal);
    var tryPlay = function () { var pr = heroVideo.play(); if (pr && pr.catch) pr.catch(function () {}); };
    tryPlay();
    // Some phones block autoplay until the first touch; start it then
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
  }
  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  });

  /* Insurance Type dropdown: click to toggle, hover on desktop, Escape or outside click closes */
  var item = document.querySelector(".nav-item");
  var dropBtn = item.querySelector(".nav-drop-btn");
  var setDrop = function (open) {
    item.classList.toggle("open", open);
    dropBtn.setAttribute("aria-expanded", open ? "true" : "false");
  };
  dropBtn.addEventListener("click", function (e) { e.stopPropagation(); setDrop(!item.classList.contains("open")); });
  var desktop = window.matchMedia("(min-width: 981px) and (hover: hover)");
  // Short grace period so the menu doesn't snap shut while the mouse travels down into it
  var closeTimer = null;
  item.addEventListener("mouseenter", function () {
    if (!desktop.matches) return;
    clearTimeout(closeTimer);
    setDrop(true);
  });
  item.addEventListener("mouseleave", function () {
    if (!desktop.matches) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { setDrop(false); }, 350);
  });
  document.addEventListener("click", function (e) { if (!item.contains(e.target)) setDrop(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setDrop(false);
    if (header.classList.contains("nav-open")) toggle.click();
  });

  /* Coverage Index: the active line brings its photograph into the viewer */
  var items = document.querySelectorAll(".cindex-item");
  var viewerImgs = document.querySelectorAll(".viewer-img");
  var cap = document.querySelector(".viewer-count");
  var front = 0;
  var activate = function (el) {
    if (el.classList.contains("is-active")) return;
    items.forEach(function (i) { i.classList.remove("is-active"); });
    el.classList.add("is-active");
    var next = viewerImgs[1 - front];
    next.src = el.getAttribute("data-img");
    viewerImgs[front].classList.remove("is-shown");
    next.classList.add("is-shown");
    front = 1 - front;
    cap.textContent = el.querySelector(".cindex-name").textContent.replace(/ Insurance$/, "");
  };
  items.forEach(function (el) {
    // Phones and tablets get the photo inline instead of the side viewer
    var thumb = document.createElement("img");
    thumb.className = "cindex-thumb";
    thumb.src = el.getAttribute("data-img");
    thumb.alt = el.getAttribute("data-alt");
    thumb.loading = "lazy";
    el.querySelector("a").appendChild(thumb);
    el.addEventListener("mouseenter", function () { activate(el); });
    el.querySelector("a").addEventListener("focus", function () { activate(el); });
    var pre = new Image(); pre.src = el.getAttribute("data-img");
  });

  /* Scroll reveals */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (r) { io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("is-in"); });
  }

  /* Quote form → Formspree. The success panel gets class "show", which analytics.js
     watches to record a generate_lead event. */
  var form = document.getElementById("contact-form");
  var success = document.getElementById("form-success");
  var status = form.querySelector(".form-status");
  var submit = form.querySelector('button[type="submit"]');
  var rules = {
    businessName: function (v) { return v.trim().length > 1; },
    contactName: function (v) { return v.trim().length > 1; },
    phone: function (v) { return v.replace(/\D/g, "").length >= 10; },
    email: function (v) { return /^\S+@\S+\.\S+$/.test(v.trim()); }
  };
  var check = function (input) {
    var ok = rules[input.id] ? rules[input.id](input.value) : true;
    input.closest(".field").classList.toggle("invalid", !ok);
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  };
  Object.keys(rules).forEach(function (id) {
    var input = document.getElementById(id);
    input.addEventListener("blur", function () { if (input.value) check(input); });
    input.addEventListener("input", function () { if (input.closest(".field").classList.contains("invalid")) check(input); });
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    var bad = Object.keys(rules).map(function (id) { return document.getElementById(id); }).filter(function (i) { return !check(i); });
    if (bad.length) { bad[0].focus(); return; }
    submit.disabled = true;
    submit.firstChild.textContent = "Sending ";
    fetch(form.action, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (res) {
        if (!res.ok) throw new Error("send failed");
        form.style.display = "none";
        success.classList.add("show");
        success.focus();
      })
      .catch(function () {
        status.textContent = "Your message didn't send. Try again, or call (239) 898-2323.";
        submit.disabled = false;
        submit.firstChild.textContent = "Send Message ";
      });
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
