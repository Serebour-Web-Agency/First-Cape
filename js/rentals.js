// SmartHub Rent Rentals Loader
// Version: 3.3 - CSP COMPLIANT (No eval, No string evaluation)
// Changes:
// - All styles set via CSSStyleSheet.insertRule() - CSP compliant
// - Modal positioned under search bar
// - No eval(), new Function(), or string evaluation

class RentalsLoader {
  constructor() {
    this.rentals = [];
    this.filteredRentals = [];
    this.currentCity = '';
    this.currentBedrooms = 'any';
    this.currentBathrooms = 'any';
    this.currentType = 'any';
    this.currentSort = 'newest';
    this.isLoading = false;
  }

  async init() {
    console.log('[Rentals] Initializing v3.3 (CSP Compliant)...');
    
    this.showLoading();
    this.hideNotifyCTA(); // Hide notify CTA on initial load
    await this.loadRentals();
    this.setupFilters();
    this.renderRentals();
    
    console.log('[Rentals] Initialization complete');
  }

  async loadRentals() {
    try {
      this.isLoading = true;
      
      const config = SMARTHUB_CONFIG.airtable;
      const fields = Object.values(config.propertyFields);
      
      const filterFormula = `AND(
        {${config.propertyFields.listingType}} = "Rent",
        {${config.propertyFields.status}} = "Active",
        {${config.propertyFields.mediaUploadStatus}} = "Ready"
      )`;
      
      console.log("[Rentals] Filter formula:", filterFormula);
      console.log("[Rentals] Table name:", config.tables.properties);
      console.log("[Rentals] Requesting fields:", fields.length, "fields");
      
      const records = await airtableClient.fetchRecords(
        config.tables.properties,
        {
          filterByFormula: filterFormula,
          fields: fields,
          maxRecords: 100,
          // Temporarily removed sort to test
          // sort: [
            // { field: 'Created Time', direction: 'desc' }
          // ]
        }
      );
      
      this.rentals = records
        .map(record => this.transformRecord(record))
        .filter(property => {
          const hasMedia = this.hasValidMedia(property);
          if (!hasMedia) {
            console.warn('[Rentals] Property missing media:', property.name);
          }
          return hasMedia;
        });
      
      this.filteredRentals = [...this.rentals];
      
      console.log(`[Rentals] Loaded ${this.rentals.length} buy rentals with valid media`);
      
    } catch (error) {
      console.error('[Rentals] Error loading rentals:', error);
      this.showError('Failed to load rentals. Please try again later.');
    } finally {
      this.isLoading = false;
    }
  }

  transformRecord(record) {
    const fields = record.fields;
    const fieldMap = SMARTHUB_CONFIG.airtable.propertyFields;
    
    let cdnImages = [];
    
    if (fields[fieldMap.cdnGalleryJSON]) {
      try {
        const parsed = JSON.parse(fields[fieldMap.cdnGalleryJSON]);
        if (Array.isArray(parsed)) {
          cdnImages = parsed;
        }
      } catch (e) {
        console.warn('[Rentals] Failed to parse CDN Gallery JSON for', record.id, e);
      }
    }
    
    if (cdnImages.length === 0 && fields[fieldMap.cdnGalleryURLs]) {
      cdnImages = fields[fieldMap.cdnGalleryURLs]
        .split(/[,\n]/)
        .map(url => url.trim())
        .filter(url => url.length > 0 && url.startsWith('http'));
    }
    
    if (cdnImages.length === 0 && fields[fieldMap.cdnMainImage]) {
      cdnImages = [fields[fieldMap.cdnMainImage]];
    }
    
    if (cdnImages.length === 0) {
      cdnImages = [SMARTHUB_CONFIG.display.placeholderImage || '/images/placeholder-property.jpg'];
    }
    
    return {
      id: record.id,
      name: fields[fieldMap.name] || 'Untitled Property',
      price: fields[fieldMap.price] || 0,
      city: fields[fieldMap.city] || 'Unknown',
      state: fields[fieldMap.state] || '',
      country: fields[fieldMap.country] || 'Ghana',
      address: fields[fieldMap.address] || '',
      bedrooms: fields[fieldMap.bedrooms] || 0,
      bathrooms: fields[fieldMap.bathrooms] || 0,
      size: fields[fieldMap.size] || 0,
      yearBuilt: fields[fieldMap.yearBuilt] || null,
      propertyType: fields[fieldMap.propertyType] || 'Residential',
      listingType: fields[fieldMap.listingType] || 'Rent',
      status: fields[fieldMap.status] || 'Active',
      description: fields[fieldMap.description] || '',
      cdnImages: cdnImages,
      cdnVideo: fields[fieldMap.cdnVideo] || null,
      cdn360: fields[fieldMap.cdn360] || null,
      virtualTourURL: fields[fieldMap.virtualTourURL] || null,
      slug: fields[fieldMap.slug] || null
    };
  }

