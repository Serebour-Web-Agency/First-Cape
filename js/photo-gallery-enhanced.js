// SmartHub Enhanced Photo Gallery
// Version: 2.0
// Beautiful lightbox gallery with zoom, share, and advanced navigation

class PhotoGallery {
  constructor(containerId, images, config = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.images = images;
    this.config = {
      showThumbnails: config.showThumbnails !== false,
      showCounter: config.showCounter !== false,
      enableZoom: config.enableZoom !== false,
      enableShare: config.enableShare !== false,
      enableDownload: config.enableDownload !== false,
      enableFullscreen: config.enableFullscreen !== false,
      autoPlay: config.autoPlay || false,
      autoPlayInterval: config.autoPlayInterval || 3000,
      ...config
    };
    
    this.currentIndex = 0;
    this.lightboxOpen = false;
    this.isZoomed = false;
    this.autoPlayTimer = null;
    
    this.init();
  }

  /**
   * Initialize gallery
   */
  init() {
    if (!this.container) {
      console.error('[PhotoGallery] Container not found:', this.containerId);
      return;
    }

    this.renderGallery();
    this.attachEventListeners();
  }

  /**
   * Render gallery
   */
  renderGallery() {
    this.container.innerHTML = `
      <div class="photo-gallery">
        <!-- Main Image -->
        <div class="photo-gallery-main" onclick="photoGallery.openLightbox(${this.currentIndex})">
          <img 
            src="${this.images[0].url}" 
            alt="${this.images[0].caption || 'Property image'}"
            class="photo-gallery-main-img"
          >
          <div class="photo-gallery-overlay">
            <div class="photo-gallery-count">
              📷 ${this.images.length} Photos
            </div>
            <div class="photo-gallery-zoom-hint">
              Click to view gallery
            </div>
          </div>
        </div>
        
        <!-- Thumbnails -->
        ${this.config.showThumbnails ? this.renderThumbnails() : ''}
      </div>
    `;
  }

