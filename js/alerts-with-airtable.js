// FirstCape Property Alerts System with Airtable Integration
// Version: 2.0
// Saves alerts to both localStorage AND Airtable for cross-device access and automation

class PropertyAlerts {
  constructor() {
    this.storageKey = 'firstcape_alerts';
    this.maxProperties = 3;
    this.alerts = this.loadFromStorage();
    this.listeners = [];
    this.userEmail = this.loadUserEmail(); // Track user's email for fetching their alerts
  }

  /**
   * Load alerts from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[Alerts] Error loading:', error);
      return [];
    }
  }

  /**
   * Load user email from localStorage
   */
  loadUserEmail() {
    try {
      return localStorage.getItem('firstcape_user_email') || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save user email to localStorage
   */
  saveUserEmail(email) {
    try {
      if (email) {
        localStorage.setItem('firstcape_user_email', email);
        this.userEmail = email;
      }
    } catch (error) {
      console.error('[Alerts] Error saving email:', error);
    }
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.alerts));
      this.notifyListeners();
    } catch (error) {
      console.error('[Alerts] Error saving:', error);
    }
  }

  /**
   * Create new alert (saves to BOTH localStorage AND Airtable)
   */
  async createAlert(alertData) {
    // Validate required fields
    if (!alertData.location) {
      this.showToast('Location is required', 'error');
      return false;
    }

    if (!alertData.email) {
      this.showToast('Email is required for notifications', 'error');
      return false;
    }

    const alert = {
      id: this.generateId(),
      location: alertData.location || '',
      priceMin: alertData.priceMin || 0,
      priceMax: alertData.priceMax || 0,
      propertyType: alertData.propertyType || 'Any',
      listingType: alertData.listingType || 'Any',
      bedrooms: alertData.bedrooms || 0,
      bathrooms: alertData.bathrooms || 0,
      email: alertData.email || '',
      phone: alertData.phone || '',
      frequency: alertData.frequency || 'instant',
      active: true,
      createdAt: new Date().toISOString(),
      lastNotified: null,
      matchCount: 0,
      airtableRecordId: null // Will be set after Airtable save
    };

    // Save to localStorage first (immediate feedback)
    this.alerts.unshift(alert);
    this.saveToStorage();
    this.saveUserEmail(alert.email);

    console.log('[Alerts] Created locally:', alert);
    this.showToast('Creating alert...', 'info');

    // Save to Airtable
    try {
      const airtableRecordId = await this.saveAlertToAirtable(alert);
      
      if (airtableRecordId) {
        // Update local alert with Airtable record ID
        const index = this.alerts.findIndex(a => a.id === alert.id);
        if (index !== -1) {
          this.alerts[index].airtableRecordId = airtableRecordId;
          this.saveToStorage();
        }
        
        this.showToast('Alert created successfully! You\'ll receive email notifications.', 'success');
        console.log('[Alerts] Saved to Airtable:', airtableRecordId);
      } else {
        this.showToast('Alert created (local only - check your connection)', 'warning');
      }
    } catch (error) {
      console.error('[Alerts] Error saving to Airtable:', error);
      this.showToast('Alert saved locally. Will sync when connection is restored.', 'warning');
    }

    return alert;
  }

  /**
   * Save alert to Airtable
   */
  async saveAlertToAirtable(alert) {
    try {
      // Check if Airtable client is available
      if (typeof airtableClient === 'undefined') {
        console.warn('[Alerts] Airtable client not available');
        return null;
      }

      const config = FIRSTCAPE_CONFIG.airtable;
      
      // Prepare record data
      const fields = {
        'Email': alert.email,
        'Phone': alert.phone || '',
        'Location': alert.location,
        'Price Min': alert.priceMin,
        'Price Max': alert.priceMax,
        'Property Type': alert.propertyType,
        'Listing Type': alert.listingType,
        'Min Bedrooms': alert.bedrooms,
        'Min Bathrooms': alert.bathrooms,
        'Frequency': alert.frequency.charAt(0).toUpperCase() + alert.frequency.slice(1),
        'Status': 'Active',
        'Match Count': 0,
        'Total Notifications Sent': 0,
        'Source': 'Website'
      };

      // Create record in Airtable
      const record = await airtableClient.createRecord(config.tables.alerts, fields);
      
      return record.id;
    } catch (error) {
      console.error('[Alerts] Error saving to Airtable:', error);
      throw error;
    }
  }

  /**
   * Update alert in Airtable
   */
  async updateAlertInAirtable(alertId, updates) {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (!alert || !alert.airtableRecordId) {
        console.warn('[Alerts] Alert not found or no Airtable record ID');
        return false;
      }

      if (typeof airtableClient === 'undefined') {
        console.warn('[Alerts] Airtable client not available');
        return false;
      }

      const config = FIRSTCAPE_CONFIG.airtable;
      
      // Prepare update fields
      const fields = {};
      if (updates.active !== undefined) {
        fields['Status'] = updates.active ? 'Active' : 'Paused';
      }

      await airtableClient.updateRecord(config.tables.alerts, alert.airtableRecordId, fields);
      
      return true;
    } catch (error) {
      console.error('[Alerts] Error updating in Airtable:', error);
      return false;
    }
  }

  /**
   * Delete alert from Airtable
   */
  async deleteAlertFromAirtable(alertId) {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (!alert || !alert.airtableRecordId) {
        return false;
      }

      if (typeof airtableClient === 'undefined') {
        return false;
      }

      const config = FIRSTCAPE_CONFIG.airtable;
      
      // Mark as deleted (don't actually delete, for record keeping)
      await airtableClient.updateRecord(
        config.tables.alerts,
        alert.airtableRecordId,
        { 'Status': 'Deleted' }
      );
      
      return true;
    } catch (error) {
      console.error('[Alerts] Error deleting from Airtable:', error);
      return false;
    }
  }

  /**
   * Load alerts from Airtable for current user
   */
  async loadAlertsFromAirtable() {
    try {
      if (!this.userEmail) {
        console.log('[Alerts] No user email, skipping Airtable sync');
        return;
      }

      if (typeof airtableClient === 'undefined') {
        console.warn('[Alerts] Airtable client not available');
        return;
      }

      const config = FIRSTCAPE_CONFIG.airtable;
      
      // Fetch alerts for this email
      const records = await airtableClient.fetchRecords(
        config.tables.alerts,
        {
          filterByFormula: `AND({Email} = "${this.userEmail}", OR({Status} = "Active", {Status} = "Paused"))`,
          maxRecords: 100
        }
      );

      console.log('[Alerts] Loaded from Airtable:', records.length);

      // Sync with local storage
      records.forEach(record => {
        const airtableAlert = {
          id: record.id,
          airtableRecordId: record.id,
          location: record.fields['Location'] || '',
          priceMin: record.fields['Price Min'] || 0,
          priceMax: record.fields['Price Max'] || 0,
          propertyType: record.fields['Property Type'] || 'Any',
          listingType: record.fields['Listing Type'] || 'Any',
          bedrooms: record.fields['Min Bedrooms'] || 0,
          bathrooms: record.fields['Min Bathrooms'] || 0,
          email: record.fields['Email'] || '',
          phone: record.fields['Phone'] || '',
          frequency: (record.fields['Frequency'] || 'instant').toLowerCase(),
          active: record.fields['Status'] === 'Active',
          createdAt: record.fields['Created Date'] || new Date().toISOString(),
          lastNotified: record.fields['Last Notified'] || null,
          matchCount: record.fields['Match Count'] || 0
        };

        // Check if already in local storage
        const existingIndex = this.alerts.findIndex(a => a.airtableRecordId === record.id);
        
        if (existingIndex === -1) {
          // New alert from Airtable, add it
          this.alerts.push(airtableAlert);
        } else {
          // Update existing alert
          this.alerts[existingIndex] = airtableAlert;
        }
      });

      this.saveToStorage();
      
    } catch (error) {
      console.error('[Alerts] Error loading from Airtable:', error);
    }
  }

  /**
   * Update existing alert
   */
  async updateAlert(alertId, updates) {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index === -1) return false;

    this.alerts[index] = {
      ...this.alerts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveToStorage();
    
    // Update in Airtable
    await this.updateAlertInAirtable(alertId, updates);
    
    this.showToast('Alert updated successfully', 'success');
    return true;
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    if (confirm(`Delete alert for "${alert.location}"?`)) {
      // Delete from Airtable first
      await this.deleteAlertFromAirtable(alertId);
      
      // Then remove from local storage
      this.alerts = this.alerts.filter(a => a.id !== alertId);
      this.saveToStorage();
      this.showToast('Alert deleted', 'info');
      return true;
    }
    return false;
  }

  /**
   * Toggle alert active status
   */
  async toggleAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.active = !alert.active;
    this.saveToStorage();
    
    // Update in Airtable
    await this.updateAlertInAirtable(alertId, { active: alert.active });
    
    const status = alert.active ? 'activated' : 'paused';
    this.showToast(`Alert ${status}`, 'info');
    return true;
  }

  /**
   * Get all alerts
   */
  getAllAlerts() {
    return [...this.alerts];
  }

  /**
   * Get active alerts only
   */
  getActiveAlerts() {
    return this.alerts.filter(a => a.active);
  }

  /**
   * Get alert count
   */
  getCount() {
    return this.alerts.length;
  }

  /**
   * Get active alert count
   */
  getActiveCount() {
    return this.alerts.filter(a => a.active).length;
  }

  /**
   * Check if property matches any alerts
   */
  checkPropertyMatch(property) {
    const activeAlerts = this.getActiveAlerts();
    const matches = [];

    activeAlerts.forEach(alert => {
      if (this.doesPropertyMatch(property, alert)) {
        matches.push(alert);
      }
    });

    return matches;
  }

  /**
   * Check if property matches specific alert
   */
  doesPropertyMatch(property, alert) {
    // Location match (flexible - contains)
    const propertyLocation = (property.city + ' ' + property.state).toLowerCase();
    const alertLocation = alert.location.toLowerCase();
    if (!propertyLocation.includes(alertLocation)) {
      return false;
    }

    // Price match
    if (alert.priceMin > 0 && property.price < alert.priceMin) {
      return false;
    }
    if (alert.priceMax > 0 && property.price > alert.priceMax) {
      return false;
    }

    // Property type match
    if (alert.propertyType !== 'Any' && property.propertyType !== alert.propertyType) {
      return false;
    }

    // Listing type match
    if (alert.listingType !== 'Any' && property.listingType !== alert.listingType) {
      return false;
    }

    // Bedrooms match
    if (alert.bedrooms > 0 && property.bedrooms < alert.bedrooms) {
      return false;
    }

    // Bathrooms match
    if (alert.bathrooms > 0 && property.bathrooms < alert.bathrooms) {
      return false;
    }

    return true;
  }

  /**
   * Get properties matching alerts
   */
  getMatchingProperties(properties) {
    const activeAlerts = this.getActiveAlerts();
    const matches = [];

    properties.forEach(property => {
      activeAlerts.forEach(alert => {
        if (this.doesPropertyMatch(property, alert)) {
          matches.push({
            property,
            alert,
            alertId: alert.id
          });
        }
      });
    });

    // Update match counts
    activeAlerts.forEach(alert => {
      const count = matches.filter(m => m.alertId === alert.id).length;
      if (alert.matchCount !== count) {
        alert.matchCount = count;
      }
    });

    this.saveToStorage();

    return matches;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        callback(this.alerts);
      } catch (error) {
        console.error('[Alerts] Listener error:', error);
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('alerts-toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'alerts-toast-container';
      container.className = 'alerts-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alerts-toast alerts-toast--${type}`;
    
    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      error: '✕'
    };
    
    toast.innerHTML = `
      <span class="alerts-toast__icon">${icons[type] || 'ℹ'}</span>
      <span class="alerts-toast__message">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('alerts-toast--visible'), 10);

    setTimeout(() => {
      toast.classList.remove('alerts-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Export alerts
   */
  exportAlerts() {
    const data = {
      alerts: this.alerts,
      exportedAt: new Date().toISOString(),
      count: this.alerts.length
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firstcape-alerts-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.showToast('Alerts exported', 'success');
  }
}

// Initialize global instance
const alertsManager = new PropertyAlerts();

// Make available globally
if (typeof window !== 'undefined') {
  window.alertsManager = alertsManager;
}

// Load alerts from Airtable on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await alertsManager.loadAlertsFromAirtable();
    updateAlertsCounter();
  });
} else {
  alertsManager.loadAlertsFromAirtable().then(() => {
    updateAlertsCounter();
  });
}

/**
 * Open create alert modal
 */
function openCreateAlertModal(prefillData = {}) {
  // Remove existing modal if any
  const existing = document.getElementById('create-alert-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'create-alert-modal';
  modal.className = 'alert-modal-backdrop';
  
  modal.innerHTML = `
    <div class="alert-modal">
      <button class="alert-modal__close" onclick="closeCreateAlertModal()">×</button>
      
      <h2 class="alert-modal__title">🔔 Create Property Alert</h2>
      <p class="alert-modal__subtitle">Get email notifications when properties match your preferences</p>
      
      <form id="create-alert-form" class="alert-form">
        <div class="alert-form__row">
          <div class="alert-form__field">
            <label>Email * (for notifications)</label>
            <input 
              type="email" 
              name="email" 
              placeholder="your.email@example.com" 
              value="${prefillData.email || alertsManager.userEmail || ''}"
              required
            >
            <small style="color: #6b7280; font-size: 0.75rem;">We'll send you property matches at this email</small>
          </div>
        </div>
        
        <div class="alert-form__row">
          <div class="alert-form__field">
            <label>Location *</label>
            <input 
              type="text" 
              name="location" 
              placeholder="e.g. Accra, East Legon, Kumasi" 
              value="${prefillData.location || ''}"
              required
            >
          </div>
        </div>
        
        <div class="alert-form__row alert-form__row--2col">
          <div class="alert-form__field">
            <label>Min Price (GH₵)</label>
            <input 
              type="number" 
              name="priceMin" 
              placeholder="0"
              value="${prefillData.priceMin || ''}"
              min="0"
            >
          </div>
          <div class="alert-form__field">
            <label>Max Price (GH₵)</label>
            <input 
              type="number" 
              name="priceMax" 
              placeholder="No limit"
              value="${prefillData.priceMax || ''}"
              min="0"
            >
          </div>
        </div>
        
        <div class="alert-form__row alert-form__row--2col">
          <div class="alert-form__field">
            <label>Property Type</label>
            <select name="propertyType">
              <option value="Any">Any Type</option>
              <option value="Residential">Residential</option>
              <option value="Apartment">Apartment</option>
              <option value="House">House</option>
              <option value="Condo">Condo</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed-Use">Mixed-Use</option>
            </select>
          </div>
          <div class="alert-form__field">
            <label>Listing Type</label>
            <select name="listingType">
              <option value="Any">Buy or Rent</option>
              <option value="Buy">For Sale</option>
              <option value="Rent">For Rent</option>
            </select>
          </div>
        </div>
        
        <div class="alert-form__row alert-form__row--2col">
          <div class="alert-form__field">
            <label>Min Bedrooms</label>
            <select name="bedrooms">
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
          <div class="alert-form__field">
            <label>Min Bathrooms</label>
            <select name="bathrooms">
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>
        
        <div class="alert-form__row">
          <div class="alert-form__field">
            <label>Phone / WhatsApp (optional)</label>
            <input 
              type="tel" 
              name="phone" 
              placeholder="+233..."
              value="${prefillData.phone || ''}"
            >
          </div>
        </div>
        
        <div class="alert-form__row">
          <div class="alert-form__field">
            <label>Notification Frequency</label>
            <select name="frequency">
              <option value="instant">Instant (as soon as listed)</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>
        </div>
        
        <div class="alert-form__actions">
          <button type="button" class="alert-btn alert-btn--secondary" onclick="closeCreateAlertModal()">
            Cancel
          </button>
          <button type="submit" class="alert-btn alert-btn--primary">
            Create Alert
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Add submit handler
  document.getElementById('create-alert-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const alertData = {
      email: formData.get('email'),
      location: formData.get('location'),
      priceMin: parseInt(formData.get('priceMin')) || 0,
      priceMax: parseInt(formData.get('priceMax')) || 0,
      propertyType: formData.get('propertyType'),
      listingType: formData.get('listingType'),
      bedrooms: parseInt(formData.get('bedrooms')) || 0,
      bathrooms: parseInt(formData.get('bathrooms')) || 0,
      phone: formData.get('phone'),
      frequency: formData.get('frequency')
    };

    const result = await alertsManager.createAlert(alertData);
    
    if (result) {
      closeCreateAlertModal();
    }
  });

  // Show modal with animation
  setTimeout(() => modal.classList.add('alert-modal-backdrop--visible'), 10);
}

/**
 * Close create alert modal
 */
function closeCreateAlertModal() {
  const modal = document.getElementById('create-alert-modal');
  if (modal) {
    modal.classList.remove('alert-modal-backdrop--visible');
    setTimeout(() => modal.remove(), 300);
  }
}

/**
 * Update alert counter in navigation
 */
function updateAlertsCounter() {
  const counter = document.querySelector('.alerts-counter');
  if (counter) {
    const count = alertsManager.getActiveCount();
    counter.textContent = count;
    counter.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}

// Listen for alerts changes
alertsManager.addListener(() => {
  updateAlertsCounter();
});

console.log('[Alerts] System loaded with Airtable integration - v2.0');
console.log('[Alerts] Active alerts:', alertsManager.getActiveCount());
