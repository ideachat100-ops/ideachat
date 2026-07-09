/**
 * IDEACHAT - Portfolio JavaScript
 * Handles grid categorization filters, pagination rendering, and image lightbox.
 */

import { database, ref, get, child } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const portfolioGrid = document.getElementById('portfolioGrid');
  
  if (portfolioGrid) {
    try {
      const snap = await get(child(ref(database), 'portfolio'));
      if (snap.exists()) {
        const storedData = [];
        snap.forEach(childSnap => {
          storedData.push({ id: childSnap.key, ...childSnap.val() });
        });
        
        storedData.forEach((item, index) => {
          const card = document.createElement('div');
          const categories = ['all', item.category];
          card.className = 'portfolio-item-card reveal fade-up';
          card.setAttribute('data-categories', JSON.stringify(categories));
          card.setAttribute('data-index', 'dynamic-' + index);
          
          let websiteBtnHtml = '';
          if (item.category === 'web-design' && item.link) {
            websiteBtnHtml = `<a href="${item.link}" target="_blank" class="btn btn-primary" style="margin-top: 10px; font-size: 12px; padding: 6px 12px;">View website</a>`;
          }

          card.innerHTML = `
            <div class="portfolio-card-img-box">
              <img class="lazy" data-src="${item.imageUrl}" src="${item.imageUrl}" alt="${item.title}">
              <div class="portfolio-card-overlay">
                <div class="lightbox-trigger-btn"><i class="fa-solid fa-expand"></i></div>
                <h3 class="portfolio-card-title">${item.title}</h3>
                <span class="portfolio-card-category" style="text-transform: capitalize;">${item.category.replace('-', ' ')}</span>
                ${websiteBtnHtml}
              </div>
            </div>
          `;
          portfolioGrid.appendChild(card);
        });
      }
    } catch (err) {
      console.error('Error loading portfolio data', err);
    }
  }

  const filterButtons = document.querySelectorAll('.filter-btn');
  const allCards = Array.from(document.querySelectorAll('.portfolio-item-card'));
  const paginationWrapper = document.getElementById('portfolioPagination');
  
  // Lightbox selectors
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCat = document.getElementById('lightboxCat');
  const lightboxClose = document.querySelector('.lightbox-close');
  const lightboxPrev = document.querySelector('.lightbox-prev');
  const lightboxNext = document.querySelector('.lightbox-next');

  if (allCards.length === 0) return;

  const itemsPerPage = 6;
  let currentFilter = 'all';
  let currentPage = 1;
  let filteredCards = [...allCards];
  let lightboxActiveIndex = 0; // Index relative to currently visible filtered list

  // 1. Pagination and Grid Render Logic
  const renderGallery = (cards = Array.from(document.querySelectorAll('.portfolio-item-card'))) => {
    // Hide all first
    cards.forEach(card => card.classList.add('hidden'));

    // Calculate pagination slices
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const visibleSlice = filteredCards.slice(startIndex, endIndex);

    // Show visible page cards
    visibleSlice.forEach(card => {
      card.classList.remove('hidden');
      // Trigger scroll reveal recheck if needed
      card.classList.add('revealed');
    });

    renderPagination(cards);
  };

  const renderPagination = (cards) => {
    if (!paginationWrapper) return;
    paginationWrapper.innerHTML = '';

    const totalPages = Math.ceil(filteredCards.length / itemsPerPage);
    if (totalPages <= 1) return; // No pagination required if 1 page or empty

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-number-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      
      pageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentPage = i;
        renderGallery(cards);
        // Scroll back to top of section
        document.querySelector('.portfolio-gallery-section').scrollIntoView({ behavior: 'smooth' });
      });
      
      paginationWrapper.appendChild(pageBtn);
    }
  };

  // 2. Filtration Logic
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // ALWAYS recalculate cards in case they were dynamically added
      const cards = Array.from(document.querySelectorAll('.portfolio-item-card'));
      
      // Update active button state
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentFilter = btn.getAttribute('data-filter');
      currentPage = 1; // Reset to page 1

      // Filter card lists based on categories JSON array
      filteredCards = cards.filter(card => {
        const categories = JSON.parse(card.getAttribute('data-categories') || '[]');
        return categories.includes(currentFilter);
      });

      renderGallery(cards);
    });
  });

  // 3. Image Lightbox implementation
  const openLightbox = (idx) => {
    if (!lightbox || !lightboxImg) return;
    
    lightboxActiveIndex = idx;
    const card = filteredCards[lightboxActiveIndex];
    if (!card) return;

    // Retrieve image source & texts from card DOM
    const imgEl = card.querySelector('img');
    const titleEl = card.querySelector('.portfolio-card-title');
    const catEl = card.querySelector('.portfolio-card-category');

    // Extract actual lazy source if loaded, otherwise fallback
    const src = imgEl.dataset.src || imgEl.src;
    lightboxImg.src = src;
    
    if (lightboxTitle && titleEl) lightboxTitle.textContent = titleEl.textContent;
    if (lightboxCat && catEl) lightboxCat.textContent = catEl.textContent;

    // Show Lightbox smoothly
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const navigateLightbox = (direction) => {
    let nextIdx = lightboxActiveIndex + direction;
    
    // Cycle boundary check
    if (nextIdx < 0) {
      nextIdx = filteredCards.length - 1;
    } else if (nextIdx >= filteredCards.length) {
      nextIdx = 0;
    }

    openLightbox(nextIdx);
  };

  // Bind trigger links on each card
  allCards.forEach(card => {
    const trigger = card.querySelector('.lightbox-trigger-btn');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Find click index in current filtered list
        const filteredIdx = filteredCards.indexOf(card);
        if (filteredIdx !== -1) {
          openLightbox(filteredIdx);
        }
      });
    }
  });

  // Bind Lightbox close actions
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // Next / Previous binds
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft') {
      navigateLightbox(-1);
    } else if (e.key === 'ArrowRight') {
      navigateLightbox(1);
    }
  });

  // Init grid
  const initialCards = Array.from(document.querySelectorAll('.portfolio-item-card'));
  if (initialCards.length > 0) {
    filteredCards = [...initialCards];
    renderGallery(initialCards);
  }
});
