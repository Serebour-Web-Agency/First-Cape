// ------------------------------------
// SMART HUB NAVBAR CONTROLLER
// ------------------------------------

(function () {
  "use strict";

  window.SmartHubDiag?.log("navbar.js loaded", { url: window.location.href });

  // ELEMENT REFERENCES
  const mobileMenu = document.querySelector(".site-mobile-menu");
  const mobileMenuBody = document.querySelector(".site-mobile-menu-body");
  const navItems = document.querySelectorAll(".js-clone-nav");
  const menuToggles = document.querySelectorAll(".js-menu-toggle");

  // CLONE NAVIGATION FOR MOBILE (safe)
  if (mobileMenu && mobileMenuBody && navItems.length > 0) {
    try {
      navItems.forEach(nav => {
        const clone = nav.cloneNode(true);
        clone.classList.remove("js-clone-nav");
        clone.classList.add("site-nav-wrap");
        mobileMenuBody.appendChild(clone);
      });
      window.SmartHubDiag?.log("Mobile nav cloned", {
        count: navItems.length
      });
    } catch (err) {
      console.error("Error cloning navigation:", err);
      window.SmartHubDiag?.log("Error cloning navigation", { error: String(err) }, "error");
    }
  } else {
    window.SmartHubDiag?.log("Mobile nav cloning skipped", {
      hasMobileMenu: !!mobileMenu,
      hasBody: !!mobileMenuBody,
      navItems: navItems.length
    }, "warn");
  }

  // MOBILE MENU TOGGLE (safe)
  if (menuToggles.length > 0 && mobileMenu) {
    menuToggles.forEach(toggle => {
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        mobileMenu.classList.toggle("active");
        window.SmartHubDiag?.log("Mobile menu toggled", {
          isActive: mobileMenu.classList.contains("active")
        });
      });
    });
  } else {
    window.SmartHubDiag?.log("Menu toggle not bound", {
      toggles: menuToggles.length,
      hasMobileMenu: !!mobileMenu
    }, "warn");
  }

  // CLICK OUTSIDE TO CLOSE (safe)
  document.addEventListener("click", function (e) {
    if (!mobileMenu) return;

    const clickedInsideMenu = mobileMenu.contains(e.target);
    const clickedToggle = e.target.closest(".js-menu-toggle");

    if (!clickedInsideMenu && !clickedToggle) {
      if (mobileMenu.classList.contains("active")) {
        mobileMenu.classList.remove("active");
        window.SmartHubDiag?.log("Mobile menu closed by outside click");
      }
    }
  });

})();