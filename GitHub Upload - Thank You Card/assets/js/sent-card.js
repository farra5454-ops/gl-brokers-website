// GL Insurance Brokers — the "message sent" card (Home and Contact quote forms), added 2026-11-09.
// When the quote form sends, home.js / main.min.js add class "show" to #form-success. This file then:
//  - thanks the visitor by first name (from the Contact Name box),
//  - fills in the date and time the request was received,
//  - hides the white "Request a Quote" box behind the card,
//  - scrolls so the card sits in the middle of the screen, so they see the next step.
// It doesn't send anything; analytics.js still counts the lead by watching the same "show" class.
(function () {
  "use strict";
  var panel = document.getElementById("form-success");
  var card = panel && panel.querySelector(".sent-card");
  if (!card) return;
  var form = document.getElementById("contact-form");
  var done = false;

  function reveal() {
    if (done || !panel.classList.contains("show")) return;
    done = true;

    var nameBox = form && form.querySelector('[name="contactName"]');
    var first = nameBox ? nameBox.value.trim().split(/\s+/)[0] : "";
    if (first) first = first.charAt(0).toUpperCase() + first.slice(1);
    var thanks = card.querySelector("[data-sc-thanks]");
    if (thanks) thanks.textContent = first ? "Thanks, " + first + "." : "Thank you.";

    var when = card.querySelector("[data-sc-time]");
    if (when) {
      var now = new Date();
      when.textContent = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " · ";
      var t = document.createElement("span"); // keeps "11:34 AM" together on small screens
      t.textContent = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      when.appendChild(t);
    }

    var box = panel.closest(".form-card");
    if (box) box.classList.add("is-sent");

    // after the page's own code has finished (it may move focus), centre the card on screen
    setTimeout(function () {
      var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      card.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    }, 80);
  }

  new MutationObserver(reveal).observe(panel, { attributes: true, attributeFilter: ["class"] });
  reveal();
})();
