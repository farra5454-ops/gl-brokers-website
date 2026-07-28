(function () {
  "use strict";

  /* ---------- Hero background video ----------
     Always plays; phones get the smaller 480p encode. */
  var heroVideo = document.querySelector(".hero-bg-video");
  if (heroVideo) {
    if (window.innerWidth <= 760) {
      var heroSource = heroVideo.querySelector("source");
      if (heroSource) {
        heroSource.src = heroSource.src.replace("hero-sunset.mp4", "hero-sunset-mobile.mp4");
        heroVideo.load();
      }
    }
    heroVideo.setAttribute("preload", "auto");
    heroVideo.play().catch(function () {});
  }

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  var scrim = document.querySelector(".nav-scrim");

  function closeMobileNav() {
    if (!toggle || !navLinks) return;
    toggle.classList.remove("active");
    navLinks.classList.remove("open");
    if (scrim) scrim.classList.remove("show");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
  function openMobileNav() {
    if (!toggle || !navLinks) return;
    toggle.classList.add("active");
    navLinks.classList.add("open");
    if (scrim) scrim.classList.add("show");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }
  if (toggle && navLinks) {
    toggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.contains("open");
      if (isOpen) closeMobileNav();
      else openMobileNav();
    });
  }
  if (scrim) scrim.addEventListener("click", closeMobileNav);

  /* ---------- Dropdown (Insurance Type) ---------- */
  var navItems = document.querySelectorAll(".nav-item");
  var isTouch = window.matchMedia("(hover: none)").matches;
  var isMobileWidth = function () { return window.innerWidth <= 760; };

  navItems.forEach(function (item) {
    var btn = item.querySelector(".nav-link");
    if (!btn) return;

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var willOpen = !item.classList.contains("open");
      navItems.forEach(function (i) { i.classList.remove("open"); });
      if (willOpen) item.classList.add("open");
      btn.setAttribute("aria-expanded", String(willOpen));
    });

    if (!isTouch) {
      var closeTimer = null;
      item.addEventListener("mouseenter", function () {
        if (isMobileWidth()) return;
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        navItems.forEach(function (i) { i.classList.remove("open"); });
        item.classList.add("open");
      });
      item.addEventListener("mouseleave", function () {
        if (isMobileWidth()) return;
        closeTimer = setTimeout(function () {
          item.classList.remove("open");
        }, 250);
      });
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".nav-item")) {
      navItems.forEach(function (i) { i.classList.remove("open"); });
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      navItems.forEach(function (i) { i.classList.remove("open"); });
      closeMobileNav();
    }
  });

  /* close mobile nav when a real link inside it is followed */
  if (navLinks) {
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (isMobileWidth()) closeMobileNav();
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger, .bar-row");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length && "IntersectionObserver" in window) {
    var counterIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          counterIO.unobserve(el);
          var to = parseFloat(el.getAttribute("data-count-to"));
          var decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
          var suffix = el.getAttribute("data-suffix") || "";
          var duration = 1400;
          var start = null;
          function step(ts) {
            if (start === null) start = ts;
            var progress = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var val = to * eased;
            el.textContent = val.toFixed(decimals) + suffix;
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = to.toFixed(decimals) + suffix;
          }
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) { counterIO.observe(el); });
  }

  /* ---------- Coverage card cursor-follow glow ---------- */
  document.querySelectorAll(".coverage-card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    });
  });

  /* ---------- FAQ accordions ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      item.classList.toggle("open", !isOpen);
      q.setAttribute("aria-expanded", String(!isOpen));
      a.style.maxHeight = !isOpen ? a.scrollHeight + "px" : "0px";
    });
  });
  /* keep open accordions correctly sized on resize */
  window.addEventListener("resize", function () {
    document.querySelectorAll(".faq-item.open .faq-a").forEach(function (a) {
      a.style.maxHeight = a.scrollHeight + "px";
    });
  });

  /* ---------- Requirement accordion (numbered, single-open) ---------- */
  var reqItems = document.querySelectorAll(".req-item");
  if (reqItems.length) {
    var setReqState = function (item, isOpen) {
      var q = item.querySelector(".req-q");
      var a = item.querySelector(".req-a");
      if (!q || !a) return;
      item.classList.toggle("open", isOpen);
      q.setAttribute("aria-expanded", String(isOpen));
      a.style.maxHeight = isOpen ? a.scrollHeight + "px" : "0px";
    };
    reqItems.forEach(function (item) {
      var q = item.querySelector(".req-q");
      if (!q) return;
      q.addEventListener("click", function () {
        var willOpen = !item.classList.contains("open");
        reqItems.forEach(function (other) {
          if (other !== item) setReqState(other, false);
        });
        setReqState(item, willOpen);
      });
    });
    window.addEventListener("resize", function () {
      document.querySelectorAll(".req-item.open .req-a").forEach(function (a) {
        a.style.maxHeight = a.scrollHeight + "px";
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var successPanel = document.getElementById("form-success");

    function setError(field, message) {
      var wrap = field.closest(".field");
      if (!wrap) return;
      wrap.classList.toggle("invalid", !!message);
      var err = wrap.querySelector(".err");
      if (err) err.textContent = message || "";
    }

    function validate() {
      var valid = true;
      var businessName = form.querySelector("#businessName");
      var contactName = form.querySelector("#contactName");
      var email = form.querySelector("#email");
      var phone = form.querySelector("#phone");

      /* Only four required fields by design — see the note in contact.html.
         Filtered for null so removing a field from the markup can never
         throw here and take the whole form down with it. */
      [businessName, contactName].forEach(function (f) {
        if (!f) return;
        if (!f.value.trim()) { setError(f, "Required"); valid = false; }
        else setError(f, "");
      });

      if (!phone || !email) return valid;

      var phonePattern = /^[\d\s()+\-.]{7,}$/;
      if (!phone.value.trim() || !phonePattern.test(phone.value.trim())) {
        setError(phone, "Enter a valid phone number");
        valid = false;
      } else setError(phone, "");

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailPattern.test(email.value.trim())) {
        setError(email, "Enter a valid email address");
        valid = false;
      } else setError(email, "");

      return valid;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstInvalid = form.querySelector(".field.invalid input, .field.invalid textarea, .field.invalid select");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      var endpoint = form.getAttribute("action");
      var isPlaceholder = !endpoint || endpoint.indexOf("YOUR_FORM_ID") !== -1;

      if (isPlaceholder) {
        /* Form backend not yet connected — see README/setup note in contact.html.
           Tell the visitor honestly rather than faking a success message,
           so a real inquiry never looks "sent" when it went nowhere. */
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        alert("Our online form isn't fully connected yet. Please call or text us directly at (239) 898-2323 and we'll take care of you right away.");
        return;
      }

      fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      })
        .then(function (res) {
          if (res.ok) {
            form.style.display = "none";
            if (successPanel) successPanel.classList.add("show");
          } else {
            throw new Error("Submission failed");
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
          alert("Something went wrong sending your message. Please call (239) 898-2323 or try again.");
        });
    });
  }

  /* ---------- Veteran-owned confetti ---------- */
  function launchConfetti(originEl) {
    var dpr = window.devicePixelRatio || 1;
    var canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    var rect = originEl.getBoundingClientRect();
    var originX = rect.left + rect.width / 2;
    var originY = rect.top + rect.height / 2;

    var colors = ["#B22234", "#FFFFFF", "#3C3B6E"];
    var particles = [];
    var count = 150;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 4 + Math.random() * 9;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 6,
        color: colors[i % colors.length],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        gravity: 0.22 + Math.random() * 0.12,
        drag: 0.985,
        life: 1,
        decay: 0.006 + Math.random() * 0.006,
      });
    }

    var start = null;
    var duration = 1400;
    function frame(ts) {
      if (start === null) start = ts;
      var elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;
        if (p.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(frame);
  }

  document.querySelectorAll(".veteran-link").forEach(function (link) {
    var confettiCooling = false;
    link.addEventListener("mouseenter", function () {
      if (confettiCooling) return;
      confettiCooling = true;
      launchConfetti(link);
      setTimeout(function () {
        confettiCooling = false;
      }, 1500);
    });
  });
})();
