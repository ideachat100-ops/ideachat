import { database, ref, get, set, child, onValue, update } from './firebase-config.js';

/**
 * IDEACHAT - Academy LMS Core Javascript
 * Handles progress display, student login, profile, and syllabus loading via Firebase.
 */

const STUDENT_STORAGE_KEY = 'academyStudentProfile';

const getStoredStudent = () => {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const saveStoredStudent = (student) => {
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(student));
};

const formatPhone = (phone) => phone.trim();
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
};
const validatePhone = (phone) => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 16;
};

const setAccountIcon = (isLoggedIn) => {
  const accountToggle = document.getElementById('navAccountToggle');
  if (!accountToggle) return;
  const icon = accountToggle.querySelector('i');
  const srText = accountToggle.querySelector('.sr-only');
  if (icon) {
    icon.className = isLoggedIn ? 'fa-solid fa-user-circle' : 'fa-solid fa-right-to-bracket';
  }
  if (srText) {
    srText.textContent = isLoggedIn ? 'Open student profile' : 'Open student login';
  }
  accountToggle.setAttribute('aria-label', isLoggedIn ? 'Open student profile' : 'Open student login');
  accountToggle.setAttribute('href', isLoggedIn ? 'profile.html' : '#');
};

const openLoginModal = () => {
  const loginModal = document.getElementById('loginModal');
  if (!loginModal) return;
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeLoginModal = () => {
  const loginModal = document.getElementById('loginModal');
  if (!loginModal) return;
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

const showElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
};

const hideElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

const scrollToElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ================= SYLLABUS RENDERING (FIREBASE) =================

const fetchAndRenderSyllabus = async (courseName) => {
  const container = document.getElementById('courseMonthsContainer');
  if (!container) return;

  const courseSafe = courseName.replace(/[^a-zA-Z0-9]/g, '_');
  const syllabusDbRef = child(ref(database), `syllabus/${courseSafe}`);
  
  onValue(syllabusDbRef, (snapshot) => {
    container.innerHTML = '';
    const data = snapshot.val();
    
    let months = data?.months || [];
    if (!months || months.length === 0) {
      months = Array.from({length: 6}, (_, i) => ({ title: `Month ${i+1}`, days: [] }));
    }

    const accordionBox = document.createElement('div');
    accordionBox.className = 'accordion-box';
    accordionBox.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.15); border-radius: 16px; padding: 18px; margin-bottom: 24px;';

    months.forEach((month, monthIndex) => {
      const monthPanel = document.createElement('div');
      monthPanel.className = 'month-panel';
      monthPanel.style = 'margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden;';

      const monthToggle = document.createElement('button');
      monthToggle.type = 'button';
      monthToggle.className = 'month-toggle';
      monthToggle.style = 'width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(255,255,255,0.03); color: var(--text-dark); border: none; font-size: 14px; font-weight: 700; cursor: pointer; text-align: left;';
      monthToggle.innerHTML = `${month.title || 'Month ' + (monthIndex + 1)}<span class="month-arrow" style="transition: transform 0.2s;"></span>`;
      monthPanel.appendChild(monthToggle);

      const monthDays = document.createElement('div');
      monthDays.className = 'month-days';
      monthDays.style = 'max-height: 0; overflow: hidden; transition: max-height 0.3s ease; background: rgba(0,0,0,0.2);';

      const daysWrapper = document.createElement('div');
      daysWrapper.style = 'padding: 16px; display: grid; gap: 12px;';

      const daysArray = month.days ? Object.keys(month.days).map(k => month.days[k]) : [];

      if (daysArray.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style = 'color: #94A3B8; font-size: 13px; margin: 0; text-align: center;';
        emptyMsg.textContent = 'No modules added yet.';
        daysWrapper.appendChild(emptyMsg);
      } else {
        daysArray.forEach(day => {
          const dayEntry = document.createElement('div');
          dayEntry.style = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px;';
          
          const header = document.createElement('div');
          header.style = 'font-weight: 700; color: #E2E8F0; font-size: 13px; margin-bottom: 8px;';
          header.textContent = `${day.day}: ${day.title}`;
          dayEntry.appendChild(header);
          
          const linkContainer = document.createElement('div');
          linkContainer.style = 'display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px;';
          
          if (day.noteUrl) {
            const noteBtn = document.createElement('a');
            noteBtn.href = day.noteUrl;
            noteBtn.target = '_blank';
            noteBtn.className = 'btn btn-secondary';
            noteBtn.style = 'padding: 6px 12px; font-size: 11px;';
            noteBtn.innerHTML = `<i class="fa-solid fa-file-pdf" style="margin-right: 5px;"></i> Lecture Note`;
            linkContainer.appendChild(noteBtn);
          }
          if (day.toolUrl) {
            const toolBtn = document.createElement('a');
            toolBtn.href = day.toolUrl;
            toolBtn.target = '_blank';
            toolBtn.className = 'btn btn-secondary';
            toolBtn.style = 'padding: 6px 12px; font-size: 11px; border-color: #F59E0B; color: #F59E0B;';
            toolBtn.innerHTML = `<i class="fa-solid fa-file-zipper" style="margin-right: 5px;"></i> Practical Tool`;
            linkContainer.appendChild(toolBtn);
          }
          if (day.zoomLink) {
            const zoomBtn = document.createElement('a');
            zoomBtn.href = day.zoomLink;
            zoomBtn.target = '_blank';
            zoomBtn.className = 'btn btn-secondary';
            zoomBtn.style = 'padding: 6px 12px; font-size: 11px; border-color: #3B82F6; color: #3B82F6;';
            zoomBtn.innerHTML = '<i class="fa-solid fa-video" style="margin-right: 5px;"></i> View Recording';
            linkContainer.appendChild(zoomBtn);
          }
          if (!day.noteUrl && !day.toolUrl && !day.zoomLink) {
             const noFiles = document.createElement('span');
             noFiles.style = 'color: #64748B; font-size: 11px; font-style: italic;';
             noFiles.textContent = 'No materials attached.';
             linkContainer.appendChild(noFiles);
          }
          dayEntry.appendChild(linkContainer);
          daysWrapper.appendChild(dayEntry);
        });
      }
      
      monthDays.appendChild(daysWrapper);
      monthPanel.appendChild(monthDays);
      accordionBox.appendChild(monthPanel);

      monthToggle.addEventListener('click', () => {
        const isOpen = monthPanel.classList.contains('open');
        accordionBox.querySelectorAll('.month-panel').forEach(p => {
          p.classList.remove('open');
          p.querySelector('.month-days').style.maxHeight = '0';
          p.querySelector('.month-arrow').style.transform = 'rotate(0deg)';
        });
        if (!isOpen) {
          monthPanel.classList.add('open');
          monthDays.style.maxHeight = monthDays.scrollHeight + 'px';
          monthToggle.querySelector('.month-arrow').style.transform = 'rotate(180deg)';
        }
      });
    });
    
    container.appendChild(accordionBox);
  });
};

