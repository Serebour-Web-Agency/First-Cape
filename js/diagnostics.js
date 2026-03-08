// ------------------------------------
// SMART HUB DIAGNOSTICS DASHBOARD
// Centralized logger + overlay panel
// ------------------------------------

(function () {
  const panel = document.getElementById("smarthub-diagnostics");
  const logBox = document.getElementById("smarthub-log");

  if (!panel || !logBox) {
    console.warn("SmartHubDiag: diagnostics panel not found in DOM.");
    return;
  }

  // Toggle panel with CTRL + ALT + D
document.addEventListener("keydown", e => {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "d") {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  }
});

  function log(message, data = null, level = "info") {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement("div");
    entry.style.marginBottom = "6px";

    let color = "#0f0";
    if (level === "warn") color = "#ff0";
    if (level === "error") color = "#f33";

    entry.innerHTML = `<span style="color:${color}">[${time}]</span> ${message}`;

    if (data) {
      const pre = document.createElement("pre");
      pre.style.whiteSpace = "pre-wrap";
      pre.style.color = "#ccc";
      pre.textContent = JSON.stringify(data, null, 2);
      entry.appendChild(pre);
    }

    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Expose logger globally
  window.SmartHubDiag = {
    log
  };

  // Initial boot log
  log("SmartHub Diagnostics dashboard loaded.");
})();

// ------------------------------------
// GLOBAL ERROR + PROMISE LOGGER
// ------------------------------------

window.onerror = function (message, source, lineno, colno, error) {
  const payload = {
    message,
    source,
    lineno,
    colno,
    stack: error && error.stack ? error.stack.toString() : null,
    url: window.location.href
  };

  console.group("🔥 GLOBAL ERROR CAUGHT");
  console.log(payload);
  console.groupEnd();

  window.SmartHubDiag?.log("JS Error captured", payload, "error");
};

window.addEventListener("unhandledrejection", function (event) {
  const payload = {
    reason: event.reason,
    url: window.location.href
  };

  console.group("🔥 UNHANDLED PROMISE REJECTION");
  console.log(payload);
  console.groupEnd();

  window.SmartHubDiag?.log("Unhandled Promise Rejection", payload, "error");
});

// Optional: version stamp (update manually per release)
window.SmartHubDiag?.log("SmartHub JS Version: 1.0.0");