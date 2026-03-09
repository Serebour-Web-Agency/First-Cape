// Load properties via Worker
async function loadProperties() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  const errorMessage = document.getElementById('errorMessage');
  const noResults = document.getElementById('noResults');
  const propertiesGrid = document.getElementById('propertiesGrid');
  
  if (!window.FIRSTCAPE_CONFIG || !window.FIRSTCAPE_CONFIG.apiProxyUrl) {
    console.error('Config not loaded or Worker URL missing');
    if (errorMessage) {
      errorMessage.classList.remove('d-none');
      errorMessage.innerHTML = '<h5>Configuration Error</h5><p>Worker URL not configured in config.js</p>';
    }
    return;
  }
  
  try {
    if (loadingIndicator) loadingIndicator.classList.remove('d-none');
    if (errorMessage) errorMessage.classList.add('d-none');
    if (noResults) noResults.classList.add('d-none');
    if (propertiesGrid) propertiesGrid.classList.add('d-none');
    
    const workerUrl = window.FIRSTCAPE_CONFIG.apiProxyUrl + '/properties';
    
    console.log('🔄 Fetching properties from Worker:', workerUrl);
    
    const response = await fetch(workerUrl);
    
    if (!response.ok) {
      throw new Error('Worker returned ' + response.status);
    }
    
    const data = await response.json();
    
    console.log('✅ Received data:', data);
    
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    
    if (!data.records || data.records.length === 0) {
      if (noResults) noResults.classList.remove('d-none');
      return;
    }
    
    if (propertiesGrid) {
      propertiesGrid.classList.remove('d-none');
      displayProperties(data.records);
    }
    
  } catch (error) {
    console.error('Error loading properties:', error);
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    if (errorMessage) {
      errorMessage.classList.remove('d-none');
      errorMessage.innerHTML = '<h5>Error Loading Properties</h5><p>' + error.message + '</p>';
    }
  }
}

function displayProperties(records) {
  const grid = document.getElementById('propertiesGrid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  records.forEach(record => {
    const fields = record.fields;
    const card = document.createElement('div');
    card.className = 'col-md-6 col-lg-4';
    
    card.innerHTML = `
      <div class="card h-100 border-0 shadow">
        <img src="${fields.Image || 'images/placeholder.jpg'}" class="card-img-top" alt="${fields.Title || 'Property'}">
        <div class="card-body">
          <h5 class="fw-bold" style="color: #374151;">${fields.Title || 'Property'}</h5>
          <p class="text-muted"><i class="fas fa-map-marker-alt me-2"></i>${fields.Location || 'Location'}</p>
          <p class="fw-bold" style="color: #FACC15; font-size: 1.25rem;">
            ${fields.Price ? 'GHS ' + fields.Price.toLocaleString() : 'Price on request'}
          </p>
          <div class="d-flex justify-content-between mb-3">
            <span><i class="fas fa-bed me-1"></i> ${fields.Bedrooms || 0} beds</span>
            <span><i class="fas fa-bath me-1"></i> ${fields.Bathrooms || 0} baths</span>
          </div>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  console.log('✅ Displayed ' + records.length + ' properties');
}

document.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  if (path.includes('properties.html')) {
    loadProperties();
  }
});

if (typeof window !== 'undefined') {
  window.loadProperties = loadProperties;
}
