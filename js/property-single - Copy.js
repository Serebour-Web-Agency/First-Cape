// SmartHub Single Property Detail Page
// Works for both Buy and Rent properties
// Version: 2.1 - Fixed loading and display

class PropertyDetailLoader {
  constructor() {
    this.property = null;
    this.currentImageIndex = 0;
    this.propertyId = null;
  }

  async init() {
    console.log('[PropertyDetail] Initializing...');
    
    // Get property ID from URL
    this.propertyId = this.getPropertyIdFromUrl();
    
    if (!this.propertyId) {
      console.error('[PropertyDetail] No property ID in URL');
      this.showError('Property not found. Invalid URL.');
      return;
    }
    
    console.log('[PropertyDetail] Loading property ID:', this.propertyId);
    
    this.showLoading();
    await this.loadProperty();
    
    if (this.property) {
      this.hideLoading();
      this.renderProperty();
      this.setupGallery();
      this.setupInquiryForm();
      this.initializeMap();
    }
  }

  getPropertyIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    console.log('[PropertyDetail] Property ID from URL:', id);
    return id;
  }

  async loadProperty() {
    try {
      const config = SMARTHUB_CONFIG.airtable;
      
      console.log('[PropertyDetail] Fetching record:', this.propertyId);
      
      const record = await airtableClient.fetchRecord(
        config.tables.properties,
        this.propertyId
      );
      
      if (!record) {
        throw new Error('Property not found');
      }
      
      console.log('[PropertyDetail] Record fetched:', record);
      
      this.property = this.transformRecord(record);
      
      console.log('[PropertyDetail] Property transformed:', this.property);
      
      // Validate CDN images exist
      if (!this.property.cdnImages || this.property.cdnImages.length === 0) {
        console.warn('[PropertyDetail] No CDN images, using placeholder');
        this.property.cdnImages = [SMARTHUB_CONFIG.display.placeholderImage || '/images/placeholder-property.jpg'];
      }
      
      console.log('[PropertyDetail] Property loaded successfully:', this.property.name);
      
    } catch (error) {
      console.error('[PropertyDetail] Error loading property:', error);
      this.hideLoading();
      this.showError('Property not found or unavailable.');
    }
  }

  
  /**
   * Extract description from Airtable computed field
   * Handles both string and object formats
   */
  extractDescription(descriptionField) {
    if (!descriptionField) {
      return 'No description available.';
    }
    
    // If it's already a string, return it
    if (typeof descriptionField === 'string') {
      return descriptionField;
    }
    
    // If it's an object (computed field with error state)
    if (typeof descriptionField === 'object') {
      // Try to get the value field
      if (descriptionField.value) {
        return descriptionField.value;
      }
      // If it has an error, try to extract any text
      if (descriptionField.error) {
        return 'Description temporarily unavailable.';
      }
    }
    
    return 'No description available.';
  }
  transformRecord(record) {
    const fields = record.fields;
    const fieldMap = SMARTHUB_CONFIG.airtable.propertyFields;
    
    console.log('[PropertyDetail] Transforming record with fields:', Object.keys(fields));
    
    // Parse CDN Gallery URLs - try multiple formats
    let cdnImages = [];
    
    // Try CDN Gallery JSON first (preferred)
    if (fields[fieldMap.cdnGalleryJSON]) {
      try {
        const parsed = JSON.parse(fields[fieldMap.cdnGalleryJSON]);
        if (Array.isArray(parsed)) {
          cdnImages = parsed;
          console.log('[PropertyDetail] Parsed CDN Gallery JSON:', cdnImages.length, 'images');
        }
      } catch (e) {
        console.warn('[PropertyDetail] Failed to parse CDN Gallery JSON:', e);
      }
    }
    
    // Fallback to CDN Gallery URLs (comma or newline separated)
    if (cdnImages.length === 0 && fields[fieldMap.cdnGalleryURLs]) {
      cdnImages = fields[fieldMap.cdnGalleryURLs]
        .split(/[,\n]/)
        .map(url => url.trim())
        .filter(url => url.length > 0 && url.startsWith('http'));
      console.log('[PropertyDetail] Parsed CDN Gallery URLs:', cdnImages.length, 'images');
    }
    
    // Fallback to CDN Main Image
    if (cdnImages.length === 0 && fields[fieldMap.cdnMainImage]) {
      cdnImages = [fields[fieldMap.cdnMainImage]];
      console.log('[PropertyDetail] Using CDN Main Image');
    }
    
    return {
      id: record.id,
      name: fields[fieldMap.name] || 'Untitled Property',
      price: fields[fieldMap.price] || 0,
      city: fields[fieldMap.city] || 'Unknown',
      state: fields[fieldMap.state] || '',
      address: fields[fieldMap.address] || '',
      bedrooms: fields[fieldMap.bedrooms] || 0,
      bathrooms: fields[fieldMap.bathrooms] || 0,
      size: fields[fieldMap.size] || 0,
      yearBuilt: fields[fieldMap.yearBuilt] || null,
      propertyType: fields[fieldMap.propertyType] || 'Residential',
      listingType: fields[fieldMap.listingType] || 'Buy',
      description: this.extractDescription(fields[fieldMap.description]),
      cdnImages: cdnImages,
      cdnVideo: fields[fieldMap.cdnVideo] || null,
      cdn360: fields[fieldMap.cdn360] || null,
      virtualTourURL: fields[fieldMap.virtualTourURL] || null,
    };
  }

  renderProperty() {
    console.log('[PropertyDetail] Rendering property:', this.property.name);
    
    // Determine if Buy or Rent
    const isBuy = this.property.listingType === 'Buy';
    const leadType = isBuy ? 'Buy' : 'Rent';
    
    // Property title
    const titleElement = document.getElementById('propertyTitle');
    if (titleElement) {
      titleElement.textContent = this.property.name;
    }
    
    // Property location
    const locationElement = document.getElementById('propertyLocation');
    if (locationElement) {
      const locationParts = [this.property.address, this.property.city, this.property.state].filter(Boolean);
      locationElement.textContent = locationParts.join(', ');
    }
    
    // Property price
    const priceElement = document.getElementById('propertyPrice');
    if (priceElement) {
      const priceText = isBuy 
        ? this.formatPrice(this.property.price)
        : `${this.formatPrice(this.property.price)}/month`;
      priceElement.textContent = priceText;
    }
    
    // Property specs
    const specsElement = document.getElementById('propertySpecs');
    if (specsElement) {
      specsElement.innerHTML = `
        <div class="row">
          <div class="col-md-4 mb-2"><strong>Beds:</strong> ${this.property.bedrooms}</div>
          <div class="col-md-4 mb-2"><strong>Baths:</strong> ${this.property.bathrooms}</div>
          <div class="col-md-4 mb-2"><strong>Size:</strong> ${this.property.size.toLocaleString()} sq ft</div>
        </div>
        <div class="row">
          <div class="col-md-4 mb-2"><strong>Type:</strong> ${this.property.propertyType}</div>
          <div class="col-md-4 mb-2"><strong>Status:</strong> Available</div>
          ${this.property.yearBuilt ? `<div class="col-md-4 mb-2"><strong>Year Built:</strong> ${this.property.yearBuilt}</div>` : ''}
        </div>
      `;
    }
    
    // Property description
    const descElement = document.getElementById('propertyDescription');
    if (descElement) {
      descElement.textContent = this.property.description;
    }
    
    // Main image
    const mainImage = document.getElementById('mainPropertyImage');
    if (mainImage && this.property.cdnImages.length > 0) {
      mainImage.src = this.property.cdnImages[0];
      mainImage.alt = this.property.name;
      mainImage.style.display = 'block';
      console.log('[PropertyDetail] Set main image:', this.property.cdnImages[0]);
    }
    
    // Image gallery thumbnails
    const thumbnailContainer = document.getElementById('imageThumbnails');
    if (thumbnailContainer && this.property.cdnImages.length > 0) {
      thumbnailContainer.innerHTML = '';
      this.property.cdnImages.forEach((imageUrl, index) => {
        const thumb = document.createElement('img');
        thumb.src = imageUrl;
        thumb.alt = `${this.property.name} - Image ${index + 1}`;
        thumb.className = index === 0 ? 'thumbnail active' : 'thumbnail';
        thumb.addEventListener('click', () => this.showImage(index));
        thumbnailContainer.appendChild(thumb);
      });
      console.log('[PropertyDetail] Added', this.property.cdnImages.length, 'thumbnails');
    }
    
    // Video player (if available)
    if (this.property.cdnVideo) {
      const videoContainer = document.getElementById('propertyVideo');
      if (videoContainer) {
        videoContainer.innerHTML = `
          <h4>Video Tour</h4>
          <video controls style="width: 100%; border-radius: 8px;" poster="${this.property.cdnImages[0]}">
            <source src="${this.property.cdnVideo}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        `;
        console.log('[PropertyDetail] Added video player');
      }
    }
    
    
    // 360 Panorama - Smart file type detection
    if (this.property.cdn360) {
      const panoramaContainer = document.getElementById('property360');
      if (panoramaContainer) {
        const url = this.property.cdn360;
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        
        if (extension === 'mp4' || extension === 'webm' || extension === 'mov') {
          // Video file - use video player
          panoramaContainer.innerHTML = `
            <h4>360° Video Tour</h4>
            <video controls style="width: 100%; border-radius: 8px; background: #000;">
              <source src="${url}" type="video/${extension === 'mov' ? 'quicktime' : extension}">
              Your browser does not support 360° video playback.
            </video>
          `;
          console.log('[PropertyDetail] Added 360 video tour:', extension);
        } else {
          // Image file - check if Pannellum is available
          if (typeof pannellum !== 'undefined') {
            panoramaContainer.innerHTML = `
              <h4>360° Interactive Panorama</h4>
              <div id="panorama-viewer" style="width: 100%; height: 500px; border-radius: 8px;"></div>
            `;
            
            pannellum.viewer('panorama-viewer', {
              type: 'equirectangular',
              panorama: url,
              autoLoad: true,
              showControls: true,
              mouseZoom: true,
              compass: true
            });
            console.log('[PropertyDetail] Added interactive 360 panorama with Pannellum');
          } else {
            // Fallback: Static image
            panoramaContainer.innerHTML = `
              <h4>360° Panorama</h4>
              <img src="${url}" alt="360 Panorama" style="width: 100%; border-radius: 8px; cursor: pointer;" 
                   onclick="window.open('${url}', '_blank')">
              <p style="font-size: 0.9em; color: #666; margin-top: 0.5rem;">Click to view full size</p>
            `;
            console.log('[PropertyDetail] Added static 360 panorama (Pannellum not available)');
          }
        }
      }
    }
    
    // Virtual Tour Link
    if (this.property.virtualTourURL) {
      const virtualTourContainer = document.getElementById('propertyVirtualTour');
      if (virtualTourContainer) {
        virtualTourContainer.innerHTML = `
          <h4>Virtual Tour</h4>
          <a href="${this.property.virtualTourURL}" target="_blank" class="btn btn-hub">
            Launch Virtual Tour
          </a>
        `;
        console.log('[PropertyDetail] Added virtual tour link');
      }
    }
    
    // Update page title
    document.title = `${this.property.name} - SmartHub Ghana`;
    
    console.log('[PropertyDetail] Rendering complete');
  }

  setupGallery() {
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousImage());
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextImage());
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousImage();
      if (e.key === 'ArrowRight') this.nextImage();
    });
    
    console.log('[PropertyDetail] Gallery navigation setup complete');
  }

  showImage(index) {
    this.currentImageIndex = index;
    
    const mainImage = document.getElementById('mainPropertyImage');
    if (mainImage && this.property.cdnImages[index]) {
      mainImage.src = this.property.cdnImages[index];
    }
    
    // Update thumbnail active state
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }

  previousImage() {
    const newIndex = this.currentImageIndex > 0 
      ? this.currentImageIndex - 1 
      : this.property.cdnImages.length - 1;
    this.showImage(newIndex);
  }

  nextImage() {
    const newIndex = this.currentImageIndex < this.property.cdnImages.length - 1 
      ? this.currentImageIndex + 1 
      : 0;
    this.showImage(newIndex);
  }

  initializeMap() {
    if (!this.property) return;
    
    const mapContainer = document.getElementById('map');
    const mapAddress = document.getElementById('mapAddress');
    
    if (!mapContainer) return;
    
    // Build full address
    const addressParts = [
      this.property.address,
      this.property.city,
      this.property.state,
      this.property.country || 'Ghana'
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(', ');
    
    if (mapAddress) {
      mapAddress.textContent = fullAddress;
    }
    
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      mapContainer.innerHTML = '<div style="padding: 2rem; text-align: center; background: #f3f4f6; border-radius: 8px;"><p style="margin: 0; color: #6b7280;">Map unavailable. Location: ' + fullAddress + '</p></div>';
      console.warn('[PropertyDetail] Google Maps API not loaded');
      return;
    }
    
    // PRIORITY: Check if manual coordinates exist in Airtable (FREE!)
    //     if (this.property.latitude && this.property.longitude) {
    //       console.log('[PropertyDetail] Using manual coordinates from Airtable (no geocoding needed)');
    //       
    //       const location = {
    //         lat: parseFloat(this.property.latitude),
    //         lng: parseFloat(this.property.longitude)
    //       };
    //       
    //       // Create map with manual coordinates
    //       const map = new google.maps.Map(mapContainer, {
    //         center: location,
    //         zoom: 16, // Closer zoom since coordinates are precise
    //         mapTypeControl: true,
    //         streetViewControl: true,
    //         fullscreenControl: true
    //       });
    //       
    //       // Add marker
    //       new google.maps.Marker({
    //         position: location,
    //         map: map,
    //         title: this.property.name,
    //         animation: google.maps.Animation.DROP
    //       });
    //       
    //       console.log('[PropertyDetail] Map initialized with precise coordinates:', location);
    //       return; // Done! No geocoding needed
    //     }
    
    // Geocode the address if no manual coordinates (costs money after free tier)
    console.log('[PropertyDetail] Geocoding address...');
    const geocoder = new google.maps.Geocoder();
    
    geocoder.geocode({ address: fullAddress }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        
        // Create map
        const map = new google.maps.Map(mapContainer, {
          center: location,
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });
        
        // Add marker
        new google.maps.Marker({
          position: location,
          map: map,
          title: this.property.name,
          animation: google.maps.Animation.DROP
        });
        
        console.log('[PropertyDetail] Map initialized via geocoding for:', this.property.city);
        console.log('[PropertyDetail] TIP: Add these coordinates to Airtable to avoid geocoding costs:');
        console.log('  Latitude:', location.lat());
        console.log('  Longitude:', location.lng());
      } else {
        // Fallback: Use city center
        const ghanaCenter = { lat: 5.6037, lng: -0.1870 }; // Accra
        
        const map = new google.maps.Map(mapContainer, {
          center: ghanaCenter,
          zoom: 12,
          mapTypeControl: true
        });
        
        console.warn('[PropertyDetail] Geocoding failed, showing general area');
      }
    });
  }

  setupInquiryForm() {
    const form = document.getElementById('propertyInquiryForm');
    if (!form) {
      console.warn('[PropertyDetail] Inquiry form not found');
      return;
    }
    
    // Determine lead type based on listing type
    const leadType = this.property.listingType === 'Buy' ? 'Buy' : 'Rent';
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = form.querySelector('[name="fullName"]').value.trim();
      const phone = form.querySelector('[name="phone"]').value.trim();
      const emailInput = form.querySelector('[name="email"]');
      const email = emailInput ? emailInput.value.trim() : '';
      const messageInput = form.querySelector('[name="message"]');
      const message = messageInput ? messageInput.value.trim() : '';
      
      const priceText = leadType === 'Buy' 
        ? this.formatPrice(this.property.price)
        : `${this.formatPrice(this.property.price)}/month`;
      
      const notes = `${leadType} Inquiry: ${this.property.name} (${this.property.city}) - Price: ${priceText}\n\nMessage: ${message}`;
      
      try {
        console.log('[PropertyDetail] Submitting inquiry...');
        
        await window.smartHubNotifyLead({
          fullName: fullName,
          city: this.property.city,
          leadType: leadType,
          phone: phone,
          email: email,
          notes: notes
        });
        
        console.log('[PropertyDetail] Inquiry submitted successfully');
        
        this.showFormSuccess();
        form.reset();
        
      } catch (error) {
        console.error('[PropertyDetail] Form submission error:', error);
        alert('Failed to submit inquiry. Please try again.');
      }
    });
    
    console.log('[PropertyDetail] Inquiry form setup complete');
  }

  showFormSuccess() {
    const form = document.getElementById('propertyInquiryForm');
    if (!form) return;
    
    // Use the new canonical success message
    if (window.showLeadSuccessMessage) {
      const phoneInput = form.querySelector('[name="phone"]');
      const phone = phoneInput ? phoneInput.value : 'phone';
      window.showLeadSuccessMessage(form, {
        title: 'Thank You!',
        message: 'We\'ve received your inquiry and will contact you soon.',
        phone: phone,
        autoClose: true,
        closeDelay: 5000
      });
    }
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
    const loadingSpinner = document.getElementById('loadingSpinner');
    const propertyContent = document.getElementById('propertyContent');
    
    if (loadingSpinner) {
      loadingSpinner.style.display = 'block';
    }
    
    if (propertyContent) {
      propertyContent.style.display = 'none';
    }
    
    console.log('[PropertyDetail] Showing loading state');
  }

  hideLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const propertyContent = document.getElementById('propertyContent');
    
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    
    if (propertyContent) {
      propertyContent.style.display = 'block';
    }
    
    console.log('[PropertyDetail] Hiding loading state');
  }

  showError(message) {
    const container = document.getElementById('propertyDetailContainer');
    if (!container) return;
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    
    container.innerHTML = `
      <div class="error-state" style="text-align: center; padding: 3rem 1rem;">
        <h2>Oops!</h2>
        <p>${message}</p>
        <a href="properties.html" class="btn btn-hub mt-3">Back to Properties</a>
      </div>
    `;
    
    console.error('[PropertyDetail] Error displayed:', message);
  }
}

// Initialize when DOM is ready
let propertyDetailLoader;

document.addEventListener('DOMContentLoaded', () => {
  console.log('[PropertyDetail] DOM ready, initializing...');
  propertyDetailLoader = new PropertyDetailLoader();
  propertyDetailLoader.init();
});