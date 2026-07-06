/**
 * Admin panel script
 * Handles admin login, student registry, and payment approvals.
 */

const ADMIN_PASSWORD = 'admin123';
const STUDENT_STORAGE_KEY = 'academyStudentProfile';
const PURCHASES_STORAGE_KEY = 'academyPurchases';
const ACCESS_STORAGE_KEY = 'academyApprovedAccess';
const SYLLABUS_STORAGE_KEY = 'academySyllabusData';
const getStoredStudent = () => {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const getPurchases = () => {
  try {
    return JSON.parse(localStorage.getItem(PURCHASES_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const savePurchases = (purchases) => {
  localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
};

const getApprovedAccess = () => {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveApprovedAccess = (accessRecords) => {
  localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(accessRecords));
};

const grantCourseAccess = (studentEmail, courseName) => {
  if (!studentEmail || !courseName) return;
  const accessRecords = getApprovedAccess();
  const existing = accessRecords.find((item) => item.studentEmail === studentEmail && item.courseName === courseName);
  if (existing) return;
  accessRecords.push({
    studentEmail,
    courseName,
    approvedAt: new Date().toISOString()
  });
  saveApprovedAccess(accessRecords);
};

const hasCourseAccess = (studentEmail, courseName) => {
  if (!studentEmail || !courseName) return false;
  const accessRecords = getApprovedAccess();
  return accessRecords.some((item) => item.studentEmail === studentEmail && item.courseName === courseName);
};

const addPurchaseRequest = (course, student) => {
  if (!course || !student) return;
  const purchases = getPurchases();
  const existing = purchases.find((item) => item.studentEmail === student.email && item.courseName === course.name);
  if (existing) return;

  purchases.push({
    id: `purchase_${Date.now()}`,
    studentEmail: student.email,
    studentPhone: student.phone,
    courseName: course.name,
    coursePrice: course.price,
    courseDescription: course.description,
    bankSlip: 'Uploaded',
    status: 'pending',
    requestedAt: new Date().toISOString()
  });
  savePurchases(purchases);
};

const renderAdminMetrics = () => {
  const student = getStoredStudent();
  const purchases = getPurchases();
  const summaryStudents = document.getElementById('summaryStudents');
  const summaryPayments = document.getElementById('summaryPayments');
  const summaryPending = document.getElementById('summaryPending');

  if (summaryStudents) summaryStudents.textContent = student ? '1' : '0';
  if (summaryPayments) summaryPayments.textContent = purchases.length.toString();
  if (summaryPending) summaryPending.textContent = purchases.filter((item) => item.status === 'pending').length.toString();
};

const renderStudentTable = () => {
  const studentTableBody = document.getElementById('studentTableBody');
  if (!studentTableBody) return;

  const student = getStoredStudent();
  studentTableBody.innerHTML = '';

  if (!student) {
    studentTableBody.innerHTML = '<tr><td colspan="5">No registered students yet.</td></tr>';
    return;
  }

  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${student.email}</td>
    <td>${student.phone}</td>
    <td>${student.course}</td>
    <td class="status-pending">Registered</td>
    <td>${new Date(student.createdAt).toLocaleDateString()}</td>
  `;
  studentTableBody.appendChild(row);
};

const renderPaymentTable = () => {
  const paymentTableBody = document.getElementById('paymentTableBody');
  if (!paymentTableBody) return;

  const purchases = getPurchases();
  paymentTableBody.innerHTML = '';

  if (purchases.length === 0) {
    paymentTableBody.innerHTML = '<tr><td colspan="5">No payment requests yet.</td></tr>';
    return;
  }

  purchases.forEach((purchase) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${purchase.studentEmail}</td>
      <td>${purchase.courseName}</td>
      <td><span class="status-${purchase.status}">${purchase.bankSlip}</span></td>
      <td><span class="status-${purchase.status}">${purchase.status}</span></td>
      <td>
        <button class="admin-action-btn approve" data-id="${purchase.id}">Approve</button>
        <button class="admin-action-btn reject" data-id="${purchase.id}">Reject</button>
      </td>
    `;
    paymentTableBody.appendChild(row);
  });
};

const getDefaultSyllabusData = (courseName) => ({
  courseName: courseName,
  months: [
    { title: 'Month 1', days: [] },
    { title: 'Month 2', days: [] },
    { title: 'Month 3', days: [] },
    { title: 'Month 4', days: [] },
    { title: 'Month 5', days: [] },
    { title: 'Month 6', days: [] }
  ]
});

const getSyllabusStore = () => {
  try {
    return JSON.parse(localStorage.getItem(SYLLABUS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const getSyllabusData = (courseName = 'Adobe Photoshop & Illustrator Mastery') => {
  const store = getSyllabusStore();
  return store[courseName] || getDefaultSyllabusData(courseName);
};

const saveSyllabusData = (data) => {
  const store = getSyllabusStore();
  store[data.courseName] = data;
  localStorage.setItem(SYLLABUS_STORAGE_KEY, JSON.stringify(store));
};

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
  const notePreview = document.getElementById('syllabusNotePreview');
  const toolPreview = document.getElementById('syllabusToolPreview');
  const listContainer = document.getElementById('adminSyllabusList');

  if (!addButton || !saveMessage) return;

  let editingDayId = null;
  let existingNoteData = null;
  let existingToolData = null;

  const renderList = () => {
    if (!listContainer || !courseSelect) return;
    const data = getSyllabusData(courseSelect.value);
    listContainer.innerHTML = '';
    
    let needsSave = false;
    if (!data.months) {
      data.months = [
        { title: 'Month 1', days: [] },
        { title: 'Month 2', days: [] },
        { title: 'Month 3', days: [] },
        { title: 'Month 4', days: [] },
        { title: 'Month 5', days: [] },
        { title: 'Month 6', days: [] }
      ];
      needsSave = true;
    }

    data.months.forEach((month, mIndex) => {
      if (!month.days || month.days.length === 0) return;
      
      const monthDiv = document.createElement('div');
      monthDiv.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 14px; padding: 16px;';
      
      const header = document.createElement('h3');
      header.style = 'margin: 0 0 12px; color: #93C5FD; font-size: 14px;';
      header.textContent = month.title;
      monthDiv.appendChild(header);

      month.days.forEach((day, dIndex) => {
        if (!day.id) {
          day.id = Date.now().toString() + Math.random();
          needsSave = true;
        }
        
        const dayDiv = document.createElement('div');
        dayDiv.style = 'display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin-bottom: 8px;';
        dayDiv.innerHTML = `
          <div>
            <strong style="color: #F8FAFC; display: block; font-size: 14px;">${day.day}: ${day.title}</strong>
            <span style="font-size: 12px; color: #94A3B8;">
              Note: ${day.note ? 'Yes' : 'No'} | Tool: ${day.tool ? 'Yes' : 'No'} | Zoom: ${day.zoomLink ? 'Yes' : 'No'}
            </span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary edit-day" data-id="${day.id}" style="padding: 6px 12px; font-size: 12px;">Edit</button>
            <button class="btn btn-secondary delete-day" data-id="${day.id}" style="padding: 6px 12px; font-size: 12px; border-color: #EF4444; color: #EF4444;">Delete</button>
          </div>
        `;
        monthDiv.appendChild(dayDiv);
      });
      listContainer.appendChild(monthDiv);
    });

    if (needsSave) {
      saveSyllabusData(data);
    }

    listContainer.querySelectorAll('.edit-day').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const data = getSyllabusData(courseSelect.value);
        for (let m = 0; m < data.months.length; m++) {
          const day = data.months[m].days.find(d => d.id === id);
          if (day) {
            if(monthSelect) monthSelect.value = m;
            if(dayInput) dayInput.value = day.day;
            if(titleInput) titleInput.value = day.title;
            if (noteInput) noteInput.value = '';
            if (toolInput) toolInput.value = '';
            if (zoomInput) zoomInput.value = day.zoomLink || '';
            
            existingNoteData = day.note || null;
            existingToolData = day.tool || null;
            
            if (notePreview) {
              notePreview.textContent = existingNoteData ? `Current: ${existingNoteData.name || 'File attached'}` : '';
            }
            if (toolPreview) {
              toolPreview.textContent = existingToolData ? `Current: ${existingToolData.name || 'File attached'}` : '';
            }
            
            editingDayId = id;
            addButton.textContent = 'Update Module';
            const tableWrap = document.querySelector('.table-wrap');
            if (tableWrap) tableWrap.scrollIntoView({ behavior: 'smooth' });
            break;
          }
        }
      });
    });

    listContainer.querySelectorAll('.delete-day').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (!confirm('Are you sure you want to delete this module?')) return;
        const id = e.target.getAttribute('data-id');
        const data = getSyllabusData(courseSelect.value);
        for (let m = 0; m < data.months.length; m++) {
          const dIndex = data.months[m].days.findIndex(d => d.id === id);
          if (dIndex !== -1) {
            data.months[m].days.splice(dIndex, 1);
            break;
          }
        }
        saveSyllabusData(data);
        renderList();
      });
    });
  };

  if (courseSelect && listContainer) {
    courseSelect.addEventListener('change', renderList);
    renderList();
  }

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  addButton.addEventListener('click', async () => {
    if (!courseSelect || !monthSelect || !dayInput || !titleInput) return;
    
    if (!dayInput.value.trim() || !titleInput.value.trim()) {
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Please fill in Day and Title.';
      return;
    }

    try {
      let noteData = existingNoteData;
      if (noteInput && noteInput.files.length > 0) {
        noteData = await readFileAsDataURL(noteInput.files[0]);
      }

      let toolData = existingToolData;
      if (toolInput && toolInput.files.length > 0) {
        toolData = await readFileAsDataURL(toolInput.files[0]);
      }
      
      const zoomLink = zoomInput ? zoomInput.value.trim() : '';
      
      const courseName = courseSelect.value;
      const data = getSyllabusData(courseName);
      
      if (!data.months) {
        data.months = [];
      }

      while (data.months.length < 6) {
        data.months.push({ title: `Month ${data.months.length + 1}`, days: [] });
      }
      
      const monthIndex = parseInt(monthSelect.value, 10);
      
      if (editingDayId) {
        for (let m = 0; m < data.months.length; m++) {
          const dIndex = data.months[m].days.findIndex(d => d.id === editingDayId);
          if (dIndex !== -1) {
            data.months[m].days.splice(dIndex, 1);
            break;
          }
        }
        data.months[monthIndex].days.push({
          id: editingDayId,
          day: dayInput.value.trim(),
          title: titleInput.value.trim(),
          note: noteData,
          tool: toolData,
          zoomLink: zoomLink
        });
        editingDayId = null;
        existingNoteData = null;
        existingToolData = null;
        if (notePreview) notePreview.textContent = '';
        if (toolPreview) toolPreview.textContent = '';
        addButton.textContent = 'Add Module to Month';
      } else {
        data.months[monthIndex].days.push({
          id: Date.now().toString(),
          day: dayInput.value.trim(),
          title: titleInput.value.trim(),
          note: noteData,
          tool: toolData,
          zoomLink: zoomLink
        });
      }
      
      saveSyllabusData(data);
      
      dayInput.value = '';
      titleInput.value = '';
      if (noteInput) noteInput.value = '';
      if (toolInput) toolInput.value = '';
      if (zoomInput) zoomInput.value = '';
      
      saveMessage.style.color = '#A7F3D0';
      saveMessage.textContent = 'Module saved successfully! Students will see it immediately.';
      setTimeout(() => { saveMessage.textContent = ''; }, 3000);
      
      renderList();
    } catch (err) {
      console.error(err);
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Error processing file. Storage limit might be reached.';
    }
  });
};

