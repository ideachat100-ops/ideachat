/**
 * IMPORTANT: Replace the attachPortfolioEditor function in js/admin.js with this updated version
 * This version uses MongoDB API instead of PHP endpoints
 */

const attachPortfolioEditor = () => {
  const categorySelect = document.getElementById('portfolioCategorySelect');
  const titleInput = document.getElementById('portfolioTitleInput');
  const imageInput = document.getElementById('portfolioImageInput');
  const websiteLinkGroup = document.getElementById('portfolioWebsiteLinkGroup');
  const websiteInput = document.getElementById('portfolioWebsiteInput');
  const addButton = document.getElementById('addPortfolioButton');
  const saveMessage = document.getElementById('portfolioSaveMessage');
  const listContainer = document.getElementById('adminPortfolioList');

  if (!categorySelect || !addButton || !listContainer) return;

  categorySelect.addEventListener('change', () => {
    if (categorySelect.value === 'web-design') {
      websiteLinkGroup.style.display = 'flex';
    } else {
      websiteLinkGroup.style.display = 'none';
      websiteInput.value = '';
    }
  });

  const renderList = async () => {
    try {
      // Fetch from MongoDB API instead of PHP
      const res = await fetch('/api/portfolio');
      const result = await res.json();
      
      listContainer.innerHTML = '';
      
      if (!result.success || !result.data || result.data.length === 0) {
        listContainer.innerHTML = '<p style="color: #94A3B8; text-align: center; grid-column: 1/-1;">No portfolio items yet. Upload one to get started!</p>';
        return;
      }
      
      result.data.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 14px; padding: 16px; position: relative;';
        
        // Create image element with MongoDB API endpoint
        const img = document.createElement('img');
        img.src = `/api/portfolio/${item._id}`;
        img.style = 'width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px; cursor: pointer;';
        img.alt = item.title;
        
        const title = document.createElement('h3');
        title.style = 'color: #F8FAFC; font-size: 16px; margin: 0 0 4px;';
        title.textContent = item.title;
        
        const category = document.createElement('p');
        category.style = 'color: #94A3B8; font-size: 12px; margin: 0 0 12px; text-transform: capitalize;';
        category.textContent = item.category.replace('-', ' ');
        
        itemDiv.appendChild(img);
        itemDiv.appendChild(title);
        itemDiv.appendChild(category);
        
        if (item.link) {
          const link = document.createElement('a');
          link.href = item.link;
          link.target = '_blank';
          link.style = 'display: inline-block; color: #93C5FD; font-size: 12px; margin-bottom: 12px; word-break: break-all; text-decoration: underline;';
          link.textContent = 'Link: ' + item.link;
          itemDiv.appendChild(link);
        }
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-secondary';
        deleteBtn.style = 'padding: 6px 12px; font-size: 12px; border-color: #EF4444; color: #EF4444; width: 100%;';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('data-id', item._id);
        
        deleteBtn.addEventListener('click', async (e) => {
          if (!confirm('Are you sure you want to delete this item?')) return;
          
          try {
            const deleteRes = await fetch(`/api/portfolio/${item._id}`, {
              method: 'DELETE'
            });
            const deleteResult = await deleteRes.json();
            
            if (deleteResult.success) {
              saveMessage.style.color = '#A7F3D0';
              saveMessage.textContent = 'Item deleted successfully!';
              setTimeout(() => { saveMessage.textContent = ''; }, 3000);
              renderList();
            } else {
              saveMessage.style.color = '#FCA5A5';
              saveMessage.textContent = deleteResult.error || 'Error deleting item.';
            }
          } catch (err) {
            console.error(err);
            saveMessage.style.color = '#FCA5A5';
            saveMessage.textContent = 'Error deleting item.';
          }
        });
        
        itemDiv.appendChild(deleteBtn);
        listContainer.appendChild(itemDiv);
      });
    } catch(err) {
      console.error(err);
      listContainer.innerHTML = '<p style="color: #EF4444; text-align: center; grid-column: 1/-1;">Error loading portfolio items.</p>';
    }
  };

  renderList();

  addButton.addEventListener('click', async () => {
    if (!titleInput.value.trim() || !imageInput.files || imageInput.files.length === 0) {
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Please fill in Title and upload an image.';
      return;
    }

    try {
      // Create FormData for MongoDB API
      const formData = new FormData();
      formData.append('title', titleInput.value.trim());
      formData.append('category', categorySelect.value);
      formData.append('image', imageInput.files[0]);
      
      if (categorySelect.value === 'web-design' && websiteInput.value.trim()) {
        formData.append('link', websiteInput.value.trim());
      }

      // POST to MongoDB API
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        body: formData
      });
      const result = await res.json();
      
      if (result.success) {
        titleInput.value = '';
        imageInput.value = '';
        websiteInput.value = '';
        
        saveMessage.style.color = '#A7F3D0';
        saveMessage.textContent = 'Portfolio item added successfully!';
        setTimeout(() => { saveMessage.textContent = ''; }, 3000);
        
        renderList();
      } else {
        saveMessage.style.color = '#FCA5A5';
        saveMessage.textContent = result.error || 'Error saving item.';
      }
    } catch (err) {
      console.error(err);
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Error processing request.';
    }
  });
};