  hasValidMedia(property) {
    return property.cdnImages && property.cdnImages.length > 0;
  }

  setupFilters() {
    const cityInput = document.getElementById('city-input');
    const citySearchBtn = document.getElementById('city-search-btn');
    
    if (citySearchBtn && cityInput) {
      citySearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentCity = cityInput.value.trim();
        this.applyFilters();
      });
      
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.currentCity = cityInput.value.trim();
          this.applyFilters();
        }
      });
    }
    
    const bedroomsFilter = document.getElementById('bedroomsFilter');
    if (bedroomsFilter) {
      bedroomsFilter.addEventListener('change', (e) => {
        this.currentBedrooms = e.target.value;
        this.applyFilters();
      });
    }
    
    const bathroomsFilter = document.getElementById('bathroomsFilter');
    if (bathroomsFilter) {
      bathroomsFilter.addEventListener('change', (e) => {
        this.currentBathrooms = e.target.value;
        this.applyFilters();
      });
    }
    
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
      typeFilter.addEventListener('change', (e) => {
        this.currentType = e.target.value;
        this.applyFilters();
      });
    }
    
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.applyFilters();
      });
    }
    
    const refreshBtn = document.getElementById('refreshRentals');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.currentCity = '';
        this.currentBedrooms = 'any';
        this.currentBathrooms = 'any';
        this.currentType = 'any';
        this.currentSort = 'newest';
        
        if (cityInput) cityInput.value = '';
        if (bedroomsFilter) bedroomsFilter.value = 'any';
        if (bathroomsFilter) bathroomsFilter.value = 'any';
        if (typeFilter) typeFilter.value = 'any';
        if (sortFilter) sortFilter.value = 'newest';
        
        this.hideNotifyCTA();
        
        airtableClient.clearCache();
        this.init();
      });
    }
  }

  applyFilters() {
    let filtered = [...this.rentals];
    
    if (this.currentCity && this.currentCity.length > 0) {
      const searchValue = this.currentCity.toLowerCase();
      filtered = filtered.filter(item => 
        (item.city || '').toLowerCase().includes(searchValue) ||
        (item.state || '').toLowerCase().includes(searchValue) ||
        (item.address || '').toLowerCase().includes(searchValue)
      );
    }
    
    if (this.currentBedrooms !== 'any') {
      const minBeds = parseInt(this.currentBedrooms, 10) || 0;
      filtered = filtered.filter(item => (item.bedrooms || 0) >= minBeds);
    }
    
    if (this.currentBathrooms !== 'any') {
      const minBaths = parseInt(this.currentBathrooms, 10) || 0;
      filtered = filtered.filter(item => (item.bathrooms || 0) >= minBaths);
    }
    
    if (this.currentType !== 'any') {
      filtered = filtered.filter(item => 
        (item.propertyType || '').toLowerCase() === this.currentType.toLowerCase()
      );
    }
    
    if (this.currentSort === 'price-low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (this.currentSort === 'price-high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    this.filteredRentals = filtered;
    
    if (filtered.length === 0 && this.currentCity && this.currentCity.length > 0) {
      this.showNotifyCTA(this.currentCity);
    } else {
      this.hideNotifyCTA();
    }
    
    this.renderRentals();
  }

  showNotifyCTA(city) {
    const notifyCTA = document.getElementById('notifyInlineCTA');
    if (notifyCTA) {
      notifyCTA.style.display = 'block';
      
      const citySpan = document.getElementById('notifyCityName');
      if (citySpan) {
        citySpan.textContent = city;
      }
      
      const notifyBtn = document.getElementById('openNotifyModal');
      if (notifyBtn) {
        notifyBtn.onclick = () => {
          this.openNotifyModal(city);
        };
      }
    }
  }

  hideNotifyCTA() {
    const notifyCTA = document.getElementById('notifyInlineCTA');
    if (notifyCTA) {
      notifyCTA.style.display = 'none';
    }
  }

  openNotifyModal(city) {
    console.log('[Rentals] Opening notify modal for:', city);
    
    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'notifyModal';
    modal.className = 'notify-modal-smarthub';
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'notify-modal-smarthub__overlay';
    overlay.onclick = () => this.closeNotifyModal();
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'notify-modal-smarthub__content';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notify-modal-smarthub__close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.onclick = () => this.closeNotifyModal();
    
    // Create header
    const header = document.createElement('div');
    header.className = 'notify-modal-smarthub__header';
    
    const h3 = document.createElement('h3');
    h3.textContent = '🔔 Get Notified';
    
    const p = document.createElement('p');
    p.innerHTML = `We'll notify you when new rentals become available in <strong>${city}</strong>`;
    
    header.appendChild(h3);
    header.appendChild(p);
    
    // Create form
    const form = document.createElement('form');
    form.id = 'notifyForm';
    form.className = 'notify-modal-smarthub__form';
    
    // Full Name field
    const nameGroup = document.createElement('div');
    nameGroup.className = 'form-group-smarthub';
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'notifyFullName');
    nameLabel.textContent = 'Full Name *';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'notifyFullName';
    nameInput.name = 'fullName';
    nameInput.required = true;
    nameInput.placeholder = 'Enter your full name';
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    
    // Phone field
    const phoneGroup = document.createElement('div');
    phoneGroup.className = 'form-group-smarthub';
    const phoneLabel = document.createElement('label');
    phoneLabel.setAttribute('for', 'notifyPhone');
    phoneLabel.textContent = 'Phone / WhatsApp *';
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.id = 'notifyPhone';
    phoneInput.name = 'phone';
    phoneInput.required = true;
    phoneInput.placeholder = '+233 or 0XX XXX XXXX';
    phoneGroup.appendChild(phoneLabel);
    phoneGroup.appendChild(phoneInput);
    
    // Email field
    const emailGroup = document.createElement('div');
    emailGroup.className = 'form-group-smarthub';
    const emailLabel = document.createElement('label');
    emailLabel.setAttribute('for', 'notifyEmail');
    emailLabel.textContent = 'Email (optional)';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.id = 'notifyEmail';
    emailInput.name = 'email';
    emailInput.placeholder = 'your@email.com';
    emailGroup.appendChild(emailLabel);
    emailGroup.appendChild(emailInput);
    
    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn-hub btn-hub--large';
    submitBtn.textContent = 'Notify Me When Available';
    
    // Assemble form
    form.appendChild(nameGroup);
    form.appendChild(phoneGroup);
    form.appendChild(emailGroup);
    form.appendChild(submitBtn);
    
    // Assemble content
    content.appendChild(closeBtn);
    content.appendChild(header);
    content.appendChild(form);
    
    // Assemble modal
    modal.appendChild(overlay);
    modal.appendChild(content);
    
    // Add to document
    document.body.appendChild(modal);
    
    // Add styles (CSP compliant)
    this.addNotifyModalStyles();
    
    // Setup form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.submitNotifyForm(city, form);
    });
    
    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);
  }

  closeNotifyModal() {
    const modal = document.getElementById('notifyModal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  async submitNotifyForm(city, form) {
    const fullName = form.querySelector('[name="fullName"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    
    const notes = `Property Notification Request for ${city} - User wants to be notified when rentals become available in this city.`;
    
    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';
      
      await window.smartHubNotifyLead({
        fullName: fullName,
        city: city,
        leadType: 'Notify',
        phone: phone,
        email: email,
        notes: notes
      });
      
      console.log('[Rentals] Notify form submitted successfully');
      
      // Create success message
      const formContainer = form.parentElement;
      formContainer.innerHTML = '';
      
      const successDiv = document.createElement('div');
      successDiv.className = 'notify-success-smarthub';
      
      const icon = document.createElement('div');
      icon.className = 'notify-success-smarthub__icon';
      icon.textContent = '✓';
      
      const h3 = document.createElement('h3');
      h3.textContent = 'Thank You!';
      
      const p1 = document.createElement('p');
      p1.innerHTML = `We'll notify you when rentals become available in <strong>${city}</strong>.`;
      
      const p2 = document.createElement('p');
      p2.className = 'notify-success-smarthub__subtext';
      p2.textContent = `We'll contact you via ${phone}`;
      
      const closeBtn = document.createElement('button');
      closeBtn.className = 'btn-hub';
      closeBtn.textContent = 'Close';
      closeBtn.onclick = () => this.closeNotifyModal();
      
      successDiv.appendChild(icon);
      successDiv.appendChild(h3);
      successDiv.appendChild(p1);
      successDiv.appendChild(p2);
      successDiv.appendChild(closeBtn);
      
      formContainer.appendChild(successDiv);
      
    } catch (error) {
      console.error('[Rentals] Notify form error:', error);
      alert('Failed to submit notification request. Please try again.');
      
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Notify Me When Available';
      }
    }
  }

  addNotifyModalStyles() {
    if (document.getElementById('notifyModalStyles')) return;
    
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'notifyModalStyles';
    document.head.appendChild(styleEl);
    
    // Get the stylesheet
    const sheet = styleEl.sheet;
    
    // Add rules using insertRule (CSP compliant)
    sheet.insertRule('.notify-modal-smarthub { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 99999; opacity: 0; transition: opacity 0.3s ease; overflow-y: auto; }');
    sheet.insertRule('.notify-modal-smarthub.active { opacity: 1; }');
    sheet.insertRule('.notify-modal-smarthub__overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.75); cursor: pointer; z-index: 99998; }');
    sheet.insertRule('.notify-modal-smarthub__content { position: relative; max-width: 500px; margin: 0 auto; margin-top: 52vh; background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4); z-index: 99999; transform: translateY(-50%); }');
    sheet.insertRule('@media (max-width: 768px) { .notify-modal-smarthub__content { margin-top: 45vh; max-width: 90%; padding: 1.5rem; } }');
    sheet.insertRule('.notify-modal-smarthub__close { position: absolute; top: 1rem; right: 1rem; background: transparent; border: none; font-size: 2rem; color: #9ca3af; cursor: pointer; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: all 0.2s ease; z-index: 100000; }');
    sheet.insertRule('.notify-modal-smarthub__close:hover { background: #f3f4f6; color: #374151; }');
    sheet.insertRule('.notify-modal-smarthub__header { margin-bottom: 1.5rem; }');
    sheet.insertRule('.notify-modal-smarthub__header h3 { color: #064635; margin: 0 0 0.5rem 0; font-size: 1.5rem; }');
    sheet.insertRule('.notify-modal-smarthub__header p { color: #6b7280; margin: 0; }');
    sheet.insertRule('.notify-modal-smarthub__form .form-group-smarthub { margin-bottom: 1rem; }');
    sheet.insertRule('.notify-modal-smarthub__form label { display: block; font-weight: 500; color: #374151; margin-bottom: 0.5rem; font-size: 0.95rem; }');
    sheet.insertRule('.notify-modal-smarthub__form input { width: 100%; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s ease; box-sizing: border-box; }');
    sheet.insertRule('.notify-modal-smarthub__form input:focus { outline: none; border-color: #064635; }');
    sheet.insertRule('.btn-hub--large { width: 100%; padding: 0.875rem 1.5rem; font-size: 1.05rem; margin-top: 0.5rem; }');
    sheet.insertRule('.notify-success-smarthub { text-align: center; padding: 2rem 0; }');
    sheet.insertRule('.notify-success-smarthub__icon { width: 80px; height: 80px; background: linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%); color: #064635; font-size: 3rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 4px 12px rgba(6, 70, 53, 0.2); animation: successPop 0.5s ease-out; }');
    sheet.insertRule('@keyframes successPop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }');
    sheet.insertRule('.notify-success-smarthub h3 { color: #064635; margin: 0 0 0.5rem 0; font-size: 1.75rem; }');
    sheet.insertRule('.notify-success-smarthub p { color: #6b7280; margin: 0 0 0.5rem 0; font-size: 1.05rem; }');
    sheet.insertRule('.notify-success-smarthub__subtext { font-size: 0.9rem !important; color: #9ca3af !important; margin-bottom: 1.5rem !important; }');
    sheet.insertRule('.notify-success-smarthub .btn-hub { margin-top: 0.5rem; padding: 0.75rem 2rem; }');
  }

  renderRentals() {
    const container = document.getElementById('rentalsContainer');
    const emptyState = document.getElementById('rentalsEmptyState');
    const countLabel = document.getElementById('propertyCount');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    
    if (!container) {
      console.error('[Rentals] Container element #rentalsContainer not found');
      return;
    }
    
    container.innerHTML = '';
    
    if (countLabel) {
      const count = this.filteredRentals.length;
      countLabel.textContent = count === 1 
        ? '1 Property Available' 
        : `${count} Rentals Available`;
    }
    
    if (this.filteredRentals.length === 0) {
      if (emptyState) {
        emptyState.style.display = 'block';
      }
      container.style.display = 'none';
      return;
    }
    
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    container.style.display = 'grid';
    
    this.filteredRentals.forEach((property) => {
      const card = this.createPropertyCard(property);
      container.appendChild(card);
    });
  }

  createPropertyCard(property) {
    const card = document.createElement('article');
    card.className = 'property-card';
    
    const featuredImage = property.cdnImages[0];
    const formattedPrice = this.formatPrice(property.price);
    
    const locationParts = [property.city, property.state].filter(Boolean);
    const location = locationParts.join(', ');
    
    card.innerHTML = `
      <div class="property-card__media">
        <img src="${featuredImage}" alt="${property.name}" loading="lazy" onerror="this.src='/images/placeholder-property.jpg'">
        <div class="property-card__badge">${property.listingType}</div>
      </div>
      <div class="property-card__body">
        <h3 class="property-card__title">${property.name}</h3>
        ${location ? `<div class="property-card__meta">
          <span>${location}</span>
          ${property.bedrooms ? `<span>${property.bedrooms} bed</span>` : ''}
          ${property.bathrooms ? `<span>${property.bathrooms} bath</span>` : ''}
        </div>` : ''}
        <div class="property-card__price-row">
          <div class="property-card__price-main">${formattedPrice}</div>
          <div class="property-card__price-hint">Managed by Smart Hub</div>
        </div>
      </div>
      <div class="property-card__footer">
        <span class="property-card__tag">
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>
          <span>${property.propertyType}</span>
        </span>
        <a class="property-card__link" href="property-single.html?id=${property.id}">
          <span>View details</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    `;
    
    return card;
  }

  formatPrice(price) {
    if (typeof price !== 'number' || price === 0) {
      return 'Price on request';
    }
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(price);
  }

  showLoading() {
    const container = document.getElementById('rentalsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    if (loadingSpinner) {
      loadingSpinner.style.display = 'block';
    }
    
    if (container) {
      container.style.display = 'none';
    }
  }

  showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
  }
}

// Initialize when DOM is ready
let rentalsLoader;

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Rentals] DOM ready, initializing v3.3 (CSP Compliant)...');
  rentalsLoader = new RentalsLoader();
  rentalsLoader.init();
});