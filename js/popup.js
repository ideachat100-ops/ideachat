/**
 * IDEACHAT - Modals Popup JavaScript
 * Handles dynamic content injection and modal overlay controls for services specifications.
 */

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('serviceModal');
  const modalContent = document.getElementById('modalContent');
  const openButtons = document.querySelectorAll('.open-modal-btn');
  const closeButton = document.querySelector('.modal-close-btn');

  if (!modal || !modalContent) return;

  // Services specifications data registry
  const servicesData = {
    'graphic-design': {
      title: 'Graphic & Brand Identity Design',
      image: 'images/services/s1.svg',
      fullDescription: 'Establish a powerful visual presence with bespoke visual assets that reflect your business culture. Our graphic design processes involve deep discovery, conceptual research, grid layouts, and meticulous vector optimization to build assets that scale from business cards to massive roadside billboards.',
      benefits: [
        'Creates an immediate premium brand impression',
        'Fully scalable vector guidelines (SVG, EPS, PDF)',
        'Strategic color schemes customized to your market domain',
        'Cohesive visual guidelines across all print & digital mediums'
      ],
      process: [
        { title: 'Research & Moodboard', desc: 'Analyzing competitors, market domain colors, and collecting style layout examples.' },
        { title: 'Concept Creation', desc: 'Sketching multiple visual layout paths and refining vectors in Adobe Illustrator.' },
        { title: 'System Definition', desc: 'Selecting core typography scale, brand guideline spacing, and secondary color palettes.' },
        { title: 'Final Handover', desc: 'Packaging scalable production-ready layouts, print-ready files, and SVG assets.' }
      ],
      deliverables: 'Custom Vector Logo, Typography Scale, Color Swatches, Brand Guidelines Booklet (PDF), Print Layout files, Business Cards Vector mockup.',
      timeline: '2 - 3 Weeks',
      whatsappMessage: 'Hello IdeaChat team, I am interested in your Graphic & Brand Identity Design service. Please share details!'
    },
    'web-dev': {
      title: 'Professional Web Development',
      image: 'images/services/s2.svg',
      fullDescription: 'Get a clean, fast, and accessible digital home. We construct custom websites using semantic HTML5 structures, premium vanilla CSS3 glassmorphic design variables, and light vanilla JavaScript modules. No bloated frameworks, no slow loading templates—just absolute performance, search engine rankings (SEO), and responsiveness.',
      benefits: [
        'Outstanding loading speeds (Lighthouse score 95+)',
        'Responsive layout adapting smoothly to any viewport size',
        'Optimized for search engines (SEO semantics & metadata)',
        'Fully accessible, readable, and keyboard-navigable structures'
      ],
      process: [
        { title: 'UI/UX Visual Prototyping', desc: 'Designing custom layouts, glassmorphic interfaces, and establishing content hierarchy.' },
        { title: 'Semantic Coding', desc: 'Writing clean, semantic HTML tags, and setting up centralized CSS design variables.' },
        { title: 'Interactive Engineering', desc: 'Developing navigation toggles, scroll observers, slider intervals, and popups using Vanilla JS.' },
        { title: 'Audit & Launch', desc: 'Benchmarking load speed, running cross-device tests, verifying SEO metadata, and domain pointing.' }
      ],
      deliverables: 'Clean production-ready source code repository, Configured domain hosting, Google Search Console index configuration, Web Vitals performance report.',
      timeline: '3 - 5 Weeks',
      whatsappMessage: 'Hello IdeaChat team, I am interested in your Web Development service. Let\'s schedule a call!'
    },
    'social-media': {
      title: 'Social Media Handling & Creatives',
      image: 'images/services/s3.svg',
      fullDescription: 'Increase brand awareness and hook users on social feeds. We design high-contrast Instagram graphics, informative carousels, Facebook flyers, and LinkedIn content grids. All assets align with your brand guidelines to maintain visual consistency.',
      benefits: [
        'Consistent and cohesive design language on all social profiles',
        'Pre-scheduled monthly content planners for ease of mind',
        'Data-driven post design to maximize conversion and shares',
        'Creative layout concepts that cut through the social clutter'
      ],
      process: [
        { title: 'Feed Theme Design', desc: 'Defining a unified layout style, grid structure, and typographic templates.' },
        { title: 'Monthly Planners', desc: 'Creating an editorial list of promotional posts, carousels, and announcements.' },
        { title: 'Asset Designing', desc: 'Crafting layout banners and interactive templates matching brand visual rules.' },
        { title: 'Analytics Review', desc: 'Analyzing post reach and click-through statistics to optimize next month\'s designs.' }
      ],
      deliverables: '12 - 16 Premium Feed Design layouts, 4 Carousel Slide designs, 8 Custom Story templates, Copywriting definitions, Analytics report.',
      timeline: 'Ongoing (Monthly)',
      whatsappMessage: 'Hello IdeaChat team, I am interested in your Social Media Handling service. Please share your monthly packages!'
    }
  };

  // Open modal handler
  const openModal = (serviceKey) => {
    const data = servicesData[serviceKey];
    if (!data) return;

    // Build process steps HTML
    let processHtml = '';
    data.process.forEach((step, idx) => {
      processHtml += `
        <div class="process-step">
          <span class="step-badge">${idx + 1}</span>
          <div>
            <h5 style="font-size:14px; font-weight:700; margin-bottom:2px;">${step.title}</h5>
            <p style="font-size:12px; color:var(--text-muted); line-height:1.5;">${step.desc}</p>
          </div>
        </div>
      `;
    });

    // Build benefits list HTML
    let benefitsHtml = '';
    data.benefits.forEach(benefit => {
      benefitsHtml += `
        <li style="font-size:14px; color:var(--text-muted); display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <i class="fa-solid fa-check" style="color:var(--accent); font-size:12px;"></i> ${benefit}
        </li>
      `;
    });

    // Encode WhatsApp CTA
    const whatsappUrl = `https://wa.me/94788009907?text=${encodeURIComponent(data.whatsappMessage)}`;

    // Inject modal body
    modalContent.innerHTML = `
      <div class="modal-body">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <img src="${data.image}" alt="${data.title}" style="border-radius:var(--radius-md); box-shadow:var(--shadow-sm); border:1px solid var(--glass-border); width:100%; height:auto;">
          
          <div>
            <h4 style="font-size:16px; font-weight:700; margin-bottom:12px;">Key Benefits</h4>
            <ul style="list-style:none;">
              ${benefitsHtml}
            </ul>
          </div>
        </div>
        
        <div>
          <h3 style="font-size:24px; font-weight:800; margin-bottom:15px; color:var(--text-dark);">${data.title}</h3>
          <p style="color:var(--text-muted); font-size:14px; line-height:1.7; margin-bottom:20px;">${data.fullDescription}</p>
          
          <h4 style="font-size:16px; font-weight:700; margin-bottom:10px;">Our Process</h4>
          <div class="process-timeline">
            ${processHtml}
          </div>

          <div style="background-color:rgba(0,0,0,0.03); border-radius:var(--radius-sm); padding:15px; margin-top:20px; font-size:13px; border:1px solid rgba(0,0,0,0.05);">
            <p style="margin-bottom:6px;"><strong>Deliverables:</strong> ${data.deliverables}</p>
            <p><strong>Timeline Duration:</strong> ${data.timeline}</p>
          </div>

          <div style="margin-top:25px; display:flex; gap:12px;">
            <a href="${whatsappUrl}" target="_blank" class="btn btn-primary" style="flex:1; padding:12px 24px; font-size:14px;">
              Consult on WhatsApp <i class="fa-brands fa-whatsapp" style="margin-left:5px;"></i>
            </a>
            <button class="btn btn-secondary close-modal-action" style="padding:12px 24px; font-size:14px;">Close</button>
          </div>
        </div>
      </div>
    `;

    // Show modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Hook internal close action button
    const innerCloseBtn = modalContent.querySelector('.close-modal-action');
    if (innerCloseBtn) {
      innerCloseBtn.addEventListener('click', closeModal);
    }
  };

  // Close modal handler
  const closeModal = () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Bind trigger buttons
  openButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const serviceKey = button.getAttribute('data-service');
      openModal(serviceKey);
    });
  });

  // Bind close buttons
  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  // Close on backdrop overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
});
