// SmartHub Production Configuration
// ⚠️ SECURITY: Keep this file secure - contains API credentials

const SMARTHUB_CONFIG = {
  // Airtable Configuration
  airtable: {
    baseId: 'appCjAj6uP24Ffn3h',
    token: 'pataNAohYI2Nbip0C.744ac2be6843b7a519502a119f81173f366943aaf2f8db74273d1aceea9c16fb',
    
    // Table names
    tables: {
      properties: 'Properties',  // Single table for both Buy and Rent
      leads: 'Leads'
    },
    
    // Field mappings for Properties table
    propertyFields: {
      name: 'Property Name',
      price: 'Price',
      city: 'City',
      state: 'State/Province',
      country: 'Country',
      address: 'Address',
      bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms',
      size: 'Size (sq ft)',
      yearBuilt: 'Year Built',
      propertyType: 'Property Type',
      listingType: 'Listing Type',        // 'Buy', 'Rent', 'Not Listed'
      status: 'Status',                   // 'Active', 'Inactive', etc.
      mediaUploadStatus: 'Media Upload Status',  // 'Pending', 'Processing', 'Ready', 'Error'
      
      // CDN Media Fields (CRITICAL)
      cdnMainImage: 'CDN Main Image URL',
      cdnGalleryURLs: 'CDN Gallery URLs',   // Long text field
      cdnGalleryJSON: 'CDN Gallery JSON',   // JSON array of URLs
      cdnVideo: 'CDN Video Tour URL',
      cdn360: 'CDN 360 Panorama URL',
      cdnTourZip: 'CDN Tour ZIP URL',
      
      // Legacy attachment fields (fallback)
      mainImage: 'Main Image',
      galleryImages: 'Gallery Images',
      videoTour: 'Video Tour',
      
      // Additional info
      description: 'Property Overview & Recommendations',  // AI-generated field
      virtualTourURL: 'Virtual Tour URL',
      slug: 'Slug',
      
      // Metrics
      activeTenants: 'Active Tenants Count',
      totalUnits: 'Total Units',
      vacancyRate: 'Vacancy Rate'
    },
    
    // Field mappings for Leads table
    leadFields: {
      fullName: 'Full Name',
      phone: 'Phone / WhatsApp',
      email: 'Email',
      city: 'City / Region',
      leadType: 'Lead Type',        // 'Buy', 'Rent', 'Landlord', 'Notify', etc.
      status: 'Status',             // 'New', 'Contacted', 'Converted'
      notes: 'Notes',
      sourcePage: 'Source Page',
      createdAt: 'Created At',
      createdTime: 'Created Time'
    }
  },
  
  // Display settings
  display: {
    propertiesPerPage: 12,
    defaultSort: 'newest',
    
    // Only show properties with these criteria:
    showOnlyWithMedia: true,          // Must have CDN images
    requiredMediaStatus: 'Ready',     // Media Upload Status must be 'Ready'
    requiredStatus: 'Active',         // Status must be 'Active'
    
    // Placeholder for properties without CDN images (during transition)
    placeholderImage: '/images/placeholder-property.jpg'
  },
  
  // Ghana cities for filtering
  cities: [
    'Accra',
    'Kumasi',
    'Takoradi',
    'Tema',
    'Cape Coast',
    'Tamale',
    'Sekondi',
    'Obuasi',
    'Koforidua',
    'Sunyani'
  ],
  
  // Property types from your Airtable
  propertyTypes: [
    'Residential',
    'Commercial',
    'Industrial',
    'Mixed-Use',
    'Land'
  ],
  
  // Listing types
  listingTypes: {
    buy: 'Buy',
    rent: 'Rent',
    notListed: 'Not Listed'
  },
  
  // Lead types (from your schema)
  leadTypes: {
    buy: 'Buy',
    rent: 'Rent',
    landlord: 'Landlord',
    notify: 'Notify',
    buyNotify: 'Buy-Notify',
    rentBuy: 'Rent/Buy',
    services: 'Services',
    service: 'Service',
    new: 'New'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SMARTHUB_CONFIG;
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SMARTHUB_CONFIG = SMARTHUB_CONFIG;
}