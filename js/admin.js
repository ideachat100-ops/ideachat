import { database, ref, set, get, push, remove, update, child, IMGBB_API_KEY, onValue } from './firebase-config.js';

/**
 * Admin panel script
 * Handles admin login, student registry, syllabus, portfolio, and payment approvals via Firebase.
 */

const ADMIN_PASSWORD = 'admin123';

// Firebase References
const dbRef = ref(database);
const studentsRef = ref(database, 'students');
const purchasesRef = ref(database, 'purchases');
const syllabusRef = ref(database, 'syllabus');
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
let students = [];
let purchases = [];
let portfolioItems = [];

// Fetch data on load
const setupListeners = () => {
  onValue(studentsRef, (snapshot) => {
    students = [];
    snapshot.forEach(child => {
      students.push({ id: child.key, ...child.val() });
    });
    renderAdminMetrics();
    renderStudentTable();
  });

  onValue(purchasesRef, (snapshot) => {
    purchases = [];
    snapshot.forEach(child => {
      purchases.push({ id: child.key, ...child.val() });
    });
    renderAdminMetrics();
    renderPaymentTable();
  });

  onValue(portfolioRef, (snapshot) => {
    portfolioItems = [];
    snapshot.forEach(child => {
      portfolioItems.push({ id: child.key, ...child.val() });
    });
    renderPortfolioList();
  });
};

const renderAdminMetrics = () => {
  const summaryStudents = document.getElementById('summaryStudents');
  const summaryPayments = document.getElementById('summaryPayments');
  const summaryPending = document.getElementById('summaryPending');

  if (summaryStudents) summaryStudents.textContent = students.length.toString();
  if (summaryPayments) summaryPayments.textContent = purchases.length.toString();
  if (summaryPending) summaryPending.textContent = purchases.filter((item) => item.status === 'pending').length.toString();
};

