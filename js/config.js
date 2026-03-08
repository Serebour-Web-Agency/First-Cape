// SmartHub Secure Configuration
// Version: 2.1 - CORRECTED Lead Fields
// Last Updated: Fixed all field mappings

const SMARTHUB_CONFIG = {
  api: {
    useProxy: true,
    proxyUrl: '/api/airtable-proxy.php'
  },
  
  airtable: {
    tables: {
      properties: 'Properties',
      leads: 'Leads',
      alerts: 'Alerts'
    },
    
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
      listingType: 'Listing Type',
      status: 'Status',
      mediaUploadStatus: 'Media Upload Status',
      cdnMainImage: 'CDN Main Image URL',
      cdnGalleryURLs: 'CDN Gallery URLs',
      cdnGalleryJSON: 'CDN Gallery JSON',
      cdnVideo: 'CDN Video Tour URL',
      cdn360: 'CDN 360 Panorama URL',
      cdn360Video: 'CDN 360 Video URL',
      cdnPanoramaURL: 'CDN 360 Panorama URL',
      panorama360VideoURL: 'CDN 360 Video URL',
      cdnFloorplanSVG: 'CDN Floorplan SVG URL',
      cdnTourZip: 'CDN Tour ZIP URL',
      mainImage: 'Main Image',
      galleryImages: 'Gallery Images',
      videoTour: 'Video Tour',
      description: 'Property Overview & Recommendations',
      virtualTourURL: 'Virtual Tour URL',
      slug: 'Slug',
      latitude: 'Latitude',
      longitude: 'Longitude',
      activeTenants: 'Active Tenants Count',
      totalUnits: 'Total Units',
      vacancyRate: 'Vacancy Rate'
    },
    
    leadFields: {
      fullName: 'Full Name',
      phone: 'Phone / WhatsApp',
      email: 'Email',
      message: 'Notes',
      notes: 'Notes',
      city: 'City / Region',
      leadType: 'Lead Type',
      sourcePage: 'Source Page',
      status: 'Status',
      createdAt: 'Created At',
      timestamp: 'Created Time',
      salesTeamNotified: 'Sales Team Notified'
    }
  },
  
  display: {
    placeholderImage: '/images/placeholder-property.jpg',
    defaultCity: 'Accra',
    itemsPerPage: 12,
    enableFilters: true,
    enableSearch: true
  },
  
  leadTypes: {
    buy: 'Buy',
    rent: 'Rent',
    landlord: 'Landlord',
    service: 'Service',
    services: 'Services',
    new: 'New',
    notify: 'Notify',
    buyNotify: 'Buy-Notify',
    rentBuy: 'Rent/Buy'
  },
  
  leadStatuses: {
    new: 'New',
    contacted: 'Contacted',
    converted: 'Converted',
    notInterested: 'Not Interested'
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SMARTHUB_CONFIG;
}

if (typeof window !== 'undefined') {
  window.SMARTHUB_CONFIG = SMARTHUB_CONFIG;
}

console.log('[Config] v2.1 loaded - All fields corrected');