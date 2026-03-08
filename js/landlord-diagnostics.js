/**
 * SMART HUB - LANDLORD MODAL DIAGNOSTICS HOOK
 * Version: 1.0.0
 * File: js/landlord-diagnostics.js
 * 
 * Comprehensive debugging and monitoring tool for landlord submissions
 * Use in browser console or include on staging/dev environments
 */

(function(window, document) {
  'use strict';

  /**
   * Diagnostics Configuration
   */
  const DIAG_CONFIG = {
    LOG_SUBMISSIONS: true,
    TRACK_USER_FLOW: true,
    CAPTURE_ERRORS: true,
    STORE_LOCAL: true, // Store logs in localStorage
    MAX_STORED_LOGS: 50
  };

  /**
   * Diagnostics State
   */
  const diagnosticsState = {
    logs: [],
    submissions: [],
    errors: [],
    userFlow: [],
    startTime: Date.now()
  };

  /**
   * Initialize Diagnostics
   */
  function initDiagnostics() {
    console.log("%c🔧 Smart Hub Landlord Modal Diagnostics Active", "color: #10b981; font-weight: bold; font-size: 14px;");
    
    // Load previous logs from localStorage
    loadStoredLogs();
    
    // Intercept landlord modal events
    interceptModalEvents();
    
    // Intercept form submissions
    interceptSubmissions();
    
    // Monitor errors
    monitorErrors();
    
    // Expose global diagnostics API
    exposeDiagnosticsAPI();
    
    log("Diagnostics initialized", "info");
  }

  /**
   * Load stored logs from localStorage
   */
  function loadStoredLogs() {
    try {
      const stored = localStorage.getItem('smartHubLandlordDiagnostics');
      if (stored) {
        const parsed = JSON.parse(stored);
        diagnosticsState.logs = parsed.logs || [];
        diagnosticsState.submissions = parsed.submissions || [];
        diagnosticsState.errors = parsed.errors || [];
        log(`Loaded ${diagnosticsState.logs.length} previous logs from storage`, "info");
      }
    } catch (e) {
      console.warn("Failed to load stored diagnostics:", e);
    }
  }

  /**
   * Save logs to localStorage
   */
  function saveLogsToStorage() {
    if (!DIAG_CONFIG.STORE_LOCAL) return;

    try {
      // Keep only last N logs
      const toStore = {
        logs: diagnosticsState.logs.slice(-DIAG_CONFIG.MAX_STORED_LOGS),
        submissions: diagnosticsState.submissions.slice(-DIAG_CONFIG.MAX_STORED_LOGS),
        errors: diagnosticsState.errors.slice(-DIAG_CONFIG.MAX_STORED_LOGS),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('smartHubLandlordDiagnostics', JSON.stringify(toStore));
    } catch (e) {
      console.warn("Failed to save diagnostics:", e);
    }
  }

  /**
   * Intercept modal events
   */
  function interceptModalEvents() {
    // Intercept modal open
    const originalOpen = window.SmartHubLandlordModal?.open;
    if (originalOpen) {
      window.SmartHubLandlordModal.open = function(...args) {
        trackUserFlow("modal_opened");
        log("Modal opened", "event", { timestamp: Date.now() });
        return originalOpen.apply(this, args);
      };
    }

    // Intercept modal close
    const originalClose = window.SmartHubLandlordModal?.close;
    if (originalClose) {
      window.SmartHubLandlordModal.close = function(...args) {
        trackUserFlow("modal_closed");
        log("Modal closed", "event", { timestamp: Date.now() });
        return originalClose.apply(this, args);
      };
    }

    // Track open trigger clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('landlord-open') || 
          e.target.closest('.landlord-open')) {
        trackUserFlow("trigger_clicked");
        log("Open trigger clicked", "event", { 
          element: e.target.tagName,
          text: e.target.textContent?.trim()
        });
      }
    });
  }

  /**
   * Intercept form submissions
   */
  function interceptSubmissions() {
    // Hook into unified lead system
    const originalNotifyLead = window.smartHubNotifyLead;
    if (originalNotifyLead) {
      window.smartHubNotifyLead = function(payload) {
        if (payload.leadType === "Landlord") {
          captureSubmission(payload, "unified_lead_system");
        }
        return originalNotifyLead.apply(this, arguments);
      };
    }

    // Monitor fetch calls (for direct webhook)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      
      // Check if it's a landlord webhook call
      if (typeof url === 'string' && url.includes('make.com')) {
        const options = args[1] || {};
        if (options.method === 'POST' && options.body) {
          try {
            const payload = JSON.parse(options.body);
            if (payload.leadType === "Landlord") {
              captureSubmission(payload, "direct_webhook");
            }
          } catch (e) {
            // Not JSON or parsing failed
          }
        }
      }

      return originalFetch.apply(this, args);
    };

    log("Submission interceptors installed", "info");
  }

  /**
   * Capture submission details
   */
  function captureSubmission(payload, method) {
    const submission = {
      timestamp: new Date().toISOString(),
      method: method,
      payload: payload,
      page: document.title,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    diagnosticsState.submissions.push(submission);
    trackUserFlow("submission_sent");

    log("Landlord submission captured", "submission", submission);

    // Console output for immediate visibility
    console.group("%c📤 Landlord Submission", "color: #3b82f6; font-weight: bold;");
    console.log("Method:", method);
    console.log("Full Name:", payload.fullName);
    console.log("Phone:", payload.phone);
    console.log("Location:", payload.city);
    console.log("Service:", extractService(payload.notes));
    console.log("Full Payload:", payload);
    console.groupEnd();

    saveLogsToStorage();
  }

  /**
   * Extract service from notes
   */
  function extractService(notes) {
    const match = notes?.match(/Service:\s*([^\n]+)/);
    return match ? match[1].trim() : "Unknown";
  }

  /**
   * Monitor errors
   */
  function monitorErrors() {
    const originalError = console.error;
    console.error = function(...args) {
      // Check if error is related to landlord modal
      const errorStr = args.join(' ').toLowerCase();
      if (errorStr.includes('landlord') || errorStr.includes('modal') || errorStr.includes('webhook')) {
        captureError(args);
      }
      return originalError.apply(console, args);
    };

    // Global error handler
    window.addEventListener('error', (e) => {
      if (e.message.toLowerCase().includes('landlord') || 
          e.filename?.includes('landlord')) {
        captureError([e.message, e.filename, e.lineno]);
      }
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
      if (e.reason?.message?.toLowerCase().includes('landlord') ||
          e.reason?.message?.toLowerCase().includes('webhook')) {
        captureError(['Promise rejection:', e.reason]);
      }
    });

    log("Error monitors installed", "info");
  }

  /**
   * Capture error details
   */
  function captureError(errorArgs) {
    const error = {
      timestamp: new Date().toISOString(),
      message: errorArgs.join(' '),
      page: document.title,
      url: window.location.href,
      stack: new Error().stack
    };

    diagnosticsState.errors.push(error);
    trackUserFlow("error_occurred");

    log("Error captured", "error", error);

    console.group("%c❌ Landlord Modal Error", "color: #dc2626; font-weight: bold;");
    console.error(...errorArgs);
    console.groupEnd();

    saveLogsToStorage();
  }

  /**
   * Track user flow
   */
  function trackUserFlow(action) {
    if (!DIAG_CONFIG.TRACK_USER_FLOW) return;

    diagnosticsState.userFlow.push({
      action: action,
      timestamp: Date.now(),
      relativeTime: Date.now() - diagnosticsState.startTime
    });
  }

  /**
   * Log event
   */
  function log(message, type = "info", data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: type,
      message: message,
      data: data
    };

    diagnosticsState.logs.push(logEntry);

    // Color-coded console output
    const colors = {
      info: "#6b7280",
      event: "#3b82f6",
      submission: "#10b981",
      error: "#dc2626",
      warning: "#f59e0b"
    };

    console.log(
      `%c[${type.toUpperCase()}] ${message}`,
      `color: ${colors[type] || colors.info}; font-weight: 500;`,
      data || ""
    );

    saveLogsToStorage();
  }

  /**
   * Generate diagnostics report
   */
  function generateReport() {
    const uptime = ((Date.now() - diagnosticsState.startTime) / 1000 / 60).toFixed(2);
    
    const report = {
      summary: {
        uptime: `${uptime} minutes`,
        totalLogs: diagnosticsState.logs.length,
        totalSubmissions: diagnosticsState.submissions.length,
        totalErrors: diagnosticsState.errors.length,
        userFlowSteps: diagnosticsState.userFlow.length
      },
      modalHealth: checkModalHealth(),
      recentSubmissions: diagnosticsState.submissions.slice(-5),
      recentErrors: diagnosticsState.errors.slice(-5),
      userFlowSummary: summarizeUserFlow(),
      recommendations: generateRecommendations()
    };

    return report;
  }

  /**
   * Check modal health
   */
  function checkModalHealth() {
    const modal = document.getElementById("landlord-modal");
    const form = document.getElementById("landlord-form");
    const triggers = document.querySelectorAll(".landlord-open");

    const health = {
      status: "healthy",
      issues: [],
      elements: {
        modal: !!modal,
        form: !!form,
        triggers: triggers.length
      }
    };

    if (!modal) {
      health.status = "critical";
      health.issues.push("Modal element (#landlord-modal) not found");
    }

    if (!form) {
      health.status = "critical";
      health.issues.push("Form element (#landlord-form) not found");
    }

    if (triggers.length === 0) {
      health.status = "warning";
      health.issues.push("No open triggers (.landlord-open) found");
    }

    if (typeof window.smartHubNotifyLead !== "function") {
      health.status = "warning";
      health.issues.push("Unified lead system not available");
    }

    return health;
  }

  /**
   * Summarize user flow
   */
  function summarizeUserFlow() {
    const flow = diagnosticsState.userFlow;
    const summary = {
      totalSteps: flow.length,
      firstAction: flow[0]?.action || "none",
      lastAction: flow[flow.length - 1]?.action || "none",
      timeline: flow.map(step => ({
        action: step.action,
        timeFromStart: `${(step.relativeTime / 1000).toFixed(2)}s`
      }))
    };

    return summary;
  }

  /**
   * Generate recommendations
   */
  function generateRecommendations() {
    const recommendations = [];
    const health = checkModalHealth();

    if (health.issues.length > 0) {
      recommendations.push({
        priority: "high",
        issue: "Critical elements missing",
        action: "Check HTML for missing modal elements"
      });
    }

    if (diagnosticsState.errors.length > 5) {
      recommendations.push({
        priority: "high",
        issue: `${diagnosticsState.errors.length} errors detected`,
        action: "Review error logs and fix underlying issues"
      });
    }

    if (diagnosticsState.submissions.length === 0 && diagnosticsState.userFlow.length > 5) {
      recommendations.push({
        priority: "medium",
        issue: "User activity but no submissions",
        action: "Check form validation or submission logic"
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: "low",
        issue: "None",
        action: "System is operating normally"
      });
    }

    return recommendations;
  }

  /**
   * Print diagnostics report to console
   */
  function printReport() {
    const report = generateReport();

    console.clear();
    console.log("%c╔════════════════════════════════════════╗", "color: #10b981; font-weight: bold;");
    console.log("%c║   SMART HUB LANDLORD DIAGNOSTICS      ║", "color: #10b981; font-weight: bold;");
    console.log("%c╚════════════════════════════════════════╝", "color: #10b981; font-weight: bold;");
    console.log("");

    console.group("📊 Summary");
    console.table(report.summary);
    console.groupEnd();

    console.group("🏥 Modal Health");
    console.log("Status:", report.modalHealth.status.toUpperCase());
    console.log("Elements:", report.modalHealth.elements);
    if (report.modalHealth.issues.length > 0) {
      console.warn("Issues:", report.modalHealth.issues);
    } else {
      console.log("✓ No issues detected");
    }
    console.groupEnd();

    console.group("📤 Recent Submissions (" + report.recentSubmissions.length + ")");
    report.recentSubmissions.forEach((sub, i) => {
      console.log(`${i + 1}.`, sub.timestamp, "-", sub.payload.fullName, "via", sub.method);
    });
    console.groupEnd();

    console.group("❌ Recent Errors (" + report.recentErrors.length + ")");
    if (report.recentErrors.length === 0) {
      console.log("✓ No errors");
    } else {
      report.recentErrors.forEach((err, i) => {
        console.error(`${i + 1}.`, err.timestamp, "-", err.message);
      });
    }
    console.groupEnd();

    console.group("👤 User Flow");
    console.table(report.userFlowSummary.timeline);
    console.groupEnd();

    console.group("💡 Recommendations");
    report.recommendations.forEach((rec, i) => {
      const icon = rec.priority === "high" ? "🔴" : rec.priority === "medium" ? "🟡" : "🟢";
      console.log(`${icon} ${rec.priority.toUpperCase()}: ${rec.issue}`);
      console.log(`   Action: ${rec.action}`);
    });
    console.groupEnd();

    console.log("");
    console.log("%cFull report object available as: window.SmartHubDiagnostics.getReport()", "color: #6b7280; font-style: italic;");

    return report;
  }

  /**
   * Export logs as JSON
   */
  function exportLogs() {
    const exportData = {
      exportDate: new Date().toISOString(),
      diagnostics: diagnosticsState,
      report: generateReport()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `landlord-diagnostics-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    log("Diagnostics exported", "info");
  }

  /**
   * Clear all logs
   */
  function clearLogs() {
    diagnosticsState.logs = [];
    diagnosticsState.submissions = [];
    diagnosticsState.errors = [];
    diagnosticsState.userFlow = [];
    diagnosticsState.startTime = Date.now();
    
    localStorage.removeItem('smartHubLandlordDiagnostics');
    
    console.log("%c✓ All diagnostics logs cleared", "color: #10b981; font-weight: bold;");
  }

  /**
   * Expose diagnostics API
   */
  function exposeDiagnosticsAPI() {
    window.SmartHubDiagnostics = {
      getReport: generateReport,
      printReport: printReport,
      exportLogs: exportLogs,
      clearLogs: clearLogs,
      getLogs: () => diagnosticsState.logs,
      getSubmissions: () => diagnosticsState.submissions,
      getErrors: () => diagnosticsState.errors,
      getUserFlow: () => diagnosticsState.userFlow,
      enableStorage: () => { DIAG_CONFIG.STORE_LOCAL = true; },
      disableStorage: () => { DIAG_CONFIG.STORE_LOCAL = false; }
    };

    // Auto-print report on load
    setTimeout(() => {
      console.log("%c💡 Type 'SmartHubDiagnostics.printReport()' to see full diagnostics", "color: #3b82f6; font-style: italic;");
    }, 1000);
  }

  /**
   * Initialize on DOM ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDiagnostics);
  } else {
    initDiagnostics();
  }

})(window, document);