const renderStudentTable = () => {
  const studentTableBody = document.getElementById('studentTableBody');
  if (!studentTableBody) return;
  
  studentTableBody.innerHTML = '';

  if (students.length === 0) {
    studentTableBody.innerHTML = '<tr><td colspan="5">No registered students yet.</td></tr>';
    return;
  }

  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.email}</td>
      <td>${student.phone}</td>
      <td>${student.course || 'N/A'}</td>
      <td class="status-pending">Registered</td>
      <td>${new Date(student.createdAt).toLocaleDateString()}</td>
    `;
    studentTableBody.appendChild(row);
  });
};

const grantCourseAccess = async (studentEmail, courseName) => {
  if (!studentEmail || !courseName) return;
  // Update student's approved access array in Firebase
  const student = students.find(s => s.email === studentEmail);
  if (student) {
    const accessList = student.approvedCourses || [];
    if (!accessList.includes(courseName)) {
      accessList.push(courseName);
      await update(ref(database, `students/${student.id}`), {
        approvedCourses: accessList
      });
    }
  }
};

const renderPaymentTable = () => {
  const paymentTableBody = document.getElementById('paymentTableBody');
  if (!paymentTableBody) return;
  
  paymentTableBody.innerHTML = '';

  if (purchases.length === 0) {
    paymentTableBody.innerHTML = '<tr><td colspan="5">No payment requests yet.</td></tr>';
    return;
  }

  purchases.forEach((purchase) => {
    const row = document.createElement('tr');
    
    // Display Bank Slip as Link/Image
    let slipHtml = purchase.bankSlip;
    if (purchase.bankSlip.startsWith('http')) {
      slipHtml = `<a href="${purchase.bankSlip}" target="_blank" style="color:#93C5FD; text-decoration:underline;">View Slip</a>`;
    }

    row.innerHTML = `
      <td>${purchase.studentEmail}</td>
      <td>${purchase.courseName}</td>
      <td>${slipHtml}</td>
      <td><span class="status-${purchase.status}">${purchase.status}</span></td>
      <td>
        ${purchase.status === 'pending' ? `
          <button class="admin-action-btn approve" data-id="${purchase.id}">Approve</button>
          <button class="admin-action-btn reject" data-id="${purchase.id}">Reject</button>
        ` : 'N/A'}
      </td>
    `;
    paymentTableBody.appendChild(row);
  });
};

const attachPaymentActions = () => {
  const paymentTableBody = document.getElementById('paymentTableBody');
  if (!paymentTableBody) return;

  paymentTableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute('data-id');
    if (!id) return;

    const purchase = purchases.find((item) => item.id === id);
    if (!purchase) return;

    if (target.classList.contains('approve')) {
      await update(ref(database, `purchases/${id}`), { status: 'approved' });
      await grantCourseAccess(purchase.studentEmail, purchase.courseName);
    }
    if (target.classList.contains('reject')) {
      await update(ref(database, `purchases/${id}`), { status: 'rejected' });
    }
  });
};

// ================= SYLLABUS EDITOR (FIREBASE) =================

const attachSyllabusEditor = () => {
  const addButton = document.getElementById('addSyllabusButton');
  const saveMessage = document.getElementById('syllabusSaveMessage');
  const courseSelect = document.getElementById('syllabusCourseSelect');
  const monthSelect = document.getElementById('syllabusMonthSelect');
  const dayInput = document.getElementById('syllabusDayInput');
  const titleInput = document.getElementById('syllabusTitleInput');
  const noteInput = document.getElementById('syllabusNoteInput');
  const toolInput = document.getElementById('syllabusToolInput');
  const zoomInput = document.getElementById('syllabusZoomInput');
  const listContainer = document.getElementById('adminSyllabusList');

  if (!addButton || !saveMessage) return;

  let editingDayId = null;

  const renderSyllabusList = (courseName) => {
    onValue(child(syllabusRef, courseName.replace(/[^a-zA-Z0-9]/g, '_')), (snapshot) => {
      listContainer.innerHTML = '';
      const data = snapshot.val();
      
      if (!data || !data.months) {
        listContainer.innerHTML = '<p style="color: #94A3B8;">No syllabus data for this course yet.</p>';
        return;
      }

      data.months.forEach((month, mIndex) => {
        if (!month.days) return;
        
        const monthDiv = document.createElement('div');
        monthDiv.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 14px; padding: 16px;';
        
        const header = document.createElement('h3');
        header.style = 'margin: 0 0 12px; color: #93C5FD; font-size: 14px;';
        header.textContent = month.title;
        monthDiv.appendChild(header);

        // Convert days object to array
        const daysArray = Object.keys(month.days).map(key => ({ id: key, ...month.days[key] }));

        daysArray.forEach((day) => {
          const dayDiv = document.createElement('div');
          dayDiv.style = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 8px;';
          dayDiv.innerHTML = `
            <div>
              <strong style="color: #F8FAFC; display: block; font-size: 14px;">${day.day}: ${day.title}</strong>
              <span style="font-size: 12px; color: #94A3B8;">
                Note: ${day.noteUrl ? 'Yes' : 'No'} | Tool: ${day.toolUrl ? 'Yes' : 'No'} | Zoom: ${day.zoomLink ? 'Yes' : 'No'}
              </span>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary edit-day" data-mindex="${mIndex}" data-id="${day.id}" style="padding: 6px 12px; font-size: 12px;">Edit</button>
              <button class="btn btn-secondary delete-day" data-mindex="${mIndex}" data-id="${day.id}" style="padding: 6px 12px; font-size: 12px; border-color: #EF4444; color: #EF4444;">Delete</button>
            </div>
          `;
          monthDiv.appendChild(dayDiv);
        });
        if(daysArray.length > 0) {
          listContainer.appendChild(monthDiv);
        }
      });

      // Attach edit/delete listeners
      listContainer.querySelectorAll('.edit-day').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.getAttribute('data-id');
          const mIndex = e.target.getAttribute('data-mindex');
          const courseSafe = courseSelect.value.replace(/[^a-zA-Z0-9]/g, '_');
          
          const snapshot = await get(child(syllabusRef, `${courseSafe}/months/${mIndex}/days/${id}`));
          if (snapshot.exists()) {
            const dayData = snapshot.val();
            monthSelect.value = mIndex;
            dayInput.value = dayData.day;
            titleInput.value = dayData.title;
            noteInput.value = dayData.noteUrl || '';
            toolInput.value = dayData.toolUrl || '';
            zoomInput.value = dayData.zoomLink || '';
            
            editingDayId = { id, mIndex };
            addButton.textContent = 'Update Module';
            document.querySelector('.table-wrap').scrollIntoView({ behavior: 'smooth' });
          }
        });
      });

      listContainer.querySelectorAll('.delete-day').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (!confirm('Delete this module?')) return;
          const id = e.target.getAttribute('data-id');
          const mIndex = e.target.getAttribute('data-mindex');
          const courseSafe = courseSelect.value.replace(/[^a-zA-Z0-9]/g, '_');
          
          await remove(child(syllabusRef, `${courseSafe}/months/${mIndex}/days/${id}`));
        });
      });
    });
  };

  if (courseSelect && listContainer) {
    courseSelect.addEventListener('change', () => renderSyllabusList(courseSelect.value));
    renderSyllabusList(courseSelect.value);
  }

  addButton.addEventListener('click', async () => {
    if (!dayInput.value.trim() || !titleInput.value.trim()) {
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Please fill in Day and Title.';
      return;
    }

    addButton.disabled = true;
    addButton.textContent = 'Saving...';

    try {
      const courseSafe = courseSelect.value.replace(/[^a-zA-Z0-9]/g, '_');
      const mIndex = monthSelect.value;
      
      const payload = {
        day: dayInput.value.trim(),
        title: titleInput.value.trim(),
        noteUrl: noteInput.value.trim(),
        toolUrl: toolInput.value.trim(),
        zoomLink: zoomInput.value.trim()
      };

      // Ensure month exists (Firebase creates it automatically, but we want the title)
      await update(child(syllabusRef, `${courseSafe}/months/${mIndex}`), {
        title: `Month ${parseInt(mIndex) + 1}`
      });

      if (editingDayId) {
        // If they changed the month, we have to move it
        if (editingDayId.mIndex !== mIndex) {
          await remove(child(syllabusRef, `${courseSafe}/months/${editingDayId.mIndex}/days/${editingDayId.id}`));
          await set(child(syllabusRef, `${courseSafe}/months/${mIndex}/days/${editingDayId.id}`), payload);
        } else {
          await update(child(syllabusRef, `${courseSafe}/months/${mIndex}/days/${editingDayId.id}`), payload);
        }
        editingDayId = null;
        addButton.textContent = 'Add Module to Month';
      } else {
        const newDayRef = push(child(syllabusRef, `${courseSafe}/months/${mIndex}/days`));
        await set(newDayRef, payload);
      }
      
      dayInput.value = '';
      titleInput.value = '';
      noteInput.value = '';
      toolInput.value = '';
      zoomInput.value = '';
      
      saveMessage.style.color = '#A7F3D0';
      saveMessage.textContent = 'Module saved to Firebase!';
    } catch (err) {
      console.error(err);
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Error saving to database.';
    } finally {
      addButton.disabled = false;
      setTimeout(() => { saveMessage.textContent = ''; }, 3000);
    }
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
  attachSyllabusEditor();
  attachPortfolioEditor();
  attachPaymentActions();
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

const setupAdminNavigation = () => {
  const dashboardBtn = document.getElementById('navDashboardBtn');
  const paymentsBtn = document.getElementById('navPaymentsBtn');
  const syllabusBtn = document.getElementById('navSyllabusBtn');
  const portfolioBtn = document.getElementById('navPortfolioBtn');

  const dashboardView = document.getElementById('adminDashboardView');
  const paymentsView = document.getElementById('adminPaymentsView');
  const syllabusView = document.getElementById('adminSyllabusView');
  const portfolioView = document.getElementById('adminPortfolioView');

  if (!dashboardBtn || !dashboardView) return;

  const setActiveBtn = (activeBtn) => {
    [dashboardBtn, paymentsBtn, syllabusBtn, portfolioBtn].forEach(btn => {
      if (btn) {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    });
    if (activeBtn) {
      activeBtn.classList.remove('btn-secondary');
      activeBtn.classList.add('btn-primary');
    }
  };

  const showView = (view) => {
    if (dashboardView) dashboardView.style.display = 'none';
    if (paymentsView) paymentsView.style.display = 'none';
    if (syllabusView) syllabusView.style.display = 'none';
    if (portfolioView) portfolioView.style.display = 'none';
    if (view) view.style.display = 'block';
  };

  dashboardBtn.addEventListener('click', () => {
    setActiveBtn(dashboardBtn);
    showView(dashboardView);
  });

  paymentsBtn.addEventListener('click', () => {
    setActiveBtn(paymentsBtn);
    showView(paymentsView);
  });

  syllabusBtn.addEventListener('click', () => {
    setActiveBtn(syllabusBtn);
    showView(syllabusView);
  });
  
  if (portfolioBtn) {
    portfolioBtn.addEventListener('click', () => {
      setActiveBtn(portfolioBtn);
      showView(portfolioView);
    });
  }
};

const initAdmin = () => {
  adminLogin();
  adminLogout();
  setupAdminNavigation();
};

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});
