/**
 * Portfolio Gallery Display Script
 * Displays MongoDB portfolio items to all users
 * Include this in portfolio.html or any page that needs to show portfolio items
 */

document.addEventListener('DOMContentLoaded', async () => {
  const portfolioContainer = document.getElementById('portfolioGrid') || document.getElementById('portfolio-grid');
  
  if (!portfolioContainer) {
    console.warn('Portfolio container not found. Make sure your HTML has an element with id "portfolioGrid" or "portfolio-grid"');
    return;
  }

  // Fetch portfolio items from MongoDB
  try {
    const response = await fetch('/api/portfolio');
    const result = await response.json();

    if (!result.success || !result.data) {
      portfolioContainer.innerHTML = '<p style="text-align: center; color: #94A3B8;">No portfolio items available yet.</p>';
      return;
    }

    portfolioContainer.innerHTML = '';

    result.data.forEach((item) => {
      const portfolioItem = document.createElement('div');
      portfolioItem.style = `
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
      `;

      portfolioItem.addEventListener('mouseenter', () => {
        portfolioItem.style.borderColor = 'rgba(147, 197, 253, 0.6)';
        portfolioItem.style.transform = 'translateY(-4px)';
      });

      portfolioItem.addEventListener('mouseleave', () => {
        portfolioItem.style.borderColor = 'rgba(148, 163, 184, 0.2)';
        portfolioItem.style.transform = 'translateY(0)';
      });

      // Image
      const imgWrapper = document.createElement('div');
      imgWrapper.style = 'width: 100%; height: 200px; overflow: hidden; background: rgba(0, 0, 0, 0.2);';

      const img = document.createElement('img');
      img.src = `/api/portfolio/${item._id}`;
      img.alt = item.title;
      img.style = 'width: 100%; height: 100%; object-fit: cover;';
      imgWrapper.appendChild(img);

      // Content
      const content = document.createElement('div');
      content.style = 'padding: 16px;';

      const title = document.createElement('h3');
      title.style = 'color: #F8FAFC; font-size: 18px; font-weight: 600; margin: 0 0 8px;';
      title.textContent = item.title;
      content.appendChild(title);

      const category = document.createElement('p');
      category.style = 'color: #93C5FD; font-size: 12px; text-transform: capitalize; margin: 0 0 12px; font-weight: 500;';
      category.textContent = item.category.replace('-', ' ');
      content.appendChild(category);

      if (item.link) {
        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.style = `
          display: inline-block;
          color: #A7F3D0;
          font-size: 12px;
          text-decoration: none;
          padding: 8px 12px;
          border: 1px solid #A7F3D0;
          border-radius: 6px;
          transition: all 0.3s ease;
        `;
        link.textContent = 'Visit Live →';
        
        link.addEventListener('mouseenter', () => {
          link.style.backgroundColor = 'rgba(167, 243, 208, 0.1)';
        });
        link.addEventListener('mouseleave', () => {
          link.style.backgroundColor = 'transparent';
        });
        
        content.appendChild(link);
      }

      portfolioItem.appendChild(imgWrapper);
      portfolioItem.appendChild(content);
      portfolioContainer.appendChild(portfolioItem);
    });

  } catch (error) {
    console.error('Error loading portfolio:', error);
    portfolioContainer.innerHTML = '<p style="text-align: center; color: #EF4444;">Error loading portfolio items.</p>';
  }
});