  /**
   * Render thumbnails
   */
  renderThumbnails() {
    return `
      <div class="photo-gallery-thumbnails">
        ${this.images.slice(0, 6).map((img, index) => `
          <div class="photo-gallery-thumb ${index === 0 ? 'photo-gallery-thumb--active' : ''}" 
               onclick="photoGallery.openLightbox(${index})">
            <img src="${img.thumbnail || img.url}" alt="${img.caption || ''}">
            ${index === 5 && this.images.length > 6 ? `
              <div class="photo-gallery-thumb-more">+${this.images.length - 6}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Open lightbox
   */
  openLightbox(index = 0) {
    this.currentIndex = index;
    this.lightboxOpen = true;
    
    // Create lightbox
    const lightbox = document.createElement('div');
    lightbox.id = 'photo-lightbox';
    lightbox.className = 'photo-lightbox';
    
    lightbox.innerHTML = `
      <div class="photo-lightbox-overlay" onclick="photoGallery.closeLightbox()"></div>
      
      <div class="photo-lightbox-content">
        <!-- Close Button -->
        <button class="photo-lightbox-close" onclick="photoGallery.closeLightbox()">×</button>
        
        <!-- Top Controls -->
        <div class="photo-lightbox-controls-top">
          <div class="photo-lightbox-counter">
            <span id="lightbox-current">1</span> / <span id="lightbox-total">${this.images.length}</span>
          </div>
          <div class="photo-lightbox-actions">
            ${this.config.enableShare ? `
              <button class="photo-lightbox-btn" onclick="photoGallery.shareImage()" title="Share">
                📤
              </button>
            ` : ''}
            ${this.config.enableDownload ? `
              <button class="photo-lightbox-btn" onclick="photoGallery.downloadImage()" title="Download">
                ⬇️
              </button>
            ` : ''}
            ${this.config.enableZoom ? `
              <button class="photo-lightbox-btn" onclick="photoGallery.toggleZoom()" title="Zoom" id="zoom-btn">
                🔍
              </button>
            ` : ''}
            ${this.config.enableFullscreen ? `
              <button class="photo-lightbox-btn" onclick="photoGallery.toggleFullscreen()" title="Fullscreen">
                ⛶
              </button>
            ` : ''}
          </div>
        </div>
        
        <!-- Image Container -->
        <div class="photo-lightbox-image-wrapper" id="lightbox-image-wrapper">
          <img 
            src="${this.images[index].url}" 
            alt="${this.images[index].caption || ''}"
            class="photo-lightbox-image"
            id="lightbox-image"
          >
          
          <!-- Loading Spinner -->
          <div class="photo-lightbox-loading" id="lightbox-loading">
            <div class="photo-lightbox-spinner"></div>
          </div>
        </div>
        
        <!-- Navigation Arrows -->
        <button class="photo-lightbox-nav photo-lightbox-nav--prev" onclick="photoGallery.navigate(-1)">
          ‹
        </button>
        <button class="photo-lightbox-nav photo-lightbox-nav--next" onclick="photoGallery.navigate(1)">
          ›
        </button>
        
        <!-- Caption -->
        <div class="photo-lightbox-caption" id="lightbox-caption">
          ${this.images[index].caption || ''}
        </div>
        
        <!-- Thumbnails Strip -->
        <div class="photo-lightbox-thumbnails" id="lightbox-thumbnails">
          ${this.renderLightboxThumbnails()}
        </div>
      </div>
    `;
    
    document.body.appendChild(lightbox);
    
    // Trigger animation
    setTimeout(() => {
      lightbox.classList.add('photo-lightbox--visible');
    }, 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Update counter
    this.updateCounter();
    
    // Start autoplay if enabled
    if (this.config.autoPlay) {
      this.startAutoPlay();
    }
  }

  /**
   * Close lightbox
   */
  closeLightbox() {
    const lightbox = document.getElementById('photo-lightbox');
    if (!lightbox) return;
    
    this.stopAutoPlay();
    
    lightbox.classList.remove('photo-lightbox--visible');
    setTimeout(() => {
      lightbox.remove();
      document.body.style.overflow = '';
      this.lightboxOpen = false;
      this.isZoomed = false;
    }, 300);
  }

  /**
   * Navigate images
   */
  navigate(direction) {
    this.currentIndex += direction;
    
    // Loop around
    if (this.currentIndex < 0) {
      this.currentIndex = this.images.length - 1;
    } else if (this.currentIndex >= this.images.length) {
      this.currentIndex = 0;
    }
    
    this.updateLightboxImage();
    
    // Reset autoplay timer
    if (this.config.autoPlay) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }

  /**
   * Update lightbox image
   */
  updateLightboxImage() {
    const img = document.getElementById('lightbox-image');
    const caption = document.getElementById('lightbox-caption');
    const loading = document.getElementById('lightbox-loading');
    
    if (!img) return;
    
    // Show loading
    if (loading) loading.style.display = 'flex';
    
    // Update image
    img.style.opacity = '0';
    
    setTimeout(() => {
      img.src = this.images[this.currentIndex].url;
      img.alt = this.images[this.currentIndex].caption || '';
      
      img.onload = () => {
        if (loading) loading.style.display = 'none';
        img.style.opacity = '1';
      };
      
      // Update caption
      if (caption) {
        caption.textContent = this.images[this.currentIndex].caption || '';
      }
      
      // Update counter
      this.updateCounter();
      
      // Update thumbnail highlights
      this.updateThumbnailHighlights();
      
      // Reset zoom
      this.isZoomed = false;
      img.classList.remove('photo-lightbox-image--zoomed');
    }, 150);
  }

  /**
   * Update counter
   */
  updateCounter() {
    const current = document.getElementById('lightbox-current');
    if (current) {
      current.textContent = this.currentIndex + 1;
    }
  }

  /**
   * Render lightbox thumbnails
   */
  renderLightboxThumbnails() {
    return this.images.map((img, index) => `
      <div class="photo-lightbox-thumb ${index === this.currentIndex ? 'photo-lightbox-thumb--active' : ''}" 
           onclick="photoGallery.jumpToImage(${index})">
        <img src="${img.thumbnail || img.url}" alt="${img.caption || ''}">
      </div>
    `).join('');
  }

  /**
   * Jump to specific image
   */
  jumpToImage(index) {
    this.currentIndex = index;
    this.updateLightboxImage();
  }

  /**
   * Update thumbnail highlights
   */
  updateThumbnailHighlights() {
    const thumbs = document.querySelectorAll('.photo-lightbox-thumb');
    thumbs.forEach((thumb, index) => {
      thumb.classList.toggle('photo-lightbox-thumb--active', index === this.currentIndex);
    });
  }

  /**
   * Toggle zoom
   */
  toggleZoom() {
    const img = document.getElementById('lightbox-image');
    const btn = document.getElementById('zoom-btn');
    
    if (!img) return;
    
    this.isZoomed = !this.isZoomed;
    img.classList.toggle('photo-lightbox-image--zoomed');
    
    if (btn) {
      btn.textContent = this.isZoomed ? '🔍-' : '🔍';
    }
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    const lightbox = document.getElementById('photo-lightbox');
    
    if (!document.fullscreenElement) {
      if (lightbox.requestFullscreen) {
        lightbox.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  /**
   * Share image
   */
  async shareImage() {
    const image = this.images[this.currentIndex];
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.caption || 'Property Image',
          text: image.caption || 'Check out this property!',
          url: image.url
        });
      } catch (err) {
        console.log('[PhotoGallery] Share cancelled or failed:', err);
      }
    } else {
      // Fallback: Copy link
      this.copyToClipboard(image.url);
      this.showToast('Image link copied to clipboard!');
    }
  }

  /**
   * Download image
   */
  downloadImage() {
    const image = this.images[this.currentIndex];
    const a = document.createElement('a');
    a.href = image.url;
    a.download = image.caption || `property-image-${this.currentIndex + 1}.jpg`;
    a.click();
    
    this.showToast('Image download started!');
  }

  /**
   * Copy to clipboard
   */
  copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  /**
   * Show toast
   */
  showToast(message) {
    let container = document.getElementById('photo-gallery-toast');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'photo-gallery-toast';
      container.className = 'photo-gallery-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'photo-gallery-toast';
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('photo-gallery-toast--visible'), 10);

    setTimeout(() => {
      toast.classList.remove('photo-gallery-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Start autoplay
   */
  startAutoPlay() {
    this.autoPlayTimer = setInterval(() => {
      this.navigate(1);
    }, this.config.autoPlayInterval);
  }

  /**
   * Stop autoplay
   */
  stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.lightboxOpen) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          this.navigate(-1);
          break;
        case 'ArrowRight':
          this.navigate(1);
          break;
        case 'Escape':
          this.closeLightbox();
          break;
        case 'z':
        case 'Z':
          if (this.config.enableZoom) {
            this.toggleZoom();
          }
          break;
      }
    });
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.PhotoGallery = PhotoGallery;
}

console.log('[PhotoGallery] Enhanced system loaded - v2.0');
