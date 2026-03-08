// SmartHub Advanced Search Filters
// Version: 1.0
// Powerful search and filtering system for properties

class AdvancedSearch {
  constructor() {
    this.storageKey = 'smarthub_search_filters';
    this.savedSearchesKey = 'smarthub_saved_searches';
    this.filters = this.loadFilters();
    this.savedSearches = this.loadSavedSearches();
    this.listeners = [];
  }

  /**
   * Load filters from localStorage
   */
  loadFilters() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultFilters();
    } catch (error) {
      console.error('[Search] Error loading filters:', error);
      return this.getDefaultFilters();
    }
  }

  /**
   * Get default filters
   */
  getDefaultFilters() {
    return {
      priceMin: 0,
      priceMax: 0,
      propertyTypes: [],
      listingTypes: [],
      bedroomsMin: 0,
      bathroomsMin: 0,
      sizeMin: 0,
      sizeMax: 0,
      amenities: [],
      petFriendly: false,
      furnished: 'any', // any, furnished, unfurnished
      availableFrom: null,
      locations: [],
      sortBy: 'newest' // newest, oldest, price-low, price-high, popular
    };
  }

  /**
   * Update filters
   */
  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.saveFilters();
    this.notifyListeners();
  }

  /**
   * Reset filters
   */
  resetFilters() {
    this.filters = this.getDefaultFilters();
    this.saveFilters();
    this.notifyListeners();
  }

  /**
   * Save filters to localStorage
   */
  saveFilters() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.filters));
    } catch (error) {
      console.error('[Search] Error saving filters:', error);
    }
  }

  /**
   * Get current filters
   */
  getFilters() {
    return { ...this.filters };
  }

  /**
   * Filter properties based on current filters
   */
  filterProperties(properties) {
    let filtered = [...properties];

    // Price range
    if (this.filters.priceMin > 0) {
      filtered = filtered.filter(p => p.price >= this.filters.priceMin);
    }
    if (this.filters.priceMax > 0) {
      filtered = filtered.filter(p => p.price <= this.filters.priceMax);
    }

    // Property types
    if (this.filters.propertyTypes.length > 0) {
      filtered = filtered.filter(p => 
        this.filters.propertyTypes.includes(p.propertyType)
      );
    }

    // Listing types
    if (this.filters.listingTypes.length > 0) {
      filtered = filtered.filter(p => 
        this.filters.listingTypes.includes(p.listingType)
      );
    }

    // Bedrooms
    if (this.filters.bedroomsMin > 0) {
      filtered = filtered.filter(p => p.bedrooms >= this.filters.bedroomsMin);
    }

    // Bathrooms
    if (this.filters.bathroomsMin > 0) {
      filtered = filtered.filter(p => p.bathrooms >= this.filters.bathroomsMin);
    }

    // Size range
    if (this.filters.sizeMin > 0) {
      filtered = filtered.filter(p => (p.size || 0) >= this.filters.sizeMin);
    }
    if (this.filters.sizeMax > 0) {
      filtered = filtered.filter(p => (p.size || 0) <= this.filters.sizeMax);
    }

    // Amenities
    if (this.filters.amenities.length > 0) {
      filtered = filtered.filter(p => {
        const propertyAmenities = p.amenities || [];
        return this.filters.amenities.every(amenity => 
          propertyAmenities.includes(amenity)
        );
      });
    }

    // Pet friendly
    if (this.filters.petFriendly) {
      filtered = filtered.filter(p => p.petFriendly === true);
    }

    // Furnished
    if (this.filters.furnished !== 'any') {
      filtered = filtered.filter(p => {
        if (this.filters.furnished === 'furnished') {
          return p.furnished === true;
        } else {
          return p.furnished === false || p.furnished === undefined;
        }
      });
    }

    // Locations
    if (this.filters.locations.length > 0) {
      filtered = filtered.filter(p => {
        const propertyLocation = (p.city + ' ' + p.state).toLowerCase();
        return this.filters.locations.some(loc => 
          propertyLocation.includes(loc.toLowerCase())
        );
      });
    }

    // Sort
    filtered = this.sortProperties(filtered, this.filters.sortBy);

    return filtered;
  }

  /**
   * Sort properties
   */
  sortProperties(properties, sortBy) {
    const sorted = [...properties];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdDate || 0) - new Date(a.createdDate || 0)
        );
      
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.createdDate || 0) - new Date(b.createdDate || 0)
        );
      
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      
      case 'popular':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      
      default:
        return sorted;
    }
  }

  /**
   * Save current search
   */
  saveSearch(name) {
    const search = {
      id: 'search_' + Date.now(),
      name: name || 'Saved Search',
      filters: { ...this.filters },
      createdAt: new Date().toISOString()
    };

    this.savedSearches.unshift(search);
    
    // Keep only last 10
    if (this.savedSearches.length > 10) {
      this.savedSearches = this.savedSearches.slice(0, 10);
    }

    this.saveSavedSearches();
    this.showToast('Search saved successfully!', 'success');
    return search;
  }

  /**
   * Load saved searches
   */
  loadSavedSearches() {
    try {
      const stored = localStorage.getItem(this.savedSearchesKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Search] Error loading saved searches:', error);
      return [];
    }
  }

  /**
   * Save saved searches
   */
  saveSavedSearches() {
    try {
      localStorage.setItem(this.savedSearchesKey, JSON.stringify(this.savedSearches));
    } catch (error) {
      console.error('[Search] Error saving searches:', error);
    }
  }

  /**
   * Get saved searches
   */
  getSavedSearches() {
    return [...this.savedSearches];
  }

  /**
   * Load saved search
   */
  loadSavedSearch(searchId) {
    const search = this.savedSearches.find(s => s.id === searchId);
    if (search) {
      this.filters = { ...search.filters };
      this.saveFilters();
      this.notifyListeners();
      this.showToast(`Loaded: ${search.name}`, 'info');
      return true;
    }
    return false;
  }

  /**
   * Delete saved search
   */
  deleteSavedSearch(searchId) {
    this.savedSearches = this.savedSearches.filter(s => s.id !== searchId);
    this.saveSavedSearches();
    this.showToast('Search deleted', 'info');
  }

  /**
   * Get active filter count
   */
  getActiveFilterCount() {
    let count = 0;
    const defaults = this.getDefaultFilters();

    if (this.filters.priceMin > defaults.priceMin) count++;
    if (this.filters.priceMax > defaults.priceMax) count++;
    if (this.filters.propertyTypes.length > 0) count++;
    if (this.filters.listingTypes.length > 0) count++;
    if (this.filters.bedroomsMin > defaults.bedroomsMin) count++;
    if (this.filters.bathroomsMin > defaults.bathroomsMin) count++;
    if (this.filters.sizeMin > defaults.sizeMin) count++;
    if (this.filters.sizeMax > defaults.sizeMax) count++;
    if (this.filters.amenities.length > 0) count++;
    if (this.filters.petFriendly !== defaults.petFriendly) count++;
    if (this.filters.furnished !== defaults.furnished) count++;
    if (this.filters.locations.length > 0) count++;

    return count;
  }

  /**
   * Create alert from current search
   */
  createAlertFromSearch() {
    const alertData = {
      location: this.filters.locations.join(', ') || 'Any location',
      priceMin: this.filters.priceMin,
      priceMax: this.filters.priceMax,
      propertyType: this.filters.propertyTypes[0] || 'Any',
      listingType: this.filters.listingTypes[0] || 'Any',
      bedrooms: this.filters.bedroomsMin,
      bathrooms: this.filters.bathroomsMin
    };

    // Open alert modal with prefilled data
    if (typeof openCreateAlertModal === 'function') {
      openCreateAlertModal(alertData);
    } else {
      console.warn('[Search] Alert modal function not available');
    }
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
        callback(this.filters);
      } catch (error) {
        console.error('[Search] Listener error:', error);
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('search-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'search-toast-container';
      container.className = 'search-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `search-toast search-toast--${type}`;
    
    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    toast.innerHTML = `
      <span class="search-toast__icon">${icons[type] || 'ℹ'}</span>
      <span class="search-toast__message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('search-toast--visible'), 10);

    setTimeout(() => {
      toast.classList.remove('search-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize global instance
const advancedSearch = new AdvancedSearch();

// Make available globally
if (typeof window !== 'undefined') {
  window.advancedSearch = advancedSearch;
}

/**
 * Open advanced search panel
 */
function openAdvancedSearch() {
  const existing = document.getElementById('advanced-search-panel');
  if (existing) {
    existing.classList.add('advanced-search-panel--visible');
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'advanced-search-panel';
  panel.className = 'advanced-search-panel';
  
  panel.innerHTML = `
    <div class="advanced-search-overlay" onclick="closeAdvancedSearch()"></div>
    <div class="advanced-search-content">
      <div class="advanced-search-header">
        <h2>🔍 Advanced Search</h2>
        <button class="advanced-search-close" onclick="closeAdvancedSearch()">×</button>
      </div>
      
      <div class="advanced-search-body" id="searchFiltersBody">
        ${renderSearchFilters()}
      </div>
      
      <div class="advanced-search-footer">
        <button class="search-btn search-btn--secondary" onclick="advancedSearch.resetFilters(); updateSearchUI();">
          Reset All
        </button>
        <button class="search-btn search-btn--primary" onclick="applySearch()">
          Apply Filters (<span id="filterCount">0</span>)
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(panel);
  setTimeout(() => panel.classList.add('advanced-search-panel--visible'), 10);
  
  updateSearchUI();
}

/**
 * Close advanced search panel
 */
function closeAdvancedSearch() {
  const panel = document.getElementById('advanced-search-panel');
  if (panel) {
    panel.classList.remove('advanced-search-panel--visible');
    setTimeout(() => panel.remove(), 300);
  }
}

/**
 * Render search filters
 */
function renderSearchFilters() {
  const filters = advancedSearch.getFilters();
  
  return `
    <!-- Price Range -->
    <div class="search-filter-group">
      <h3>💰 Price Range</h3>
      <div class="search-filter-row">
        <input 
          type="number" 
          id="priceMin" 
          placeholder="Min Price" 
          value="${filters.priceMin || ''}"
          class="search-input"
        >
        <span>to</span>
        <input 
          type="number" 
          id="priceMax" 
          placeholder="Max Price" 
          value="${filters.priceMax || ''}"
          class="search-input"
        >
      </div>
    </div>

    <!-- Property Type -->
    <div class="search-filter-group">
      <h3>🏠 Property Type</h3>
      <div class="search-checkboxes">
        ${['Residential', 'Apartment', 'House', 'Condo', 'Commercial', 'Mixed-Use', 'Land'].map(type => `
          <label class="search-checkbox">
            <input 
              type="checkbox" 
              value="${type}"
              ${filters.propertyTypes.includes(type) ? 'checked' : ''}
              onchange="togglePropertyType('${type}')"
            >
            <span>${type}</span>
          </label>
        `).join('')}
      </div>
    </div>

    <!-- Listing Type -->
    <div class="search-filter-group">
      <h3>📋 Listing Type</h3>
      <div class="search-checkboxes">
        <label class="search-checkbox">
          <input 
            type="checkbox" 
            value="Buy"
            ${filters.listingTypes.includes('Buy') ? 'checked' : ''}
            onchange="toggleListingType('Buy')"
          >
          <span>For Sale</span>
        </label>
        <label class="search-checkbox">
          <input 
            type="checkbox" 
            value="Rent"
            ${filters.listingTypes.includes('Rent') ? 'checked' : ''}
            onchange="toggleListingType('Rent')"
          >
          <span>For Rent</span>
        </label>
      </div>
    </div>

    <!-- Bedrooms & Bathrooms -->
    <div class="search-filter-group">
      <h3>🛏️ Bedrooms & Bathrooms</h3>
      <div class="search-filter-row">
        <div>
          <label>Min Bedrooms</label>
          <select id="bedroomsMin" class="search-select" onchange="updateBedrooms(this.value)">
            ${[0,1,2,3,4,5].map(n => `
              <option value="${n}" ${filters.bedroomsMin === n ? 'selected' : ''}>
                ${n === 0 ? 'Any' : n + '+'}
              </option>
            `).join('')}
          </select>
        </div>
        <div>
          <label>Min Bathrooms</label>
          <select id="bathroomsMin" class="search-select" onchange="updateBathrooms(this.value)">
            ${[0,1,2,3,4].map(n => `
              <option value="${n}" ${filters.bathroomsMin === n ? 'selected' : ''}>
                ${n === 0 ? 'Any' : n + '+'}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- Amenities -->
    <div class="search-filter-group">
      <h3>✨ Amenities</h3>
      <div class="search-checkboxes">
        ${['Pool', 'Parking', 'Garden', 'Gym', 'Security', 'Elevator'].map(amenity => `
          <label class="search-checkbox">
            <input 
              type="checkbox" 
              value="${amenity}"
              ${filters.amenities.includes(amenity) ? 'checked' : ''}
              onchange="toggleAmenity('${amenity}')"
            >
            <span>${amenity}</span>
          </label>
        `).join('')}
      </div>
    </div>

    <!-- Pet Friendly & Furnished -->
    <div class="search-filter-group">
      <h3>🏡 Additional Preferences</h3>
      <label class="search-checkbox">
        <input 
          type="checkbox" 
          id="petFriendly"
          ${filters.petFriendly ? 'checked' : ''}
          onchange="togglePetFriendly(this.checked)"
        >
        <span>🐕 Pet Friendly</span>
      </label>
      
      <div style="margin-top: 12px;">
        <label>Furnishing</label>
        <select id="furnished" class="search-select" onchange="updateFurnished(this.value)">
          <option value="any" ${filters.furnished === 'any' ? 'selected' : ''}>Any</option>
          <option value="furnished" ${filters.furnished === 'furnished' ? 'selected' : ''}>Furnished</option>
          <option value="unfurnished" ${filters.furnished === 'unfurnished' ? 'selected' : ''}>Unfurnished</option>
        </select>
      </div>
    </div>
  `;
}

/**
 * Update search UI
 */
function updateSearchUI() {
  const count = advancedSearch.getActiveFilterCount();
  const counter = document.getElementById('filterCount');
  if (counter) {
    counter.textContent = count;
  }

  // Update active filters badge
  const badges = document.querySelectorAll('.search-filter-badge');
  badges.forEach(badge => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  });
}

/**
 * Toggle functions
 */
function togglePropertyType(type) {
  const filters = advancedSearch.getFilters();
  const index = filters.propertyTypes.indexOf(type);
  
  if (index > -1) {
    filters.propertyTypes.splice(index, 1);
  } else {
    filters.propertyTypes.push(type);
  }
  
  advancedSearch.updateFilters({ propertyTypes: filters.propertyTypes });
  updateSearchUI();
}

function toggleListingType(type) {
  const filters = advancedSearch.getFilters();
  const index = filters.listingTypes.indexOf(type);
  
  if (index > -1) {
    filters.listingTypes.splice(index, 1);
  } else {
    filters.listingTypes.push(type);
  }
  
  advancedSearch.updateFilters({ listingTypes: filters.listingTypes });
  updateSearchUI();
}

function toggleAmenity(amenity) {
  const filters = advancedSearch.getFilters();
  const index = filters.amenities.indexOf(amenity);
  
  if (index > -1) {
    filters.amenities.splice(index, 1);
  } else {
    filters.amenities.push(amenity);
  }
  
  advancedSearch.updateFilters({ amenities: filters.amenities });
  updateSearchUI();
}

function updateBedrooms(value) {
  advancedSearch.updateFilters({ bedroomsMin: parseInt(value) });
  updateSearchUI();
}

function updateBathrooms(value) {
  advancedSearch.updateFilters({ bathroomsMin: parseInt(value) });
  updateSearchUI();
}

function togglePetFriendly(checked) {
  advancedSearch.updateFilters({ petFriendly: checked });
  updateSearchUI();
}

function updateFurnished(value) {
  advancedSearch.updateFilters({ furnished: value });
  updateSearchUI();
}

/**
 * Apply search and reload properties
 */
function applySearch() {
  // Get price inputs
  const priceMin = parseInt(document.getElementById('priceMin')?.value) || 0;
  const priceMax = parseInt(document.getElementById('priceMax')?.value) || 0;
  
  advancedSearch.updateFilters({ priceMin, priceMax });
  
  closeAdvancedSearch();
  
  // Trigger property reload
  if (typeof reloadProperties === 'function') {
    reloadProperties();
  } else {
    location.reload();
  }
}

console.log('[Search] Advanced search system loaded - v1.0');
console.log('[Search] Active filters:', advancedSearch.getActiveFilterCount());
