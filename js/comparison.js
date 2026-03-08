// FirstCape Property Comparison System
// Version: 1.0
// Allows users to select and compare up to 3 properties side-by-side

class PropertyComparison {
  constructor() {
    this.storageKey = 'firstcape_comparison';
    this.maxProperties = 3;
    this.selectedProperties = this.loadFromStorage();
    this.listeners = [];
  }

  /**
   * Load selected properties from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Comparison] Error loading:', error);
      return [];
    }
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.selectedProperties));
      this.notifyListeners();
    } catch (error) {
      console.error('[Comparison] Error saving:', error);
    }
  }

  /**
   * Add property to comparison
   */
  addProperty(property) {
    // Check if already selected
    if (this.isSelected(property.id)) {
      console.log('[Comparison] Property already selected');
      return false;
    }

    // Check if at max limit
    if (this.selectedProperties.length >= this.maxProperties) {
      this.showToast(`Maximum ${this.maxProperties} properties can be compared`, 'warning');
      return false;
    }

    const comparisonProperty = {
      id: property.id,
      name: property.name || 'Unnamed Property',
      price: property.price || 0,
      city: property.city || '',
      state: property.state || '',
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      size: property.size || 0,
      propertyType: property.propertyType || '',
      listingType: property.listingType || '',
      yearBuilt: property.yearBuilt || '',
      mainImage: property.cdnMainImage || property.mainImage || '/images/placeholder-property.jpg',
      addedAt: new Date().toISOString()
    };

    this.selectedProperties.push(comparisonProperty);
    this.saveToStorage();
    
    console.log('[Comparison] Added:', comparisonProperty.name);
    this.showToast(`Added "${comparisonProperty.name}" to comparison`, 'success');
    
    return true;
  }

  /**
   * Remove property from comparison
   */
  removeProperty(propertyId) {
    const property = this.selectedProperties.find(p => p.id === propertyId);
    if (!property) return false;

    this.selectedProperties = this.selectedProperties.filter(p => p.id !== propertyId);
    this.saveToStorage();
    
    console.log('[Comparison] Removed:', property.name);
    this.showToast(`Removed "${property.name}" from comparison`, 'info');
    
    return true;
  }

  /**
   * Check if property is selected
   */
  isSelected(propertyId) {
    return this.selectedProperties.some(p => p.id === propertyId);
  }

  /**
   * Get all selected properties
   */
  getSelected() {
    return [...this.selectedProperties];
  }

  /**
   * Get count of selected properties
   */
  getCount() {
    return this.selectedProperties.length;
  }

  /**
   * Clear all selected properties
   */
  clearAll() {
    if (confirm('Remove all properties from comparison?')) {
      this.selectedProperties = [];
      this.saveToStorage();
      this.showToast('Comparison cleared', 'info');
      return true;
    }
    return false;
  }

  /**
   * Can add more properties?
   */
  canAddMore() {
    return this.selectedProperties.length < this.maxProperties;
  }

  /**
   * Add listener for changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.selectedProperties);
      } catch (error) {
        console.error('[Comparison] Listener error:', error);
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('comparison-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'comparison-toast-container';
      container.className = 'comparison-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `comparison-toast comparison-toast--${type}`;
    
    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    toast.innerHTML = `
      <span class="comparison-toast__icon">${icons[type] || 'ℹ'}</span>
      <span class="comparison-toast__message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('comparison-toast--visible'), 10);

    setTimeout(() => {
      toast.classList.remove('comparison-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize global instance
const comparisonManager = new PropertyComparison();

// Make available globally
if (typeof window !== 'undefined') {
  window.comparisonManager = comparisonManager;
}

/**
 * Initialize comparison checkboxes on property cards
 */
function initComparisonCheckboxes() {
  document.querySelectorAll('[data-property-id]').forEach(card => {
    const propertyId = card.dataset.propertyId;
    
    // Skip if already has checkbox
    if (card.querySelector('.comparison-checkbox')) return;

    // Create checkbox container
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'comparison-checkbox-container';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'comparison-checkbox';
    checkbox.id = `compare-${propertyId}`;
    checkbox.checked = comparisonManager.isSelected(propertyId);
    
    const label = document.createElement('label');
    label.htmlFor = `compare-${propertyId}`;
    label.className = 'comparison-checkbox-label';
    label.innerHTML = '<span>Compare</span>';
    
    // Click handler
    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      
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
      
      if (checkbox.checked) {
        if (!comparisonManager.addProperty(property)) {
          checkbox.checked = false;
        }
      } else {
        comparisonManager.removeProperty(propertyId);
      }
    });
    
    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    
    // Add to card (bottom-left corner)
    card.style.position = 'relative';
    card.appendChild(checkboxContainer);
  });
}

