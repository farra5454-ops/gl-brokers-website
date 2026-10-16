// GL Insurance Brokers — live "open now" status with a Fort Myers digital clock.
// Always uses Eastern Time (the office's clock), whatever time zone the visitor is in.
(function () {
  "use strict";

  var boxes = document.querySelectorAll("[data-live-status]");
  if (!boxes.length) return;

  var OPEN = 8, EVENING = 17, CLOSE = 19; // 8 AM, 5 PM, 7 PM Eastern


  // Current hour/minute/second in Fort Myers
  var fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "numeric", minute: "numeric", second: "numeric", hour12: false
  });
  function nowET() {
    var t = {};
    fmt.formatToParts(new Date()).forEach(function (p) { t[p.type] = +p.value; });
    return { h: t.hour % 24, m: t.minute, s: t.second };
  }

  function twelve(h) { return { hr: h % 12 === 0 ? 12 : h % 12, ap: h < 12 ? "AM" : "PM" }; }

  function leftToday(t) {
    var mins = (CLOSE * 60) - (t.h * 60 + t.m);
    var hrs = Math.floor(mins / 60), rem = mins % 60;
    if (hrs && rem) return hrs + " hr " + rem + " min";
    if (hrs) return hrs + " hr";
    return rem + " min";
  }

  var lastState = "";
  function render() {
    var t = nowET();
    var state = t.h >= OPEN && t.h < EVENING ? "open" : (t.h >= EVENING && t.h < CLOSE ? "evening" : "closed");
    var c = twelve(t.h);
    var time = c.hr + "<span class=\"ls-colon\">:</span>" + (t.m < 10 ? "0" : "") + t.m;

    boxes.forEach(function (box) {
      box.querySelector(".ls-time").innerHTML = time;
      box.querySelector(".ls-ampm").textContent = c.ap;
      if (state === lastState && state !== "evening") return;
      box.setAttribute("data-state", state);
      var label = box.querySelector(".ls-label"), sub = box.querySelector(".ls-sub");
      if (state === "open") {
        label.textContent = "Open now";
        sub.innerHTML = "Licensed agents answering until <strong>7 PM</strong>";
      } else if (state === "evening") {
        label.textContent = "Open tonight";
        sub.innerHTML = "Agents still answering &middot; <strong>" + leftToday(t) + "</strong> left to call today";
      } else {
        label.textContent = "Closed now";
        var quote = box.getAttribute("data-quote") || "/contact";
        sub.innerHTML = "Opens <strong>8 AM</strong> &middot; <a href=\"" + quote + "\">Request a quote</a> and we'll call you first thing";
      }
    });
    lastState = state;
  }

  // Today's date in words, Fort Myers time, e.g. "Thursday, October 16th, 2026"
  var dates = document.querySelectorAll("[data-live-date]");
  var dfmt = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric", year: "numeric" });
  function ordinal(n) {
    var v = n % 100;
    if (v >= 11 && v <= 13) return n + "th";
    return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  }
  function renderDate() {
    var p = {};
    dfmt.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var text = p.weekday + ", " + p.month + " " + ordinal(+p.day) + ", " + p.year;
    dates.forEach(function (d) { d.textContent = text; });
  }

  render();
  renderDate();
  setInterval(function () { render(); renderDate(); }, 1000);
})();
