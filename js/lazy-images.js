// ------------------------------------
// SMART HUB LAZY IMAGE LOADER
// ------------------------------------

window.SmartHubDiag?.log("lazy-images.js loaded", { url: window.location.href });

document.addEventListener("DOMContentLoaded", () => {
  const lazyImages = document.querySelectorAll("img.lazy");

  if (lazyImages.length === 0) {
    window.SmartHubDiag?.log("No lazy images found on this page");
    return;
  }

  // Fallback for browsers without IntersectionObserver
  if (!("IntersectionObserver" in window)) {
    console.warn("LAZY-IMAGES: IntersectionObserver not supported. Loading all images immediately.");
    window.SmartHubDiag?.log("IntersectionObserver not supported; loading all images immediately", {
      count: lazyImages.length
    }, "warn");

    lazyImages.forEach(img => {
      if (img.dataset?.src) img.src = img.dataset.src;
      img.classList.remove("lazy");
    });
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const img = entry.target;
      const dataSrc = img.dataset?.src;

      if (!dataSrc) {
        console.warn("LAZY-IMAGES: Image missing data-src attribute:", img);
        window.SmartHubDiag?.log("Image missing data-src", {
          alt: img.alt,
          src: img.src
        }, "warn");
        obs.unobserve(img);
        return;
      }

      img.src = dataSrc;
      img.classList.remove("lazy");
      obs.unobserve(img);

      window.SmartHubDiag?.log("Lazy image loaded", {
        finalSrc: dataSrc,
        alt: img.alt
      });
    });
  });

  lazyImages.forEach(img => observer.observe(img));

  window.SmartHubDiag?.log("Lazy images observer attached", { count: lazyImages.length });
});