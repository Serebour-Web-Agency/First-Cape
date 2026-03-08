// FirstCape Configuration
// DO NOT change existing URLs/paths - keep as SmartHub if that's where assets are hosted!

const FIRSTCAPE_CONFIG = {
  // Airtable Configuration
  // IMPORTANT: Replace these with your actual Airtable credentials
  airtableApiKey: 'YOUR_AIRTABLE_API_KEY_HERE', // Get from Airtable account settings
  airtableBaseId: 'YOUR_AIRTABLE_BASE_ID_HERE', // Get from your Airtable base URL
  
  // Table names (update these to match your Airtable base)
  tables: {
    properties: 'Properties', // For sale properties table name
    rentals: 'Rentals',       // Rental properties table name
    alerts: 'Alerts',         // User alerts table name
    analytics: 'Analytics'    // Analytics data table name
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
    primaryColor: '#FACC15',      // Bright Yellow
    secondaryColor: '#374151',    // Dark Grey
    accentColor: '#FDE047',       // Light Yellow
    itemsPerPage: 12,
    mapZoom: 12,
    maxComparison: 4,             // Max properties to compare
    maxFavorites: 100             // Max favorites to save
  },
  
  // Image paths - KEEP EXISTING PATHS!
  // If your images are at smarthubestatemanagement.com, keep those URLs!
  imagePaths: {
    // Update these to match where your actual images are hosted
    base: 'images/',  // Local images folder
    properties: 'images/properties/',
    hero: 'images/hero/',
    logos: 'images/logos/'
  }
};

// Make config available globally
window.FIRSTCAPE_CONFIG = FIRSTCAPE_CONFIG;

// For debugging
console.log('FirstCape Config Loaded:', {
  apiKeySet: !!FIRSTCAPE_CONFIG.airtableApiKey && FIRSTCAPE_CONFIG.airtableApiKey !== 'YOUR_AIRTABLE_API_KEY_HERE',
  baseIdSet: !!FIRSTCAPE_CONFIG.airtableBaseId && FIRSTCAPE_CONFIG.airtableBaseId !== 'YOUR_AIRTABLE_BASE_ID_HERE',
  features: FIRSTCAPE_CONFIG.features
});

// Export for modules (if using)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIRSTCAPE_CONFIG;
}
