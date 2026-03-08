// SmartHub Dark Mode System
// Version: 1.0
// Toggle between light and dark themes with persistence

class DarkMode {
  constructor() {
    this.storageKey = 'smarthub_dark_mode';
    this.isDark = this.loadPreference();
    this.listeners = [];
    this.init();
  }

  /**
   * Initialize dark mode
   */
  init() {
    // Apply saved preference
    if (this.isDark) {
      this.enable(false);
    } else {
      this.disable(false);
    }

    // Check system preference if no saved preference
    if (localStorage.getItem(this.storageKey) === null) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        this.enable(false);
      }
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (localStorage.getItem(this.storageKey) === null) {
        if (e.matches) {
          this.enable(true);
        } else {
          this.disable(true);
        }
      }
    });
  }

  /**
   * Load preference from localStorage
   */
  loadPreference() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored === 'true';
    } catch (error) {
      console.error('[DarkMode] Error loading preference:', error);
      return false;
    }
  }

  /**
   * Save preference to localStorage
   */
  savePreference() {
    try {
      localStorage.setItem(this.storageKey, this.isDark.toString());
    } catch (error) {
      console.error('[DarkMode] Error saving preference:', error);
    }
  }

  /**
   * Enable dark mode
   */
  enable(notify = true) {
    this.isDark = true;
    document.documentElement.classList.add('dark-mode');
    document.body.classList.add('dark-mode');
    this.savePreference();
    
    if (notify) {
      this.notifyListeners();
      this.showToast('Dark mode enabled', 'info');
    }

    // Update toggle buttons
    this.updateToggles();
  }

  /**
   * Disable dark mode
   */
  disable(notify = true) {
    this.isDark = false;
    document.documentElement.classList.remove('dark-mode');
    document.body.classList.remove('dark-mode');
    this.savePreference();
    
    if (notify) {
      this.notifyListeners();
      this.showToast('Light mode enabled', 'info');
    }

    // Update toggle buttons
    this.updateToggles();
  }

  /**
   * Toggle dark mode
   */
  toggle() {
    if (this.isDark) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Get current state
   */
  isEnabled() {
    return this.isDark;
  }

  /**
   * Update all toggle buttons
   */
  updateToggles() {
    const toggles = document.querySelectorAll('.dark-mode-toggle');
    toggles.forEach(toggle => {
      const icon = toggle.querySelector('.dark-mode-toggle__icon');
      if (icon) {
        icon.textContent = this.isDark ? '☀️' : '🌙';
      }
      
      toggle.setAttribute('aria-label', this.isDark ? 'Switch to light mode' : 'Switch to dark mode');
      toggle.setAttribute('title', this.isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  /**
   * Add listener
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.isDark);
      } catch (error) {
        console.error('[DarkMode] Listener error:', error);
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('darkmode-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'darkmode-toast-container';
      container.className = 'darkmode-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `darkmode-toast darkmode-toast--${type}`;
    
    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    toast.innerHTML = `
      <span class="darkmode-toast__icon">${icons[type] || 'ℹ'}</span>
      <span class="darkmode-toast__message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('darkmode-toast--visible'), 10);

    setTimeout(() => {
      toast.classList.remove('darkmode-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }
}

// Initialize global instance
const darkMode = new DarkMode();

// Make available globally
if (typeof window !== 'undefined') {
  window.darkMode = darkMode;
}

/**
 * Create dark mode toggle button
 */
function createDarkModeToggle() {
  const toggle = document.createElement('button');
  toggle.className = 'dark-mode-toggle';
  toggle.setAttribute('aria-label', darkMode.isEnabled() ? 'Switch to light mode' : 'Switch to dark mode');
  toggle.setAttribute('title', darkMode.isEnabled() ? 'Switch to light mode' : 'Switch to dark mode');
  toggle.onclick = () => darkMode.toggle();
  
  toggle.innerHTML = `
    <span class="dark-mode-toggle__icon">${darkMode.isEnabled() ? '☀️' : '🌙'}</span>
  `;
  
  return toggle;
}

/**
 * Initialize dark mode toggle in navigation
 */
function initDarkModeToggle() {
  // Find navigation or create toggle location
  const nav = document.querySelector('nav .navbar-nav');
  
  if (nav) {
    const toggleItem = document.createElement('li');
    toggleItem.className = 'nav-item';
    
    const toggle = createDarkModeToggle();
    toggle.classList.add('nav-link');
    
    toggleItem.appendChild(toggle);
    nav.appendChild(toggleItem);
  } else {
    // Create floating toggle button
    const toggle = createDarkModeToggle();
    toggle.classList.add('dark-mode-toggle--floating');
    document.body.appendChild(toggle);
  }
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkModeToggle);
} else {
  initDarkModeToggle();
}

console.log('[DarkMode] System loaded - v1.0');
console.log('[DarkMode] Current mode:', darkMode.isEnabled() ? 'Dark' : 'Light');
