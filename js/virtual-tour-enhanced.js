// SmartHub Enhanced Virtual Tour System
// Version: 2.0
// Professional 360° viewer with hotspots and navigation

class VirtualTour {
  constructor(containerId, config = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.config = {
      autoLoad: config.autoLoad !== false,
      autoRotate: config.autoRotate || 0,
      mouseZoom: config.mouseZoom !== false,
      showControls: config.showControls !== false,
      showFullscreen: config.showFullscreen !== false,
      showZoom: config.showZoom !== false,
      compass: config.compass || false,
      ...config
    };
    
    this.viewer = null;
    this.scenes = [];
    this.currentScene = null;
    this.hotspots = [];
  }

  /**
   * Initialize tour with scenes
   */
  init(scenes) {
    if (!this.container) {
      console.error('[VirtualTour] Container not found:', this.containerId);
      return;
    }

    this.scenes = scenes;
    
    // Check if Pannellum is loaded
    if (typeof pannellum === 'undefined') {
      console.error('[VirtualTour] Pannellum library not loaded');
      this.showError('Virtual tour library not loaded. Please refresh the page.');
      return;
    }

    // Create tour structure
    this.createTourStructure();
    
    // Initialize first scene
    if (scenes.length > 0) {
      this.loadScene(scenes[0].id);
    }
  }

  /**
   * Create tour structure
   */
  createTourStructure() {
    this.container.innerHTML = `
      <div class="virtual-tour-wrapper">
        <!-- Viewer Container -->
        <div id="${this.containerId}-viewer" class="virtual-tour-viewer"></div>
        
        <!-- Controls Overlay -->
        <div class="virtual-tour-controls">
          <!-- Room Navigation -->
          <div class="virtual-tour-rooms">
            <div class="virtual-tour-rooms-title">Select Room:</div>
            <div class="virtual-tour-rooms-list" id="${this.containerId}-rooms">
              ${this.renderRoomsList()}
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="virtual-tour-actions">
            <button class="virtual-tour-btn" onclick="virtualTour.toggleAutoRotate()" title="Auto Rotate">
              <span id="autoRotateIcon">🔄</span>
            </button>
            <button class="virtual-tour-btn" onclick="virtualTour.resetView()" title="Reset View">
              🎯
            </button>
            <button class="virtual-tour-btn" onclick="virtualTour.toggleFullscreen()" title="Fullscreen">
              ⛶
            </button>
            <button class="virtual-tour-btn" onclick="virtualTour.toggleHelp()" title="Help">
              ❓
            </button>
          </div>
        </div>
        
        <!-- Current Room Label -->
        <div class="virtual-tour-label" id="${this.containerId}-label">
          <div class="virtual-tour-label-room"></div>
          <div class="virtual-tour-label-info"></div>
        </div>
        
        <!-- Help Overlay -->
        <div class="virtual-tour-help" id="${this.containerId}-help" style="display: none;">
          <div class="virtual-tour-help-content">
            <button class="virtual-tour-help-close" onclick="virtualTour.toggleHelp()">×</button>
            <h3>🏠 Virtual Tour Controls</h3>
            <ul>
              <li><strong>Mouse/Touch:</strong> Drag to look around</li>
              <li><strong>Scroll/Pinch:</strong> Zoom in and out</li>
              <li><strong>Click Hotspots:</strong> Navigate between rooms</li>
              <li><strong>Room List:</strong> Jump to any room</li>
              <li><strong>Fullscreen:</strong> Immersive experience</li>
            </ul>
          </div>
        </div>
        
        <!-- Loading -->
        <div class="virtual-tour-loading" id="${this.containerId}-loading">
          <div class="virtual-tour-spinner"></div>
          <div>Loading virtual tour...</div>
        </div>
      </div>
    `;
  }

  /**
   * Render rooms list
   */
  renderRoomsList() {
    return this.scenes.map(scene => `
      <button 
        class="virtual-tour-room-btn" 
        data-scene="${scene.id}"
        onclick="virtualTour.loadScene('${scene.id}')"
      >
        <span class="virtual-tour-room-icon">${scene.icon || '📍'}</span>
        <span class="virtual-tour-room-name">${scene.name}</span>
      </button>
    `).join('');
  }

  /**
   * Load a scene
   */
  loadScene(sceneId) {
    const scene = this.scenes.find(s => s.id === sceneId);
    if (!scene) {
      console.error('[VirtualTour] Scene not found:', sceneId);
      return;
    }

    this.currentScene = scene;
    this.showLoading();

    // Destroy existing viewer
    if (this.viewer) {
      this.viewer.destroy();
    }

    // Prepare hotspots
    const hotspots = this.prepareHotspots(scene);

    // Initialize Pannellum viewer
    this.viewer = pannellum.viewer(this.containerId + '-viewer', {
      type: 'equirectangular',
      panorama: scene.image,
      autoLoad: this.config.autoLoad,
      autoRotate: this.config.autoRotate,
      showControls: this.config.showControls,
      showFullscreenCtrl: false, // We have custom fullscreen
      showZoomCtrl: this.config.showZoom,
      mouseZoom: this.config.mouseZoom,
      compass: this.config.compass,
      hotSpots: hotspots,
      pitch: scene.pitch || 0,
      yaw: scene.yaw || 0,
      hfov: scene.hfov || 100
    });

    // Event listeners
    this.viewer.on('load', () => {
      this.hideLoading();
      this.updateRoomLabel();
      this.updateActiveRoom();
    });

    this.viewer.on('error', (err) => {
      this.hideLoading();
      this.showError('Failed to load virtual tour. Please try again.');
      console.error('[VirtualTour] Load error:', err);
    });
  }

