// FirstCape Configuration
// This is the PUBLIC configuration file (safe to commit to GitHub)

const FIRSTCAPE_CONFIG = {
  // Airtable Configuration
  // NOTE: For security, API keys should be in environment variables
  // For now, we'll use a placeholder
  airtableApiKey: '', // Leave empty - will be set via Cloudflare environment variable
  airtableBaseId: 'appXXXXXXXXXXXXXX', // Replace with your actual base ID
  
  // Site Configuration
  siteName: 'FirstCape Estate Management',
  siteUrl: 'https://firstcapeestatemanagement.com',
  contactEmail: 'enquiries@firstcape.com',
  contactPhone: '+233 59 687 1452',
  
  // Location
  location: {
    address: 'Abokobi, Accra, Ghana',
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
    analytics: true
  },
  
  // UI Configuration
  ui: {
    primaryColor: '#FACC15', // Bright Yellow
    secondaryColor: '#374151', // Dark Grey
    itemsPerPage: 12,
    mapZoom: 12
  }
};

// Make config available globally
window.FIRSTCAPE_CONFIG = FIRSTCAPE_CONFIG;

// Export for modules (if using)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIRSTCAPE_CONFIG;
}
