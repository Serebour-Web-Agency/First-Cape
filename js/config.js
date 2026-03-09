const FIRSTCAPE_CONFIG = {
  // Worker URL - Properties load through here
  apiProxyUrl: 'https://icy-cherry-d39b.fragrant-sea-e1f1.workers.dev',
  
  tables: {
    properties: 'Properties',
    rentals: 'Rentals',
    alerts: 'Alerts',
    analytics: 'Analytics'
  },
  
  siteName: 'FirstCape Estate Management',
  siteUrl: 'https://firstcapeestatemanagement.com',
  contactEmail: 'enquiries@firstcape.com',
  contactPhone: '+233 59 687 1452',
  
  location: {
    address: 'Abokobi, Accra, Ghana',
    city: 'Accra',
    country: 'Ghana',
    coordinates: {
      lat: 5.6037,
      lng: -0.1870
    }
  },
  
  features: {
    favorites: true,
    comparison: true,
    alerts: true,
    analytics: true,
    search: true,
    filters: true
  },
  
  ui: {
    primaryColor: '#FACC15',
    secondaryColor: '#374151',
    accentColor: '#FDE047',
    itemsPerPage: 12,
    mapZoom: 12,
    maxComparison: 4,
    maxFavorites: 100
  },
  
  imagePaths: {
    base: 'images/',
    properties: 'images/properties/',
    hero: 'images/hero/',
    logos: 'images/logos/'
  }
};

window.FIRSTCAPE_CONFIG = FIRSTCAPE_CONFIG;

console.log('✅ FirstCape Config Loaded');
console.log('🔒 Using Worker:', FIRSTCAPE_CONFIG.apiProxyUrl);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FIRSTCAPE_CONFIG;
}