  /**
   * Prepare hotspots for scene
   */
  prepareHotspots(scene) {
    const hotspots = [];

    // Navigation hotspots
    if (scene.hotspots) {
      scene.hotspots.forEach(hotspot => {
        hotspots.push({
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          type: 'custom',
          cssClass: 'virtual-tour-hotspot virtual-tour-hotspot-nav',
          createTooltipFunc: (hotSpotDiv) => {
            hotSpotDiv.innerHTML = `
              <div class="virtual-tour-hotspot-content">
                <div class="virtual-tour-hotspot-icon">${hotspot.icon || '🚪'}</div>
                <div class="virtual-tour-hotspot-label">${hotspot.label}</div>
              </div>
            `;
          },
          clickHandlerFunc: () => {
            this.loadScene(hotspot.targetScene);
          }
        });
      });
    }

    // Info hotspots
    if (scene.infoSpots) {
      scene.infoSpots.forEach(info => {
        hotspots.push({
          pitch: info.pitch,
          yaw: info.yaw,
          type: 'info',
          text: info.text,
          cssClass: 'virtual-tour-hotspot virtual-tour-hotspot-info'
        });
      });
    }

    return hotspots;
  }

  /**
   * Toggle auto rotate
   */
  toggleAutoRotate() {
    if (!this.viewer) return;

    const currentSpeed = this.viewer.getAutoRotate();
    const newSpeed = currentSpeed === 0 ? 2 : 0;
    
    this.viewer.setAutoRotate(newSpeed);
    
    const icon = document.getElementById('autoRotateIcon');
    if (icon) {
      icon.textContent = newSpeed === 0 ? '🔄' : '⏸️';
    }
  }

  /**
   * Reset view
   */
  resetView() {
    if (!this.viewer || !this.currentScene) return;

    this.viewer.setPitch(this.currentScene.pitch || 0);
    this.viewer.setYaw(this.currentScene.yaw || 0);
    this.viewer.setHfov(this.currentScene.hfov || 100);
  }

  /**
   * Toggle fullscreen
   */
  toggleFullscreen() {
    const wrapper = this.container.querySelector('.virtual-tour-wrapper');
    
    if (!document.fullscreenElement) {
      if (wrapper.requestFullscreen) {
        wrapper.requestFullscreen();
      } else if (wrapper.webkitRequestFullscreen) {
        wrapper.webkitRequestFullscreen();
      } else if (wrapper.msRequestFullscreen) {
        wrapper.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  /**
   * Toggle help
   */
  toggleHelp() {
    const help = document.getElementById(this.containerId + '-help');
    if (help) {
      help.style.display = help.style.display === 'none' ? 'flex' : 'none';
    }
  }

  /**
   * Update room label
   */
  updateRoomLabel() {
    const label = document.getElementById(this.containerId + '-label');
    if (label && this.currentScene) {
      const roomLabel = label.querySelector('.virtual-tour-label-room');
      const infoLabel = label.querySelector('.virtual-tour-label-info');
      
      if (roomLabel) {
        roomLabel.textContent = `${this.currentScene.icon || '📍'} ${this.currentScene.name}`;
      }
      
      if (infoLabel && this.currentScene.description) {
        infoLabel.textContent = this.currentScene.description;
      }
    }
  }

  /**
   * Update active room button
   */
  updateActiveRoom() {
    const buttons = document.querySelectorAll('.virtual-tour-room-btn');
    buttons.forEach(btn => {
      btn.classList.remove('virtual-tour-room-btn--active');
      if (btn.dataset.scene === this.currentScene.id) {
        btn.classList.add('virtual-tour-room-btn--active');
      }
    });
  }

  /**
   * Show loading
   */
  showLoading() {
    const loading = document.getElementById(this.containerId + '-loading');
    if (loading) {
      loading.style.display = 'flex';
    }
  }

  /**
   * Hide loading
   */
  hideLoading() {
    const loading = document.getElementById(this.containerId + '-loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * Show error
   */
  showError(message) {
    this.container.innerHTML = `
      <div class="virtual-tour-error">
        <div class="virtual-tour-error-icon">⚠️</div>
        <div class="virtual-tour-error-message">${message}</div>
        <button class="virtual-tour-error-retry" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }

  /**
   * Destroy tour
   */
  destroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.VirtualTour = VirtualTour;
}

console.log('[VirtualTour] Enhanced system loaded - v2.0');
