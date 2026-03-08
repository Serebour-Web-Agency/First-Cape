// ------------------------------------
// SMART HUB UI LIFECYCLE CONTROLLER
// Protects DOM rendering order and preserves state
// ------------------------------------

let activeCity = ""; // global state for city search cascade

document.addEventListener("DOMContentLoaded", function () {
  window.SmartHubDiag?.log("ui-shell.js DOMContentLoaded", { url: window.location.href });

  // 1. Load BUY listings and render them into DOM
  fetch("data/listings-buy.json")
    .then(res => res.json())
    .then(listings => {
      const container = document.getElementById("grid-inner");
      if (!container) {
        console.warn("UI-Shell: #grid-inner not found. Skipping listing render.");
        window.SmartHubDiag?.log("grid-inner not found; skipping listing render", null, "warn");
        return;
      }

      listings
        .filter(p => p.listingType === "Buy")
        .forEach(p => {
          const col = document.createElement("div");
          col.className = "col-lg-3 col-md-6";
          col.innerHTML = `
            <div class="property-item card p-2 shadow-sm rounded-2"
                 data-city="${p.city}"
                 data-bedrooms="${p.bedrooms}"
                 data-bathrooms="${p.bathrooms}"
                 data-type="${p.propertyType}">
              <a href="property-single.html?id=${p.id}">
                <img src="${p.image}" class="img-fluid rounded-2 mb-2"/>
                <div class="price fw-bold">GHS ${Number(p.price).toLocaleString()}</div>
                <div class="small text-muted">${p.name}</div>
                <div class="badge bg-dark text-white">${p.city}</div>
                <div class="mt-2 text-muted small">
                  ${p.bedrooms} Bedrooms • ${p.bathrooms} Bathrooms • ${p.propertyType}
                </div>
              </a>
            </div>`;
          container.appendChild(col);
        });

      window.SmartHubDiag?.log("Listings rendered", { count: listings.length });

      // 2. Initialise slider only AFTER listings exist
      if (typeof initSlider === "function") {
        try {
          initSlider("main-slider", "property-nav");
          window.SmartHubDiag?.log("initSlider called from ui-shell");
        } catch (err) {
          console.error("UI-Shell: initSlider failed:", err);
          window.SmartHubDiag?.log("initSlider failed in ui-shell", { error: String(err) }, "error");
        }
      }
    })
    .catch(err => {
      console.error("UI-Shell: Buy JSON failed:", err);
      window.SmartHubDiag?.log("Buy JSON failed", { error: String(err) }, "error");
    });

  // 3. City search listener
  const citySearchForm = document.getElementById("city-search-form");
  const cityInput = document.getElementById("city-input");

  if (citySearchForm && cityInput) {
    citySearchForm.addEventListener("submit", function (e) {
      e.preventDefault();
      activeCity = cityInput.value.trim().toLowerCase();
      window.SmartHubDiag?.log("City search submitted", { activeCity });
      cascadeFilters();
    });
  } else {
    window.SmartHubDiag?.log("City search disabled; elements missing", {
      hasForm: !!citySearchForm,
      hasInput: !!cityInput
    }, "warn");
  }

  // 4. Filter cascade logic (respects city search if set)
  const applyFiltersBtn = document.getElementById("apply-filters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", e => {
      e.preventDefault();
      window.SmartHubDiag?.log("Apply filters clicked");
      cascadeFilters();
    });
  } else {
    window.SmartHubDiag?.log("Apply filters button missing; no click handler", null, "warn");
  }

  function cascadeFilters() {
    const bedEl = document.getElementById("filter-bedrooms");
    const bathEl = document.getElementById("filter-bathrooms");
    const typeEl = document.getElementById("filter-type");

    if (!bedEl || !bathEl || !typeEl) {
      window.SmartHubDiag?.log("Filter controls missing; cascading skipped", {
        hasBed: !!bedEl,
        hasBath: !!bathEl,
        hasType: !!typeEl
      }, "warn");
      return;
    }

    const bed = bedEl.value;
    const bath = bathEl.value;
    const type = typeEl.value.toLowerCase();
    const cards = document.querySelectorAll(".property-item");

    if (cards.length === 0) {
      window.SmartHubDiag?.log("No property-item cards during cascadeFilters", null, "warn");
    }

    let visible = 0;

    cards.forEach(c => {
      const cCity = c.getAttribute("data-city")?.toLowerCase() || "";
      const cBed = Number(c.getAttribute("data-bedrooms"));
      const cBath = Number(c.getAttribute("data-bathrooms"));
      const cType = c.getAttribute("data-type")?.toLowerCase() || "";

      if (activeCity && !cCity.includes(activeCity)) {
        c.style.display = "none";
        return;
      }

      let show = true;
      if (bed && cBed < Number(bed)) show = false;
      if (bath && cBath < Number(bath)) show = false;
      if (type && !cType.includes(type)) show = false;

      c.style.display = show ? "block" : "none";
      if (show) visible++;
    });

    window.SmartHubDiag?.log("Filters applied", {
      activeCity,
      visibleCount: visible
    });

    // 5. Notify only when search+filters result in 0 visible items
    const fallbackBox = document.getElementById("fallback-box");
    const noCitySpan = document.getElementById("no-city");
    const notifyBtn = document.getElementById("notify-btn");

    if (fallbackBox && notifyBtn) {
      if (activeCity && visible === 0) {
        fallbackBox.style.display = "block";
        fallbackBox.innerHTML = `No listings found in ${activeCity}`;
        if (noCitySpan) {
          noCitySpan.textContent = activeCity;
        }
        notifyBtn.style.display = "inline-block";
        window.SmartHubDiag?.log("No listings state activated", { activeCity });
      } else {
        fallbackBox.style.display = "none";
        notifyBtn.style.display = "none";
      }
    } else if (activeCity && visible === 0) {
      window.SmartHubDiag?.log("Fallback UI missing; cannot show empty state", null, "warn");
    }

    rearrangeGrid();
  }

  // 6. Grid rearrange logic preserved
  function rearrangeGrid() {
    const grid = document.getElementById("grid-inner");
    if (!grid) {
      window.SmartHubDiag?.log("Grid rearrange skipped; #grid-inner missing", null, "warn");
      return;
    }

    const cols = Array.from(grid.children);
    cols.forEach(col => {
      const card = col.querySelector(".property-item");
      if (!card || card.style.display === "none") {
        col.style.display = "none";
      } else {
        col.style.display = "block";
      }
    });

    window.SmartHubDiag?.log("Grid rearranged", { columns: cols.length });
  }

  // 7. Landlord modal binding
  const landlordModal = document.getElementById("landlord-modal");
  const landlordButtons = document.querySelectorAll(".landlord-open");

  if (landlordButtons.length > 0) {
    landlordButtons.forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        if (landlordModal) {
          landlordModal.style.setProperty("display", "flex");
          window.SmartHubDiag?.log("Landlord modal opened");
        } else {
          window.SmartHubDiag?.log("Landlord modal missing; cannot open", null, "warn");
        }
      });
    });
  }

  // 8. Notify modal binding
  const notifyModal = document.getElementById("notify-modal");
  const notifyButtons = document.querySelectorAll(".notify-open");

  if (notifyButtons.length > 0) {
    notifyButtons.forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        if (notifyModal) {
          notifyModal.style.display = "flex";
          window.SmartHubDiag?.log("Notify modal opened");
        } else {
          window.SmartHubDiag?.log("Notify modal missing; cannot open", null, "warn");
        }
      });
    });
  }

});