// SmartHub Landlord Modal Handler
// Version: 2.0 - Fixed with email field support

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('landlord-modal');
    const landlordForm = document.getElementById('landlord-form');
    const landlordFormView = document.getElementById('landlord-form-view');
    const landlordThankYou = document.getElementById('landlord-thankyou');
    const landlordError = document.getElementById('landlord-error');
    const closeBtns = document.querySelectorAll('.modal-close');

    if (!modal || !landlordForm) {
      console.warn('[Landlord Modal] Modal elements not found');
      return;
    }

    // Open modal function
    function openModal(e) {
      if (e) e.preventDefault();
      modal.classList.add('is-visible');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Reset form and views
      landlordFormView.style.display = 'block';
      landlordThankYou.style.display = 'none';
      if (landlordError) landlordError.style.display = 'none';
      landlordForm.reset();
    }

    // Close modal function
    function closeModal() {
      modal.classList.remove('is-visible');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    // Attach open handlers
    document.querySelectorAll('.landlord-open').forEach(btn => {
      btn.addEventListener('click', openModal);
    });

    // Attach close handlers
    closeBtns.forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-visible')) {
        closeModal();
      }
    });

    // Handle form submission
    landlordForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form values
      const service = document.getElementById('landlordService').value.trim();
      const fullName = document.getElementById('landlordFullName').value.trim();
      const phone = document.getElementById('landlordPhone').value.trim();
      const emailInput = document.getElementById('landlordEmail');
      const email = emailInput ? emailInput.value.trim() : ''; // ✅ NOW INCLUDES EMAIL
      const location = document.getElementById('landlordLocation').value.trim();
      const notes = document.getElementById('landlordNotes').value.trim();

      // Validate required fields
      if (!service || !fullName || !phone || !location) {
        showError('Please fill in all required fields');
        return;
      }

      // Validate phone format
      if (typeof window.validateLeadPhone === 'function') {
        if (!window.validateLeadPhone(phone)) {
          showError('Please enter a valid phone number (e.g., +233 59 687 1452)');
          return;
        }
      }

      // Build notes with service and property details
      const fullNotes = `Service: ${service}\nLocation: ${location}\n\n${notes}`;

      try {
        // Submit via canonical lead system
        if (typeof window.smartHubNotifyLead !== 'function') {
          throw new Error('Lead system not loaded');
        }

        await window.smartHubNotifyLead({
          fullName: fullName,
          phone: phone,
          email: email,        // ✅ Email is now passed
          city: location,
          leadType: 'Landlord',
          notes: fullNotes
        });

        // Show success message
        landlordFormView.style.display = 'none';
        landlordThankYou.style.display = 'block';

        // Auto-close after 3 seconds
        setTimeout(() => {
          closeModal();
          // Reset for next use
          setTimeout(() => {
            landlordFormView.style.display = 'block';
            landlordThankYou.style.display = 'none';
            landlordForm.reset();
          }, 300);
        }, 3000);

      } catch (error) {
        console.error('[Landlord Modal] Submission error:', error);
        showError('Failed to submit. Please try again or contact us directly.');
      }
    });

    // Show error message
    function showError(message) {
      if (landlordError) {
        landlordError.textContent = message;
        landlordError.style.display = 'block';
        setTimeout(() => {
          landlordError.style.display = 'none';
        }, 5000);
      } else {
        alert(message);
      }
    }

    console.log('[Landlord Modal] Initialized successfully');
  });

})();