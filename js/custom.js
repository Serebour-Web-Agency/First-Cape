// ------------------------------------
// SMART HUB CORE UI (AOS + SLIDERS)
// ------------------------------------

(function () {
  "use strict";

  window.SmartHubDiag?.log("custom.js loaded", { url: window.location.href });

  // ------------------------------------
  // AOS INIT (safe)
  // ------------------------------------
  if (window.AOS) {
    try {
      AOS.init({
        duration: 800,
        easing: "slide",
        once: true
      });
      window.SmartHubDiag?.log("AOS initialized");
    } catch (err) {
      console.error("AOS init failed:", err);
      window.SmartHubDiag?.log("AOS init failed", { error: String(err) }, "error");
    }
  } else {
    window.SmartHubDiag?.log("AOS not available; skipping animations", null, "warn");
  }

  // ------------------------------------
  // SAFE LOADER FADE
  // ------------------------------------
  (function () {
    const loader = document.querySelector(".loader");
    const overlayer = document.getElementById("overlayer");

    function fadeOut(el) {
      if (!el) return; // Prevent null errors
      el.style.opacity = 1;

      (function fade() {
        el.style.opacity -= 0.1;
        if (el.style.opacity < 0) {
          el.style.display = "none";
          window.SmartHubDiag?.log("Element faded out", { id: el.id, class: el.className });
        } else {
          requestAnimationFrame(fade);
        }
      })();
    }

    if (loader || overlayer) {
      setTimeout(() => {
        window.SmartHubDiag?.log("Starting loader fade", {
          hasLoader: !!loader,
          hasOverlayer: !!overlayer
        });
        fadeOut(loader);
        fadeOut(overlayer);
      }, 200);
    } else {
      window.SmartHubDiag?.log("No loader/overlayer found; fade skipped");
    }
  })();

  // ------------------------------------
  // SLIDER INITIALIZER (safe wrapper)
  // ------------------------------------
  function initSliderInstance(selector, options, label) {
    const el = document.querySelector(selector);
    if (!el) {
      window.SmartHubDiag?.log("Slider not found; skipping", { selector, label }, "warn");
      return;
    }
    if (typeof tns !== "function") {
      window.SmartHubDiag?.log("tns not available; slider init skipped", { selector, label }, "error");
      return;
    }
    try {
      tns(options);
      window.SmartHubDiag?.log("Slider initialized", { selector, label });
    } catch (err) {
      console.error("Slider init failed:", selector, err);
      window.SmartHubDiag?.log("Slider init failed", { selector, label, error: String(err) }, "error");
    }
  }

  // ------------------------------------
  // HERO SLIDER
  // ------------------------------------
  initSliderInstance(".hero-slide", {
    container: ".hero-slide",
    mode: "carousel",
    speed: 700,
    autoplay: true,
    controls: false,
    nav: false,
    autoplayButtonOutput: false,
    controlsContainer: "#hero-nav"
  }, "hero-slide");

  // ------------------------------------
  // PROPERTY IMAGE SLIDER
  // ------------------------------------
  initSliderInstance(".img-property-slide", {
    container: ".img-property-slide",
    mode: "carousel",
    speed: 700,
    items: 1,
    gutter: 30,
    autoplay: true,
    controls: false,
    nav: true,
    autoplayButtonOutput: false
  }, "img-property-slide");

  // ------------------------------------
  // PROPERTY CARD SLIDER
  // ------------------------------------
  initSliderInstance(".property-slider", {
    container: ".property-slider",
    mode: "carousel",
    speed: 700,
    gutter: 30,
    items: 3,
    autoplay: true,
    autoplayButtonOutput: false,
    controlsContainer: "#property-nav",
    responsive: {
      0: { items: 1 },
      700: { items: 2 },
      900: { items: 3 }
    }
  }, "property-slider");

  // ------------------------------------
  // TESTIMONIAL SLIDER
  // ------------------------------------
  initSliderInstance(".testimonial-slider", {
    container: ".testimonial-slider",
    mode: "carousel",
    speed: 700,
    items: 3,
    gutter: 50,
    autoplay: true,
    autoplayButtonOutput: false,
    controlsContainer: "#testimonial-nav",
    responsive: {
      0: { items: 1 },
      700: { items: 2 },
      900: { items: 3 }
    }
  }, "testimonial-slider");

})();