// ================= AUTHENTICATION (FIREBASE) =================

const initLoginAndReset = () => {
  const loginForm = document.getElementById('loginForm');
  const resetRequestForm = document.getElementById('resetRequestForm');
  const resetPasswordSubmitForm = document.getElementById('resetPasswordSubmitForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const navAccountToggle = document.getElementById('navAccountToggle');
  const enrollButtons = document.querySelectorAll('.enroll-button');

  const loginMessage = document.getElementById('loginMessage');
  const resetNotice = document.getElementById('resetNotice');
  const resetEmailPreview = document.getElementById('resetEmailPreview');
  const resetMessage = document.getElementById('resetMessage');

  let localStudent = getStoredStudent();

  if (localStudent) {
    setAccountIcon(true);
    hideElement('loginForm');
  } else {
    setAccountIcon(false);
  }

  if (navAccountToggle) {
    navAccountToggle.addEventListener('click', (event) => {
      const storedStudent = getStoredStudent();
      if (!storedStudent) {
        event.preventDefault();
        openLoginModal();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const emailInput = document.getElementById('loginEmail');
      const phoneInput = document.getElementById('loginPhone');
      const passwordInput = document.getElementById('loginPassword');
      const courseSelect = document.getElementById('courseSelect');
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const selectedCourseName = courseSelect ? courseSelect.value : '';

      if (!validateEmail(email)) {
        if (loginMessage) loginMessage.textContent = 'Enter a valid email address.';
        return;
      }

      if (!password || password.length < 6) {
        if (loginMessage) loginMessage.textContent = 'Password must be at least 6 characters long.';
        return;
      }

      if (loginMessage) {
        loginMessage.textContent = 'Verifying...';
        loginMessage.style.color = '#fff';
      }
      
      const emailSafe = email.replace(/[^a-zA-Z0-9]/g, '_');
      const studentRef = child(ref(database), `students/${emailSafe}`);
      
      try {
        const snapshot = await get(studentRef);
        let studentData;
        if (snapshot.exists()) {
          // Login existing
          studentData = snapshot.val();
          if (studentData.password !== password) {
            if (loginMessage) {
              loginMessage.textContent = 'Incorrect password.';
              loginMessage.style.color = '#FCA5A5';
            }
            return;
          }
        } else {
          // Register new
          studentData = {
            email,
            phone,
            password,
            course: selectedCourseName || 'None selected',
            createdAt: new Date().toISOString(),
            approvedCourses: [],
            progress: {}
          };
          await set(studentRef, studentData);
        }

        // Store local copy for session
        saveStoredStudent({ email: studentData.email, phone: studentData.phone, id: emailSafe });
        setAccountIcon(true);

        const pendingCourse = JSON.parse(localStorage.getItem('academyEnrollPendingCourse') || 'null');
        if (pendingCourse) {
          localStorage.setItem('academySelectedCourse', JSON.stringify(pendingCourse));
          localStorage.removeItem('academyEnrollPendingCourse');
          window.location.href = 'purchase.html';
          return;
        }

        if (loginMessage) {
          loginMessage.textContent = 'Login successful!';
          loginMessage.style.color = '#A7F3D0';
        }
        setTimeout(() => closeLoginModal(), 1000);
        
      } catch (err) {
        console.error(err);
        if (loginMessage) {
          loginMessage.textContent = 'Database error. Try again.';
          loginMessage.style.color = '#FCA5A5';
        }
      }
    });
  }

  // Course Details and Access
  const courseDetails = {
    photoshop: {
      name: 'Adobe Photoshop & Illustrator Mastery',
      price: 'Rs 12,000',
      description: 'Master visual manipulation, vector drawings, custom branding, and export-ready print layouts.',
      bankName: 'ABC Bank',
      accountNumber: '123-456-789',
      ifsc: 'ABCD0123456',
      page: 'courses/photoshop-course.html'
    },
    principles: {
      name: 'Graphic Design Core Principles',
      price: 'Rs 10,000',
      description: 'Learn visual hierarchy, grids, typography, contrast, spacing, and layout systems.',
      bankName: 'ABC Bank',
      accountNumber: '123-456-789',
      ifsc: 'ABCD0123456',
      page: 'courses/design-principles.html'
    }
  };

  const processEnrollButtons = async () => {
    let approvedCourses = [];
    if (localStudent && localStudent.id) {
      const snap = await get(child(ref(database), `students/${localStudent.id}/approvedCourses`));
      if (snap.exists()) {
        approvedCourses = snap.val() || [];
      }
    }

    enrollButtons.forEach((button) => {
      const courseId = button.getAttribute('data-course-id');
      const selectedCourse = courseDetails[courseId] || {
        name: button.getAttribute('data-course-name') || 'Selected Course',
        price: 'Rs 9,999',
        description: 'Complete the course enrollment through the bank slip upload page.',
        bankName: 'ABC Bank',
        accountNumber: '123-456-789',
        ifsc: 'ABCD0123456',
        page: 'purchase.html'
      };

      const hasAccess = localStudent && approvedCourses.includes(selectedCourse.name);
      
      if (hasAccess) {
        button.textContent = 'Start learning';
        button.style.opacity = '1';
        button.dataset.access = 'approved';
      }

      button.addEventListener('click', (event) => {
        event.preventDefault();
        
        if (hasAccess && selectedCourse.page) {
          localStorage.setItem('academySelectedCourse', JSON.stringify(selectedCourse));
          window.location.href = selectedCourse.page;
          return;
        }

        localStorage.setItem('academyEnrollPendingCourse', JSON.stringify(selectedCourse));

        if (!localStudent) {
          const courseSelect = document.getElementById('courseSelect');
          if (courseSelect) courseSelect.value = selectedCourse.name;
          openLoginModal();
          return;
        }

        localStorage.setItem('academySelectedCourse', JSON.stringify(selectedCourse));
        window.location.href = 'purchase.html';
      });
    });
  };

  processEnrollButtons();

  const loginModalBackdrop = document.getElementById('loginModalBackdrop');
  const closeLoginModalButton = document.getElementById('closeLoginModal');

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();
      showElement('resetRequest');
      hideElement('resetPasswordForm');
      hideElement('resetNotice');
      const resetRequestSection = document.getElementById('resetRequest');
      if (resetRequestSection) resetRequestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (loginModalBackdrop) {
    loginModalBackdrop.addEventListener('click', () => {
      closeLoginModal();
    });
  }

  if (closeLoginModalButton) {
    closeLoginModalButton.addEventListener('click', () => {
      closeLoginModal();
    });
  }
};

const updateProgress = async () => {
  const psContainer = document.getElementById('progressPhotoshopContainer');
  const psVal = document.getElementById('progressPhotoshopValue');
  const psBar = document.getElementById('progressPhotoshopBar');
  const totalPsLessons = 32;

  const localStudent = getStoredStudent();
  if (localStudent && localStudent.id && psContainer && psVal && psBar) {
    const snap = await get(child(ref(database), `students/${localStudent.id}/progress`));
    if (snap.exists()) {
      const progressData = snap.val();
      const completedPs = progressData.photoshop || [];
      const psPercentage = Math.round((completedPs.length / totalPsLessons) * 100);
      psContainer.style.display = 'block';
      psVal.textContent = `${psPercentage}%`;
      setTimeout(() => {
        psBar.style.width = `${psPercentage}%`;
      }, 300);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  initLoginAndReset();
  
  // If we are on a course page, fetch the syllabus for it
  const isPhotoshop = window.location.pathname.includes('photoshop-course');
  const isPrinciples = window.location.pathname.includes('design-principles');
  
  if (isPhotoshop) {
    fetchAndRenderSyllabus('Adobe Photoshop & Illustrator Mastery');
  } else if (isPrinciples) {
    fetchAndRenderSyllabus('Graphic Design Core Principles');
  } else {
    // If we're on the main academy page, maybe we render for a default or we don't need it.
  }
});
