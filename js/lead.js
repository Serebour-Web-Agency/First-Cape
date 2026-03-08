// SmartHub Canonical Lead System
// Version: 2.1 - CONSISTENT SUCCESS CONFIRMATIONS
// All lead forms now show beautiful success messages

(function() {
  'use strict';

  const PHONE_PATTERN = /^\+?[0-9\s\-\(\)]{7,20}$/;

  /**
   * Canonical lead notification function
   * All forms must use this function
   */
  window.smartHubNotifyLead = async function(payload) {
    console.log('[Lead] Submitting lead:', payload);

    const config = window.SMARTHUB_CONFIG?.airtable;
    if (!config) {
      console.error('[Lead] SMARTHUB_CONFIG not found');
      throw new Error('Configuration not loaded');
    }

    const fieldMap = config.leadFields;

    const { fullName, phone, leadType } = payload;
    
    if (!fullName || !phone) {
      console.error('[Lead] Missing required fields');
      throw new Error('Full name and phone are required');
    }

    if (!PHONE_PATTERN.test(phone)) {
      console.error('[Lead] Invalid phone format');
      throw new Error('Invalid phone number format');
    }

    const {
      city = '',
      email = '',
      notes = '',
      sourcePage = window.location.pathname
    } = payload;

    const fields = {};
    fields[fieldMap.fullName] = fullName;
    fields[fieldMap.phone] = phone;
    fields[fieldMap.email] = email;
    fields[fieldMap.city] = city;
    fields[fieldMap.leadType] = leadType || 'Notify';
    fields[fieldMap.notes] = notes;
    
    if (fieldMap.sourcePage) {
      fields[fieldMap.sourcePage] = sourcePage;
    }

    try {
      const record = await window.airtableClient.createRecord(
        config.tables.leads,
        fields
      );

      console.log('[Lead] Successfully created lead:', record.id);
      
      if (typeof gtag !== 'undefined') {
        gtag('event', 'lead_submission', {
          lead_type: leadType,
          source_page: sourcePage
        });
      }

      return record;

    } catch (error) {
      console.error('[Lead] Error creating lead:', error);
      throw error;
    }
  };

  /**
   * Show consistent success message for any form
   * NEW: Universal success message function
   */
  window.showLeadSuccessMessage = function(formElement, options = {}) {
    const {
      title = 'Thank You!',
      message = 'We\'ve received your request and will contact you shortly.',
      phone = null,
      autoClose = false,
      closeDelay = 5000
    } = options;

    // Remove existing success messages
    const existingSuccess = formElement.parentElement.querySelector('.lead-success-message');
    if (existingSuccess) {
      existingSuccess.remove();
    }

    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'lead-success-message';
    successDiv.innerHTML = `
      <div class="lead-success__icon">✓</div>
      <h3 class="lead-success__title">${title}</h3>
      <p class="lead-success__message">${message}</p>
      ${phone ? `<p class="lead-success__contact">We'll contact you via ${phone}</p>` : ''}
      ${autoClose ? `<p class="lead-success__autoclose">This message will close automatically...</p>` : ''}
    `;

    // Insert after form
    formElement.insertAdjacentElement('afterend', successDiv);

    // Add styles if not already present
    addLeadSuccessStyles();

    // Trigger animation
    setTimeout(() => successDiv.classList.add('active'), 10);

    // Auto-close if requested
    if (autoClose) {
      setTimeout(() => {
        successDiv.classList.remove('active');
        setTimeout(() => successDiv.remove(), 300);
      }, closeDelay);
    }

    return successDiv;
  };

  /**
   * Add success message styles
   */
  function addLeadSuccessStyles() {
    if (document.getElementById('leadSuccessStyles')) return;

    const style = document.createElement('style');
    style.id = 'leadSuccessStyles';
    style.textContent = `
      .lead-success-message {
        background: linear-gradient(135deg, #ecfdf3 0%, #d1fae5 100%);
        border: 2px solid #a7f3d0;
        border-radius: 12px;
        padding: 2rem;
        margin-top: 1.5rem;
        text-align: center;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
      }

      .lead-success-message.active {
        opacity: 1;
        transform: translateY(0);
      }

      .lead-success__icon {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        font-size: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.25rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        animation: successBounce 0.6s ease-out;
      }

      @keyframes successBounce {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }

      .lead-success__title {
        color: #065f46;
        margin: 0 0 0.75rem 0;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .lead-success__message {
        color: #047857;
        margin: 0 0 0.5rem 0;
        font-size: 1.05rem;
        line-height: 1.5;
      }

      .lead-success__contact {
        color: #059669;
        margin: 0 0 0.5rem 0;
        font-size: 0.95rem;
        font-weight: 500;
      }

      .lead-success__autoclose {
        color: #6ee7b7;
        margin: 1rem 0 0 0;
        font-size: 0.85rem;
        font-style: italic;
      }

      @media (max-width: 640px) {
        .lead-success-message {
          padding: 1.5rem;
        }

        .lead-success__icon {
          width: 60px;
          height: 60px;
          font-size: 2rem;
        }

        .lead-success__title {
          font-size: 1.25rem;
        }

        .lead-success__message {
          font-size: 0.95rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Validate phone number format
   */
  window.validateLeadPhone = function(phone) {
    return PHONE_PATTERN.test(phone);
  };

  console.log('[Lead System] Canonical lead system v2.1 loaded (Consistent Success Messages)');

})();