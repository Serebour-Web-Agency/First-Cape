// FirstCape Analytics Dashboard
// Version: 1.0
// Track and visualize property performance and user engagement

class Analytics {
  constructor() {
    this.storageKey = 'firstcape_analytics';
    this.data = this.loadAnalytics();
  }

  /**
   * Load analytics from localStorage
   */
  loadAnalytics() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.getDefaultData();
    } catch (error) {
      console.error('[Analytics] Error loading:', error);
      return this.getDefaultData();
    }
  }

  /**
   * Get default analytics data
   */
  getDefaultData() {
    return {
      propertyViews: {},
      favoriteActions: [],
      comparisonActions: [],
      alertActions: [],
      searchActions: [],
      pageViews: [],
      sessions: [],
      startDate: new Date().toISOString()
    };
  }

  /**
   * Save analytics
   */
  saveAnalytics() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (error) {
      console.error('[Analytics] Error saving:', error);
    }
  }

  /**
   * Track property view
   */
  trackPropertyView(propertyId, propertyName) {
    if (!this.data.propertyViews[propertyId]) {
      this.data.propertyViews[propertyId] = {
        id: propertyId,
        name: propertyName,
        views: 0,
        lastViewed: null
      };
    }
    
    this.data.propertyViews[propertyId].views++;
    this.data.propertyViews[propertyId].lastViewed = new Date().toISOString();
    this.saveAnalytics();
  }

  /**
   * Track favorite action
   */
  trackFavorite(action, propertyId, propertyName) {
    this.data.favoriteActions.push({
      action: action, // 'add' or 'remove'
      propertyId: propertyId,
      propertyName: propertyName,
      timestamp: new Date().toISOString()
    });
    this.saveAnalytics();
  }

  /**
   * Track comparison action
   */
  trackComparison(action, propertyIds) {
    this.data.comparisonActions.push({
      action: action, // 'add', 'remove', 'compare'
      propertyIds: propertyIds,
      count: propertyIds.length,
      timestamp: new Date().toISOString()
    });
    this.saveAnalytics();
  }

  /**
   * Track alert action
   */
  trackAlert(action, alertData) {
    this.data.alertActions.push({
      action: action, // 'create', 'update', 'delete'
      location: alertData.location,
      timestamp: new Date().toISOString()
    });
    this.saveAnalytics();
  }

  /**
   * Track search action
   */
  trackSearch(filters) {
    this.data.searchActions.push({
      filters: filters,
      filterCount: this.countActiveFilters(filters),
      timestamp: new Date().toISOString()
    });
    this.saveAnalytics();
  }

  /**
   * Track page view
   */
  trackPageView(page) {
    this.data.pageViews.push({
      page: page,
      timestamp: new Date().toISOString()
    });
    this.saveAnalytics();
  }

  /**
   * Count active filters
   */
  countActiveFilters(filters) {
    let count = 0;
    if (filters.priceMin > 0) count++;
    if (filters.priceMax > 0) count++;
    if (filters.propertyTypes?.length > 0) count++;
    if (filters.listingTypes?.length > 0) count++;
    if (filters.bedroomsMin > 0) count++;
    if (filters.bathroomsMin > 0) count++;
    return count;
  }

  /**
   * Get analytics summary
   */
  getSummary() {
    const totalPropertyViews = Object.values(this.data.propertyViews)
      .reduce((sum, prop) => sum + prop.views, 0);
    
    const totalFavorites = this.data.favoriteActions
      .filter(a => a.action === 'add').length;
    
    const totalComparisons = this.data.comparisonActions
      .filter(a => a.action === 'compare').length;
    
    const totalAlerts = this.data.alertActions
      .filter(a => a.action === 'create').length;
    
    const totalSearches = this.data.searchActions.length;

    return {
      totalPropertyViews,
      totalFavorites,
      totalComparisons,
      totalAlerts,
      totalSearches,
      topProperties: this.getTopProperties(),
      recentActivity: this.getRecentActivity()
    };
  }

  /**
   * Get top properties by views
   */
  getTopProperties(limit = 10) {
    return Object.values(this.data.propertyViews)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit = 20) {
    const activities = [];

    // Favorite actions
    this.data.favoriteActions.forEach(action => {
      activities.push({
        type: 'favorite',
        action: action.action,
        description: `${action.action === 'add' ? 'Added' : 'Removed'} ${action.propertyName}`,
        timestamp: action.timestamp
      });
    });

    // Comparison actions
    this.data.comparisonActions.forEach(action => {
      activities.push({
        type: 'comparison',
        action: action.action,
        description: `Compared ${action.count} properties`,
        timestamp: action.timestamp
      });
    });

    // Alert actions
    this.data.alertActions.forEach(action => {
      activities.push({
        type: 'alert',
        action: action.action,
        description: `${capitalizeFirst(action.action)} alert for ${action.location}`,
        timestamp: action.timestamp
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get stats by date range
   */
  getStatsByDateRange(days = 7) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const views = this.data.pageViews.filter(v => 
      new Date(v.timestamp) >= startDate && new Date(v.timestamp) <= endDate
    );

    const favorites = this.data.favoriteActions.filter(a => 
      new Date(a.timestamp) >= startDate && new Date(a.timestamp) <= endDate
    );

    const comparisons = this.data.comparisonActions.filter(a => 
      new Date(a.timestamp) >= startDate && new Date(a.timestamp) <= endDate
    );

    const alerts = this.data.alertActions.filter(a => 
      new Date(a.timestamp) >= startDate && new Date(a.timestamp) <= endDate
    );

    return {
      views: views.length,
      favorites: favorites.filter(a => a.action === 'add').length,
      comparisons: comparisons.filter(a => a.action === 'compare').length,
      alerts: alerts.filter(a => a.action === 'create').length
    };
  }

  /**
   * Export analytics data
   */
  exportData() {
    const data = {
      summary: this.getSummary(),
      fullData: this.data,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firstcape-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all analytics
   */
  clearAll() {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      this.data = this.getDefaultData();
      this.saveAnalytics();
      return true;
    }
    return false;
  }
}

// Initialize global instance
const analytics = new Analytics();

// Make available globally
if (typeof window !== 'undefined') {
  window.analytics = analytics;
}

/**
 * Helper function to capitalize first letter
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Auto-track page views
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    analytics.trackPageView(page);
  });
} else {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  analytics.trackPageView(page);
}

console.log('[Analytics] System loaded - v1.0');
console.log('[Analytics] Summary:', analytics.getSummary());
