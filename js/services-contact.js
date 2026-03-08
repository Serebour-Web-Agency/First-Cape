// SmartHub Services and Contact Page Forms
// Unified lead capture for services inquiries and general contact

class ServicesContactForms {
  constructor() {
    this.phonePattern = /^\+?[0-9\s\-\(\)]{7,20}$/;
  }

  /**
   * Initialize all forms on the page
   */
  init() {
    console.log('[ServicesContact] Initializing forms...');
    
    // Services inquiry form
    this.setupServicesForm();
    
    // General contact form
    this.setupContactForm();
    
    // Footer quick inquiry form (on all pages)
    this.setupFooterForm();
    
    console.log('[ServicesContact] Forms initialized');
  }

  /**
   * Setup services inquiry form
   */
  setupServicesForm() {
    const form = document.getElementById('servicesForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = form.querySelector('[name="fullName"]').value;
      const phone = form.querySelector('[name="phone"]').value;
      const email = form.querySelector('[name="email"]').value;
      const city = form.querySelector('[name="city"]').value;
      const service = form.querySelector('[name="service"]').value;
      const message = form.querySelector('[name="message"]').value;
      
      // Validate phone
      if (!this.validatePhone(phone)) {
        this.showError(form, 'Please enter a valid phone number');
        return;
      }
      
      // Create detailed notes
      const notes = `Service Inquiry: ${service}\n\nMessage: ${message}`;
      
      try {
        this.showSubmitting(form);
        
        await smartHubNotifyLead({
          fullName: fullName,
          city: city,
          leadType: 'Notify',
          phone: phone,
          email: email,
          notes: notes
        });
        
        this.showSuccess(form, 'Thank you! We will contact you about our services.');
        form.reset();
        
      } catch (error) {
        console.error('[ServicesContact] Services form error:', error);
        this.showError(form, 'Failed to submit inquiry. Please try again.');
      }
    });
  }

  /**
   * Setup general contact form
   */
  setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = form.querySelector('[name="fullName"]').value;
      const phone = form.querySelector('[name="phone"]').value;
      const email = form.querySelector('[name="email"]').value;
      const city = form.querySelector('[name="city"]').value || 'Not specified';
      const subject = form.querySelector('[name="subject"]').value;
      const message = form.querySelector('[name="message"]').value;
      
      // Validate phone
      if (!this.validatePhone(phone)) {
        this.showError(form, 'Please enter a valid phone number');
        return;
      }
      
      const notes = `Contact Form - Subject: ${subject}\n\nMessage: ${message}`;
      
      try {
        this.showSubmitting(form);
        
        await smartHubNotifyLead({
          fullName: fullName,
          city: city,
          leadType: 'Notify',
          phone: phone,
          email: email,
          notes: notes
        });
        
        this.showSuccess(form, 'Thank you for contacting us! We will respond shortly.');
        form.reset();
        
      } catch (error) {
        console.error('[ServicesContact] Contact form error:', error);
        this.showError(form, 'Failed to send message. Please try again.');
      }
    });
  }

  /**
   * Setup footer quick inquiry form
   */
  setupFooterForm() {
    const form = document.getElementById('footerQuickInquiry');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const fullName = form.querySelector('[name="fullName"]').value;
      const phone = form.querySelector('[name="phone"]').value;
      const email = form.querySelector('[name="email"]').value;
      
      // Validate phone
      if (!this.validatePhone(phone)) {
        this.showError(form, 'Please enter a valid phone number');
        return;
      }
      
      const notes = 'Quick inquiry from website footer';
      
      try {
        this.showSubmitting(form);
        
        await smartHubNotifyLead({
          fullName: fullName,
          city: 'Not specified',
          leadType: 'Notify',
          phone: phone,
          email: email,
          notes: notes
        });
        
        this.showSuccess(form, 'Thank you! We will contact you soon.');
        form.reset();
        
      } catch (error) {
        console.error('[ServicesContact] Footer form error:', error);
        this.showError(form, 'Failed to submit. Please try again.');
      }
    });
  }

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    return this.phonePattern.test(phone);
  }

  /**
   * Show submitting state
   */
  showSubmitting(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Submitting...';
    }
  }

  /**
   * Show success message
   */
  showSuccess(form, message) {
    // Remove any existing messages
    this.clearMessages(form);
    
    // Re-enable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
    }
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-message success-message';
    successDiv.textContent = message;
    form.insertAdjacentElement('afterend', successDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => successDiv.remove(), 5000);
  }

  /**
   * Show error message
   */
  showError(form, message) {
    // Remove any existing messages
    this.clearMessages(form);
    
    // Re-enable submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message error-message';
    errorDiv.textContent = message;
    form.insertAdjacentElement('afterend', errorDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => errorDiv.remove(), 5000);
  }

  /**
   * Clear all form messages
   */
  clearMessages(form) {
    const messages = form.parentElement.querySelectorAll('.form-message');
    messages.forEach(msg => msg.remove());
  }
}

// Initialize when DOM is ready
let servicesContactForms;

document.addEventListener('DOMContentLoaded', () => {
  servicesContactForms = new ServicesContactForms();
  servicesContactForms.init();
});