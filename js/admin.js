import { database, ref, set, get, push, remove, update, child, IMGBB_API_KEY, onValue } from './firebase-config.js';

/**
 * Admin panel script
 * Handles admin login, student registry, syllabus, portfolio, and payment approvals via Firebase.
 */

const ADMIN_PASSWORD = 'admin123';

// Firebase References
const dbRef = ref(database);
const portfolioRef = ref(database, 'portfolio');

// Utility to upload images to ImgBB
const uploadToImgBB = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (result.success) {
      return result.data.url; // The direct image link
    } else {
      throw new Error(result.error.message || 'ImgBB upload failed');
    }
  } catch (err) {
    console.error('ImgBB Error:', err);
    throw err;
  }
};

// State
let portfolioItems = [];

// Fetch data on load
const setupListeners = () => {
  onValue(portfolioRef, (snapshot) => {
    portfolioItems = [];
    snapshot.forEach(child => {
      portfolioItems.push({ id: child.key, ...child.val() });
    });
    renderPortfolioList();
  });
};



// ================= PORTFOLIO EDITOR (IMGBB + FIREBASE) =================

let renderPortfolioList;

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

  renderPortfolioList = () => {
    listContainer.innerHTML = '';
    if (portfolioItems.length === 0) {
      listContainer.innerHTML = '<p style="color: #94A3B8; text-align: center; grid-column: 1/-1;">No portfolio items yet.</p>';
      return;
    }
    
    portfolioItems.forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 14px; padding: 16px; position: relative;';
      
      const img = document.createElement('img');
      img.src = item.imageUrl;
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
      
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
          await remove(child(portfolioRef, item.id));
        } catch (err) {
          console.error(err);
        }
      });
      
      itemDiv.appendChild(deleteBtn);
      listContainer.appendChild(itemDiv);
    });
  };

  addButton.addEventListener('click', async () => {
    if (!titleInput.value.trim() || !imageInput.files || imageInput.files.length === 0) {
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Please fill in Title and upload an image.';
      return;
    }

    addButton.disabled = true;
    addButton.textContent = 'Uploading...';

    try {
      // 1. Upload to ImgBB
      const imageUrl = await uploadToImgBB(imageInput.files[0]);
      
      // 2. Save to Firebase
      const newItemRef = push(portfolioRef);
      await set(newItemRef, {
        title: titleInput.value.trim(),
        category: categorySelect.value,
        imageUrl: imageUrl,
        link: categorySelect.value === 'web-design' ? websiteInput.value.trim() : '',
        createdAt: new Date().toISOString()
      });

      titleInput.value = '';
      imageInput.value = '';
      websiteInput.value = '';
      
      saveMessage.style.color = '#A7F3D0';
      saveMessage.textContent = 'Portfolio item added successfully!';
    } catch (err) {
      console.error(err);
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = err.message || 'Error saving item.';
    } finally {
      addButton.disabled = false;
      addButton.textContent = 'Add to Portfolio';
      setTimeout(() => { saveMessage.textContent = ''; }, 3000);
    }
  });
};

const showAdminPanel = () => {
  const adminPanel = document.getElementById('adminPanel');
  const adminLoginSection = document.getElementById('adminLoginSection');
  if (adminPanel && adminLoginSection) {
    adminLoginSection.style.display = 'none';
    adminPanel.style.display = 'block';
  }
  setupListeners();
  attachPortfolioEditor();
};

const adminLogin = () => {
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPassword = document.getElementById('adminPassword');
  const adminLoginMessage = document.getElementById('adminLoginMessage');

  if (!adminLoginForm || !adminPassword) return;

  adminLoginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = adminPassword.value.trim();
    if (password !== ADMIN_PASSWORD) {
      if (adminLoginMessage) adminLoginMessage.textContent = 'Invalid admin password.';
      return;
    }
    if (adminLoginMessage) adminLoginMessage.textContent = '';
    showAdminPanel();
  });
};

const adminLogout = () => {
  const adminLogoutButton = document.getElementById('adminLogoutButton');
  if (!adminLogoutButton) return;
  adminLogoutButton.addEventListener('click', () => {
    const adminLoginSection = document.getElementById('adminLoginSection');
    const adminPanel = document.getElementById('adminPanel');
    if (adminLoginSection && adminPanel) {
      adminLoginSection.style.display = 'block';
      adminPanel.style.display = 'none';
    }
  });
};

const initAdmin = () => {
  adminLogin();
  adminLogout();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
