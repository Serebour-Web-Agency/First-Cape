// FirstCape Favorites System
// Version: 1.0
// Handles saving, removing, and managing favorite properties

class FavoritesManager {
  constructor() {
    this.storageKey = 'firstcape_favorites';
    this.favorites = this.loadFavorites();
    this.listeners = [];
  }

  /**
   * Load favorites from localStorage
   */
  loadFavorites() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Favorites] Error loading favorites:', error);
      return [];
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
      this.notifyListeners();
    } catch (error) {
      console.error('[Favorites] Error saving favorites:', error);
    }
  }

  /**
   * Add property to favorites
   */
  addFavorite(property) {
    // Check if already favorited
    if (this.isFavorite(property.id)) {
      console.log('[Favorites] Property already in favorites');
      return false;
    }

    const favorite = {
      id: property.id,
      name: property.name || 'Unnamed Property',
      price: property.price || 'Price on request',
      city: property.city || '',
      bedrooms: property.bedrooms || '',
      bathrooms: property.bathrooms || '',
      propertyType: property.propertyType || '',
      listingType: property.listingType || '',
      mainImage: property.cdnMainImage || property.mainImage || '/images/placeholder-property.jpg',
      savedAt: new Date().toISOString()
    };

    this.favorites.unshift(favorite); // Add to beginning
    this.saveFavorites();
    
    console.log('[Favorites] Added:', favorite.name);
    this.showToast(`Added "${favorite.name}" to favorites`, 'success');
    
    return true;
  }

  /**
   * Remove property from favorites
   */
  removeFavorite(propertyId) {
    const index = this.favorites.findIndex(f => f.id === propertyId);
    
    if (index === -1) {
      console.log('[Favorites] Property not in favorites');
      return false;
    }

    const removed = this.favorites.splice(index, 1)[0];
    this.saveFavorites();
    
    console.log('[Favorites] Removed:', removed.name);
    this.showToast(`Removed "${removed.name}" from favorites`, 'info');
    
    return true;
  }

  /**
   * Remove property (alias for compatibility)
   */
  remove(propertyId) {
    return this.removeFavorite(propertyId);
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(property) {
    if (this.isFavorite(property.id)) {
      return this.removeFavorite(property.id);
    } else {
      return this.addFavorite(property);
    }
  }

  /**
   * Toggle favorite (simple version - for compatibility)
   * Can be called with just propertyId and name
   */
  toggle(propertyId, propertyName = 'Property') {
    const property = {
      id: propertyId,
      name: propertyName
    };
    return this.toggleFavorite(property);
  }

  /**
   * Check if property is favorited
   */
  isFavorite(propertyId) {
    return this.favorites.some(f => f.id === propertyId);
  }

  /**
   * Get all favorite IDs (simple array - for compatibility)
   */
  getAll() {
    return this.favorites.map(f => f.id);
  }

  /**
   * Get all favorites (full objects with details)
   */
  getAllFavorites() {
    return [...this.favorites]; // Return copy
  }

  /**
   * Get favorites count
   */
  getCount() {
    return this.favorites.length;
  }

  /**
   * Clear all favorites
   */
  clearAll() {
    if (confirm('Are you sure you want to remove all favorites?')) {
      this.favorites = [];
      this.saveFavorites();
      this.showToast('All favorites cleared', 'info');
      return true;
    }
    return false;
  }

  /**
   * Sort favorites
   */
  sortBy(field, order = 'asc') {
    this.favorites.sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle price sorting (remove $ and commas)
      if (field === 'price') {
        aVal = parseFloat(aVal.replace(/[$,]/g, '')) || 0;
        bVal = parseFloat(bVal.replace(/[$,]/g, '')) || 0;
      }

      // Handle date sorting
      if (field === 'savedAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (order === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    this.notifyListeners();
  }

  /**
   * Export favorites as JSON
   */
  exportFavorites() {
    const data = {
      favorites: this.favorites,
      exportedAt: new Date().toISOString(),
      count: this.favorites.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firstcape-favorites-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Favorites exported', 'success');
  }

  /**
   * Share favorites via email
   */
  shareViaEmail() {
    const favoritesList = this.favorites.map((f, i) => 
      `${i + 1}. ${f.name} - ${f.price} (${f.city})`
    ).join('\n');

    const subject = encodeURIComponent('My Favorite Properties - FirstCape');
    const body = encodeURIComponent(
      `Here are my favorite properties from FirstCape Estate Management:\n\n` +
      `${favoritesList}\n\n` +
      `View all properties at: https://firstcapeestatemanagement.com/properties.html\n\n` +
      `Saved on: ${new Date().toLocaleDateString()}`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  /**
   * Add listener for changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.favorites);
      } catch (error) {
        console.error('[Favorites] Listener error:', error);
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    // Check if toast container exists
    let container = document.getElementById('favorites-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'favorites-toast-container';
      container.className = 'favorites-toast-container';
      document.body.appendChild(container);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `favorites-toast favorites-toast--${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
      <span class="favorites-toast__icon">${icon}</span>
      <span class="favorites-toast__message">${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('favorites-toast--visible'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('favorites-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize global favorites manager
const favoritesManager = new FavoritesManager();

// Make available globally with multiple names for compatibility
if (typeof window !== 'undefined') {
  window.favoritesManager = favoritesManager;
  window.favorites = favoritesManager; // Alias for compatibility
}

/**
 * Initialize heart icons on property cards
 */
function initFavoriteButtons() {
  document.querySelectorAll('[data-property-id]').forEach(card => {
    const propertyId = card.dataset.propertyId;
    
    // Skip if already initialized
    if (card.querySelector('.favorite-btn')) return;

    // Create heart button
    const btn = document.createElement('button');
    btn.className = 'favorite-btn';
    btn.setAttribute('aria-label', 'Add to favorites');
    btn.innerHTML = `
      <svg class="favorite-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    `;

    // Update state
    if (favoritesManager.isFavorite(propertyId)) {
      btn.classList.add('favorite-btn--active');
    }

    // Click handler
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Get property data from card
      const property = {
        id: propertyId,
        name: card.querySelector('.property-name')?.textContent || 'Property',
        price: card.querySelector('.property-price')?.textContent || '',
        city: card.querySelector('.property-city')?.textContent || '',
        bedrooms: card.dataset.bedrooms || '',
        bathrooms: card.dataset.bathrooms || '',
        propertyType: card.dataset.propertyType || '',
        listingType: card.dataset.listingType || '',
        cdnMainImage: card.querySelector('img')?.src || ''
      };

      // Toggle favorite
      favoritesManager.toggleFavorite(property);

      // Update button state
      btn.classList.toggle('favorite-btn--active');
      
      // Animate
      btn.classList.add('favorite-btn--animating');
      setTimeout(() => btn.classList.remove('favorite-btn--animating'), 300);
    });

    // Add button to card
    card.style.position = 'relative';
    card.appendChild(btn);
  });
}

/**
 * Update favorites counter in navigation
 */
function updateFavoritesCounter() {
  const counter = document.querySelector('.favorites-counter');
  if (counter) {
    const count = favoritesManager.getCount();
    counter.textContent = count;
    counter.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

// Listen for favorites changes
favoritesManager.addListener(() => {
  updateFavoritesCounter();
  
  // Update all heart buttons
  document.querySelectorAll('[data-property-id]').forEach(card => {
    const propertyId = card.dataset.propertyId;
    const btn = card.querySelector('.favorite-btn');
    
    if (btn) {
      if (favoritesManager.isFavorite(propertyId)) {
        btn.classList.add('favorite-btn--active');
      } else {
        btn.classList.remove('favorite-btn--active');
      }
    }
  });
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initFavoriteButtons();
    updateFavoritesCounter();
  });
} else {
  initFavoriteButtons();
  updateFavoritesCounter();
}

// Re-initialize when new properties are added dynamically
const observer = new MutationObserver(() => {
  initFavoriteButtons();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[Favorites] System loaded - v1.0');
console.log('[Favorites] Current favorites:', favoritesManager.getCount());
