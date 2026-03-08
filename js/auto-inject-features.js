/**
 * SmartHub Auto-Inject Features
 * Automatically adds all SmartHub features to existing pages
 * NO MANUAL HTML EDITING REQUIRED!
 * 
 * Just include this script: <script src="js/auto-inject-features.js"></script>
 */

(function() {
  'use strict';
  
  console.log('[SmartHub Auto-Inject] Initializing...');
  
  // ========================================
  // CONFIGURATION
  // ========================================
  
  const SMARTHUB_AUTO_CONFIG = {
    // CSS files to load
    cssFiles: [
      'css/favorites.css',
      'css/comparison.css',
      'css/alerts.css',
      'css/analytics.css',
      'css/dark-mode.css',
      'css/advanced-search.css',
      'css/mobile-app-banner.css',
      'css/print-friendly.css'
    ],
    
    // JavaScript files to load
    jsFiles: [
      'js/favorites.js',
      'js/comparison.js',
      'js/analytics.js',
      'js/dark-mode.js',
      'js/advanced-search.js',
      'js/mobile-app-banner.js'
    ],
    
    // Navigation items to inject
    navItems: [
      { href: 'favorites.html', icon: '❤️', label: 'Favorites', badge: 'favorites-counter', bgClass: 'bg-danger' },
      { href: 'comparison.html', icon: '⚖️', label: 'Compare', badge: 'comparison-counter', bgClass: 'bg-warning' },
      { href: 'alerts.html', icon: '🔔', label: 'Alerts', badge: null, bgClass: null },
      { href: 'analytics.html', icon: '📊', label: 'Analytics', badge: null, bgClass: null }
    ],
    
    // Selectors to try for navigation
    navSelectors: [
      'nav ul',
      '.navbar-nav',
      '.nav',
      '.navigation ul',
      'header nav ul',
      '.menu ul',
      '#main-nav ul'
    ],
    
    // Selectors to try for property cards
    propertyCardSelectors: [
      '.property-card',
      '.property-item',
      '.listing',
      '.property',
      '[data-property-id]',
      '.property-listing'
    ]
  };
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`link[href="${href}"]`)) {
        resolve();
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  
  function loadJS(src) {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  
  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found`));
      }, timeout);
    });
  }
  
  // ========================================
  // LOAD RESOURCES
  // ========================================
  
  async function loadResources() {
    console.log('[SmartHub Auto-Inject] Loading CSS files...');
    
    try {
      // Load all CSS files
      await Promise.all(SMARTHUB_AUTO_CONFIG.cssFiles.map(loadCSS));
      console.log('[SmartHub Auto-Inject] CSS files loaded');
      
      // Load JavaScript files sequentially (they may depend on each other)
      console.log('[SmartHub Auto-Inject] Loading JavaScript files...');
      for (const src of SMARTHUB_AUTO_CONFIG.jsFiles) {
        await loadJS(src);
      }
      console.log('[SmartHub Auto-Inject] JavaScript files loaded');
      
    } catch (error) {
      console.error('[SmartHub Auto-Inject] Error loading resources:', error);
    }
  }
  
  // ========================================
  // INJECT NAVIGATION
  // ========================================
  
  function injectNavigation() {
    console.log('[SmartHub Auto-Inject] Injecting navigation...');
    
    // Try to find navigation
    let navList = null;
    for (const selector of SMARTHUB_AUTO_CONFIG.navSelectors) {
      navList = document.querySelector(selector);
      if (navList) {
        console.log('[SmartHub Auto-Inject] Found navigation:', selector);
        break;
      }
    }
    
    if (!navList) {
      console.warn('[SmartHub Auto-Inject] Navigation not found. Skipping navigation injection.');
      return;
    }
    
    // Check if already injected OR if items already exist
    if (navList.querySelector('[data-smarthub-injected]')) {
      console.log('[SmartHub Auto-Inject] Navigation already injected');
      return;
    }
    
    // Check if navigation items already exist in the menu
    const existingFavorites = navList.querySelector('a[href*="favorites"]');
    const existingComparison = navList.querySelector('a[href*="comparison"]');
    const existingAlerts = navList.querySelector('a[href*="alerts"]');
    const existingAnalytics = navList.querySelector('a[href*="analytics"]');
    
    if (existingFavorites && existingComparison && existingAlerts && existingAnalytics) {
      console.log('[SmartHub Auto-Inject] Navigation items already exist in menu. Skipping injection.');
      
      // Just update the counters on existing elements
      updateExistingCounters();
      return;
    }
    
    // Inject navigation items only if they don't exist
    SMARTHUB_AUTO_CONFIG.navItems.forEach(item => {
      // Check if this specific item already exists
      const exists = navList.querySelector(`a[href="${item.href}"]`);
      if (exists) {
        console.log('[SmartHub Auto-Inject] Item already exists:', item.href);
        return; // Skip this item
      }
      
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.setAttribute('data-smarthub-injected', 'true');
      
      const badgeHTML = item.badge 
        ? ` <span class="badge ${item.bgClass} ${item.badge}">0</span>` 
        : '';
      
      li.innerHTML = `
        <a class="nav-link" href="${item.href}">
          ${item.icon} ${item.label}${badgeHTML}
        </a>
      `;
      
      navList.appendChild(li);
    });
    
    console.log('[SmartHub Auto-Inject] Navigation injected successfully');
  }
  
  // Update counters on existing navigation items
  function updateExistingCounters() {
    // Update favorites counter if it exists
    const favCounters = document.querySelectorAll('.favorites-counter');
    const favCount = localStorage.getItem('smarthub_favorites') 
      ? JSON.parse(localStorage.getItem('smarthub_favorites')).length 
      : 0;
    favCounters.forEach(counter => counter.textContent = favCount);
    
    // Update comparison counter if it exists
    const compCounters = document.querySelectorAll('.comparison-counter');
    const compCount = localStorage.getItem('smarthub_comparison') 
      ? JSON.parse(localStorage.getItem('smarthub_comparison')).length 
      : 0;
    compCounters.forEach(counter => counter.textContent = compCount);
    
    console.log('[SmartHub Auto-Inject] Updated existing counters');
  }
  
  // ========================================
  // INJECT PROPERTY CARD BUTTONS
  // ========================================
  
  function injectPropertyButtons() {
    console.log('[SmartHub Auto-Inject] Injecting property buttons...');
    
    // Try to find property cards
    let propertyCards = [];
    for (const selector of SMARTHUB_AUTO_CONFIG.propertyCardSelectors) {
      propertyCards = document.querySelectorAll(selector);
      if (propertyCards.length > 0) {
        console.log('[SmartHub Auto-Inject] Found', propertyCards.length, 'property cards:', selector);
        break;
      }
    }
    
    if (propertyCards.length === 0) {
      console.warn('[SmartHub Auto-Inject] No property cards found. Skipping button injection.');
      return;
    }
    
    // Inject buttons into each property card
    propertyCards.forEach((card, index) => {
      // Check if already injected
      if (card.querySelector('[data-smarthub-buttons]')) {
        return;
      }
      
      // Get property ID
      let propertyId = card.getAttribute('data-property-id');
      if (!propertyId) {
        // Try to extract from link
        const link = card.querySelector('a[href*="property"]');
        if (link) {
          const match = link.href.match(/property.*?([a-zA-Z0-9]+)$/);
          propertyId = match ? match[1] : `prop-${index}`;
        } else {
          propertyId = `prop-${index}`;
        }
      }
      
      // Get property name
      let propertyName = 'Property';
      const titleElement = card.querySelector('h3, h4, h5, .title, .property-title, .name');
      if (titleElement) {
        propertyName = titleElement.textContent.trim();
      }
      
      // Create buttons container
      const buttonsDiv = document.createElement('div');
      buttonsDiv.setAttribute('data-smarthub-buttons', 'true');
      buttonsDiv.style.cssText = 'position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; gap: 8px;';
      
      // Check if property is favorited
      const isFavorited = localStorage.getItem('smarthub_favorites') && 
                         JSON.parse(localStorage.getItem('smarthub_favorites')).includes(propertyId);
      
      buttonsDiv.innerHTML = `
        <button class="favorite-heart" 
                data-property-id="${propertyId}"
                data-property-name="${propertyName.replace(/'/g, "\\'")}"
                style="width: 40px; height: 40px; background: rgba(255,255,255,0.9); border: 2px solid #e5e7eb; border-radius: 50%; cursor: pointer; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
          ${isFavorited ? '❤️' : '🤍'}
        </button>
        <label class="comparison-checkbox" 
               style="width: 40px; height: 40px; background: rgba(255,255,255,0.9); border: 2px solid #e5e7eb; border-radius: 50%; cursor: pointer; font-size: 1.125rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
          <input type="checkbox" 
                 onchange="if(typeof propertyComparison !== 'undefined') propertyComparison.toggle('${propertyId}', this.checked); event.stopPropagation();"
                 style="display: none;">
          <span>☐</span>
        </label>
      `;
      
      // Add click handler to heart button
      const heartBtn = buttonsDiv.querySelector('.favorite-heart');
      heartBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        const propId = this.getAttribute('data-property-id');
        const propName = this.getAttribute('data-property-name');
        
        // Toggle favorite
        if (typeof favorites !== 'undefined') {
          favorites.toggle(propId, propName);
          
          // Update button immediately
          const isFav = favorites.has(propId);
          this.textContent = isFav ? '❤️' : '🤍';
          
          // Add animation
          this.style.transform = 'scale(1.2)';
          setTimeout(() => {
            this.style.transform = 'scale(1)';
          }, 200);
        }
      });
      
      // Make sure card has position relative
      if (getComputedStyle(card).position === 'static') {
        card.style.position = 'relative';
      }
      
      // Add buttons to card
      card.appendChild(buttonsDiv);
    });
    
    console.log('[SmartHub Auto-Inject] Property buttons injected successfully');
  }
  
  // ========================================
  // INJECT DARK MODE TOGGLE
  // ========================================
  
  function injectDarkModeToggle() {
    console.log('[SmartHub Auto-Inject] Injecting dark mode toggle...');
    
    // Check if already exists
    if (document.querySelector('.dark-mode-toggle')) {
      console.log('[SmartHub Auto-Inject] Dark mode toggle already exists');
      return;
    }
    
    // Create toggle button
    const toggle = document.createElement('button');
    toggle.className = 'dark-mode-toggle';
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.innerHTML = '🌙';
    toggle.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    toggle.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
    });
    
    toggle.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(toggle);
    console.log('[SmartHub Auto-Inject] Dark mode toggle injected');
  }
  
  // ========================================
  // INITIALIZE EVERYTHING
  // ========================================
  
  async function initialize() {
    try {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Load all resources
      await loadResources();
      
      // Small delay to ensure everything is loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Inject navigation
      injectNavigation();
      
      // Inject property buttons
      injectPropertyButtons();
      
      // Inject dark mode toggle
      injectDarkModeToggle();
      
      console.log('[SmartHub Auto-Inject] ✅ All features injected successfully!');
      
      // Dispatch custom event to notify other scripts
      window.dispatchEvent(new CustomEvent('smarthub-features-loaded'));
      
    } catch (error) {
      console.error('[SmartHub Auto-Inject] Initialization error:', error);
    }
  }
  
  // ========================================
  // START
  // ========================================
  
  initialize();
  
})();
