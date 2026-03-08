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
      description: fields[fieldMap.description] || 'No description available.',
      cdnImages: cdnImages,
      cdnVideo: fields[fieldMap.cdnVideo] || null,
      cdn360: fields[fieldMap.cdn360] || null,
      virtualTourURL: fields[fieldMap.virtualTourURL] || null
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
    
    // 360° Content (Image or Video)
    this.render360Content();
    
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

  render360Content() {
    // Check for 360° content (image or video)
    const has360Image = this.property.cdn360 || this.property.cdnPanoramaURL;
    const has360Video = this.property.cdn360Video || this.property.panorama360VideoURL;
    
    if (!has360Image && !has360Video) {
      return; // No 360° content
    }
    
    const panoramaContainer = document.getElementById('property360');
    if (!panoramaContainer) {
      return;
    }
    
    // Determine content type and URL
    let contentURL = '';
    let contentType = 'image'; // 'image' or 'video'
    
    if (has360Video) {
      contentURL = this.property.cdn360Video || this.property.panorama360VideoURL;
      contentType = 'video';
    } else {
      contentURL = this.property.cdn360 || this.property.cdnPanoramaURL;
      contentType = 'image';
    }
    
    console.log('[PropertyDetail] Adding 360° content:', contentType, contentURL);
    
    // Create container with Pannellum viewer
    panoramaContainer.innerHTML = `
      <h4>
        <i class="icon-camera"></i> 
        360° ${contentType === 'video' ? 'Video' : 'View'}
      </h4>
      <div id="panoramaViewer" style="
        width: 100%; 
        height: 500px; 
        border-radius: 12px; 
        overflow: hidden;
        background: #000;
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 1.2rem;
        ">
          Loading 360° ${contentType}...
        </div>
      </div>
      <p class="text-muted mt-2" style="font-size: 0.9rem;">
        <i class="icon-info-circle"></i> 
        ${contentType === 'video' 
          ? 'Click play, then drag to look around. Use mouse wheel to zoom.' 
          : 'Drag to look around. Use mouse wheel to zoom. Click fullscreen for immersive experience.'}
      </p>
    `;
    
    // Initialize Pannellum viewer
    setTimeout(() => {
      this.initPannellumViewer(contentURL, contentType);
    }, 100);
  }

  initPannellumViewer(contentURL, contentType) {
    // Check if Pannellum library is loaded
    if (typeof pannellum === 'undefined') {
      console.error('[PropertyDetail] Pannellum library not loaded');
      document.getElementById('panoramaViewer').innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
          <p>360° viewer library not loaded.</p>
          <a href="${contentURL}" target="_blank" class="btn btn-hub btn-sm mt-2">
            View ${contentType === 'video' ? 'Video' : 'Image'} Directly
          </a>
        </div>
      `;
      return;
    }
    
    try {
      // Configure viewer based on content type
      const viewerConfig = {
        type: 'equirectangular',
        autoLoad: contentType === 'image', // Auto-load images, not videos
        showControls: true,
        showFullscreenCtrl: true,
        showZoomCtrl: true,
        mouseZoom: true,
        draggable: true,
        keyboardZoom: true,
        compass: false,
        hotSpotDebug: false,
      };
      
      if (contentType === 'video') {
        // 360° Video configuration
        const videoElement = document.createElement('video');
        videoElement.src = contentURL;
        videoElement.loop = true;
        videoElement.controls = true;
        videoElement.crossOrigin = 'anonymous';
        videoElement.style.width = '100%';
        videoElement.style.height = '100%';
        videoElement.style.objectFit = 'cover';
        
        viewerConfig.panorama = videoElement;
        
        console.log('[PropertyDetail] 360° video configured');
      } else {
        // 360° Image configuration
        viewerConfig.panorama = contentURL;
        
        console.log('[PropertyDetail] 360° image configured');
      }
      
      // Initialize viewer
      const viewer = pannellum.viewer('panoramaViewer', viewerConfig);
      
      console.log('[PropertyDetail] Pannellum viewer initialized');
      
    } catch (error) {
      console.error('[PropertyDetail] Error initializing 360° viewer:', error);
      
      // Fallback display
      document.getElementById('panoramaViewer').innerHTML = `
        <div style="padding: 40px; text-align: center; color: #666;">
          <p>Unable to load 360° viewer.</p>
          <a href="${contentURL}" target="_blank" class="btn btn-hub btn-sm mt-2">
            View ${contentType === 'video' ? 'Video' : 'Image'} Directly
          </a>
        </div>
      `;
    }
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
      const email = form.querySelector('[name="email"]')?.value.trim() || '';
      const message = form.querySelector('[name="message"]')?.value.trim() || '';
      
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
      const phone = form.querySelector('[name="phone"]')?.value || 'phone';
      window.showLeadSuccessMessage(form, {
        title: 'Thank You!',
        message: 'We have received your inquiry and will contact you soon.',
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