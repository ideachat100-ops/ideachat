import { database, ref, get, child } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  const homePortfolioGrid = document.getElementById('homePortfolioGrid');
  
  if (homePortfolioGrid) {
    try {
      const snap = await get(child(ref(database), 'portfolio'));
      
      if (snap.exists()) {
        let storedData = [];
        snap.forEach(childSnap => {
          storedData.push({ id: childSnap.key, ...childSnap.val() });
        });
        
        // Reverse to show newest first, then take up to 6
        storedData.reverse();
        storedData = storedData.slice(0, 6);
        
        storedData.forEach((item, index) => {
          const card = document.createElement('div');
          
          // Calculate delay for scroll reveal animation
          let delayClass = '';
          if (index % 3 === 1) delayClass = 'delay-100';
          if (index % 3 === 2) delayClass = 'delay-200';
          
          card.className = `portfolio-preview-card reveal fade-up ${delayClass}`;
          card.style.position = 'relative';
          card.style.borderRadius = 'var(--radius-md)';
          card.style.overflow = 'hidden';
          card.style.boxShadow = 'var(--shadow-md)';
          
          card.innerHTML = `
            <img class="lazy" data-src="${item.imageUrl}" src="${item.imageUrl}" alt="${item.title}"
              style="width: 100%; height: 100%; object-fit: cover; aspect-ratio: 4/3; transition: var(--transition-slow);">
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 20px; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); color: white;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white;">${item.title}</h3>
                <span style="font-size: 12px; color: var(--accent); text-transform: capitalize;">${item.category.replace('-', ' ')}</span>
            </div>
          `;
          
          homePortfolioGrid.appendChild(card);
          
          // Small delay to allow DOM insertion before adding revealed class for animation
          setTimeout(() => {
            card.classList.add('revealed');
          }, 50);
        });
      } else {
        homePortfolioGrid.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">No portfolio items available yet.</p>';
      }
    } catch (err) {
      console.error('Error loading home portfolio data', err);
      homePortfolioGrid.innerHTML = '<p style="text-align: center; color: var(--danger); grid-column: 1 / -1;">Error loading portfolio items.</p>';
    }
  }
});
