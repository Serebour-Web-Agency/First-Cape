// SmartHub Single Rental Detail Page
// Loads and displays individual rental with image gallery, video, and inquiry form

class RentalDetailLoader {
  constructor() {
    this.rental = null;
    this.currentImageIndex = 0;
    this.rentalId = null;
  }

  async init() {
    console.log('[RentalDetail] Initializing...');
    
    this.rentalId = this.getRentalIdFromUrl();
    
    if (!this.rentalId) {
      this.showError('Rental not found. Invalid URL.');
      return;
    }
    
    this.showLoading();
    await this.loadRental();
    
    if (this.rental) {
      this.renderRental();
      this.setupGallery();
      this.setupInquiryForm();
    }
  }

  getRentalIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  async loadRental() {
    try {
      const config = SMARTHUB_CONFIG.airtable;
      
      const record = await airtableClient.fetchRecord(
        config.tables.rentals,
        this.rentalId
      );
      
      if (!record) {
        throw new Error('Rental not found');
      }
      
      this.rental = this.transformRecord(record);
      
      if (!this.rental.cdnImages || this.rental.cdnImages.length === 0) {
        throw new Error('Rental images not available');
      }
      
      console.log('[RentalDetail] Rental loaded:', this.rental.name);
      
    } catch (error) {
      console.error('[RentalDetail] Error loading rental:', error);
      this.showError('Rental not found or unavailable.');
    }
  }

  transformRecord(record) {
    const fields = record.fields;
    const fieldMap = SMARTHUB_CONFIG.airtable.rentalFields;
    
    return {
      id: record.id,
      name: fields[fieldMap.name] || 'Untitled Rental',
      monthlyRent: fields[fieldMap.monthlyRent] || 0,
      city: fields[fieldMap.city] || 'Unknown',
      bedrooms: fields[fieldMap.bedrooms] || 0,
      bathrooms: fields[fieldMap.bathrooms] || 0,
      area: fields[fieldMap.area] || 0,
      propertyType: fields[fieldMap.propertyType] || 'Property',
      description: fields[fieldMap.description] || '',
      cdnImages: fields[fieldMap.cdnImages] || [],
      cdnVideo: fields[fieldMap.cdnVideo] || null,
      featured: fields[fieldMap.featured] || false
    };
  }

  renderRental() {
    const titleElement = document.getElementById('rentalTitle');
    if (titleElement) {
      titleElement.textContent = this.rental.name;
    }
    
    const locationElement = document.getElementById('rentalLocation');
    if (locationElement) {
      locationElement.textContent = this.rental.city;
    }
    
    const priceElement = document.getElementById('rentalPrice');
    if (priceElement) {
      priceElement.textContent = `${this.formatPrice(this.rental.monthlyRent)}/month`;
    }
    
    const specsElement = document.getElementById('rentalSpecs');
    if (specsElement) {
      specsElement.innerHTML = `
        <div class="spec-item">
          <i class="icon-bed"></i>
          <span>${this.rental.bedrooms} Bedrooms</span>
        </div>
        <div class="spec-item">
          <i class="icon-bath"></i>
          <span>${this.rental.bathrooms} Bathrooms</span>
        </div>
        <div class="spec-item">
          <i class="icon-area"></i>
          <span>${this.rental.area} m²</span>
        </div>
        <div class="spec-item">
          <i class="icon-type"></i>
          <span>${this.rental.propertyType}</span>
        </div>
      `;
    }
    
    const descElement = document.getElementById('rentalDescription');
    if (descElement) {
      descElement.textContent = this.rental.description;
    }
    
    const mainImage = document.getElementById('mainRentalImage');
    if (mainImage) {
      mainImage.src = this.rental.cdnImages[0];
      mainImage.alt = this.rental.name;
    }
    
    const thumbnailContainer = document.getElementById('imageThumbnails');
    if (thumbnailContainer) {
      thumbnailContainer.innerHTML = '';
      this.rental.cdnImages.forEach((imageUrl, index) => {
        const thumb = document.createElement('img');
        thumb.src = imageUrl;
        thumb.alt = `${this.rental.name} - Image ${index + 1}`;
        thumb.className = index === 0 ? 'thumbnail active' : 'thumbnail';
        thumb.addEventListener('click', () => this.showImage(index));
        thumbnailContainer.appendChild(thumb);
      });
    }
    
    if (this.rental.cdnVideo) {
      const videoContainer = document.getElementById('rentalVideo');
      if (videoContainer) {
        videoContainer.innerHTML = `
          <video controls poster="${this.rental.cdnImages[0]}">
            <source src="${this.rental.cdnVideo}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        `;
      }
    }
    
    document.title = `${this.rental.name} - SmartHub Ghana`;
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
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousImage();
      if (e.key === 'ArrowRight') this.nextImage();
    });
  }

  showImage(index) {
    this.currentImageIndex = index;
    
    const mainImage = document.getElementById('mainRentalImage');
    if (mainImage) {
      mainImage.src = this.rental.cdnImages[index];
    }
    
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }

  previousImage() {
    const newIndex = this.currentImageIndex > 0 
      ? this.currentImageIndex - 1 
      : this.rental.cdnImages.length - 1;
    this.showImage(newIndex);
  }

  nextImage() {
    const newIndex = this.currentImageIndex < this.rental.cdnImages.length - 1 
      ? this.currentImageIndex + 1 
      : 0;
    this.showImage(newIndex);
  }

  setupInquiryForm() {
    const form = document.getElementById('rentalInquiryForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = form.querySelector('[name="fullName"]').value;
      const phone = form.querySelector('[name="phone"]').value;
      const email = form.querySelector('[name="email"]').value;
      const message = form.querySelector('[name="message"]').value;
      
      const notes = `Rental Inquiry: ${this.rental.name} (${this.rental.city}) - Rent: ${this.formatPrice(this.rental.monthlyRent)}/month\n\nMessage: ${message}`;
      
      try {
        await smartHubNotifyLead({
          fullName: fullName,
          city: this.rental.city,
          leadType: 'Rent',
          phone: phone,
          email: email,
          notes: notes
        });
        
        this.showFormSuccess();
        form.reset();
        
      } catch (error) {
        console.error('[RentalDetail] Form submission error:', error);
        alert('Failed to submit inquiry. Please try again.');
      }
    });
  }

  showFormSuccess() {
    const form = document.getElementById('rentalInquiryForm');
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = 'Thank you! We will contact you shortly.';
    form.insertAdjacentElement('beforebegin', successMsg);
    
    setTimeout(() => successMsg.remove(), 5000);
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0
    }).format(price);
  }

  showLoading() {
    const container = document.getElementById('rentalDetailContainer');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading rental details...</p>
        </div>
      `;
    }
  }

  showError(message) {
    const container = document.getElementById('rentalDetailContainer');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <h2>Oops!</h2>
          <p>${message}</p>
          <a href="rentals.html" class="btn-back">Back to Rentals</a>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
let rentalDetailLoader;

document.addEventListener('DOMContentLoaded', () => {
  rentalDetailLoader = new RentalDetailLoader();
  rentalDetailLoader.init();
});