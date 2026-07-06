/**
 * IDEACHAT - Contact JavaScript
 * Handles contact form client-side validations, WhatsApp API redirect link compilation, and FAQ accordion collapse.
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');

  // 1. FAQ Accordion Toggle Control
  const faqHeaders = document.querySelectorAll('.faq-header');
  faqHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      e.preventDefault();
      const parentItem = header.closest('.faq-item');
      
      // Check if it's already active
      const isActive = parentItem.classList.contains('active');

      // Close all other active items
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        const body = item.querySelector('.faq-body');
        if (body) body.style.maxHeight = '';
      });

      // Toggle current item
      if (!isActive) {
        parentItem.classList.add('active');
        const body = parentItem.querySelector('.faq-body');
        if (body) {
          // Set exact height of content child so CSS transition works smoothly
          const content = body.querySelector('.faq-content');
          body.style.maxHeight = `${content.offsetHeight + 24}px`;
        }
      }
    });
  });

  // 2. Form validation helper checks
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone) => {
    // Basic phone checker: optional leading + and minimum 10 digits
    const re = /^\+?[0-9]{10,14}$/;
    return re.test(phone.replace(/\s/g, '')); // Strip whitespaces before test
  };

  const setInputError = (inputEl, errorElId, showError) => {
    const errorEl = document.getElementById(errorElId);
    if (showError) {
      inputEl.classList.add('error');
      if (errorEl) errorEl.style.display = 'block';
    } else {
      inputEl.classList.remove('error');
      if (errorEl) errorEl.style.display = 'none';
    }
  };

  // 3. Form Submit Validation & WhatsApp Integration
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isValid = true;

      // Validate name
      if (nameInput.value.trim() === '') {
        setInputError(nameInput, 'nameError', true);
        isValid = false;
      } else {
        setInputError(nameInput, 'nameError', false);
      }

      // Validate email
      if (!validateEmail(emailInput.value.trim())) {
        setInputError(emailInput, 'emailError', true);
        isValid = false;
      } else {
        setInputError(emailInput, 'emailError', false);
      }

      // Validate phone
      if (!validatePhone(phoneInput.value.trim())) {
        setInputError(phoneInput, 'phoneError', true);
        isValid = false;
      } else {
        setInputError(phoneInput, 'phoneError', false);
      }

      // Validate message
      if (messageInput.value.trim() === '') {
        setInputError(messageInput, 'messageError', true);
        isValid = false;
      } else {
        setInputError(messageInput, 'messageError', false);
      }

      if (isValid) {
        // Compile WhatsApp text template
        const nameText = nameInput.value.trim();
        const emailText = emailInput.value.trim();
        const phoneText = phoneInput.value.trim();
        const detailsText = messageInput.value.trim();
        
        const messageTemplate = `*New Project Enquiry from IdeaChat Form*\n\n` + 
          `*Name:* ${nameText}\n` +
          `*Email:* ${emailText}\n` +
          `*Phone:* ${phoneText}\n\n` +
          `*Project Details:*\n${detailsText}`;

        // Format direct WhatsApp URL redirection
        // Destination WhatsApp number is Sri Lanka +94 788009907 (url formatted as 94788009907)
        const whatsappNumber = '94788009907';
        const encodedMsg = encodeURIComponent(messageTemplate);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

        // Alert user of redirect and trigger window reload
        alert('Form details validated successfully! Opening WhatsApp chat to send project details.');
        window.open(whatsappUrl, '_blank');
        form.reset();
      }
    });

    // Real-time error removals on keydown
    nameInput.addEventListener('input', () => setInputError(nameInput, 'nameError', false));
    emailInput.addEventListener('input', () => setInputError(emailInput, 'emailError', false));
    phoneInput.addEventListener('input', () => setInputError(phoneInput, 'phoneError', false));
    messageInput.addEventListener('input', () => setInputError(messageInput, 'messageError', false));
  }
});