/**
 * Create and show comparison bar
 */
function showComparisonBar() {
  let bar = document.getElementById('comparison-bar');
  
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'comparison-bar';
    bar.className = 'comparison-bar';
    document.body.appendChild(bar);
  }

  const count = comparisonManager.getCount();
  
  if (count === 0) {
    bar.classList.remove('comparison-bar--visible');
    return;
  }

  const selected = comparisonManager.getSelected();
  
  bar.innerHTML = `
    <div class="comparison-bar__content">
      <div class="comparison-bar__info">
        <strong>${count} ${count === 1 ? 'property' : 'properties'}</strong> selected for comparison
        ${count < comparisonManager.maxProperties ? `<span class="comparison-bar__hint">(Select up to ${comparisonManager.maxProperties})</span>` : ''}
      </div>
      
      <div class="comparison-bar__properties">
        ${selected.map(property => `
          <div class="comparison-bar__property">
            <img src="${property.mainImage}" alt="${property.name}" onerror="this.src='/images/placeholder-property.jpg'">
            <span>${property.name}</span>
            <button 
              class="comparison-bar__remove" 
              onclick="comparisonManager.removeProperty('${property.id}')"
              aria-label="Remove ${property.name}">×</button>
          </div>
        `).join('')}
      </div>
      
      <div class="comparison-bar__actions">
        ${count >= 2 ? `
          <a href="comparison.html" class="comparison-bar__btn comparison-bar__btn--primary">
            Compare Now
          </a>
        ` : `
          <button class="comparison-bar__btn comparison-bar__btn--disabled" disabled>
            Select ${2 - count} more to compare
          </button>
        `}
        <button 
          class="comparison-bar__btn comparison-bar__btn--secondary" 
          onclick="comparisonManager.clearAll()">
          Clear All
        </button>
      </div>
    </div>
  `;

  bar.classList.add('comparison-bar--visible');
}

/**
 * Update comparison bar and checkboxes
 */
function updateComparisonUI() {
  showComparisonBar();
  
  // Update all checkboxes
  document.querySelectorAll('[data-property-id]').forEach(card => {
    const propertyId = card.dataset.propertyId;
    const checkbox = card.querySelector('.comparison-checkbox');
    
    if (checkbox) {
      checkbox.checked = comparisonManager.isSelected(propertyId);
      
      // Disable if at max and not selected
      if (!comparisonManager.canAddMore() && !checkbox.checked) {
        checkbox.disabled = true;
        checkbox.parentElement.classList.add('comparison-checkbox-container--disabled');
      } else {
        checkbox.disabled = false;
        checkbox.parentElement.classList.remove('comparison-checkbox-container--disabled');
      }
    }
  });
}

// Listen for comparison changes
comparisonManager.addListener(() => {
  updateComparisonUI();
});

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initComparisonCheckboxes();
    updateComparisonUI();
  });
} else {
  initComparisonCheckboxes();
  updateComparisonUI();
}

// Re-initialize when new properties are added
const comparisonObserver = new MutationObserver(() => {
  initComparisonCheckboxes();
  updateComparisonUI();
});

comparisonObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[Comparison] System loaded - v1.0');
console.log('[Comparison] Current selection:', comparisonManager.getCount());
