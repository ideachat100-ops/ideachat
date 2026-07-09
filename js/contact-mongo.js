/**
 * Contact Form Handler - Integrates with MongoDB via API
 * Handles contact information submission to the backend
 */

const CONTACT_API_URL = 'http://localhost:5000/api/contacts';

// Handle contact form submission
document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.getElementById('contactForm');
  
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get form values
    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const subject = document.getElementById('subject')?.value.trim();
    const message = document.getElementById('message')?.value.trim();

    // Validate required fields
    if (!name || !email || !message) {
      showMessage('Please fill in all required fields (Name, Email, Message)', 'error');
      return;
    }

    // Show loading state
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton?.textContent;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    try {
      // Send to MongoDB via API
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || '',
          subject: subject || '',
          message,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showMessage('✅ Thank you! Your message has been saved. We will contact you soon.', 'success');
        contactForm.reset();
      } else {
        showMessage(`❌ Error: ${result.message || 'Failed to save contact'}`, 'error');
      }
    } catch (error) {
      console.error('Contact submission error:', error);
      showMessage('❌ Connection error. Please try again later.', 'error');
    } finally {
      // Restore button state
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  });
});

/**
 * Display message to user
 * @param {string} message - Message text
 * @param {string} type - 'success' or 'error'
 */
function showMessage(message, type = 'success') {
  // Remove existing messages
  const existingMessage = document.querySelector('.contact-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageEl = document.createElement('div');
  messageEl.className = `contact-message contact-message-${type}`;
  messageEl.textContent = message;
  messageEl.style.cssText = `
    padding: 15px 20px;
    margin-bottom: 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    animation: slideDown 0.3s ease-out;
    ${type === 'success' 
      ? 'background-color: #10b981; color: white;' 
      : 'background-color: #ef4444; color: white;'}
  `;

  // Insert before form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.parentElement.insertBefore(messageEl, contactForm);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
