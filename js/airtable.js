// Airtable Integration via Cloudflare Worker
// This file uses the Worker proxy instead of calling Airtable directly

// Load properties from Airtable via Worker
async function loadProperties(filters = {}) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const noResults = document.getElementById('noResults');
  const propertiesGrid = document.getElementById('propertiesGrid');
  
  if (!window.FIRSTCAPE_CONFIG || !window.FIRSTCAPE_CONFIG.apiProxyUrl) {
    console.error('Config not loaded or API proxy URL missing');
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    if (errorMessage) {
      errorMessage.classList.remove('d-none');
      errorMessage.innerHTML = '<p>Configuration error. Please check config.js</p>';
    }
    return;
  }
  
  try {
    // Show loading
    if (loadingIndicator) loadingIndicator.classList.remove('d-none');
    if (errorMessage) errorMessage.classList.add('d-none');
    if (noResults) noResults.classList.add('d-none');
    if (propertiesGrid) propertiesGrid.classList.add('d-none');
    
    // Build URL with filters if provided
    const workerUrl = `${window.FIRSTCAPE_CONFIG.apiProxyUrl}/properties`;
    
    console.log('🔄 Fetching properties from Worker:', workerUrl);
    
    // Fetch from Worker (no API key needed - it's in the Worker!)
    const response = await fetch(workerUrl);
    
    if (!response.ok) {
      throw new Error(`Worker returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Received data from Worker:', data);
    
    // Hide loading
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    
    // Check if we have records
    if (!data.records || data.records.length === 0) {
      if (noResults) noResults.classList.remove('d-none');
      console.log('No properties found');
      return;
    }
    
    // Display properties
    if (propertiesGrid) {
      propertiesGrid.classList.remove('d-none');
      displayProperties(data.records);
    }
    
  } catch (error) {
    console.error('Error loading properties:', error);
    
    // Hide loading
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    
    // Show error
    if (errorMessage) {
      errorMessage.classList.remove('d-none');
      errorMessage.innerHTML = `
        <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Unable to Load Properties</h5>
        <p class="mb-2">Error: ${error.message}</p>
        <hr>
        <p class="mb-0">Please check:</p>
        <ul class="mb-0">
          <li>Worker environment variables are set (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)</li>
          <li>Worker is deployed and accessible</li>
          <li>Airtable base and table names are correct</li>
        </ul>
      `;
    }
  }
}

// Load rentals from Airtable via Worker
async function loadRentals(filters = {}) {
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const noResults = document.getElementById('noResults');
  const propertiesGrid = document.getElementById('propertiesGrid');
  
  if (!window.FIRSTCAPE_CONFIG || !window.FIRSTCAPE_CONFIG.apiProxyUrl) {
    console.error('Config not loaded or API proxy URL missing');
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    if (errorMessage) {
      errorMessage.classList.remove('d-none');
      errorMessage.innerHTML = '<p>Configuration error. Please check config.js</p>';
    }
    return;
  }
  
  try {
    // Show loading
    if (loadingIndicator) loadingIndicator.classList.remove('d-none');
    if (errorMessage) errorMessage.classList.add('d-none');
    if (noResults) noResults.classList.add('d-none');
    if (propertiesGrid) propertiesGrid.classList.add('d-none');
    
    // Fetch from Worker
    const workerUrl = `${window.FIRSTCAPE_CONFIG.apiProxyUrl}/rentals`;
    
    console.log('🔄 Fetching rentals from Worker:', workerUrl);
    
    const response = await fetch(workerUrl);
    
    if (!response.ok) {
      throw new Error(`Worker returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Received data from Worker:', data);
    
    // Hide loading
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    
    // Check if we have records
    if (!data.records || data.records.length === 0) {
      if (noResults) noResults.classList.remove('d-none');
      console.log('No rentals found');
      return;
    }
    
    // Display rentals
    if (propertiesGrid) {
      propertiesGrid.classList.remove('d-none');
      displayProperties(data.records); // Can use same display function
    }
    
  } catch (error) {
    console.error('Error loading rentals:', error);
    
    // Hide loading
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    
    // Show error
    if (errorMessage) {
      errorMessage.classList.remove('d-none');
      errorMessage.innerHTML = `
        <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Unable to Load Rentals</h5>
        <p class="mb-2">Error: ${error.message}</p>
        <p class="mb-0">Please check Worker configuration and environment variables.</p>
      `;
    }
  }
}

// Display properties in grid
function displayProperties(records) {
  const grid = document.getElementById('propertiesGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  records.forEach(record => {
    const fields = record.fields;
    
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    
    card.innerHTML = `
      <div class="card property-card h-100 border-0 shadow">
        <img src="${fields.Image || 'images/placeholder.jpg'}" class="card-img-top" alt="${fields.Title || 'Property'}">
        <div class="card-body">
          <h5 class="card-title fw-bold" style="color: #374151;">${fields.Title || 'Untitled Property'}</h5>
          <p class="text-muted mb-2"><i class="fas fa-map-marker-alt me-2"></i>${fields.Location || 'Location not specified'}</p>
          <p class="fw-bold mb-3" style="color: #FACC15; font-size: 1.25rem;">
            ${fields.Price ? 'GHS ' + fields.Price.toLocaleString() : 'Price on request'}
          </p>
          <div class="d-flex justify-content-between mb-3">
            <span><i class="fas fa-bed me-1"></i> ${fields.Bedrooms || 0} beds</span>
            <span><i class="fas fa-bath me-1"></i> ${fields.Bathrooms || 0} baths</span>
            <span><i class="fas fa-home me-1"></i> ${fields.Type || 'N/A'}</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm flex-grow-1" style="background: #FACC15; color: #374151; border: none;">
              <i class="fas fa-info-circle me-1"></i>Details
            </button>
            <button class="btn btn-sm" style="background: #374151; color: #FACC15; border: none;" onclick="toggleFavorite('${record.id}')">
              <i class="fas fa-heart"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  console.log(`✅ Displayed ${records.length} properties`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Page loaded, checking for properties to load...');
  
  // Check which page we're on and load appropriate data
  const path = window.location.pathname;
  
  if (path.includes('properties.html')) {
    console.log('📍 On properties page, loading properties...');
    loadProperties();
  } else if (path.includes('rentals.html')) {
    console.log('📍 On rentals page, loading rentals...');
    loadRentals();
  }
});

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.loadProperties = loadProperties;
  window.loadRentals = loadRentals;
  window.displayProperties = displayProperties;
}
