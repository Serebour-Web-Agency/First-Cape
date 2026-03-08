// SmartHub Mobile App Banner
// Version: 1.0
// Smart banner promoting mobile app with device detection

class MobileAppBanner {
  constructor(config = {}) {
    this.config = {
      appName: config.appName || 'Smart Hub',
      appIcon: config.appIcon || 'https://via.placeholder.com/80x80?text=App',
      appDescription: config.appDescription || 'Find your dream property on the go',
      iosAppId: config.iosAppId || '123456789',
      androidPackage: config.androidPackage || 'com.smarthub.app',
      showDelay: config.showDelay || 2000, // 2 seconds
      dismissDays: config.dismissDays || 7, // Don't show again for 7 days
      closeButtonText: config.closeButtonText || '×',
      dontShowText: config.dontShowText || "Don't show again",
      ...config
    };

    this.storageKey = 'smarthub_app_banner_dismissed';
    this.device = this.detectDevice();
    this.init();
  }

  /**
   * Detect device type
   */
  detectDevice() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return {
        type: 'ios',
        name: 'iOS',
        store: 'App Store',
        icon: '🍎',
        url: `https://apps.apple.com/app/id${this.config.iosAppId}`
      };
    }

    // Android detection
    if (/android/i.test(userAgent)) {
      return {
        type: 'android',
        name: 'Android',
        store: 'Google Play',
        icon: '🤖',
        url: `https://play.google.com/store/apps/details?id=${this.config.androidPackage}`
      };
    }

    // Not mobile
    return null;
  }

  /**
   * Initialize banner
   */
  init() {
    // Don't show if:
    // 1. Not on mobile device
    // 2. Already dismissed
    // 3. Already in app (standalone mode)
    if (!this.device) {
      console.log('[AppBanner] Not a mobile device');
      return;
    }

    if (this.isStandalone()) {
      console.log('[AppBanner] Already in app');
      return;
    }

    if (this.isDismissed()) {
      console.log('[AppBanner] Banner dismissed');
      return;
    }

    // Show banner after delay
    setTimeout(() => {
      this.show();
    }, this.config.showDelay);
  }

  /**
   * Check if running as standalone app
   */
  isStandalone() {
    return window.navigator.standalone === true || 
           window.matchMedia('(display-mode: standalone)').matches;
  }

  /**
   * Check if banner was dismissed
   */
  isDismissed() {
    try {
      const dismissed = localStorage.getItem(this.storageKey);
      if (!dismissed) return false;

      const dismissedDate = new Date(dismissed);
      const now = new Date();
      const daysPassed = (now - dismissedDate) / (1000 * 60 * 60 * 24);

      return daysPassed < this.config.dismissDays;
    } catch (error) {
      console.error('[AppBanner] Error checking dismissal:', error);
      return false;
    }
  }

  /**
   * Show banner
   */
  show() {
    // Remove existing banner if any
    const existing = document.getElementById('mobile-app-banner');
    if (existing) existing.remove();

    // Create banner
    const banner = this.createBanner();
    document.body.insertBefore(banner, document.body.firstChild);

    // Trigger animation
    setTimeout(() => {
      banner.classList.add('mobile-app-banner--visible');
    }, 100);

    // Track analytics
    if (typeof analytics !== 'undefined') {
      analytics.trackPageView('app-banner-shown');
    }
  }

  /**
   * Create banner HTML
   */
  createBanner() {
    const banner = document.createElement('div');
    banner.id = 'mobile-app-banner';
    banner.className = 'mobile-app-banner';
    
    banner.innerHTML = `
      <div class="mobile-app-banner__content">
        <button class="mobile-app-banner__close" onclick="mobileAppBanner.close()">
          ${this.config.closeButtonText}
        </button>
        
        <div class="mobile-app-banner__icon">
          <img src="${this.config.appIcon}" alt="${this.config.appName}">
        </div>
        
        <div class="mobile-app-banner__info">
          <div class="mobile-app-banner__title">${this.config.appName}</div>
          <div class="mobile-app-banner__description">${this.config.appDescription}</div>
          <div class="mobile-app-banner__store">
            <span class="mobile-app-banner__store-icon">${this.device.icon}</span>
            <span>${this.device.store}</span>
          </div>
        </div>
        
        <div class="mobile-app-banner__actions">
          <a 
            href="${this.device.url}" 
            class="mobile-app-banner__button"
            onclick="mobileAppBanner.trackInstall()"
            target="_blank"
            rel="noopener noreferrer"
          >
            GET
          </a>
        </div>
      </div>
      
      <div class="mobile-app-banner__footer">
        <button 
          class="mobile-app-banner__dont-show" 
          onclick="mobileAppBanner.dismiss()"
        >
          ${this.config.dontShowText}
        </button>
      </div>
    `;

    return banner;
  }

  /**
   * Close banner (temporary)
   */
  close() {
    const banner = document.getElementById('mobile-app-banner');
    if (banner) {
      banner.classList.remove('mobile-app-banner--visible');
      setTimeout(() => banner.remove(), 300);
    }

    // Track analytics
    if (typeof analytics !== 'undefined') {
      analytics.trackPageView('app-banner-closed');
    }
  }

  /**
   * Dismiss banner permanently
   */
  dismiss() {
    try {
      localStorage.setItem(this.storageKey, new Date().toISOString());
    } catch (error) {
      console.error('[AppBanner] Error dismissing:', error);
    }

    this.close();

    // Track analytics
    if (typeof analytics !== 'undefined') {
      analytics.trackPageView('app-banner-dismissed');
    }

    this.showToast("We won't show this again for a week", 'info');
  }

  /**
   * Track install click
   */
  trackInstall() {
    // Track analytics
    if (typeof analytics !== 'undefined') {
      analytics.trackPageView('app-install-clicked');
    }

    console.log('[AppBanner] Install button clicked');
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('app-banner-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'app-banner-toast-container';
      container.className = 'app-banner-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `app-banner-toast app-banner-toast--${type}`;
    
    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    toast.innerHTML = `
      <span class="app-banner-toast__icon">${icons[type] || 'ℹ'}</span>
      <span class="app-banner-toast__message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('app-banner-toast--visible'), 10);

    setTimeout(() => {
      toast.classList.remove('app-banner-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Manually show banner (for testing)
   */
  forceShow() {
    localStorage.removeItem(this.storageKey);
    this.show();
  }
}

// Initialize global instance with default config
const mobileAppBanner = new MobileAppBanner({
  appName: 'Smart Hub',
  appDescription: 'Find your dream property on the go',
  appIcon: 'favicon.png', // Use your app icon
  iosAppId: '123456789', // Replace with your actual iOS App ID
  androidPackage: 'com.smarthub.app', // Replace with your actual Android package name
  showDelay: 2000, // Show after 2 seconds
  dismissDays: 7 // Don't show again for 7 days
});

// Make available globally
if (typeof window !== 'undefined') {
  window.mobileAppBanner = mobileAppBanner;
}

console.log('[AppBanner] System loaded - v1.0');
console.log('[AppBanner] Device:', mobileAppBanner.device?.name || 'Desktop');
