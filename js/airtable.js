/**
 * airtable.js — FirstCape Estate Management
 * Fetches from Cloudflare Worker proxy, filters by Listing Type,
 * and renders property cards on properties.html and rentals.html.
 */

(function () {
  // ─── Detect page context ────────────────────────────────────────────────
  const isRentals = window.location.pathname.includes('rental');
  const listingTypeFilter = isRentals ? 'Rent' : 'Buy';

  // ─── Helpers ────────────────────────────────────────────────────────────
  function getConfig() {
    return window.FIRSTCAPE_CONFIG || {};
  }

  function getWorkerUrl() {
    return getConfig().apiProxyUrl || '';
  }

  function formatPrice(price, listingType) {
    if (!price) return 'Price on Request';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === 'Rent' ? `${formatted}/mo` : formatted;
  }

  function getImageUrl(record) {
    const f = record.fields;
    // Prefer CDN URLs, fall back to Airtable attachment
    if (f['CDN Main Image URL']) return f['CDN Main Image URL'];
    if (f['Main Image'] && f['Main Image'][0]) return f['Main Image'][0].url;
    if (f['Photos'] && f['Photos'][0]) return f['Photos'][0].url;
    return 'images/properties/placeholder.jpg';
  }

  function buildDetailUrl(record) {
    const slug = record.fields['Slug'] || record.id;
    return `property-detail.html?id=${encodeURIComponent(slug)}`;
  }

  // ─── Card renderer ───────────────────────────────────────────────────────
  function renderCard(record) {
    const f = record.fields;
    const price = formatPrice(f['Price'], f['Listing Type']);
    const image = getImageUrl(record);
    const detailUrl = buildDetailUrl(record);
    const beds = f['Bedrooms'] ?? '—';
    const baths = f['Bathrooms'] ?? '—';
    const sqft = f['Size (sq ft)'] ? f['Size (sq ft)'].toLocaleString() : '—';
    const city = f['City'] || '';
    const address = f['Address'] || '';
    const propType = f['Property Type'] || '';
    const name = f['Property Name'] || 'Property';
    const status = f['Status'] || '';

    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm property-card border-0">
          <div style="position:relative;overflow:hidden;height:220px;">
            <img src="${image}"
                 class="card-img-top"
                 alt="${name}"
                 style="width:100%;height:100%;object-fit:cover;"
                 onerror="this.src='images/properties/placeholder.jpg'">
            <div style="position:absolute;top:12px;left:12px;">
              <span class="badge" style="background:#FACC15;color:#374151;font-size:0.75rem;">
                ${f['Listing Type'] === 'Rent' ? 'For Rent' : 'For Sale'}
              </span>
            </div>
            ${status === 'Active' ? '' : `
            <div style="position:absolute;top:12px;right:12px;">
              <span class="badge bg-secondary">${status}</span>
            </div>`}
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold mb-1" style="color:#374151;">${name}</h5>
            <p class="text-muted small mb-2">
              <i class="fas fa-map-marker-alt me-1" style="color:#FACC15;"></i>
              ${[address, city].filter(Boolean).join(', ')}
            </p>
            <div class="d-flex gap-3 mb-3 text-muted small">
              ${beds !== '—' ? `<span><i class="fas fa-bed me-1"></i>${beds} bed</span>` : ''}
              ${baths !== '—' ? `<span><i class="fas fa-bath me-1"></i>${baths} bath</span>` : ''}
              ${sqft !== '—' ? `<span><i class="fas fa-ruler-combined me-1"></i>${sqft} sqft</span>` : ''}
            </div>
            ${propType ? `<p class="text-muted small mb-2"><i class="fas fa-home me-1"></i>${propType}</p>` : ''}
            <div class="mt-auto d-flex align-items-center justify-content-between">
              <span class="fw-bold fs-5" style="color:#374151;">${price}</span>
              <a href="${detailUrl}"
                 class="btn btn-sm fw-semibold"
                 style="background:#FACC15;color:#374151 !important;border:none;"
                View Details
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Filter & sort ───────────────────────────────────────────────────────
  function applyFilters(records) {
    const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const bedroomsVal = document.getElementById('bedroomsFilter')?.value || '';
    const bathroomsVal = document.getElementById('bathroomsFilter')?.value || '';
    const typeVal = document.getElementById('typeFilter')?.value || '';
    const sortVal = document.getElementById('sortFilter')?.value || 'newest';

    let filtered = records.filter(r => {
      const f = r.fields;
      if (searchVal) {
        const searchable = [f['City'], f['Address'], f['State/Province'], f['Property Name']]
          .filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(searchVal)) return false;
      }
      if (bedroomsVal) {
        const beds = f['Bedrooms'] || 0;
        if (bedroomsVal === '5') { if (beds < 5) return false; }
        else if (beds !== parseInt(bedroomsVal)) return false;
      }
      if (bathroomsVal) {
        const baths = f['Bathrooms'] || 0;
        if (bathroomsVal === '4') { if (baths < 4) return false; }
        else if (baths !== parseInt(bathroomsVal)) return false;
      }
      if (typeVal && f['Property Type'] !== typeVal) return false;
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const pa = a.fields['Price'] || 0;
      const pb = b.fields['Price'] || 0;
      if (sortVal === 'price-low') return pa - pb;
      if (sortVal === 'price-high') return pb - pa;
      // newest: use Airtable record creation order (already default)
      return 0;
    });

    return filtered;
  }

  // ─── Render to grid ──────────────────────────────────────────────────────
  let allRecords = [];

  function renderGrid(records) {
    const grid = document.getElementById('propertiesGrid');
    const noResults = document.getElementById('noResults');
    const loading = document.getElementById('loadingIndicator');

    loading.classList.add('d-none');

    if (!records || records.length === 0) {
      grid.classList.add('d-none');
      noResults.classList.remove('d-none');
      return;
    }

    noResults.classList.add('d-none');
    grid.innerHTML = records.map(renderCard).join('');
    grid.classList.remove('d-none');
  }

  function refreshDisplay() {
    renderGrid(applyFilters(allRecords));
  }

  // ─── Fetch from Worker ───────────────────────────────────────────────────
  async function fetchAllPages(baseUrl) {
    let records = [];
    let offset = null;

    do {
      // Build query string manually — URLSearchParams encodes [] as %5B%5D
      // which some proxies mishandle. Manual encoding keeps fields[] intact.
      const filter = encodeURIComponent(`AND({Listing Type}='${listingTypeFilter}',{Status}='Active')`);
      const fields = [
        'Property Name', 'Address', 'City', 'State/Province', 'Country',
        'Property Type', 'Status', 'Bedrooms', 'Bathrooms', 'Size (sq ft)',
        'Price', 'Listing Type', 'CDN Main Image URL', 'Main Image', 'Photos', 'Slug'
      ];
      const fieldParams = fields.map(f => `fields%5B%5D=${encodeURIComponent(f)}`).join('&');
      let qs = `filterByFormula=${filter}&${fieldParams}`;
      if (offset) qs += `&offset=${encodeURIComponent(offset)}`;

      const response = await fetch(`${baseUrl}?${qs}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Worker error ${response.status}: ${JSON.stringify(err)}`);
      }
      const data = await response.json();
      records = records.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);

    return records;
  }

  // ─── Public entry points ─────────────────────────────────────────────────
  async function loadProperties() {
    const workerUrl = getWorkerUrl();
    if (!workerUrl) {
      console.error('airtable.js: apiProxyUrl not set in FIRSTCAPE_CONFIG');
      return;
    }

    try {
      allRecords = await fetchAllPages(workerUrl);
      renderGrid(applyFilters(allRecords));
      attachEventListeners();
    } catch (err) {
      console.error('Error loading properties:', err);
      document.getElementById('loadingIndicator')?.classList.add('d-none');
      const errorEl = document.getElementById('errorMessage');
      if (errorEl) {
        errorEl.classList.remove('d-none');
        errorEl.innerHTML = `
          <h5 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i>Error Loading Properties</h5>
          <p class="mb-0">${err.message}</p>
        `;
      }
    }
  }

  // Alias so rentals.html loader works too
  window.loadRentals = loadProperties;
  window.loadProperties = loadProperties;

  // ─── Filter/search event listeners ──────────────────────────────────────
  function attachEventListeners() {
    document.getElementById('searchBtn')?.addEventListener('click', refreshDisplay);
    document.getElementById('searchInput')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') refreshDisplay();
    });
    document.getElementById('refreshBtn')?.addEventListener('click', () => {
      document.getElementById('searchInput') && (document.getElementById('searchInput').value = '');
      renderGrid(applyFilters(allRecords));
    });
    ['bedroomsFilter', 'bathroomsFilter', 'typeFilter', 'sortFilter'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', refreshDisplay);
    });
  }
})();
