// FirstCape Configuration - Updated for Cloudflare Worker

const FIRSTCAPE_CONFIG = {
  // Cloudflare Worker URL (replaces direct Airtable access)
  apiProxyUrl: 'https://icy-cherry-d39b.fragrant-sea-e1f1.workers.dev',
  
  // NOTE: API credentials are now in Worker environment variables
  // DO NOT add airtableApiKey or airtableBaseId here!
  // They are secure in the Worker
  
  // Table names in your Airtable base
  tables: {
    properties: 'Properties',
    rentals: 'Rentals',
    alerts: 'Alerts',
    analytics: 'Analytics'
  },
  
  // Site Configuration
  siteName: 'FirstCape Estate Management',
  siteUrl: 'https://firstcapeestatemanagement.com',
  contactEmail: 'enquiries@firstcape.com',
  contactPhone: '+233 59 687 1452',
  
  // Location
  location: {
    address: 'Abokobi, Accra, Ghana',
    city: 'Accra',
    country: 'Ghana',
    coordinates: {
      lat: 5.6037,
      lng: -0.1870
    }
  },
  
  // Feature Flags
  features: {
    favorites: true,
    comparison: true,
    alerts: true,
    analytics: true,
    search: true,
    filters: true
  },
  
  // UI Configuration
  ui: {
    primaryColor: '#FACC15',
    secondaryColor: '#374151',
    accentColor: '#FDE047',
    itemsPerPage: 12,
    mapZoom: 12,
    maxComparison: 4,
    maxFavorites: 100
  },
  
  // Image paths
  imagePaths: {
    base: 'images/',
    properties: 'images/properties/',
    hero: 'images/hero/',
    logos: 'images/logos/'
  }
};

// Make config available globally
window.FIRSTCAPE_CONFIG = FIRSTCAPE_CONFIG;

// Log success
console.log('✅ FirstCape Config Loaded');
console.log('🔒 API Proxy URL:', FIRSTCAPE_CONFIG.apiProxyUrl);
console.log('✅ API credentials secured in Cloudflare Worker');

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIRSTCAPE_CONFIG;
}