const PORTFOLIO_STORAGE_KEY = 'academyPortfolioData';

const getPortfolioData = () => {
  try {
    return JSON.parse(localStorage.getItem(PORTFOLIO_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const savePortfolioData = (data) => {
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(data));
};

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

  const renderList = () => {
    const data = getPortfolioData();
    listContainer.innerHTML = '';
    
    data.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.35); border-radius: 14px; padding: 16px; position: relative;';
      
      const img = document.createElement('img');
      img.src = item.image;
      img.style = 'width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;';
      
      const title = document.createElement('h3');
      title.style = 'color: #F8FAFC; font-size: 16px; margin: 0 0 4px;';
      title.textContent = item.title;
      
      const category = document.createElement('p');
      category.style = 'color: #94A3B8; font-size: 12px; margin: 0 0 12px; text-transform: capitalize;';
      category.textContent = item.category.replace('-', ' ');
      
      itemDiv.appendChild(img);
      itemDiv.appendChild(title);
      itemDiv.appendChild(category);
      
      if (item.websiteLink) {
        const link = document.createElement('a');
        link.href = item.websiteLink;
        link.target = '_blank';
        link.style = 'display: inline-block; color: #93C5FD; font-size: 12px; margin-bottom: 12px; word-break: break-all;';
        link.textContent = 'Link: ' + item.websiteLink;
        itemDiv.appendChild(link);
      }
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-secondary';
      deleteBtn.style = 'padding: 6px 12px; font-size: 12px; border-color: #EF4444; color: #EF4444; width: 100%;';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this portfolio item?')) {
          const newData = getPortfolioData();
          newData.splice(index, 1);
          savePortfolioData(newData);
          renderList();
        }
      });
      
      itemDiv.appendChild(deleteBtn);
      listContainer.appendChild(itemDiv);
    });
  };

  renderList();

  const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  addButton.addEventListener('click', async () => {
    if (!titleInput.value.trim() || !imageInput.files || imageInput.files.length === 0) {
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Please fill in Title and upload an image.';
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataURL(imageInput.files[0]);
      
      const newItem = {
        id: Date.now().toString(),
        title: titleInput.value.trim(),
        category: categorySelect.value,
        image: imageDataUrl,
        websiteLink: categorySelect.value === 'web-design' ? websiteInput.value.trim() : ''
      };
      
      const data = getPortfolioData();
      data.unshift(newItem);
      savePortfolioData(data);
      
      titleInput.value = '';
      imageInput.value = '';
      websiteInput.value = '';
      
      saveMessage.style.color = '#A7F3D0';
      saveMessage.textContent = 'Portfolio item added successfully!';
      setTimeout(() => { saveMessage.textContent = ''; }, 3000);
      
      renderList();
    } catch (err) {
      console.error(err);
      saveMessage.style.color = '#FCA5A5';
      saveMessage.textContent = 'Error processing image. Storage limit might be reached.';
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
  renderAdminMetrics();
  renderStudentTable();
  renderPaymentTable();
  attachSyllabusEditor();
  attachPortfolioEditor();
};

const attachPaymentActions = () => {
  const paymentTableBody = document.getElementById('paymentTableBody');
  if (!paymentTableBody) return;

  paymentTableBody.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute('data-id');
    if (!id) return;

    const purchases = getPurchases();
    const index = purchases.findIndex((item) => item.id === id);
    if (index === -1) return;

    if (target.classList.contains('approve')) {
      purchases[index].status = 'approved';
      grantCourseAccess(purchases[index].studentEmail, purchases[index].courseName);
    }
    if (target.classList.contains('reject')) {
      purchases[index].status = 'rejected';
    }

    savePurchases(purchases);
    renderAdminMetrics();
    renderPaymentTable();
  });
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
    attachPaymentActions();
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

const guardPurchaseApproval = () => {
  const course = JSON.parse(localStorage.getItem('academySelectedCourse') || 'null');
  const student = getStoredStudent();
  const purchases = getPurchases();

  if (!course || !student) return;

  const pending = purchases.find((item) => item.studentEmail === student.email && item.courseName === course.name && item.status === 'approved');
  if (!pending) return;

  localStorage.setItem('academyCourseAccess', JSON.stringify({
    courseName: course.name,
    grantedAt: new Date().toISOString()
  }));
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

const registerPurchaseRequest = () => {
  const course = JSON.parse(localStorage.getItem('academySelectedCourse') || 'null');
  const student = getStoredStudent();
  const purchases = getPurchases();
  const found = purchases.find((item) => item.studentEmail === student?.email && item.courseName === course?.name);
  if (!student || !course || found) return;
  addPurchaseRequest(course, student);
};

const runAdminHelpers = () => {
  const currentUrl = window.location.pathname.toLowerCase();
  if (currentUrl.endsWith('/purchase.html') || currentUrl.endsWith('purchase.html')) {
    registerPurchaseRequest();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
  runAdminHelpers();
});
